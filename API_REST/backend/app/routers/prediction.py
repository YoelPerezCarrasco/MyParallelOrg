# colaboracion.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.database import get_db
from app.models.user import GitHubUserModel
from app.services.interactions import (
    obtener_commits_juntos,
    obtener_pull_requests_comentados,
    obtener_revisiones
)
from app.models.user import UserInteractions
from joblib import load
import pandas as pd
import os

router = APIRouter()

class ColaboracionInput(BaseModel):
    user_1: int
    user_2: int

@router.post('/predecir_colaboracion')
async def predecir_colaboracion(input_data: ColaboracionInput, db: Session = Depends(get_db)):
    # Verificar que los usuarios existen
    user1 = db.query(GitHubUserModel).filter_by(id=input_data.user_1).first()
    user2 = db.query(GitHubUserModel).filter_by(id=input_data.user_2).first()
    if not user1 or not user2:
        raise HTTPException(status_code=404, detail="Uno o ambos usuarios no encontrados")

    # Obtener las características desde la tabla user_interactions
    interaction = db.query(UserInteractions).filter_by(user_1=user1.id, user_2=user2.id).first()
    if not interaction:
        # Si no existe la interacción, puedes decidir calcularla en tiempo real o devolver un error
        commits_juntos = obtener_commits_juntos(db, user1.id, user2.id)
        pull_requests_comentados = obtener_pull_requests_comentados(db, user1.id, user2.id)
        revisiones = obtener_revisiones(db, user1.id, user2.id)

        features = {
            'commits_juntos': commits_juntos,
            'pull_requests_comentados': pull_requests_comentados,
            'revisiones': revisiones
        }
    else:
        features = {
            'commits_juntos': interaction.commits_juntos,
            'pull_requests_comentados': interaction.pull_requests_comentados,
            'revisiones': interaction.revisiones
        }

    # Convertir a DataFrame
    X = pd.DataFrame([features])

    # Ruta al modelo entrenado
    model_path = os.path.join(os.path.dirname(__file__), 'modelo_colaboracion.joblib')

    # Intentar cargar el modelo entrenado
    try:
        model = load(model_path)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="El modelo entrenado no se encontró. Por favor, entrenar el modelo antes de realizar predicciones.")

    # Realizar la predicción
    try:
        prediction = model.predict(X)[0]
        probability = model.predict_proba(X)[0][1]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al realizar la predicción: {e}")

    return {
        'prediccion': int(prediction),
        'probabilidad': probability
    }
