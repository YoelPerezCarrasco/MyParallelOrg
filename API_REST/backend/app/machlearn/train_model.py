import os
import pandas as pd
import numpy as np
from sklearn.model_selection import GroupShuffleSplit
from sklearn.exceptions import NotFittedError
from joblib import dump
import logging
from sklearn.metrics import (classification_report, confusion_matrix, roc_auc_score,
                             precision_score, recall_score, f1_score)
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

def entrenar_modelo_colaboracion():
    try:
        # Configurar el logger
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        logger.info("Iniciando el entrenamiento del modelo de colaboración")
    
        # Definir el directorio de modelos
        model_dir = '/app/modelos'
        os.makedirs(model_dir, exist_ok=True)
    
        # Leer el dataset desde el archivo CSV
        csv_file_path = os.path.join(model_dir, 'simulated_interacciones.csv')
        logger.info(f"Leyendo el dataset desde '{csv_file_path}'")
        df = pd.read_csv(csv_file_path)
    
        # Verificar que el DataFrame no esté vacío
        if df.empty:
            logger.error("El DataFrame está vacío.")
            return None

        # Verificar la distribución de la variable objetivo
        class_distribution = df['resultado'].value_counts()
        logger.info(f"Distribución de clases en 'resultado':\n{class_distribution}")

        # Calcular la matriz de correlación
        corr_matrix = df[['commits_juntos', 'contributions_juntas', 'pull_requests_comentados', 'revisiones', 'resultado']].corr()
        logger.info(f"Matriz de correlación:\n{corr_matrix['resultado'].sort_values(ascending=False)}")

        # Si hay características con correlación muy alta, considerar eliminarlas
        # Por ejemplo, eliminar 'commits_juntos' si está perfectamente correlacionada
        # df = df.drop(columns=['commits_juntos'])

        # Crear una columna de grupo basada en 'user_2' para evitar fugas de datos
        df['grupo'] = df['user_2']
    
        # Separar características y etiqueta
        X = df[['commits_juntos', 'contributions_juntas', 'pull_requests_comentados', 'revisiones']]
        y = df['resultado']
        groups = df['grupo']
    
        # Dividir los datos en conjuntos de entrenamiento y prueba utilizando GroupShuffleSplit
        gss = GroupShuffleSplit(n_splits=1, test_size=0.3, random_state=42)
        train_idx, test_idx = next(gss.split(X, y, groups=groups))
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        # Verificar que no haya usuarios comunes en 'user_2' entre entrenamiento y prueba
        train_users = set(df['user_2'].iloc[train_idx])
        test_users = set(df['user_2'].iloc[test_idx])
        common_users = train_users.intersection(test_users)
        if common_users:
            logger.error(f"Hay usuarios comunes entre entrenamiento y prueba: {common_users}")
            return None
        else:
            logger.info("No hay usuarios comunes entre entrenamiento y prueba.")
    
        # Verificar la distribución de clases en el conjunto de entrenamiento
        class_distribution_train = y_train.value_counts()
        logger.info(f"Distribución de clases en entrenamiento:\n{class_distribution_train}")
        class_distribution_test = y_test.value_counts()
        logger.info(f"Distribución de clases en prueba:\n{class_distribution_test}")
    
        # Escalar las características
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
    
        # Entrenar un modelo de Regresión Logística
        model = LogisticRegression(max_iter=1000, random_state=42)
        model.fit(X_train_scaled, y_train)
    
        # Evaluar el modelo en el conjunto de prueba
        y_test_pred = model.predict(X_test_scaled)
        y_test_proba = model.predict_proba(X_test_scaled)[:, 1]
    
        test_accuracy = model.score(X_test_scaled, y_test)
        test_precision = precision_score(y_test, y_test_pred)
        test_recall = recall_score(y_test, y_test_pred)
        test_f1 = f1_score(y_test, y_test_pred)
        test_auc = roc_auc_score(y_test, y_test_proba)
        test_report = classification_report(y_test, y_test_pred)
        test_cm = confusion_matrix(y_test, y_test_pred)
        logger.info(f"Precisión del modelo en prueba: {test_accuracy:.4f}")
        logger.info(f"Precisión: {test_precision:.4f}, Recall: {test_recall:.4f}, F1-score: {test_f1:.4f}, AUC: {test_auc:.4f}")
        logger.info(f"Reporte de clasificación en prueba:\n{test_report}")
        logger.info(f"Matriz de confusión en prueba:\n{test_cm}")
    
        # Guardar el modelo
        model_path = os.path.join(model_dir, 'modelo_colaboracion.joblib')
        dump(model, model_path)
        logger.info("Modelo guardado exitosamente")
    
        return test_accuracy
    
    except FileNotFoundError as e:
        logger.error(f"Error al guardar el archivo: {e}")
        return None
    except NotFittedError as e:
        logger.error(f"Error al evaluar el modelo: {e}")
        return None
    except Exception as e:
        logger.error(f"Ocurrió un error inesperado: {e}")
        return None
