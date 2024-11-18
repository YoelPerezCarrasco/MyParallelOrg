from datetime import datetime, timedelta
from json import load
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from app.models.user import GitHubUserModel, ProjectModel, UserModel, UserModel, GruposTrabajo, PullRequest, UserRepoCommits, UserRepoContributions, PullRequestReview
from app.schemas.user import ProjectResponse
from app.services.auth import get_current_user
from app.database.database import get_db
import numpy as np
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score, confusion_matrix
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
        existing_project = db.query(ProjectModel).filter_by(name=repo["name"]).first()

        if existing_project:
            # Actualizar el campo de organización si es necesario
            if existing_project.organization != organization:
                existing_project.organization = organization
        else:
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
                organization=organization  # Asignar organización al nuevo proyecto
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


# routers/projects.py

from app.models.user import ProjectModel

@router.get("/projects/group/{group_id}")
def get_group_project(
    group_id: int,
    current_user: GitHubUserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verificar si el usuario pertenece al grupo
    user_group = db.query(GruposTrabajo).filter(GruposTrabajo.usuario_id == current_user.id).first()
    if not user_group or user_group.grupo_id != group_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a este grupo.")
    
    # Obtener el grupo de trabajo
    group = db.query(GruposTrabajo).filter(GruposTrabajo.grupo_id == group_id).first()
    if not group or not group.project_id:
        raise HTTPException(status_code=404, detail="El grupo no tiene un proyecto asignado.")
    
    project = db.query(ProjectModel).filter(ProjectModel.id == group.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="El proyecto asignado no existe.")
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "url": project.url,
        "language": project.language,
        "stargazers_count": project.stargazers_count,
        "forks_count": project.forks_count
    }



@router.get("/api/dashboard/resumen")
def get_resumen_data(db: Session = Depends(get_db)):
    # Total de grupos únicos
    total_grupos = db.query(GruposTrabajo.grupo_id).distinct().count()

    # Total de usuarios de GitHub
    total_usuarios = db.query(GitHubUserModel).count()

    # Total de commits
    commits_totales = db.query(func.sum(UserRepoCommits.commit_count)).scalar() or 0

    # Total de pull requests
    pull_requests_totales = db.query(PullRequest).count()

    return {
        "totalGrupos": total_grupos,
        "totalUsuarios": total_usuarios,
        "commitsTotales": commits_totales,
        "pullRequestsTotales": pull_requests_totales
    }


@router.get("/api/modelo/rendimiento")
def get_model_performance():
    try:
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        model_dir = '/app/modelos'
        model_path = os.path.join(model_dir, 'modelo_colaboracion.joblib')
        scaler_path = os.path.join(model_dir, 'scaler.joblib')
        X_test_path = os.path.join(model_dir, 'X_test_scaled.csv')
        y_test_path = os.path.join(model_dir, 'y_test.txt')

        if not os.path.exists(model_path) or not os.path.exists(scaler_path) or not os.path.exists(X_test_path) or not os.path.exists(y_test_path):
            logger.error("No se encontraron los archivos necesarios para el modelo.")
            return {"error": "Model files not found."}

        model = load(model_path)
        scaler = load(scaler_path)

        # Cargar los datos de prueba desde archivos de texto
        X_test_scaled = np.loadtxt(X_test_path, delimiter=',')
        y_test = np.loadtxt(y_test_path, dtype=int)

        y_pred = model.predict(X_test_scaled)
        y_proba = model.predict_proba(X_test_scaled)[:, 1]

        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1score = f1_score(y_test, y_pred)
        accuracy = accuracy_score(y_test, y_pred)
        matriz_confusion = confusion_matrix(y_test, y_pred).tolist()

        rendimiento_data = {
            "precision": precision,
            "recall": recall,
            "f1Score": f1score,
            "accuracy": accuracy,
            "matrizConfusion": matriz_confusion
        }
        return rendimiento_data

    except Exception as e:
        logger.error(f"Ocurrió un error al obtener el rendimiento del modelo: {e}")
        return {"error": str(e)}

