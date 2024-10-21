import random

from fastapi.encoders import jsonable_encoder
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from sqlalchemy.exc import IntegrityError
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship, Session

from networkx.readwrite import json_graph

from jose import JWTError, jwt

from pydantic import BaseModel, Field

from datetime import datetime, timedelta

from typing import Optional, List, Dict

from passlib.context import CryptContext

from backend.schemas import UserCreate, ChangePasswordRequest, UserResponse
from backend.requestgithub import fetch_github_user_stars, fetch_github_user_details, fetch_user_dominant_language,fetch_github_org_repos, fetch_github_repo_commits, fetch_github_repo_contributors  # Importa la función para obtener datos de GitHub
from backend.crud import build_user_graph
from backend.database import engine, Base, get_db
from backend.models import GitHubUserModel, UserRepoCommits, UserRepoContributions, UserModel

import logging


    
# Definir una lista de continentes
app = FastAPI()

from pydantic import BaseModel

class UserCreate(BaseModel):
    rol: str
    username: str
    password: Optional[str] = Field(None, description="Password can be empty when not updating")
    company: str
    
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
    organization = Column(String, index=True)  # Nuevo campo para la organización
 
    
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

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=True)
    is_manager = Column(Boolean, default=True)
    rol = Column(String, nullable=False)
    company = Column(String, nullable=False)

    
# Crea las tablas en la base de datos
Base.metadata.create_all(bind=engine)

# Secret key and algorithm for JWT
SECRET_KEY = "YOUR_FAST_API_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRES_MINUTES = 800
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


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")



class LoginItem(BaseModel):
    username: str
    password: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)


def authenticate_user(db: Session, username: str, password: str):
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@app.post("/login", response_model=dict)
async def login(login_item: LoginItem, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_item.username, login_item.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Crear el token de acceso, incluyendo el rol del usuario en el token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    access_token = create_access_token(
        data={"username": user.username, "is_admin": user.is_admin, "is_manager": user.is_manager},
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token": "bearer",
        "username": user.username,
        "is_admin": user.is_admin,  # Devuelve la información de si es admin o no
        "is_manager": user.is_manager  # Devuelve la información de si es admin o no

    }

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        if username is None:
            raise credentials_exception
        token_data = {"username": username}
    except JWTError:
        raise credentials_exception
    user = db.query(UserModel).filter(UserModel.username == token_data["username"]).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/users/me")
async def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user




@app.post("/register/", status_code=201)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Verificar si el usuario ya existe
    existing_user = db.query(UserModel).filter(UserModel.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Crear el nuevo usuario
    new_user = UserModel(
        username=user.username,
        hashed_password=get_password_hash(user.password),  # Encripta la contraseña
        is_active=True,
        is_admin=False,  # Asegurando que no todos los usuarios sean admins por defecto
        is_manager=True if user.rol == "manager" else False,  # Asigna is_manager basado en el rol
        rol=user.rol,  # Asigna el rol basado en la solicitud
        company=user.company  # Asigna la empresa al usuario
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "username": new_user.username, "rol": new_user.rol, "company": new_user.company}




@app.post("/change-password")
async def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db)):
    # Buscar al usuario por nombre de usuario
    user = db.query(UserModel).filter(UserModel.username == request.username).first()

    # Verificar la contraseña actual
    if not user or not pwd_context.verify(request.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")

    # Cambiar la contraseña
    user.hashed_password = pwd_context.hash(request.new_password)
    db.commit()

    return {"message": "Password changed successfully"}




























@app.get("/organizations", response_model=List[Dict[str, str]])
async def get_organizations(db: Session = Depends(get_db)):
    # Query the database to get distinct organization names
    organizations = db.query(GitHubUserModel.organization).distinct().all()

    # Convert the result to the desired format
    org_list = [{"id": org[0], "name": org[0]} for org in organizations if org[0]]

    return org_list

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

@app.get("/user-connections/{org_name}")
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


@app.get("/user/connections")
def get_user_connections(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    # Intentar construir el grafo de usuarios para la organización del usuario actual
    try:
        G = build_user_graph(db, current_user.company)
    except ValueError as e:
        # Si no hay usuarios en la organización con todos los atributos requeridos
        return {"message": str(e)}

    # Verificar si el usuario actual está en el grafo
    if current_user.username not in G:
        return {"message": "Ohhhh vaya..., parece que no tienes todavía ningun compañero por aquí..."}

    connections = list(G.neighbors(current_user.username))
    connected_users = []
    
    for conn in connections:
        user = db.query(GitHubUserModel).filter(GitHubUserModel.username == conn).first()
        if user:
            connected_users.append({
                "username": user.username,
                "avatar_url": user.avatar_url,
                "github_url": f"https://github.com/{user.username}"
            })

    # Si no hay conexiones encontradas
    if not connected_users:
        return {"message": "No connections found in your organization."}

    return connected_users


@app.get("/manager/users")
async def get_users_for_manager(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_manager:  # Asumiendo que tienes un campo 'is_manager' en tu modelo de usuario
        raise HTTPException(status_code=403, detail="Access forbidden: Only managers can access this resource.")
    
    company_name = current_user.company
    users = db.query(GitHubUserModel).filter(GitHubUserModel.organization == company_name).all()
    return users


@app.get("/users/", response_model=List[UserResponse])
async def get_users(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin:  # Solo los administradores pueden acceder a esta lista
        raise HTTPException(status_code=403, detail="Access forbidden: Only admins can access this resource.")
    
    users = db.query(UserModel).all()
    return users


@app.get("/users/{user_id}", response_model=UserCreate)
async def get_user(user_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin and current_user.id != user_id:  # Solo los admins o el propio usuario pueden acceder a sus datos
        raise HTTPException(status_code=403, detail="Access forbidden")

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user

@app.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_data: UserCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin and current_user.id != user_id:  # Solo los admins o el propio usuario pueden editar sus datos
        raise HTTPException(status_code=403, detail="Access forbidden")

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.username = user_data.username
    user.rol = user_data.rol
    user.company = user_data.company
    if user_data.password:
        user.hashed_password = get_password_hash(user_data.password)

    db.commit()
    db.refresh(user)
    
    return user

@app.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin:  # Solo los administradores pueden eliminar usuarios
        raise HTTPException(status_code=403, detail="Access forbidden")

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}
