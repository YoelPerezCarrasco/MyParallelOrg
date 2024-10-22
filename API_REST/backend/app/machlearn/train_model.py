import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from joblib import dump

# Cargar los datos
data = pd.read_csv('dataset_colaboracion.csv')

# Separar características y etiqueta
X = data[['commits_juntos', 'pull_requests_comentados', 'revisiones']]
y = data['resultado']

# Dividir en conjuntos de entrenamiento y prueba
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Crear y entrenar el modelo
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Evaluar el modelo
accuracy = model.score(X_test, y_test)
print(f'Precisión del modelo: {accuracy}')

# Guardar el modelo entrenado
dump(model, 'modelo_colaboracion.joblib')
