
import pandas as pd
from sqlalchemy.orm import Session
from app.models.user import GitHubUserModel
from typing import List
from app.services.interactions import obtener_pull_requests_comentados, obtener_revisiones, obtener_contributions_juntas, obtener_commits_juntos
from app.services.gamification import calcular_puntos_usuario
from app.models.user import UserInteractions

def generar_interacciones_y_dataset(db: Session, org_name: str) -> pd.DataFrame:
    # Obtener todos los usuarios de la organización
    users = db.query(GitHubUserModel).filter_by(organization=org_name).all()
    user_ids = [user.id for user in users]

    data = []

    for i in range(len(user_ids)):
        for j in range(i + 1, len(user_ids)):
            user_id_1 = user_ids[i]
            user_id_2 = user_ids[j]

            # Calcular las interacciones
            commits_juntos = obtener_commits_juntos(db, user_id_1, user_id_2)
            contributions_juntas = obtener_contributions_juntas(db, user_id_1, user_id_2)
            pull_requests_comentados = obtener_pull_requests_comentados(db, user_id_1, user_id_2)
            revisiones = obtener_revisiones(db, user_id_1, user_id_2)

            # Definir el 'resultado' basado en algún criterio
            resultado = 1 if (commits_juntos + contributions_juntas + pull_requests_comentados + revisiones) > 0 else 0

            # Almacenar en la base de datos
            interaction = db.query(UserInteractions).filter_by(user_1=user_id_1, user_2=user_id_2).first()
            if not interaction:
                interaction = UserInteractions(
                    user_1=user_id_1,
                    user_2=user_id_2,
                    commits_juntos=commits_juntos,
                    contributions_juntas=contributions_juntas,
                    pull_requests_comentados=pull_requests_comentados,
                    revisiones=revisiones,
                    resultado=resultado
                )
                db.add(interaction)
            else:
                interaction.commits_juntos = commits_juntos
                interaction.contributions_juntas = contributions_juntas
                interaction.pull_requests_comentados = pull_requests_comentados
                interaction.revisiones = revisiones
                interaction.resultado = resultado

            # Añadir al dataset
            data.append({
                'user_1': user_id_1,
                'user_2': user_id_2,
                'commits_juntos': commits_juntos,
                'contributions_juntas': contributions_juntas,
                'pull_requests_comentados': pull_requests_comentados,
                'revisiones': revisiones,
                'resultado': resultado
            })

    db.commit()

    # Convertir a DataFrame de pandas
    df = pd.DataFrame(data)
    return df


def actualizar_puntos_usuarios(db: Session):
    usuarios = db.query(GitHubUserModel).all()
    for usuario in usuarios:
        calcular_puntos_usuario(db, usuario)