# app/services/ml_training.py

import pandas as pd
from sqlalchemy.orm import Session
from joblib import dump
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from app.services.dataset import generar_interacciones_y_dataset

def entrenar_modelo_colaboracion(db: Session, org_name: str) -> float:
    # Generar interacciones y obtener el dataset
    df = generar_interacciones_y_dataset(db, org_name)

    # Separar características y etiqueta
    X = df[['commits_juntos', 'contributions_juntas', 'pull_requests_comentados', 'revisiones']]
    y = df['resultado']

    # Dividir en conjuntos de entrenamiento y prueba
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    # Crear y entrenar el modelo
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X_train, y_train)

    # Evaluar el modelo
    accuracy = model.score(X_test, y_test)

    # Guardar el modelo entrenado
    dump(model, 'modelo_colaboracion.joblib')

    # Guardar la precisión en un archivo para su uso posterior
    with open('model_accuracy.txt', 'w') as f:
        f.write(str(accuracy))

    return accuracy
