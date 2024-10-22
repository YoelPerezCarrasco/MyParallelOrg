# app/routers/manager_dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import GitHubUserModel, PullRequest, PullRequestReview, UserModel, UserRepoCommits
from app.services.auth import get_current_user
from typing import List

router = APIRouter()

@router.get('/manager/users-points')
async def get_users_points(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_manager:
        raise HTTPException(status_code=403, detail="Access forbidden: Only managers can access this resource.")
    
    # Obtener los usuarios de la misma organización (empresa)
    usuarios = db.query(GitHubUserModel).filter_by(organization=current_user.company).all()
    
    # Ordenar los usuarios por puntos de mayor a menor
    usuarios_ordenados = sorted(usuarios, key=lambda x: x.puntos, reverse=True)
    
    # Crear una lista con la información necesaria
    usuarios_data = []
    for usuario in usuarios_ordenados:
        usuarios_data.append({
            'username': usuario.username,
            'puntos': usuario.puntos,
            'commits': db.query(UserRepoCommits).filter_by(user_id=usuario.id).count(),
            'revisiones': db.query(PullRequestReview).filter_by(reviewer_id=usuario.id).count(),
            'pull_requests_aceptados': db.query(PullRequest).filter_by(author_id=usuario.id, state='closed').count()
        })
    
    return usuarios_data
