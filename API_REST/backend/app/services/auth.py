from typing import List
from app.models.user import GruposTrabajo, UserModel
from app.core.config import SECRET_KEY, ALGORITHM
from app.database.database import get_db
from app.core.security import verify_password
from app.services.work_groups import get_user_groups
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


def can_send_message(current_user: UserModel, receiver_id: int, db: Session) -> bool:
    if current_user.id == receiver_id:
        return False  # No puede enviarse mensajes a sí mismo

    receiver = db.query(UserModel).filter(UserModel.id == receiver_id).first()
    if not receiver:
        return False

    if current_user.is_manager:
        # Managers pueden enviar mensajes a cualquier usuario de su organización
        return receiver.company == current_user.company
    else:
        # Workers solo pueden enviar mensajes a miembros de su grupo
        # Asumiendo que tienes una tabla que relaciona usuarios y grupos
        current_user_groups = get_user_groups(db, current_user.id)
        receiver_groups = get_user_groups(db, receiver_id)
        return bool(set(current_user_groups) & set(receiver_groups))

def get_user_groups(db: Session, user_id: int) -> List[int]:
    """
    Obtiene los IDs de los grupos a los que pertenece un usuario.
    
    :param db: Sesión de la base de datos.
    :param user_id: ID del usuario.
    :return: Lista de IDs de grupos a los que pertenece el usuario.
    """
    # Consultar la tabla GruposTrabajo para obtener los grupo_id del usuario especificado
    user_groups = db.query(GruposTrabajo.grupo_id).filter(GruposTrabajo.usuario_id == user_id).all()
    
    # Extraer los IDs de grupo de los resultados y devolver como lista
    return [group[0] for group in user_groups]
