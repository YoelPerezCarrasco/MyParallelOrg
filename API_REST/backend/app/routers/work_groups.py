from fastapi import APIRouter, Depends, HTTPException
from typing import List
import json
import os
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.user import UserModel
from app.services.auth import get_current_user, get_db
from app.schemas.user import OrgRequest  # Asegúrate de definir este esquema
from app.services.work_groups import generar_grupos_de_trabajo

router = APIRouter()


@router.post("/manager/groups/generate")
async def generate_groups(request: OrgRequest, db: Session = Depends(get_db)):
    """
    Genera grupos de trabajo para una organización específica y los guarda en un archivo JSON.
    """
    org = request.org
    generar_grupos_de_trabajo(org)  # Genera los grupos de trabajo

    grupos_path = '/app/data/grupos_formados.json'
    if not os.path.exists(grupos_path):
        raise HTTPException(status_code=404, detail="No se han generado los grupos aún.")

    with open(grupos_path, 'r') as f:
        grupos = json.load(f)
    return grupos
