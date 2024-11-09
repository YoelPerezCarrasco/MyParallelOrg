from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.models.user import ProjectModel, UserModel
from app.schemas.user import ProjectResponse
from app.services.auth import get_current_user
from app.database.database import get_db
import requests
import os

router = APIRouter()

GITHUB_API_URL = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

# Función para sincronizar los repositorios de GitHub con los proyectos en la base de datos
def sync_github_repos_with_projects(db: Session, organization: str) -> List[ProjectModel]:
    # Verificar si el token de GitHub está disponible
    if not GITHUB_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub token not configured in environment."
        )

    # Solicitar los repositorios de la organización a la API de GitHub
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json"
    }
    url = f"{GITHUB_API_URL}/orgs/{organization}/repos"
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve repositories from GitHub."
        )

    # Procesar la respuesta de GitHub y sincronizar con la base de datos
    repos_data = response.json()
    for repo in repos_data:
        # Comprobar si el repositorio ya existe en la base de datos
        existing_project = db.query(ProjectModel).filter_by(
            organization=organization, name=repo["name"]
        ).first()

        if not existing_project:
            # Crear un nuevo proyecto si no existe
            new_project = ProjectModel(
                name=repo["name"],
                description=repo.get("description", ""),
                url=repo["html_url"],
                created_at=repo["created_at"],
                updated_at=repo["updated_at"],
                language=repo["language"],
                stargazers_count=repo["stargazers_count"],
                forks_count=repo["forks_count"],
                organization=organization
            )
            db.add(new_project)

    db.commit()  # Guardar todos los nuevos proyectos en la base de datos

    # Devolver todos los proyectos actuales de la organización
    return db.query(ProjectModel).filter(ProjectModel.organization == organization).all()

# Endpoint para obtener los proyectos de la organización
@router.get("/organization/manager/projects", response_model=List[ProjectResponse])
async def get_organization_projects(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if not current_user.is_manager:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Only managers can access this resource."
        )

    # Llama a la función para sincronizar repositorios de GitHub con proyectos en la base de datos
    organization = current_user.company
    return sync_github_repos_with_projects(db, organization)
