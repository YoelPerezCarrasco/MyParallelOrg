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
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        logger.info("Iniciando el entrenamiento del modelo de colaboración")
    
        model_dir = '/app/modelos'
        os.makedirs(model_dir, exist_ok=True)
    
        csv_file_path = os.path.join(model_dir, 'simulated_interacciones.csv')
        logger.info(f"Leyendo el dataset desde '{csv_file_path}'")
        df = pd.read_csv(csv_file_path)
    
        if df.empty:
            logger.error("El DataFrame está vacío.")
            return None

        df['grupo'] = df['user_2']
    
        X = df[['commits_juntos', 'contributions_juntas', 'pull_requests_comentados', 'revisiones']]
        y = df['resultado']
        groups = df['grupo']
    
        gss = GroupShuffleSplit(n_splits=1, test_size=0.3, random_state=42)
        train_idx, test_idx = next(gss.split(X, y, groups=groups))
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
    
        model = LogisticRegression(max_iter=10000000, random_state=420)
        model.fit(X_train_scaled, y_train)
    
        # Guardar X_test_scaled y y_test como archivos de texto
        np.savetxt(os.path.join(model_dir, 'X_test_scaled.csv'), X_test_scaled, delimiter=',')
        np.savetxt(os.path.join(model_dir, 'y_test.txt'), y_test, fmt='%d')
    
        model_path = os.path.join(model_dir, 'modelo_colaboracion.joblib')
        dump(model, model_path)
        dump(scaler, os.path.join(model_dir, 'scaler.joblib'))
        logger.info("Modelo y datos de prueba guardados exitosamente")
    
        return model.score(X_test_scaled, y_test)
    
    except Exception as e:
        logger.error(f"Ocurrió un error inesperado: {e}")
        return None
