from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import UserModel
from app.services.auth import get_current_user
from app.machlearn.train_model import entrenar_modelo_colaboracion
from app.services.dataset import generar_interacciones_y_dataset, generar_interacciones_simuladas
import pandas as pd
import os

# Ruta del directorio montado donde se encuentra el archivo CSV
CSV_DIRECTORY = "/app/modelos/"

def cargar_dataset(org_name: str) -> pd.DataFrame:
    """
    Cargar el dataset CSV desde el volumen montado en Docker.
    
    :param org_name: El nombre de la organización, que se utiliza para identificar el archivo CSV.
    :return: DataFrame con los datos cargados.
    """
    # Definir la ruta completa del archivo
    csv_path = os.path.join(CSV_DIRECTORY, f"{org_name}_interacciones.csv")

    # Verificar que el archivo existe
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"No se encontró el archivo CSV en la ruta: {csv_path}")

    # Leer el archivo CSV en un DataFrame de pandas
    try:
        df = pd.read_csv(csv_path)
        return df
    except Exception as e:
        raise RuntimeError(f"Error al leer el archivo CSV: {e}")



router = APIRouter()

@router.post('/admin/train-model')
async def train_model(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access forbidden: Only admins can access this resource.")

    try:
        # Especifica el nombre de la organización si es necesario
        org_name = 'EpicGames'
        accuracy = entrenar_modelo_colaboracion()
        return {"message": f"Modelo entrenado con éxito. Precisión: {accuracy}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al entrenar el modelo: {e}")

@router.get('/admin/model-status')
async def model_status():
    try:
        from joblib import load
        model = load('/app/modelos/modelo_colaboracion.joblib')
        with open('/app/modelos/model_accuracy.txt', 'r') as f:
            accuracy = f.read()
        return {"status": "Modelo entrenado", "accuracy": accuracy}
    except FileNotFoundError:
        return {"status": "Modelo no entrenado", "accuracy": None}
    


@router.get("/generate-dataset/{org_name}")
async def generate_dataset(org_name: str, db: Session = Depends(get_db)):
    try:
        df = generar_interacciones_y_dataset(db, org_name)
        return df.to_dict(orient="records")  # Convierte el DataFrame a una lista de diccionarios
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/generateSim-dataset/{org_name}")
async def generate_dataset(org_name: str, db: Session = Depends(get_db)):
    try:
        df = generar_interacciones_simuladas(db, org_name)
        return df.to_dict(orient="records")  # Convierte el DataFrame a una lista de diccionarios
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@router.get("/describe-dataset/{org_name}")
async def generate_dataset(org_name: str):
    try:
       # Definir la ruta completa del archivo
        csv_path = os.path.join(CSV_DIRECTORY, f"simulated_interacciones.csv")

        # Verificar que el archivo existe
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"No se encontró el archivo CSV en la ruta: {csv_path}")

        # Leer el archivo CSV en un DataFrame de pandas
        df = pd.read_csv(csv_path)
        print(df[['commits_juntos', 'contributions_juntas', 'pull_requests_comentados', 'revisiones']].describe())
        return df.to_dict(orient="records")  # Convierte el DataFrame a una lista de diccionarios
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


