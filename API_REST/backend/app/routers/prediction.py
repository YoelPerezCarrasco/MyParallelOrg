from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from joblib import load
import pandas as pd
from typing import List
from app.database.database import get_db
from app.models.user import GitHubUserModel, UserInteractions
from app.schemas.user import UserRecommendationResponse
import os
import logging

router = APIRouter()

@router.get('/users/{user_id}/recommendations', response_model=List[UserRecommendationResponse])
async def get_user_recommendations(user_id: int, db: Session = Depends(get_db)):
    # Configurar el logger
    logger = logging.getLogger(__name__)

    # Verificar que el usuario existe
    user = db.query(GitHubUserModel).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Cargar el modelo entrenado y el escalador
    model_path = os.path.join('/app/modelos', 'modelo_colaboracion.joblib')
    scaler_path = os.path.join('/app/modelos', 'scaler.joblib')
    try:
        model = load(model_path)
        scaler = load(scaler_path)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="El modelo o el escalador no están entrenados o no se encuentra el archivo.")

    # Obtener todos los usuarios excepto el actual
    all_users = db.query(GitHubUserModel).filter(GitHubUserModel.id != user_id).all()

    # Obtener todas las interacciones existentes del usuario actual con otros usuarios
    interactions = db.query(UserInteractions).filter(
        (UserInteractions.user_1 == user_id) | (UserInteractions.user_2 == user_id)
    ).all()

    # Crear un diccionario para acceder rápidamente a las interacciones por pares de usuarios
    interaction_dict = {}
    for interaction in interactions:
        other_user_id = interaction.user_2 if interaction.user_1 == user_id else interaction.user_1
        interaction_dict[other_user_id] = interaction

    recommendations = []

    for other_user in all_users:
        other_user_id = other_user.id

        # Verificar si ya existe una interacción almacenada
        interaction = interaction_dict.get(other_user_id, None)

        if interaction:
            features = {
                'commits_juntos': interaction.commits_juntos,
                'contributions_juntas': interaction.contributions_juntas,
                'pull_requests_comentados': interaction.pull_requests_comentados,
                'revisiones': interaction.revisiones
            }
        else:
            # Estimar características para usuarios sin interacciones previas
            # Por ejemplo, utilizar valores promedio de las interacciones existentes
            # Puedes ajustar esta parte según tus necesidades y disponibilidad de datos

            # Obtener promedios de características del usuario actual con otros usuarios
            if interactions:
                avg_commits = sum([i.commits_juntos for i in interactions]) / len(interactions)
                avg_contributions = sum([i.contributions_juntas for i in interactions]) / len(interactions)
                avg_pull_requests = sum([i.pull_requests_comentados for i in interactions]) / len(interactions)
                avg_revisiones = sum([i.revisiones for i in interactions]) / len(interactions)
            else:
                # Si el usuario no tiene interacciones, usar valores promedio globales o valores por defecto
                avg_commits = db.query(db.func.avg(UserInteractions.commits_juntos)).scalar() or 0
                avg_contributions = db.query(db.func.avg(UserInteractions.contributions_juntas)).scalar() or 0
                avg_pull_requests = db.query(db.func.avg(UserInteractions.pull_requests_comentados)).scalar() or 0
                avg_revisiones = db.query(db.func.avg(UserInteractions.revisiones)).scalar() or 0

            features = {
                'commits_juntos': avg_commits,
                'contributions_juntas': avg_contributions,
                'pull_requests_comentados': avg_pull_requests,
                'revisiones': avg_revisiones
            }

        # Crear DataFrame para la predicción con los mismos nombres de columnas
        X_new = pd.DataFrame([features])

        # Aplicar el mismo escalado que se utilizó durante el entrenamiento
        X_new_scaled = scaler.transform(X_new)

        # Predecir la probabilidad de colaboración
        probabilidad = model.predict_proba(X_new_scaled)[0][1]

        # Agregar a la lista de recomendaciones
        if probabilidad < 0.9 and probabilidad > 0.8:
            recommendations.append({
                'user': other_user,
                'probabilidad': probabilidad
            })

    # Ordenar las recomendaciones por probabilidad en orden descendente
    recommendations.sort(key=lambda x: x['probabilidad'], reverse=True)

    # Mapear las recomendaciones al formato del esquema de respuesta
    recommended_users = [
        UserRecommendationResponse(
            id=rec['user'].id,
            username=rec['user'].username,
            avatar_url=rec['user'].avatar_url,
            github_url=rec['user'].html_url,
            probabilidad=rec['probabilidad']
        )
        for rec in recommendations
    ]

    return recommended_users
