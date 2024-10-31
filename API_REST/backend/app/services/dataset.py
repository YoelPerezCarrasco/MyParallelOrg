
import pandas as pd
from sqlalchemy.orm import Session
from app.models.user import GitHubUserModel
from typing import List
from app.services.interactions import obtener_pull_requests_comentados, obtener_revisiones, obtener_contributions_juntas, obtener_commits_juntos
from app.services.gamification import calcular_puntos_usuario
from app.models.user import UserInteractions

import logging

# Configurar el logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generar_interacciones_y_dataset(db: Session, org_name: str) -> pd.DataFrame:
    try:
        # Obtener todos los usuarios de la organización
        users = db.query(GitHubUserModel).filter_by(organization=org_name).all()
        user_ids = [user.id for user in users]
        logger.info(f"Se encontraron {len(users)} usuarios en la organización {org_name}")

 

        data = []
        

        for i in range(len(user_ids)):
            for j in range(i + 1, len(user_ids)):
                user_id_1 = user_ids[i]
                user_id_2 = user_ids[j]

                try:
                    # Calcular las interacciones
                    commits_juntos = obtener_commits_juntos(db, user_id_1, user_id_2)
                    contributions_juntas = obtener_contributions_juntas(db, user_id_1, user_id_2)
                    #pull_requests_comentados = obtener_pull_requests_comentados(db, user_id_1, user_id_2)
                    #revisiones = obtener_revisiones(db, user_id_1, user_id_2)

                    # Reemplaza user_id_1 y user_id_2 con IDs reales de usuarios
                    commits_juntoss = obtener_commits_juntos(db, user_id_1, user_id_2)
                    print(f"Commits juntos entre {user_id_1} y {user_id_2}: {commits_juntoss}")

                    
      
                    logger.info(f"Interacciones entre {user_id_1} y {user_id_2}: commits_juntos={commits_juntos}, contributions_juntas={contributions_juntas}")
        
                except Exception as e:
                    logger.error(f"Error al calcular interacciones entre {user_id_1} y {user_id_2}: {e}")
                    continue

                # Definir el 'resultado' basado en algún criterio
                resultado = 1 if (commits_juntos + contributions_juntas) > 0 else 0

                try:
                    # Almacenar en la base de datos
                    interaction = db.query(UserInteractions).filter_by(user_1=user_id_1, user_2=user_id_2).first()
                    if not interaction:
                        interaction = UserInteractions(
                            user_1=user_id_1,
                            user_2=user_id_2,
                            commits_juntos=commits_juntos,
                            contributions_juntas=contributions_juntas,
                            pull_requests_comentados=" ",
                            revisiones=" ",
                            resultado=resultado
                        )
                        db.add(interaction)
                    else:
                        interaction.commits_juntos = commits_juntos
                        interaction.contributions_juntas = contributions_juntas
                        interaction.pull_requests_comentados = " "
                        interaction.revisiones = " "
                        interaction.resultado = resultado
                except Exception as e:
                    logger.error(f"Error al almacenar interacción entre {user_id_1} y {user_id_2}: {e}")
                    continue

                # Añadir al dataset
                data.append({
                    'user_1': user_id_1,
                    'user_2': user_id_2,
                    'commits_juntos': commits_juntos,
                    'contributions_juntas': contributions_juntas,
                    'pull_requests_comentados': "pull_requests_comentados",
                    'revisiones': "revisiones",
                    'resultado': resultado
                })

        db.commit()
    except Exception as e:
        logger.error(f"Error general en la generación de interacciones y dataset para la organización {org_name}: {e}")
        db.rollback()
        raise

    logger.info(f"Total de interacciones registradas: {len(data)}")


    # Convertir a DataFrame de pandas
    try:
        df = pd.DataFrame(data)
    except Exception as e:
        logger.error(f"Error al convertir los datos a DataFrame: {e}")
        raise

    return df


def actualizar_puntos_usuarios(db: Session):
    usuarios = db.query(GitHubUserModel).all()
    for usuario in usuarios:
        calcular_puntos_usuario(db, usuario)
