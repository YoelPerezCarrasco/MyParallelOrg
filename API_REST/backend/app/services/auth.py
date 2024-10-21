

from app.models.user import UserModel
from app.core.config import SECRET_KEY, ALGORITHM
from app.database.database import get_db
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.routers.auth import oauth2_scheme


from http.client import HTTPException
from jose import JWTError, jwt


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        if username is None:
            raise credentials_exception
        token_data = {"username": username}
    except JWTError:
        raise credentials_exception
    user = db.query(UserModel).filter(UserModel.username == token_data["username"]).first()
    if user is None:
        raise credentials_exception
    return user
