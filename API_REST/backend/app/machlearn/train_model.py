from typing import Optional
from sqlalchemy.orm import Session
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.exceptions import NotFittedError
from joblib import dump
from app.services.dataset import generar_interacciones_y_dataset
import logging
import pandas as pd

# Configurar el logger
logger = logging.getLogger(__name__)


def entrenar_modelo_colaboracion(db: Session, org_name: str) -> Optional[float]:
    try:
        # Generar interacciones y obtener el dataset
        df = generar_interacciones_y_dataset(db, org_name)
        
        # Verificar que el dataframe no esté vacío
        if df.empty:
            logger.error("El dataset está vacío.")
            return None

        # Verificar que las columnas necesarias existen en el dataset
        required_columns = ['commits_juntos', 'contributions_juntas', 'pull_requests_comentados', 'revisiones', 'resultado']
        if not all(col in df.columns for col in required_columns):
            logger.error("El dataset no contiene todas las columnas necesarias.")
            return None

        # Separar características y etiqueta
        X = df[['commits_juntos', 'contributions_juntas', 'pull_requests_comentados', 'revisiones']]
        y = df['resultado']

        # Dividir en conjuntos de entrenamiento y prueba
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Crear y entrenar el modelo
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        # Evaluar el modelo
        accuracy = model.score(X_test, y_test)
        logger.info(f"Modelo entrenado con precisión: {accuracy:.4f}")

        # Guardar el modelo entrenado
        dump(model, 'modelo_colaboracion.joblib')
        logger.info("Modelo guardado exitosamente en 'modelo_colaboracion.joblib'")

        # Guardar la precisión en un archivo para su uso posterior
        with open('model_accuracy.txt', 'w') as f:
            f.write(str(accuracy))
        logger.info("Precisión guardada exitosamente en 'model_accuracy.txt'")

        return accuracy

    except FileNotFoundError as e:
        logger.error(f"Error al guardar el archivo: {e}")
        return None
    except NotFittedError as e:
        logger.error(f"Error al evaluar el modelo: {e}")
        return None
    except Exception as e:
        logger.error(f"Ocurrió un error inesperado: {e}")
        return None