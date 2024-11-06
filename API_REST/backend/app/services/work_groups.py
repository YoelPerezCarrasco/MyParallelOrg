import os
from typing import List
import pandas as pd
import numpy as np
import networkx as nx
from sklearn.preprocessing import StandardScaler
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

def generar_grupos_de_trabajo(org_name: str) -> pd.DataFrame:
    logger.info(f"Iniciando generación de grupos para la organización: {org_name}")
    db = None

    try:
        # Crear sesión de base de datos
        db = SessionLocal()
        logger.info("Sesión de base de datos creada")

        # Cargar el modelo entrenado
        model_dir = '/app/modelos'
        model_path = os.path.join(model_dir, 'modelo_colaboracion.joblib')
        scaler_path = os.path.join(model_dir, 'scaler.joblib')
        modelo = load(model_path)
        scaler = load(scaler_path)
        logger.info("Modelo y escalador cargados con éxito")

        # Obtener la lista de usuarios de la organización específica desde la base de datos
        usuarios_db = db.query(GitHubUserModel).filter(GitHubUserModel.organization == org_name).all()
        usuarios = [int(usuario.id) for usuario in usuarios_db]
        logger.info(f"Usuarios obtenidos para la organización: {len(usuarios)} usuarios")

        # Leer las interacciones y características desde simulated_interacciones.csv
        interacciones_path = os.path.join(model_dir, 'simulated_interacciones.csv')
        interacciones_df = pd.read_csv(interacciones_path)
        logger.info("Interacciones cargadas desde simulated_interacciones.csv")

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

            # Limitar el tamaño de los grupos a 15 personas
            grupos_finales = []
            for comunidad in comunidades:
                comunidad = [int(u) for u in comunidad]  # Convertir a int nativo
                # Si la comunidad es mayor a 15, dividirla en subgrupos
                if len(comunidad) > 15:
                    subgrupos = [comunidad[i:i + 15] for i in range(0, len(comunidad), 15)]
                    grupos_finales.extend(subgrupos)
                else:
                    grupos_finales.append(comunidad)
            logger.info("Grupos formados con tamaño limitado a 15 personas")

        # Convertir todos los usuario_id a int en grupos_finales
        grupos_finales = [[int(usuario_id) for usuario_id in grupo] for grupo in grupos_finales]

        # Eliminar grupos previos de la misma organización en la base de datos
        db.query(GruposTrabajo).filter(GruposTrabajo.organizacion == org_name).delete()
        db.commit()

        # Insertar los nuevos grupos en la base de datos
        for grupo_id, usuarios_grupo in enumerate(grupos_finales):
            grupo_id_int = int(grupo_id)
            for usuario_id in usuarios_grupo:
                usuario_id_int = int(usuario_id)
                logger.debug(f"Insertando usuario_id: {usuario_id_int}, grupo_id: {grupo_id_int}")
                usuario = db.query(UserModel).filter(UserModel.id == usuario_id_int).first()
                if usuario:
                    grupo = GruposTrabajo(grupo_id=grupo_id_int, usuario_id=usuario_id_int, organizacion=org_name)
                else:
                    grupo = GruposTrabajo(grupo_id=grupo_id_int, usuario_id=None, organizacion=org_name)
                db.add(grupo)

        db.commit()
        logger.info("Grupos formados guardados en la base de datos")

        # Devuelve el DataFrame para uso opcional en otras partes del código
        grupos_df = pd.DataFrame({'grupo_id': range(len(grupos_finales)), 'usuarios': grupos_finales})
        return grupos_df

    except Exception as e:
        logger.error(f"Error al generar grupos de trabajo: {e}", exc_info=True)
        raise

    finally:
        if db:
            db.close()
            logger.info("Sesión de base de datos cerrada")


def get_users_in_group(db: Session, group_id: int) -> List[UserModel]:
    """
    Obtiene los usuarios en un grupo específico desde la base de datos.
    """
    # Consultar los registros en GruposTrabajo para obtener los IDs de usuarios en el grupo especificado
    user_ids = db.query(GruposTrabajo.usuario_id).filter(GruposTrabajo.grupo_id == group_id).all()
    user_ids = [user_id[0] for user_id in user_ids]  # Convertir los resultados a una lista de IDs

    # Si no se encontraron usuarios en el grupo, devolver una lista vacía
    if not user_ids:
        raise ValueError(f"No se encontraron usuarios en el grupo con ID {group_id}")

    # Consultar los usuarios en la base de datos a partir de sus IDs
    users = db.query(UserModel).filter(UserModel.id.in_(user_ids)).all()
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