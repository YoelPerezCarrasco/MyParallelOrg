import os
import pandas as pd
import numpy as np
import networkx as nx
from sklearn.preprocessing import StandardScaler
from joblib import load
from networkx.algorithms import community
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.user import GitHubUserModel
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
        usuarios = [usuario.id for usuario in usuarios_db]
        logger.info(f"Usuarios obtenidos para la organización: {len(usuarios)} usuarios")

        # Leer las interacciones y características desde simulated_interacciones.csv
        interacciones_path = os.path.join(model_dir, 'simulated_interacciones.csv')
        interacciones_df = pd.read_csv(interacciones_path)
        logger.info("Interacciones cargadas desde simulated_interacciones.csv")

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
            grupos_df = pd.DataFrame({'grupo_id': range(len(grupos_finales)), 'usuarios': grupos_finales})
            grupos_df.to_json('/app/data/grupos_formados.json', orient='records')
            logger.info("Grupos aleatorios generados y guardados en grupos_formados.json")
            return grupos_df

        # Preparar las características y predecir probabilidades
        X = interacciones_df[['commits_juntos', 'contributions_juntas', 'pull_requests_comentados', 'revisiones']]
        X_scaled = scaler.transform(X)
        probabilidades = modelo.predict_proba(X_scaled)[:, 1]
        interacciones_df['probabilidad_colaboracion'] = probabilidades
        logger.info("Probabilidades de colaboración calculadas")

        # Crear el grafo ponderado
        G = nx.Graph()
        for idx, row in interacciones_df.iterrows():
            G.add_edge(row['user_1'], row['user_2'], weight=row['probabilidad_colaboracion'])
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
            comunidad = list(comunidad)
            # Si la comunidad es mayor a 15, dividirla en subgrupos
            if len(comunidad) > 15:
                subgrupos = [comunidad[i:i + 15] for i in range(0, len(comunidad), 15)]
                grupos_finales.extend(subgrupos)
            else:
                grupos_finales.append(comunidad)
        logger.info("Grupos formados con tamaño limitado a 15 personas")

        # Guardar los grupos formados
        grupos_df = pd.DataFrame({'grupo_id': range(len(grupos_finales)), 'usuarios': grupos_finales})
        grupos_df.to_json('/app/data/grupos_formados.json', orient='records')
        logger.info("Grupos formados guardados en /app/data/grupos_formados.json")

        return grupos_df

    except Exception as e:
        logger.error(f"Error al generar grupos de trabajo: {e}", exc_info=True)
        raise

    finally:
        if db:
            db.close()
            logger.info("Sesión de base de datos cerrada")
