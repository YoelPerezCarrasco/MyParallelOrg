# crud/user.py
import os

import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.user import GruposTrabajo, UserInteractions, UserModel, GitHubUserModel
from app.schemas.user import GitHubUserDetails, UserCreate, UserResponse
from app.core.security import get_password_hash
from app.services.auth import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.database.database import get_db
from app.services.connections import build_user_graph
from networkx.readwrite import json_graph
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Endpoints CRUD para usuarios
@router.get("/manager/users/details", response_model=List[GitHubUserDetails])
async def get_users_for_manager(
        db: Session = Depends(get_db),
        current_user: UserModel = Depends(get_current_user)
    ):
        # Verificar si el usuario actual es manager
        if not current_user.is_manager:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden: Only managers can access this resource.")

        try:
            # Obtener todos los usuarios de la misma organización que el manager
            company_name = current_user.company
            users = (
                db.query(
                    GitHubUserModel.id,
                    GitHubUserModel.username,
                    GitHubUserModel.html_url,
                    GitHubUserModel.avatar_url,
                    GitHubUserModel.organization,
                    GitHubUserModel.stars,
                    GitHubUserModel.dominant_language,
                    func.sum(UserInteractions.commits_juntos).label("commits"),
                    func.sum(UserInteractions.contributions_juntas).label("contributions"),
                    func.sum(UserInteractions.pull_requests_comentados).label("pullRequests"),
                    func.sum(UserInteractions.revisiones).label("reviews"),
                )
                .join(UserInteractions, GitHubUserModel.id == UserInteractions.user_1)
                .filter(GitHubUserModel.organization == company_name)
                .group_by(GitHubUserModel.id)
                .all()
            )

            if not users:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No users found for the manager's organization.")

            # Formatear los resultados para serializar fácilmente
            user_details = [
                {
                    "id": user.id,
                    "username": user.username,
                    "html_url": user.html_url,
                    "avatar_url": user.avatar_url,
                    "organization": user.organization,
                    "stars": user.stars,
                    "dominant_language": user.dominant_language,
                    "commits": user.commits or 0,
                    "contributions": user.contributions or 0,
                    "pullRequests": user.pullRequests or 0,
                    "reviews": user.reviews or 0,
                }
                for user in users
            ]

            return user_details

        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/users/", response_model=List[UserResponse])
async def get_all_users(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access forbidden: Only admins can access this resource.")
    users = db.query(UserModel).all()
    return users

@router.get("/users/{user_id}", response_model=UserCreate)
async def get_user(user_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access forbidden")
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_endpoint(user_id: int, user_data: UserCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin and current_user.id != user_id:
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


@router.delete("/users/{user_id}", status_code=204)
async def delete_user_endpoint(user_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access forbidden")
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
from random import uniform

def generate_position():
    return {"x": uniform(-100, 100), "y": uniform(-100, 100), "z": 0}


@router.get("/user-connections/{org_name}")
async def get_user_connections(org_name: str, db: Session = Depends(get_db)):
    # Verificar si hay usuarios en la organización
    users_in_org = db.query(GitHubUserModel).filter_by(organization=org_name).all()
    if not users_in_org:
        raise HTTPException(status_code=404, detail="No users found in the organization")
    
    # Obtener grupos formados en la organización
    groups = db.query(GruposTrabajo).filter_by(organizacion=org_name).all()
    if not groups:
        raise HTTPException(status_code=404, detail="No groups found in the organization")

    # Construir el nombre del archivo CSV basado en el nombre de la organización
    csv_path = f"/app/modelos/{org_name}_interacciones.csv"  # Asegúrate de que los CSV estén en una carpeta "data/"
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail=f"CSV file not found for organization: {org_name}")
    
    # Leer las interacciones desde el CSV
    try:
        interactions_df = pd.read_csv(csv_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")
    
    # Crear un diccionario de usuarios para acceso rápido por ID
    users_dict = {user.id: user for user in users_in_org}

    # Crear nodos con información de los grupos
    user_ids_in_groups = {group.usuario_id for group in groups if group.usuario_id}
    nodes = []
    for user_id in user_ids_in_groups:
        user = users_dict.get(user_id)
        if user:
            user_group_id = next((group.grupo_id for group in groups if group.usuario_id == user_id), None)

            nodes.append({
                "id": str(user.id),
                "label": user.username,
                "icon": user.avatar_url or "",
                "github_url": f"https://github.com/{user.username}",
                "position": generate_position(),  # Generar posición inicial aleatoria
                "data": {
                    "group": f"Group {user_group_id}"  # Agregar el grupo como identificador del clúster
                }
            })

    # Crear aristas basadas en las interacciones del CSV
    edges = []
    valid_node_ids = {node["id"] for node in nodes}  # IDs válidos basados en nodos existentes
    processed_pairs = set()  # Evitar duplicados
    for _, row in interactions_df.iterrows():
        source = str(row["user_1"])
        target = str(row["user_2"])
        if source in valid_node_ids and target in valid_node_ids:
            # Filtrar solo si el campo "resultado" es 1
            if row["resultado"] == 1:
                pair = tuple(sorted([source, target]))
                if pair not in processed_pairs:
                    processed_pairs.add(pair)
                    label = (
                        f"Commits: {row['commits_juntos']}, "
                        f"Contributions: {row['contributions_juntas']}, "
                        f"PR Comments: {row['pull_requests_comentados']}, "
                        f"Reviews: {row['revisiones']}"
                    )
                    edges.append({
                        "id": f"{source}-{target}",
                        "source": source,
                        "target": target,
                        "label": label  # Etiqueta con detalles de la interacción
                    })

    return {
        "nodes": nodes,
        "edges": edges
    }
@router.get("/user/connections")
async def get_user_connections_current(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        G = build_user_graph(db, current_user.company)
    except ValueError as e:
        return {"message": str(e)}

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
 
 
    if not connected_users:
        return {"message": "No connections found in your organization."}

    return connected_users
