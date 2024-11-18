

import os
from typing import List
import pandas as pd
import numpy as np
import networkx as nx
from sklearn.preprocessing import StandardScaler
from sqlalchemy import func
from joblib import load
from networkx.algorithms import community
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.user import GitHubUserModel, UserModel
from app.models.user import GruposTrabajo

import logging

# Configurar el logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generar_grupos_de_trabajo(org_name: str, db: Session) -> pd.DataFrame:
    logger.info(f"Iniciando generación de grupos para la organización: {org_name}")

    try:
        # Cargar el modelo entrenado
        model_dir = '/app/modelos'
        model_path = os.path.join(model_dir, f'modelo_colaboracion_{org_name}.joblib')
        scaler_path = os.path.join(model_dir, f'scaler_{org_name}.joblib')
        modelo = load(model_path)
        scaler = load(scaler_path)
        logger.info("Modelo y escalador cargados con éxito")

        # Obtener la lista de usuarios de la organización específica desde la base de datos
        usuarios_db = db.query(GitHubUserModel).filter(GitHubUserModel.organization == org_name).all()
        usuarios = [int(usuario.id) for usuario in usuarios_db]
        logger.info(f"Usuarios obtenidos para la organización: {len(usuarios)} usuarios")

        # Leer las interacciones y características desde el archivo específico de la organización
        interacciones_path = os.path.join(model_dir, f'{org_name}_interacciones.csv')
        interacciones_df = pd.read_csv(interacciones_path)
        logger.info("Interacciones cargadas desde el CSV de interacciones")

        # Convertir 'user_1' y 'user_2' a enteros nativos
        interacciones_df['user_1'] = interacciones_df['user_1'].astype(int)
        interacciones_df['user_2'] = interacciones_df['user_2'].astype(int)

        # Filtrar las interacciones solo entre usuarios de la organización
        interacciones_df = interacciones_df[
            (interacciones_df['user_1'].isin(usuarios)) & 
            (interacciones_df['user_2'].isin(usuarios))
        ]
        logger.info(f"Interacciones filtradas: {len(interacciones_df)} registros tras filtrar por usuarios de la organización")

        # Si no hay interacciones después de filtrar, manejar este caso
        if interacciones_df.empty:
            logger.warning("No se encontraron interacciones entre los usuarios, asignando grupos aleatorios")
            grupos_finales = [usuarios[i:i + 15] for i in range(0, len(usuarios), 15)]
            group_leaders = [grupo[0] for grupo in grupos_finales]  # Asignar al primer usuario como líder por defecto
        else:
            # Preparar las características y predecir probabilidades
            X = interacciones_df[['commits_juntos', 'contributions_juntas', 'pull_requests_comentados', 'revisiones']]
            X_scaled = scaler.transform(X)
            probabilidades = modelo.predict_proba(X_scaled)[:, 1]
            interacciones_df['probabilidad_colaboracion'] = probabilidades
            logger.info("Probabilidades de colaboración calculadas")

            # Crear el grafo ponderado
            G = nx.Graph()
            for idx, row in interacciones_df.iterrows():
                user_1 = int(row['user_1'])
                user_2 = int(row['user_2'])
                weight = row['probabilidad_colaboracion']
                G.add_edge(user_1, user_2, weight=weight)
            logger.info("Grafo de interacciones creado")

            # Agregar nodos aislados (usuarios sin interacciones)
            G.add_nodes_from(usuarios)
            logger.info("Nodos aislados añadidos al grafo")

            # Aplicar un algoritmo de detección de comunidades
            comunidades = community.louvain_communities(G, weight='weight', resolution=1.0, seed=42)
            logger.info(f"Comunidades detectadas: {len(comunidades)} comunidades encontradas")

            # Limitar el tamaño de los grupos a 15 personas y asignar líderes
            grupos_finales = []
            group_leaders = []
            for comunidad in comunidades:
                comunidad = [int(u) for u in comunidad]
                # Si la comunidad es mayor a 15, dividirla en subgrupos
                if len(comunidad) > 15:
                    subgrupos = [comunidad[i:i + 15] for i in range(0, len(comunidad), 15)]
                    for subgrupo in subgrupos:
                        grupos_finales.append(subgrupo)
                        # Asignar líder para cada subgrupo
                        leader_id = asignar_lider(subgrupo, G)
                        group_leaders.append(leader_id)
                else:
                    grupos_finales.append(comunidad)
                    # Asignar líder para la comunidad
                    leader_id = asignar_lider(comunidad, G)
                    group_leaders.append(leader_id)
            logger.info("Grupos formados con tamaño limitado a 15 personas y líderes asignados")

        # Obtener el grupo_id máximo actual en la base de datos
        max_grupo_id = db.query(func.max(GruposTrabajo.grupo_id)).scalar()
        if max_grupo_id is None:
            max_grupo_id = 0
        else:
            max_grupo_id += 1  # Iniciar desde el siguiente ID disponible

        # Asignar grupo_id únicos a los grupos generados
        grupos_ids = list(range(max_grupo_id, max_grupo_id + len(grupos_finales)))

        logger.info("Asignación de IDs únicos a los nuevos grupos")

        # Devuelve el DataFrame para uso opcional en otras partes del código
        grupos_df = pd.DataFrame({
            'grupo_id': grupos_ids,
            'usuarios': grupos_finales,
            'leader_id': group_leaders
        })
        return grupos_df

    except Exception as e:
        logger.error(f"Error al generar grupos de trabajo: {e}", exc_info=True)
        raise


def asignar_lider(grupo: List[int], G: nx.Graph) -> int:
    total_weights = {}
    for user in grupo:
        weight_sum = 0
        for other_user in grupo:
            if user != other_user:
                if G.has_edge(user, other_user):
                    weight_sum += G[user][other_user]['weight']
        total_weights[user] = weight_sum
    logger.info(f"Total weights for group {grupo}: {total_weights}")
    leader = max(total_weights, key=total_weights.get)
    logger.info(f"Leader selected: {leader}")
    return leader


def get_users_in_group(db: Session, group_id: int) -> List[UserModel]:
    """
    Obtiene los usuarios en un grupo específico desde la base de datos,
    indicando quién es el líder.
    """
    # Consultar los registros en GruposTrabajo para obtener los usuarios en el grupo
    grupo_usuarios = db.query(GruposTrabajo).filter(GruposTrabajo.grupo_id == group_id).all()
    
    if not grupo_usuarios:
        raise ValueError(f"No se encontraron usuarios en el grupo con ID {group_id}")

    # Obtener los IDs de los usuarios y si son líderes
    users_info = [(gu.usuario_id, gu.is_leader) for gu in grupo_usuarios]

    # Consultar los usuarios en la base de datos
    user_ids = [info[0] for info in users_info]
    users = db.query(UserModel).filter(UserModel.id.in_(user_ids)).all()

    # Asociar cada usuario con su estado de líder
    for user in users:
        user.is_leader = next((is_leader for uid, is_leader in users_info if uid == user.id), False)

    return users

def get_user_groups(db: Session, user_id: int) -> List[int]:
    """
    Obtiene los IDs de los grupos a los que pertenece un usuario.
    
    :param db: Sesión de la base de datos.
    :param user_id: ID del usuario.
    :return: Lista de IDs de grupos a los que pertenece el usuario.
    """
    # Consultar la tabla GruposTrabajo para obtener los grupo_id del usuario especificado
    user_groups = db.query(GruposTrabajo.grupo_id).filter(GruposTrabajo.usuario_id == user_id).all()
    
    # Extraer los IDs de grupo de los resultados y devolver como lista
    return [group[0] for group in user_groups]