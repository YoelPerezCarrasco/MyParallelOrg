from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql://user:password@db:5432/mydatabase"
import os

if os.getenv('SPHINX_BUILD') == 'true':
    engine = None  # O cualquier otra cosa que no inicie la conexión real
else:
    from sqlalchemy import create_engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    Base.metadata.create_all(bind=engine)

    try:
        yield db
    finally:
        db.close()
