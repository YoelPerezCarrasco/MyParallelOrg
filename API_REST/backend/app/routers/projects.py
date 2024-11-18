from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.auth import get_current_user
from app.models.user import GruposTrabajo, GitHubUserModel, ProjectModel, UserModel
from app.schemas.user import ProjectAssignment, ProjectSchema

router = APIRouter()

# Helper function to get the GitHub user model for the current user
def get_github_user(db: Session, current_user: UserModel) -> GitHubUserModel:
    github_user = db.query(GitHubUserModel).filter(GitHubUserModel.username == current_user.username).first()
    if not github_user:
        raise HTTPException(status_code=404, detail="Usuario de GitHub no encontrado.")
    return github_user

@router.get("/projects/group/{group_id}", response_model=ProjectSchema)
def get_group_project(
    group_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    github_user = get_github_user(db, current_user)
    user_organization = github_user.organization

    # Verificar si el usuario pertenece al grupo especificado
    user_group = db.query(GruposTrabajo).filter(
        GruposTrabajo.usuario_id == github_user.id,
        GruposTrabajo.grupo_id == group_id
    ).first()
    if not user_group:
        raise HTTPException(status_code=403, detail="No tienes acceso a este grupo.")
    
    # Obtener el proyecto asignado al grupo
    group_project = db.query(GruposTrabajo).filter(
        GruposTrabajo.grupo_id == group_id,
        GruposTrabajo.project_id != None
    ).first()
    if not group_project:
        raise HTTPException(status_code=404, detail="El grupo no tiene un proyecto asignado.")
    
    # Obtener los detalles del proyecto y verificar que pertenece a la organización del usuario
    project = db.query(ProjectModel).filter(ProjectModel.id == group_project.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="El proyecto asignado no existe.")
    if project.organization != user_organization:
        raise HTTPException(status_code=403, detail="No tienes acceso a este proyecto.")
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "url": project.url,
        "language": project.language,
        "stargazers_count": project.stargazers_count,
        "forks_count": project.forks_count
    }


@router.get("/projects/available", response_model=List[ProjectSchema])
def get_available_projects(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    github_user = get_github_user(db, current_user)
    user_organization = github_user.organization

    # Verificar que el usuario es líder en su grupo
    user_group = db.query(GruposTrabajo).filter(
        GruposTrabajo.usuario_id == github_user.id,
        GruposTrabajo.is_leader == True
    ).first()
    if not user_group:
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")
    
    # Obtener proyectos disponibles de la organización del usuario que no están asignados a ningún grupo
    assigned_project_ids = db.query(GruposTrabajo.project_id).filter(GruposTrabajo.project_id != None).distinct()
    available_projects = db.query(ProjectModel).filter(
        ProjectModel.organization == user_organization,
        ~ProjectModel.id.in_(assigned_project_ids)
    ).all()
    
    projects = [
        {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "url": project.url,
            "language": project.language,
            "stargazers_count": project.stargazers_count,
            "forks_count": project.forks_count
        }
        for project in available_projects
    ]
    return projects


@router.post("/projects/assign")
def assign_project_to_group(
    assignment: ProjectAssignment,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    github_user = get_github_user(db, current_user)
    user_organization = github_user.organization

    # Verificar que el usuario es líder del grupo especificado
    user_group = db.query(GruposTrabajo).filter(
        GruposTrabajo.usuario_id == github_user.id,
        GruposTrabajo.grupo_id == assignment.group_id,
        GruposTrabajo.is_leader == True
    ).first()
    if not user_group:
        raise HTTPException(status_code=403, detail="No tienes permisos para asignar proyectos a este grupo.")
    
    # Verificar que el proyecto existe y pertenece a la organización del usuario
    project = db.query(ProjectModel).filter(ProjectModel.id == assignment.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="El proyecto no existe.")
    if project.organization != user_organization:
        raise HTTPException(status_code=403, detail="No puedes asignar proyectos de otra organización.")
    
    # Verificar que el proyecto está disponible
    assigned_project = db.query(GruposTrabajo).filter(GruposTrabajo.project_id == assignment.project_id).first()
    if assigned_project:
        raise HTTPException(status_code=400, detail="El proyecto ya está asignado a otro grupo.")
    
    # Asignar el proyecto al grupo
    groups = db.query(GruposTrabajo).filter(GruposTrabajo.grupo_id == assignment.group_id).all()
    for group_member in groups:
        group_member.project_id = assignment.project_id
    db.commit()
    
    # Devolver los detalles del proyecto asignado
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "url": project.url,
        "language": project.language,
        "stargazers_count": project.stargazers_count,
        "forks_count": project.forks_count
    }
