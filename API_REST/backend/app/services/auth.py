from app.models.user import UserModel
from app.core.config import SECRET_KEY, ALGORITHM
from app.database.database import get_db
from app.core.security import verify_password
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from jose import JWTError, jwt

# Importar oauth2_scheme dentro de la función para evitar problemas de importación circular
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodificar el token JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        if username is None:
            raise credentials_exception
        token_data = {"username": username}
    except JWTError:
        raise credentials_exception

    # Buscar el usuario en la base de datos
    user = db.query(UserModel).filter(UserModel.username == token_data["username"]).first()
    if user is None:
        raise credentials_exception

    return user

def authenticate_user(db: Session, username: str, password: str):
    # Buscar el usuario en la base de datos
    user = db.query(UserModel).filter(UserModel.username == username).first()
    if not user:
        return False
    # Verificar la contraseña
    if not verify_password(password, user.hashed_password):
        return False
    return user
