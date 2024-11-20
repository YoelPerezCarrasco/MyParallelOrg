
from datetime import datetime, timedelta
import json
from redis import Redis
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.user import GitHubUserModel, UserModel
from app.machlearn.train_model import entrenar_modelo_colaboracion
from app.worker import celery_app

redis_client = Redis(host="redis", port=6379, decode_responses=True)

@celery_app.task
def actualizar_trainmodel_diariamente():
    """
    Tarea Celery para entrenar modelos de todas las empresas.
    """
    db = SessionLocal()
    try:
        organizations = db.query(GitHubUserModel.organization).distinct().all()
        for org in organizations:
            entrenar_modelo_colaboracion(org.organization)

        # Registrar en historial de Redis
        task_name = "actualizar_trainmodel_diariamente"
        history_key = f"redbeat:{task_name}:history"
        execution_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "status": "success",
            "message": f"Modelo entrenado para {len(organizations)} organizaciones.",
        }
        redis_client.lpush(history_key, json.dumps(execution_data))
        redis_client.ltrim(history_key, 0, 99)  # Limitar a 100 entradas
    except Exception as e:
        # Registrar fallo
        execution_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "status": "error",
            "message": str(e),
        }
        redis_client.lpush(history_key, json.dumps(execution_data))
        redis_client.ltrim(history_key, 0, 99)
    finally:
        db.close()

@celery_app.task
def delete_unverified_users():
    db = SessionLocal()
    try:
        unverified_users = db.query(UserModel).filter(
            UserModel.is_active == False,
        ).all()

        for user in unverified_users:
            db.delete(user)
            print(f"Deleted unverified user: {user.username}")

        db.commit()
    except Exception as e:
        print(f"Error deleting unverified users: {e}")
    finally:
        db.close()