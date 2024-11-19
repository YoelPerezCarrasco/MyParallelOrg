from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
from typing import List
from app.database.database import get_db
from app.models.user import GitHubUserModel, UserInteractions
from app.schemas.user import UserRecommendationResponse
import os
import logging
from joblib import load

router = APIRouter()

@router.get('/users/{usernamegt}/recommendations', response_model=List[UserRecommendationResponse])
async def get_user_recommendations(usernamegt: str, db: Session = Depends(get_db)):
    # Configurar el logger
    logger = logging.getLogger(__name__)

    # Verificar que el usuario existe
    user = db.query(GitHubUserModel).filter_by(username=usernamegt).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Cargar el modelo entrenado y el escalador
    model_path = os.path.join('/app/modelos', f'modelo_colaboracion_{user.organization}.joblib')
    scaler_path = os.path.join('/app/modelos', f'scaler_{user.organization}.joblib')
    interactions_path = os.path.join('/app/modelos', f'{user.organization}_interacciones.csv')

    try:
        model = load(model_path)  # Cargar el modelo de sklearn en formato joblib
        scaler = load(scaler_path)  # Cargar el escalador
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="El modelo o el escalador no están entrenados o no se encuentra el archivo.")

    # Leer las interacciones desde el archivo CSV
    if not os.path.exists(interactions_path):
        raise HTTPException(status_code=500, detail=f"No se encontró el archivo de interacciones para la organización {user.organization}.")
    
    interactions_df = pd.read_csv(interactions_path)
    
    # Validar que el CSV contiene las columnas necesarias
    required_columns = {'user_1', 'user_2', 'commits_juntos', 'contributions_juntas', 'pull_requests_comentados', 'revisiones'}
    if not required_columns.issubset(interactions_df.columns):
        raise HTTPException(status_code=500, detail="El archivo de interacciones no tiene las columnas necesarias.")

    # Filtrar las interacciones del usuario actual
    user_interactions = interactions_df[(interactions_df['user_1'] == user.id) | (interactions_df['user_2'] == user.id)]

    # Crear un diccionario para acceder rápidamente a las interacciones por pares de usuarios
    interaction_dict = {}
    for _, row in user_interactions.iterrows():
        other_user_id = row['user_2'] if row['user_1'] == user.id else row['user_1']
        interaction_dict[other_user_id] = {
            'commits_juntos': row['commits_juntos'],
            'contributions_juntas': row['contributions_juntas'],
            'pull_requests_comentados': row['pull_requests_comentados'],
            'revisiones': row['revisiones']
        }

    # Obtener todos los usuarios excepto el actual
    all_users = db.query(GitHubUserModel).filter(GitHubUserModel.username != usernamegt, GitHubUserModel.organization == user.organization).all()

    recommendations = []

    for other_user in all_users:
        other_user_id = other_user.id

        # Verificar si ya existe una interacción almacenada
        interaction = interaction_dict.get(other_user_id, None)

        if interaction:
            features = interaction
        else:
            # Estimar características para usuarios sin interacciones previas
            if not user_interactions.empty:
                avg_commits = user_interactions['commits_juntos'].mean()
                avg_contributions = user_interactions['contributions_juntas'].mean()
                avg_pull_requests = user_interactions['pull_requests_comentados'].mean()
                avg_revisiones = user_interactions['revisiones'].mean()
            else:
                avg_commits = 0
                avg_contributions = 0
                avg_pull_requests = 0
                avg_revisiones = 0

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

        # Predecir la probabilidad de colaboración con el modelo
        probabilidad = model.predict_proba(X_new_scaled)[:, 1][0]  # La salida es un valor entre 0 y 1

        # Agregar a la lista de recomendaciones si la probabilidad es mayor o igual al umbral (0.5)
        if probabilidad >= 0.5:
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
