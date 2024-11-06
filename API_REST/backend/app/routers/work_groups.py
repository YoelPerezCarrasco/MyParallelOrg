from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import json
import os
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.user import UserModel,  GruposTrabajo
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

    # Genera los grupos de trabajo y obtén el DataFrame
    grupos_df = generar_grupos_de_trabajo(org)  # La función debe devolver un DataFrame con 'grupo_id' y 'usuarios'

    # Borra los grupos previos de esta organización en la base de datos
    db.query(GruposTrabajo).filter(GruposTrabajo.organizacion == org).delete()
    db.commit()

    # Inserta los nuevos grupos en la base de datos
    for _, row in grupos_df.iterrows():
        grupo_id = row['grupo_id']
        usuarios = row['usuarios']

        for usuario_id in usuarios:
            grupo = GruposTrabajo(grupo_id=grupo_id, usuario_id=usuario_id, organizacion=org)
            db.add(grupo)

    db.commit()

    # Devuelve los grupos generados
    grupos = [{"grupo_id": row['grupo_id'], "usuarios": row['usuarios']} for _, row in grupos_df.iterrows()]
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
    organizacion = current_user.organizacion

    # Obtener los grupos de trabajo para esa organización
    grupos_db = db.query(GruposTrabajo).filter(GruposTrabajo.organizacion == organizacion).all()
    if not grupos_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No workgroups found")

    # Convertir los resultados en objetos `GrupoTrabajo` para la respuesta
    grupos = []
    for grupo in grupos_db:
        grupos.append(GrupoTrabajo(grupo_id=grupo.grupo_id, usuarios=[grupo.usuario_id]))

    return grupos