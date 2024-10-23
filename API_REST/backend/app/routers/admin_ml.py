from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import UserModel
from app.services.auth import get_current_user
from app.services.ml_training import entrenar_modelo_colaboracion

router = APIRouter()

@router.post('/admin/train-model')
async def train_model(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access forbidden: Only admins can access this resource.")

    try:
        # Especifica el nombre de la organización si es necesario
        org_name = 'nombre_de_tu_organizacion'
        accuracy = entrenar_modelo_colaboracion(db, org_name)
        return {"message": f"Modelo entrenado con éxito. Precisión: {accuracy}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al entrenar el modelo: {e}")

@router.get('/admin/model-status')
async def model_status():
    try:
        from joblib import load
        model = load('modelo_colaboracion.joblib')
        with open('model_accuracy.txt', 'r') as f:
            accuracy = f.read()
        return {"status": "Modelo entrenado", "accuracy": accuracy}
    except FileNotFoundError:
        return {"status": "Modelo no entrenado", "accuracy": None}