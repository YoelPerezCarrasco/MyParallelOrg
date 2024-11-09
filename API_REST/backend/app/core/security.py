import os
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import GamificationConfig

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM= os.getenv("ALGORITHM")
SECRET_KEY= os.getenv("SECRET_KEY")
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt



def get_gamification_config(db: Session):
    config = db.query(GamificationConfig).all()
    config_dict = {item.key: item.value for item in config}
    return config_dict


def update_gamification_config(db: Session, new_config: dict):
    for key, value in new_config.items():
        config_item = db.query(GamificationConfig).filter_by(key=key).first()
        if config_item:
            config_item.value = value
        else:
            config_item = GamificationConfig(key=key, value=value)
            db.add(config_item)
    db.commit()
