# routers/github.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import GitHubUserModel
from app.services.github import fetch_github_org_repos, fetch_github_repo_contributors, fetch_github_repo_commits, fetch_github_user_stars, fetch_pull_request_comments, fetch_pull_request_reviews, fetch_pull_requests
from app.services.connections import build_user_graph, store_or_get_user, store_pull_request, store_pull_request_comment, store_pull_request_review, store_repo_contribution, store_repo_commit, update_users_with_dominant_language2
from networkx.readwrite import json_graph
import random
import logging
from typing import List, Dict

router = APIRouter()
logger = logging.getLogger(__name__)

continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica']

@router.get("/organizations", response_model=List[Dict[str, str]])
async def get_organizations(db: Session = Depends(get_db)):
    # Query the database to get distinct organization names
    organizations = db.query(GitHubUserModel.organization).distinct().all()

    # Convert the result to the desired format
    org_list = [{"id": org[0], "name": org[0]} for org in organizations if org[0]]

    return org_list

@router.get("/org-users2/{org}")
async def get_org_users(org: str, db: Session = Depends(get_db)):
    logger.info(f"Fetching GitHub organization repos: {org}")
    
    try:
        repos = await fetch_github_org_repos(org)
    except Exception as e:
        logger.error(f"Error fetching repos from GitHub: {e}")
        raise HTTPException(status_code=500, detail="Error fetching repos from GitHub")

    users: set = set()
    for repo in repos:
        repo_name = repo['name']
    
        logger.info(f"Fetching contributors for repo: {repo_name}")
        try:
            contributors = await fetch_github_repo_contributors(org, repo_name)
            for user_data in contributors:
                username = user_data['login']
                random_continent = random.choice(continents)
                user_data['location'] = random_continent
                user_data['stars'] = await fetch_github_user_stars(username)

                users.add(username)
                user = await store_or_get_user(db, username, user_data, org)  # Pasa la organización al almacenar
                store_repo_contribution(db, user, repo_name)
        except Exception as e:
            logger.error(f"Error fetching contributors for repo {repo_name}: {e}")

        logger.info(f"Fetching commits for repo: {repo_name}")
        try:
            commits = await fetch_github_repo_commits(org, repo_name)
            for commit in commits:
                author_name = commit['commit']['author']['name']
                author_login = commit['author']['login'] if commit['author'] else author_name
                commit_date = commit['commit']['author']['date']
                
                users.add(author_login)
                random_continent = random.choice(continents)
                user_data = {
                    'html_url': commit['author']['html_url'],
                    'avatar_url': commit['author']['avatar_url'],
                    'repos_url': commit['author']['repos_url'],
                    'location': random_continent,
                    'stars': await fetch_github_user_stars(author_login)
                }
                
                user = await store_or_get_user(db, author_login, user_data, org)  # Pasa la organización al almacenar
                store_repo_commit(db, user, repo_name, commit_date)
        except Exception as e:
            logger.error(f"Error fetching commits for repo {repo_name}: {e}")
        
        logger.info(f"Fetching pull requests for repo: {repo_name}")
        try:
            pull_requests = await fetch_pull_requests(org, repo_name)
            for pr_data in pull_requests:
                # Store the pull request
                pr = await store_pull_request(db, pr_data, repo_name, org)

                # Fetch and store comments
                comments = await fetch_pull_request_comments(org, repo_name, pr.pr_number)
                for comment_data in comments:
                    await store_pull_request_comment(db, pr.id, comment_data, org)

                # Fetch and store reviews
                reviews = await fetch_pull_request_reviews(org, repo_name, pr.pr_number)
                for review_data in reviews:
                    await store_pull_request_review(db, pr.id, review_data, org)
        except Exception as e:
            logger.error(f"Errorrr fetching pull requests for repo {repo_name}: {e}")
    simulate_user_locations(db)
    await update_users_with_dominant_language2(db)

    return {"message": "Users and contributions stored successfully"}


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

@router.get("/user-connections/{org_name}")
async def get_user_connections(org_name: str, db: Session = Depends(get_db)):
    # Verificar si la organización existe en la base de datos
    if not db.query(GitHubUserModel).filter_by(organization=org_name).first():
        raise HTTPException(status_code=404, detail="Organization not found")

    # Construir el grafo para la organización específica
    G = build_user_graph(db, org_name)
    
    # Convertir el grafo a un formato JSON compatible con el frontend
    data = json_graph.node_link_data(G)
    
    nodes = []
    for node in data['nodes']:
        node_id = node["id"]
        avatar_url = node.get("avatar_url", "")
        github_url = f"https://github.com/{node_id}"  # Asumiendo que el ID del usuario es su username de GitHub
        nodes.append({
            "id": node_id,
            "label": node_id,
            "icon": avatar_url,
            "github_url": github_url  # Incluimos la URL del perfil de GitHub
        })

    edges = []
    for link in data['links']:
        edge_id = f"{link['source']}-{link['target']}"
        edges.append({
            "id": edge_id,
            "source": link["source"],  
            "target": link["target"],  
            "label": link.get("label", "")  
        })

    return {"nodes": nodes, "edges": edges}
