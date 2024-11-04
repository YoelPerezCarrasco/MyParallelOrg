


import random
from sqlite3 import IntegrityError
from venv import logger
import networkx as nx
from sqlalchemy.orm import Session
from app.models.user import GitHubUserModel, UserRepoCommits, UserRepoContributions, PullRequest, PullRequestComment, PullRequestReview
from app.services.github import fetch_github_user_details, fetch_user_dominant_language

continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica']


def simulate_user_locations(db: Session):
    # Obtener todos los usuarios de la base de datos
    users = db.query(GitHubUserModel).all()

    # Iterar sobre cada usuario y asignar un continente aleatorio
    for user in users:
        random_continent = random.choice(continents)
        user.location = random_continent
        db.add(user)
        #print(f"User {user.username} assigned to {random_continent}")

    # Confirmar los cambios en la base de datos
    db.commit()
    

async def store_or_get_user(db: Session, username: str, user_data: dict, organization: str):
    try:
        user = db.query(GitHubUserModel).filter(GitHubUserModel.username == username, GitHubUserModel.organization == organization).first()
        if user is None:
            user = GitHubUserModel(
                username=username,
                html_url=user_data.get('html_url'),
                avatar_url=user_data.get('avatar_url'),
                repos_url=user_data.get('repos_url'),
                location=user_data.get('location'),
                stars=user_data.get('stars', 0),
                organization=organization  # Asignar la organización
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.location = user_data.get('location', user.location)
            user.stars = user_data.get('stars', user.stars)
            db.commit()
            db.refresh(user)
        return user
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error storing user {username} in organization {organization}: {e}")
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error storing user {username} in organization {organization}: {e}")
        return None

def store_repo_contribution(db: Session, user: GitHubUserModel, repo_name: str):
    try:
        contribution = db.query(UserRepoContributions).filter_by(user_id=user.id, repo_name=repo_name).first()
        if not contribution:
            contribution = UserRepoContributions(user_id=user.id, repo_name=repo_name, contribution_count=1)
        else:
            contribution.contribution_count += 1
        db.add(contribution)
        db.commit()
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error storing contribution for user {user.username} in repo {repo_name}: {e}")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error storing contribution for user {user.username} in repo {repo_name}: {e}")

def store_repo_commit(db: Session, user: GitHubUserModel, repo_name: str, commit_date: str):
    try:
        commit = db.query(UserRepoCommits).filter_by(user_id=user.id, repo_name=repo_name).first()

        if not commit:
            commit = UserRepoCommits(
                user_id=user.id,
                repo_name=repo_name,
                commit_count=1,
                last_commit_date=commit_date
            )
        else:
            commit.commit_count += 1
            commit.last_commit_date = commit_date

        db.add(commit)
        db.commit()
        logger.info(f"Stored commit for user {user.username} in repo {repo_name} on {commit_date}")
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error storing commit for user {user.username} in repo {repo_name}: {e}")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error storing commit for user {user.username} in repo {repo_name}: {e}")



async def store_pull_request(db: Session, pr_data: dict, repo_name: str, org_name: str):
    try:
        # Validar la existencia de 'user' y 'login'
        author_login = pr_data.get('user', {}).get('login')
        if not author_login:
            raise ValueError("Pull request data does not contain 'user' or 'login' information")

        # Buscar el usuario en la base de datos
        author = db.query(GitHubUserModel).filter_by(username=author_login).first()
        if not author:
            # Fetch user details and store if the user doesn't exist in the DB
            user_data = await fetch_github_user_details(author_login)
            # Validar la existencia de 'base' y sus subcampos
            owner_login = pr_data.get('base', {}).get('repo', {}).get('owner', {}).get('login')
            if not owner_login:
                raise ValueError("Pull request data does not contain 'base.repo.owner.login' information")
            
            author = await store_or_get_user(db, author_login, user_data, org_name)

        # Crear el PullRequest
        pr = PullRequest(
            repo_name=repo_name,
            pr_number=pr_data.get('number'),
            author_id=author.id,
            created_at=pr_data.get('created_at'),
            state=pr_data.get('state'),
            title=pr_data.get('title'),
            body=pr_data.get('body')
        )

        db.add(pr)
        db.commit()
        db.refresh(pr)
        return pr
    except ValueError as ve:
        logger.error(f"Validation error storing pull request for repo {repo_name}: {ve}")
        raise
    except Exception as e:
        logger.error(f"Error storing pull request for repo {repo_name}: {e}")
        raise


