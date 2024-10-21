# crud/user.py
from sqlalchemy.orm import Session
from app.models.user import UserModel, GitHubUserModel
from app.schemas.user import UserCreate, UserResponse
from app.core.security import get_password_hash, get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.database.database import get_db
from app.services.connections import build_user_graph
from networkx.readwrite import json_graph
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Endpoints CRUD para usuarios
@router.get("/manager/users", response_model=List[UserResponse])
async def get_users_for_manager(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_manager:
        raise HTTPException(status_code=403, detail="Access forbidden: Only managers can access this resource.")
    company_name = current_user.company
    users = db.query(GitHubUserModel).filter(GitHubUserModel.organization == company_name).all()
    return users

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
        github_url = f"https://github.com/{node_id}"
        nodes.append({
            "id": node_id,
            "label": node_id,
            "icon": avatar_url,
            "github_url": github_url
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
