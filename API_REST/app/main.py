import random
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship, Session
from networkx.readwrite import json_graph

#from networkx.readwrite import json_graph  # para convertir el grafo a JSON
#import networkx as nx
from app.database import get_db
from app.schemas import GitHubUserSchema  # Importa el modelo de Pydantic
from app.requestgithub import fetch_github_user_stars, fetch_github_user_details, fetch_user_dominant_language,fetch_github_org_repos, fetch_github_repo_commits, fetch_github_repo_contributors  # Importa la función para obtener datos de GitHub
from typing import List
import logging
from app.crud import build_user_graph


from app.database import engine, Base, get_db
from app.models import GitHubUserModel, UserRepoCommits, UserRepoContributions
    
# Definir una lista de continentes
app = FastAPI()


class GitHubUserModel(Base):
    __tablename__ = 'github_users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    html_url = Column(String)
    avatar_url = Column(String)
    repos_url = Column(String)
    contributions = relationship("UserRepoContributions", back_populates="user")
    commits = relationship("UserRepoCommits", back_populates="user")
    location = Column(String, nullable=True)
    stars = Column(Integer, default=0)
    dominant_language = Column(String)  # Nuevo campo para el lenguaje dominante
 
    
class UserRepoContributions(Base):
    __tablename__ = 'user_repo_contributions'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('github_users.id'))
    repo_name = Column(String, index=True)
    contribution_count = Column(Integer)
    user = relationship("GitHubUserModel", back_populates="contributions")

class UserRepoCommits(Base):
    __tablename__ = 'user_repo_commits'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('github_users.id'))
    repo_name = Column(String, index=True)
    commit_count = Column(Integer)
    last_commit_date = Column(DateTime)
    user = relationship("GitHubUserModel", back_populates="commits")
    

# Crea las tablas en la base de datos
Base.metadata.create_all(bind=engine)


# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"message": "API is working"}


@app.get("/users/", response_model=List[GitHubUserSchema])
async def read_all_users(db: Session = Depends(get_db)):
    logger.info("Reading all users from the database")
    try:
        users = db.query(GitHubUserModel).all()
        if users:
            logger.info(f"Found {len(users)} users")
            return [GitHubUserSchema.from_orm(user) for user in users]
        else:
            logger.info("No users found in the database")
            raise HTTPException(status_code=404, detail="No users found")
    except Exception as e:
        logger.error(f"Error reading users: {e}", exc_info=True)  # Agrega exc_info=True para más detalles del error
        raise HTTPException(status_code=500, detail="Error reading users")


import random

# Definir una lista de continentes
continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica']

@app.get("/org-users2/{org}")
async def get_org_users(org: str, db: Session = Depends(get_db)):
    logger.info(f"Fetching GitHub organization repos: {org}")
    
    try:
        repos = await fetch_github_org_repos(org)
    except Exception as e:
        logger.error(f"Error fetching repos from GitHub: {e}")
        raise HTTPException(status_code=500, detail="Error fetching repos from GitHub")

    users: Set[str] = set()
    for repo in repos:
        repo_name = repo['name']
    
        logger.info(f"Fetching contributors for repo: {repo_name}")
        try:
            contributors = await fetch_github_repo_contributors(org, repo_name)
            for user_data in contributors:
                username = user_data['login']
                # Simular la ubicación con un continente aleatorio
                random_continent = random.choice(continents)
                user_data['location'] = random_continent
                user_data['stars'] = await fetch_github_user_stars(username)  # Obtener el total de estrellas del usuario

                users.add(username)
                user = await store_or_get_user(db, username, user_data)
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
                # Simular la ubicación con un continente aleatorio
                random_continent = random.choice(continents)
                user_data = {
                    'html_url': commit['author']['html_url'],
                    'avatar_url': commit['author']['avatar_url'],
                    'repos_url': commit['author']['repos_url'],
                    'location': random_continent,
                    'stars': await fetch_github_user_stars(author_login)  # Obtener el total de estrellas del usuario
                }
                
                user = await store_or_get_user(db, author_login, user_data)
                store_repo_commit(db, user, repo_name, commit_date)
        except Exception as e:
            logger.error(f"Error fetching commits for repo {repo_name}: {e}")
    simulate_user_locations
    await update_users_with_dominant_language(db)

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
    
async def store_or_get_user(db: Session, username: str, user_data: dict):
    user = db.query(GitHubUserModel).filter(GitHubUserModel.username == username).first()
    if user is None:
        user = GitHubUserModel(
            username=username,
            html_url=user_data.get('html_url'),
            avatar_url=user_data.get('avatar_url'),
            repos_url=user_data.get('repos_url'),
            location=user_data.get('location'),  # Nueva columna
            stars=user_data.get('stars', 0)      # Nueva columna
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Actualizar la ubicación y las estrellas si ya existe el usuario
        user.location = user_data.get('location', user.location)
        user.stars = user_data.get('stars', user.stars)
        db.commit()
        db.refresh(user)
    return user


def store_repo_contribution(db: Session, user: GitHubUserModel, repo_name: str):
    contribution = db.query(UserRepoContributions).filter_by(user_id=user.id, repo_name=repo_name).first()
    if not contribution:
        contribution = UserRepoContributions(user_id=user.id, repo_name=repo_name, contribution_count=1)
    else:
        contribution.contribution_count += 1
    db.add(contribution)
    db.commit()
    
def store_repo_commit(db: Session, user: GitHubUserModel, repo_name: str, commit_date: str):
    # Verificar si ya existe un registro de commits para este usuario y repositorio
    commit = db.query(UserRepoCommits).filter_by(user_id=user.id, repo_name=repo_name).first()
    
    if not commit:
        # Si no existe, crear un nuevo registro
        commit = UserRepoCommits(
            user_id=user.id,
            repo_name=repo_name,
            commit_count=1,
            last_commit_date=commit_date
        )
    else:
        # Si ya existe, incrementar el conteo de commits y actualizar la fecha del último commit
        commit.commit_count += 1
        commit.last_commit_date = commit_date

    try:
        db.add(commit)
        db.commit()
        logger.info(f"Stored commit for user {user.username} in repo {repo_name} on {commit_date}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error storing commit for user {user.username} in repo {repo_name}: {e}")


# Lista de lenguajes de programación comunes para asignación aleatoria
languages = ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'Go', 'Ruby', 'Swift', 'TypeScript', 'PHP']

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



@app.get("/user-connections")
async def get_user_connections(db: Session = Depends(get_db)):
    # Construir el grafo como se mostró anteriormente
    G = build_user_graph(db)
    
    # Convertir el grafo a un formato JSON compatible con el frontend
    data = json_graph.node_link_data(G)
    
    # Formatear nodos para el frontend. Extraemos el id correcto.
    nodes = []
    for node in data['nodes']:
        # Extraer el id como una cadena de texto única
        node_id = node["id"]["id"] if isinstance(node["id"], dict) else node["id"]
        nodes.append({
            "id": node_id,
            "label": node_id  # Usamos el id como label o podrías usar otra propiedad como label
        })
    
    return {"nodes": nodes}
