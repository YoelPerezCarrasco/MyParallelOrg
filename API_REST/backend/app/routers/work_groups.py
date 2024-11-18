from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import json
import os
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.user import GitHubUserModel, ProjectModel, PullRequest, PullRequestReview, UserModel,  GruposTrabajo, UserRepoCommits, UserRepoContributions
from app.services.auth import get_current_user, get_db
from app.schemas.user import GrupoTrabajo, OrgRequest  # Asegúrate de definir este esquema
from app.services.work_groups import generar_grupos_de_trabajo

router = APIRouter()
@router.post("/manager/groups/generate")
async def generate_groups(request: OrgRequest, db: Session = Depends(get_db)):
    """
    Genera grupos de trabajo para una organización específica y los guarda en la base de datos.
    """
    org = request.org

    # Genera los nuevos grupos de trabajo y obtén el DataFrame
    grupos_df = generar_grupos_de_trabajo(org, db)  # La función devuelve un DataFrame con 'grupo_id' y 'usuarios'

    # Inserta los nuevos grupos en la base de datos
    for _, row in grupos_df.iterrows():
        grupo_id = row['grupo_id']
        usuarios = row['usuarios']
        leader_id = row.get('leader_id')  # Obtener el líder si está presente en el DataFrame

        for usuario_id in usuarios:
            is_leader = (usuario_id == leader_id)  # Establecer líder si coincide con leader_id
            grupo = GruposTrabajo(grupo_id=grupo_id, usuario_id=usuario_id, organizacion=org, is_leader=is_leader)
            db.add(grupo)

    db.commit()

    # Devuelve los grupos generados en formato de respuesta
    grupos = [{"grupo_id": row['grupo_id'], "usuarios": row['usuarios'], "leader_id": row.get('leader_id')} for _, row in grupos_df.iterrows()]
    return grupos



@router.get("/manager/groups", response_model=List[GrupoTrabajo])
def get_workgroups_for_manager(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Verificar si el usuario es un manager
    if not current_user.is_manager:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # Obtener la organización del usuario
    organizacion = current_user.company

    # Obtener los grupos de trabajo para esa organización
    grupos_db = db.query(GruposTrabajo).filter(GruposTrabajo.organizacion == organizacion).all()
    if not grupos_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No workgroups found")

    # Agrupar usuarios por grupo_id y asignar el líder
    grupos = defaultdict(lambda: {"usuarios": [], "leader_id": None})
    for grupo in grupos_db:
        grupos[grupo.grupo_id]["usuarios"].append(grupo.usuario_id)
        # Usar is_leader para identificar el líder
        if grupo.is_leader:
            grupos[grupo.grupo_id]["leader_id"] = grupo.usuario_id

    # Convertir a la lista de `GrupoTrabajo` para la respuesta
    resultado = [
        GrupoTrabajo(grupo_id=grupo_id, usuarios=datos["usuarios"], leader_id=datos["leader_id"])
        for grupo_id, datos in grupos.items()
    ]

    return resultado



@router.get("/workgroups/user/group")
def get_user_workgroup(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Buscar el ID correspondiente en GitHubUserModel basado en el username del UserModel actual
    github_user = db.query(GitHubUserModel).filter(GitHubUserModel.username == current_user.username).first()
    if not github_user:
        raise HTTPException(status_code=404, detail="No se encontró el usuario en GitHubUserModel.")

    # Buscar el grupo de trabajo en base al id de GitHubUserModel
    workgroup = db.query(GruposTrabajo).filter(GruposTrabajo.usuario_id == github_user.id and GruposTrabajo.organizacion == github_user.organization).first()
    if not workgroup:
        raise HTTPException(status_code=404, detail="No perteneces a ningún grupo de trabajo.")
    
    response = {
        "grupo_id": workgroup.grupo_id,
        "leader_id": workgroup.usuario_id if workgroup.is_leader else None,
        "project_id": getattr(workgroup, "project_id", None),
        "is_leader": workgroup.is_leader # Añade 'project_id' si está en el modelo
    }
    return response
# routers/workgroups.py

@router.get("/workgroups/group/{group_id}/members")
def get_group_members(
    group_id: int,
    current_user: GitHubUserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    
    user2 = db.query(GitHubUserModel).filter(GitHubUserModel.username == current_user.username).first()

    # Verificar si el usuario pertenece al grupo
    user_group = db.query(GruposTrabajo).filter(GruposTrabajo.usuario_id == user2.id).first()
    if not user_group or user_group.grupo_id != group_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a este grupo.")
    
    members = db.query(GruposTrabajo).filter(GruposTrabajo.grupo_id == group_id).all()
    member_details = []
    for member in members:
        user = db.query(GitHubUserModel).filter(GitHubUserModel.id == member.usuario_id).first()
        if user:
            member_details.append({
                "id": user.id,
                "username": user.username,
                "avatar_url": user.avatar_url,
                "is_leader": member.is_leader
            })
    return member_details


# routers/workgroups.py

# routers/workgroups.py

@router.get("/workgroups/group/{group_id}/members/details")
def get_group_members_details(
    group_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Obtener el ID de GitHubUserModel del usuario actual
    github_user = db.query(GitHubUserModel).filter(GitHubUserModel.username == current_user.username).first()
    if not github_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado en GitHubUserModel.")

    # Verificar si el usuario pertenece al grupo
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

    project_id = group_project.project_id

    # Obtener el nombre del repositorio del proyecto
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")

    repo_name = project.name  # Asumiendo que el nombre del proyecto es el nombre del repositorio

    # Obtener miembros del grupo
    members = db.query(GruposTrabajo).filter(GruposTrabajo.grupo_id == group_id).all()
    member_details = []
    for member in members:
        user = db.query(GitHubUserModel).filter(GitHubUserModel.id == member.usuario_id).first()
        if user:
            # Obtener estadísticas del usuario para el repositorio específico
            commits = db.query(UserRepoCommits).filter(
                UserRepoCommits.user_id == user.id,
                UserRepoCommits.repo_name == repo_name
            ).count()

            contributions = db.query(UserRepoContributions).filter(
                UserRepoContributions.user_id == user.id,
                UserRepoContributions.repo_name == repo_name
            ).count()

            pull_requests = db.query(PullRequest).filter(
                PullRequest.author_id == user.id,
                PullRequest.repo_name == repo_name
            ).count()

            reviews = db.query(PullRequestReview).join(PullRequest).filter(
                PullRequestReview.reviewer_id == user.id,
                PullRequest.repo_name == repo_name
            ).count()

            member_details.append({
                "id": user.id,
                "name": user.username,
                "avatarUrl": user.avatar_url,
                "commits": commits,
                "contributions": contributions,
                "pullRequests": pull_requests,
                "reviews": reviews,
                "isLeader": member.is_leader
            })
    return member_details
