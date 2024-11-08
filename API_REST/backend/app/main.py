# main.py
import logging
from sched import scheduler
from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
from app.services.gamification import actualizar_puntos_usuarios
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, github, prediction, manager, admin_gamification, admin_ml, work_groups, messages  # Importa los routers
from app.database.database import init_db  # Importa la función init_db
from app.database.database import SessionLocal

# Crear la instancia de la aplicación FastAPI
app = FastAPI()
scheduler = BackgroundScheduler()

# Inicializar la base de datos y crear las tablas
init_db()


def actualizar_puntos():
    db = SessionLocal()
    actualizar_puntos_usuarios(db)
    db.close()

scheduler.add_job(func=actualizar_puntos, trigger="interval", hours=24)  # Se ejecuta cada 24 horas
scheduler.start()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(github.router, prefix="/github", tags=["GitHub"])
app.include_router(prediction.router, prefix="/prediction", tags=["Prediction"])
app.include_router(manager.router, prefix="/manager", tags=["Manager"])
app.include_router(admin_gamification.router, prefix="/admin", tags=["Admin"])
app.include_router(admin_ml.router, prefix="/adminml", tags=["Adminml"])
app.include_router(work_groups.router, prefix="/workgroups", tags=["WorkGroups"])
app.include_router(messages.router, prefix="/messages", tags=["Messages"])

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Punto de entrada principal
@app.get("/")
async def root():
    return {"message": "Welcome to the GitHub User Management API"}

# Agregar un evento para cerrar el scheduler al apagar la aplicación
import atexit
atexit.register(lambda: scheduler.shutdown())