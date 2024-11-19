# app/tasks.py
from app.worker import celery_app
from app.database.database import SessionLocal
from app.services.gamification import actualizar_puntos_usuarios
from app.machlearn.train_model import entrenar_modelo_colaboracion

@celery_app.task
def actualizar_puntos_tarea():
    db = SessionLocal()
    try:
        actualizar_puntos_usuarios(db)
    finally:
        db.close()

@celery_app.task
def entrenar_modelo_tarea():
    db = SessionLocal()
    try:
        entrenar_modelo_colaboracion(db)
    finally:
        db.close()