@router.get("/api/estadisticas/colaboracion_anual")
def get_colaboracion_anual_data(db: Session = Depends(get_db)):
    # Obtener fechas relevantes
    today = datetime.utcnow()
    start_of_this_year = today.replace(month=1, day=1)
    start_of_last_year = (start_of_this_year - timedelta(days=1)).replace(month=1, day=1)
    end_of_last_year = start_of_this_year - timedelta(days=1)

    # Función para obtener colaboraciones por mes en un rango de fechas
    def get_colaboraciones_por_mes(start_date, end_date):
        colaboraciones = db.query(
            func.date_trunc('month', PullRequest.created_at).label('month'),
            func.count(PullRequest.id).label('count')
        ).filter(
            PullRequest.created_at >= start_date,
            PullRequest.created_at <= end_date
        ).group_by(
            func.date_trunc('month', PullRequest.created_at)
        ).order_by(
            func.date_trunc('month', PullRequest.created_at)
        ).all()
        return {record.month.month: record.count for record in colaboraciones}

    # Obtener datos para este año y el año pasado
    colaboraciones_this_year = get_colaboraciones_por_mes(start_of_this_year, today)
    colaboraciones_last_year = get_colaboraciones_por_mes(start_of_last_year, end_of_last_year)

    # Generar etiquetas para el eje X (meses)
    x_axis_labels = [str(month) for month in range(1, 13)]

    # Mapear los datos a los meses del año
    data_this_year = [colaboraciones_this_year.get(month, 0) for month in range(1, 13)]
    data_last_year = [colaboraciones_last_year.get(month, 0) for month in range(1, 13)]

    # Preparar la respuesta
    response = {
        "xAxis": x_axis_labels,
        "thisYear": data_this_year,
        "lastYear": data_last_year
    }

    return response

@router.get("/api/estadisticas/repositorios")
def get_repositorios_data(db: Session = Depends(get_db)):
    repositorios = db.query(ProjectModel).all()

    lenguajes = {}
    repos_data = []

    for repo in repositorios:
        lenguaje = repo.language or 'Desconocido'
        lenguajes[lenguaje] = lenguajes.get(lenguaje, 0) + 1

        repos_data.append({
            "nombre": repo.name,
            "estrellas": repo.stargazers_count,
            "lenguaje": lenguaje
        })

    return {
        "lenguajes": lenguajes,
        "repositorios": repos_data
    }

@router.get("/api/estadisticas/comparativas")
def get_comparativas_data(db: Session = Depends(get_db)):
    # Obtener IDs de grupos únicos
    grupos_ids = db.query(GruposTrabajo.grupo_id).distinct().all()
    grupos_ids = [gid[0] for gid in grupos_ids]

    grupos_nombres = [f"Grupo {gid}" for gid in grupos_ids]
    metricas = []

    for gid in grupos_ids:
        # Obtener IDs de usuarios en el grupo
        usuarios_ids = db.query(GruposTrabajo.usuario_id).filter(GruposTrabajo.grupo_id == gid).all()
        usuarios_ids = [uid[0] for uid in usuarios_ids if uid[0] is not None]

        if not usuarios_ids:
            metricas.append([0, 0, 0])
            continue

        # Commits del grupo
        commits = db.query(func.sum(UserRepoCommits.commit_count)).filter(
            UserRepoCommits.user_id.in_(usuarios_ids)
        ).scalar() or 0

        # Pull requests del grupo
        pull_requests = db.query(PullRequest).filter(
            PullRequest.author_id.in_(usuarios_ids)
        ).count()

        # Revisiones del grupo
        reviews = db.query(PullRequestReview).filter(
            PullRequestReview.reviewer_id.in_(usuarios_ids)
        ).count()

        metricas.append([commits, pull_requests, reviews])

    return {
        "grupos": grupos_nombres,
        "metricas": metricas
    }