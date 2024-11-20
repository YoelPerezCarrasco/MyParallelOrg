from celery import Celery
from pandas import crosstab
from celery.schedules import crontab


celery_app = Celery(
    'worker',
    broker='redis://redis:6379/0',  # URL del broker Redis
    backend='redis://redis:6379/0',  # Backend Redis
    include=['app.tasks']  # Archivos con tareas Celery
)

celery_app.conf.update(
    timezone='UTC',
    beat_scheduler='redbeat.RedBeatScheduler',  # Configuración para usar RedBeat
    redbeat_redis_url='redis://redis:6379/0',  # Conexión a Redis para RedBeat
    result_expires=3600,  # Expiración de los resultados de tareas
    task_serializer='json',  # Serialización en formato JSON
    accept_content=['json'],  # Contenidos aceptados
    enable_utc=True,  # Usar UTC como zona horaria
)

celery_app.conf.beat_schedule = {
    "delete-unverified-users": {
        "task": "app.tasks.delete_unverified_users",
        "schedule": crontab(hour=0, minute=0),  # Ejecuta a la medianoche
    },
}

celery_app.conf.timezone = 'UTC'