async def store_pull_request_comment(db: Session, pr_id: int, comment_data: dict, org_name: str):
    try:
        commenter_login = comment_data['user']['login']
        commenter = db.query(GitHubUserModel).filter_by(username=commenter_login).first()
        if not commenter:
            # Fetch user details and store
            user_data = await fetch_github_user_details(commenter_login)
            commenter_company = user_data.get('company', None)
            commenter = await store_or_get_user(db, commenter_login, user_data, org_name)

        comment = PullRequestComment(
            pull_request_id=pr_id,
            commenter_id=commenter.id,
            comment=comment_data['body'],
            created_at=comment_data['created_at']
        )
        db.add(comment)
        db.commit()
    except Exception as e:
        logger.error(f"Error storing pull request comment for PR ID {pr_id}: {e}")
        raise

async def store_pull_request_review(db: Session, pr_id: int, review_data: dict, org_name: str):
    try:
        reviewer_login = review_data['user']['login']
        reviewer = db.query(GitHubUserModel).filter_by(username=reviewer_login).first()
        if not reviewer:
            # Fetch user details and store
            user_data = await fetch_github_user_details(reviewer_login)
            reviewer_company = user_data.get('company', None)
            reviewer = await store_or_get_user(db, reviewer_login, user_data, org_name)

        review = PullRequestReview(
            pull_request_id=pr_id,
            reviewer_id=reviewer.id,
            state=review_data['state'],
            submitted_at=review_data['submitted_at']
        )
        db.add(review)
        db.commit()
    except Exception as e:
        logger.error(f"Error storing pull request review for PR ID {pr_id}: {e}")
        raise



# Lista de lenguajes de programación comunes para asignación aleatoria
languages = ['Python', 'JavaScript', 'Java', 'C++']

async def update_users_with_dominant_language(db: Session):
    # Obtener usuarios que no tienen un lenguaje dominante asignado
    users = db.query(GitHubUserModel).filter(GitHubUserModel.dominant_language.is_(None)).all()

    for user in users:
        logger.info(f"Fetching dominant language for user: {user.username}")
        dominant_language = await fetch_user_dominant_language(user.username)
        if dominant_language:
            logger.info(f"User {user.username} dominant language: {dominant_language}")
            user.dominant_language = dominant_language
        else:
            logger.warning(f"No dominant language found for user: {user.username}. Assigning a random language.")
            random_language = random.choice(languages)
            user.dominant_language = random_language
            logger.info(f"User {user.username} assigned random dominant language: {random_language}")
        
        db.add(user)
    
    db.commit()
    
async def update_users_with_dominant_language2(db: Session):
    # Obtener todos los usuarios
    users = db.query(GitHubUserModel).all()

    for user in users:
        # Asignar un lenguaje dominante aleatorio a cada usuario
        random_language = random.choice(languages)
        user.dominant_language = random_language
        logger.info(f"User {user.username} assigned random dominant language: {random_language}")
        
        db.add(user)
    
    db.commit()
    logger.info(f"Updated {len(users)} users with random dominant languages.")




def build_user_graph(db: Session, org_name: str):
    G = nx.Graph()
    
    # Filtrar usuarios por organización y no tener valores nulos en `dominant_language`, `location`, `stars`
    users = db.query(GitHubUserModel).filter(
        GitHubUserModel.organization == org_name,
        GitHubUserModel.dominant_language.isnot(None),
        GitHubUserModel.location.isnot(None),
        GitHubUserModel.stars.isnot(None)
    ).all()

    if not users:
        raise ValueError(f"No users found for organization {org_name} with all required attributes (dominant_language, location, stars).")
     
    # Añadir nodos al grafo con la URL del avatar y del perfil de GitHub
    for user in users:
        github_url = f"https://github.com/{user.username}"  # Construir la URL del perfil de GitHub
        G.add_node(
            user.username,
            language=user.dominant_language,
            continent=user.location,
            stars=user.stars,
            avatar_url=user.avatar_url, 
            github_url=github_url  # Añadir la URL del perfil de GitHub
        )
        print(f"Added node for user: {user.username} with language: {user.dominant_language}, continent: {user.location}, stars: {user.stars}, avatar_url: {user.avatar_url}, github_url: {github_url}")
    
    # Añadir aristas basadas en los tres criterios
    for user in users:
        for other_user in users:
            if user != other_user:
                # Criterios de similitud
                same_language = user.dominant_language == other_user.dominant_language
                same_continent = user.location == other_user.location
                similar_stars = abs(user.stars - other_user.stars) <= 50  # Por ejemplo, una diferencia de hasta 50 estrellas
                
                # Si cumplen los tres criterios, conectamos los nodos
                if same_language and same_continent and similar_stars:
                    try:
                        G.add_edge(user.username, other_user.username)
                        print(f"Added edge between {user.username} and {other_user.username} based on all three criteria: language, continent, stars")
                    except Exception as e:
                        print(f"Error adding edge: {e}")
    
    return G
