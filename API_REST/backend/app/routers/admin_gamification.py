
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import UserModel
from app.services.auth import get_current_user
from app.services.gamification import actualizar_puntos_usuarios, get_gamification_config
from app.schemas.user import GamificationConfigInput
from app.core.security import update_gamification_config
router = APIRouter()



@router.get('/admin/gamification-config')
async def get_config(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access forbidden: Only admins can access this resource.")

    config = get_gamification_config(db)
    return config

@router.post('/admin/gamification-config')
async def update_config(config_input: GamificationConfigInput, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access forbidden: Only admins can access this resource.")

    new_config = {
        'puntos_commit': config_input.puntos_commit,
        'puntos_revision': config_input.puntos_revision,
        'puntos_pr_aceptado': config_input.puntos_pr_aceptado
    }

    update_gamification_config(db, new_config)

    return {"message": "Configuración actualizada con éxito"}

@router.post('/admin/update-points')
async def update_points(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access forbidden: Only admins can access this resource.")

    try:
        actualizar_puntos_usuarios(db)
        return {"message": "Puntos actualizados con éxito"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar los puntos: {e}")
