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

def entrenar_modelo_colaboracion(org_name: str):
    try:
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        logger.info(f"Iniciando el entrenamiento del modelo de colaboración para la organización: {org_name}")
    
        model_dir = '/app/modelos'
        os.makedirs(model_dir, exist_ok=True)
        
        csv_file_path = os.path.join(model_dir, f'{org_name}_interacciones.csv')
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
        np.savetxt(os.path.join(model_dir, f'X_test_scaled_{org_name}.csv'), X_test_scaled, delimiter=',')
        np.savetxt(os.path.join(model_dir, f'y_test_{org_name}.txt'), y_test, fmt='%d')
    
        model_path = os.path.join(model_dir, f'modelo_colaboracion_{org_name}.joblib')
        dump(model, model_path)
        dump(scaler, os.path.join(model_dir, f'scaler_{org_name}.joblib'))
        logger.info("Modelo y datos de prueba guardados exitosamente")
    
        # Calcular precisión en el conjunto de prueba
        accuracy = model.score(X_test_scaled, y_test)
        logger.info(f"Precisión del modelo para la organización {org_name}: {accuracy}")
    
        return accuracy
    
    except Exception as e:
        logger.error(f"Ocurrió un error inesperado: {e}")
        return None
