from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.database.database import get_db
from app.services.auth import authenticate_user, get_current_user
from app.core.security import create_access_token, get_password_hash
from app.schemas.user import UserCreate, ChangePasswordRequest, LoginItem
from app.models.user import UserModel
from app.core.config import ACCESS_TOKEN_EXPIRES_MINUTES
from app.core.security import pwd_context

from datetime import timedelta


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post("/login", response_model=dict)
async def login(login_item: LoginItem, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_item.username, login_item.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Crear el token de acceso, incluyendo el rol del usuario en el token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    access_token = create_access_token(
        data={"username": user.username, "is_admin": user.is_admin, "is_manager": user.is_manager},
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token": "bearer",
        "username": user.username,
        "is_admin": user.is_admin,  # Devuelve la información de si es admin o no
        "is_manager": user.is_manager  # Devuelve la información de si es admin o no

    }

@router.get("/users/me")
async def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user




@router.post("/register/", status_code=201)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Verificar si el usuario ya existe
    existing_user = db.query(UserModel).filter(UserModel.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Crear el nuevo usuario
    new_user = UserModel(
        username=user.username,
        hashed_password=get_password_hash(user.password),  # Encripta la contraseña
        is_active=True,
        is_admin=False,  # Asegurando que no todos los usuarios sean admins por defecto
        is_manager=True if user.rol == "manager" else False,  # Asigna is_manager basado en el rol
        rol=user.rol,  # Asigna el rol basado en la solicitud
        company=user.company  # Asigna la empresa al usuario
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "username": new_user.username, "rol": new_user.rol, "company": new_user.company}




@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db)):
    # Buscar al usuario por nombre de usuario
    user = db.query(UserModel).filter(UserModel.username == request.username).first()

    # Verificar la contraseña actual
    if not user or not pwd_context.verify(request.current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")

    # Cambiar la contraseña
    user.hashed_password = pwd_context.hash(request.new_password)
    db.commit()

    return {"message": "Password changed successfully"}


