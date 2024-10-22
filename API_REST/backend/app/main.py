# main.py
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, github, prediction, manager  # Importa los routers
from app.database.database import init_db  # Importa la función init_db

# Crear la instancia de la aplicación FastAPI
app = FastAPI()

# Inicializar la base de datos y crear las tablas
init_db()

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

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Punto de entrada principal
@app.get("/")
async def root():
    return {"message": "Welcome to the GitHub User Management API"}
