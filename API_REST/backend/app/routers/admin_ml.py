from datetime import timedelta
import json
import logging
from celery.schedules import schedule
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import UpdateHistory, UserModel
from app.services.auth import get_current_user
from app.machlearn.train_model import entrenar_modelo_colaboracion
from app.services.dataset import generar_interacciones_y_dataset, generar_interacciones_simuladas
from app.schemas.user import FrequencyUpdate, TrainModelRequest, UpdateHistoryResponse
from typing import List
from app.worker import celery_app
import pandas as pd
import os
from redbeat import RedBeatSchedulerEntry
from redis import Redis

redis_client = Redis(host="redis", port=6379, decode_responses=True)

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
async def train_model(
    request: TrainModelRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access forbidden: Only admins can access this resource.")

    try:
        # Especifica el nombre de la organización
        org_name = request.organization
        accuracy = entrenar_modelo_colaboracion(org_name)
        if accuracy is not None:
            return {"message": f"Modelo entrenado con éxito para la organización '{org_name}'. Precisión: {accuracy}"}
        else:
            raise HTTPException(status_code=500, detail="Error al entrenar el modelo. Verifique los logs para más detalles.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al entrenar el modelo: {e}")

@router.get('/admin/model-status/{organization}')
async def get_model_status(
    organization: str,
    current_user: UserModel = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access forbidden: Only admins can access this resource.")
    
    model_dir = '/app/modelos'
    model_path = os.path.join(model_dir, f'modelo_colaboracion_{organization}.joblib')
    
    if os.path.exists(model_path):
        # Cargar el modelo y calcular la precisión si es necesario
        # Aquí puedes agregar lógica para obtener métricas del modelo
        accuracy = "Precisión del modelo"  # Reemplaza con la precisión real si la tienes almacenada
        return {"status": "Modelo entrenado", "accuracy": accuracy}
    else:
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

@router.get("/get_celery_schedule")
def get_celery_schedule():
    schedule = celery_app.conf.beat_schedule.get('redbeat_actualizar_trainmodel_diariamente')
    if schedule:
        interval = schedule['schedule']
        if interval.total_seconds() == 3600:
            frequency = 'hourly'
        elif interval.total_seconds() == 86400:
            frequency = 'daily'
        elif interval.total_seconds() == 604800:
            frequency = 'weekly'
        else:
            frequency = 'custom'
        return {"frequency": frequency}
    else:
        raise HTTPException(status_code=404, detail="No se encontró la programación actual")



logger = logging.getLogger(__name__)

@router.post("/update_celery_schedule")
def update_celery_schedule(
    data: FrequencyUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    frequency_map = {
        'hourly': timedelta(seconds=10),
        'daily': timedelta(days=1),
        'weekly': timedelta(weeks=1),
    }
    interval = frequency_map.get(data.frequency)
    if not interval:
        logger.error("Frecuencia no válida recibida: %s", data.frequency)
        raise HTTPException(status_code=400, detail="Frecuencia no válida")

    try:
        # Crear o actualizar la tarea periódica
        entry = RedBeatSchedulerEntry(
            name='redbeat_actualizar_trainmodel_diariamente',
            task='app.tasks.actualizar_trainmodel_diariamente',
            schedule=schedule(interval.total_seconds()),  # Corregido: Convertimos timedelta a segundos
            args=[],
            app=celery_app,
        )
        entry.save()
        logger.info("Tarea programada creada o actualizada exitosamente: %s", entry.name)

        # Registrar el cambio en el historial
        new_record = UpdateHistory(
            action='update_frequency',
            frequency=data.frequency,
            user=current_user.username,  # Asumiendo que el usuario tiene un atributo 'username'
        )
        db.add(new_record)
        db.commit()
        logger.info("Historial de actualización registrado exitosamente por el usuario: %s", current_user.username)

        return {"message": "Frecuencia actualizada exitosamente"}
    except Exception as e:
        logger.error("Error al programar la tarea: %s", str(e))
        raise HTTPException(status_code=500, detail="Error al programar la tarea")

@router.get("/update_history", response_model=List[UpdateHistoryResponse])
def get_update_history(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(UpdateHistory).order_by(UpdateHistory.timestamp.desc()).all()
    return history




@router.get("/task-history/{task_name}")
def get_task_history(task_name: str):
    """
    Devuelve el historial de ejecuciones de una tarea específica almacenada en RedBeat.
    """
    task_key = f"redbeat:{task_name}"
    history_key = f"{task_key}:history"

    if not redis_client.exists(history_key):
        return {"message": "No hay historial disponible para esta tarea"}

    history = redis_client.lrange(history_key, 0, -1)  # Obtener todo el historial
    return {"task_name": task_name, "history": [json.loads(item) for item in history]}

@router.delete("/clear-task-history/{task_name}")
async def clear_task_history(task_name: str):
    """
    Elimina el historial de una tarea específica almacenada en Redis.
    """
    try:
        # Clave en Redis donde se guarda el historial
        history_key = f"task-history:{task_name}"

        # Verificar si el historial existe
        if not redis_client.exists(history_key):
            raise HTTPException(status_code=404, detail=f"No se encontró historial para la tarea: {task_name}")

        # Eliminar el historial
        redis_client.delete(history_key)

        return {"message": f"Historial de {task_name} eliminado con éxito."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar el historial: {str(e)}")