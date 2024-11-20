# database/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = os.getenv('SQLALCHEMY_DATABASE_URL')


if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("La variable de entorno SQLALCHEMY_DATABASE_URL no está configurada.")

if os.getenv('SPHINX_BUILD') == 'true':
    engine = None  # O cualquier otra cosa que no inicie la conexión real
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Crear la sesión de la base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()

# Dependencia para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Inicializar la base de datos
def init_db():
    # Importar modelos para que sean reconocidos por SQLAlchemy
    Base.metadata.create_all(bind=engine)
