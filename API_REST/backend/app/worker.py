# app/worker.py
from celery import Celery

celery_app = Celery(
    'worker',
    broker='redis://redis:6379/0',
    backend='redis://redis:6379/0',
    include=['app.tasks']
)

celery_app.conf.beat_schedule = {
    'actualizar_puntos_diariamente': {
        'task': 'app.tasks.actualizar_puntos_tarea',
        'schedule': 86400.0,  # Cada 24 horas
    },
    'entrenar_modelo_diariamente': {
        'task': 'app.tasks.entrenar_modelo_tarea',
        'schedule': 86400.0,  # Cada 24 horas
    },
}

celery_app.conf.timezone = 'UTC'
