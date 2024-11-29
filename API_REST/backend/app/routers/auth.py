from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.database.database import get_db
from app.services.auth import authenticate_user, get_current_user, send_confirmation_email
from app.core.security import create_access_token, get_password_hash
from app.schemas.user import UserCreate, ChangePasswordRequest, LoginItem, GitHubUserDetails
from app.models.user import GruposTrabajo, UserModel, GitHubUserModel, UserInteractions
from app.core.config import ACCESS_TOKEN_EXPIRES_MINUTES
from app.core.security import pwd_context



from datetime import timedelta


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
@router.post("/login", response_model=dict)
async def login(login_item: LoginItem, db: Session = Depends(get_db)):
    # Autenticar al usuario
    user = authenticate_user(db, login_item.username, login_item.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not active. Please confirm your email."
        )
    
    # Buscar el usuario en GitHubUserModel
    usermodel = db.query(UserModel).filter(UserModel.username == user.username).first()
    usergithubquecoincidente = db.query(GitHubUserModel).filter(GitHubUserModel.username == user.username).first()
    if not usergithubquecoincidente:
        # Si no existe en GitHubUserModel, asignar None al group_id
        group_id = None
    else:
        # Si existe, obtener el group_id del usuario
        group_membership = db.query(GruposTrabajo).filter(GruposTrabajo.usuario_id == usergithubquecoincidente.id).first()
        group_id = group_membership.grupo_id if group_membership else None

    # Crear el token de acceso, incluyendo el rol y el group_id del usuario en el token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    access_token = create_access_token(
        data={
            "id": usermodel.id,
            "username": user.username,
            "is_admin": user.is_admin,
            "is_manager": user.is_manager,
            "group_id": group_id,  # Agregar el group_id al token
            "id_github": usergithubquecoincidente.id if usergithubquecoincidente else None,
            "org_name": usergithubquecoincidente.organization if usergithubquecoincidente else None

        },
        expires_delta=access_token_expires
    )
    
    return {
        "id": usermodel.id,
        "access_token": access_token,
        "token": "bearer",
        "username": user.username,
        "is_admin": user.is_admin,
        "is_manager": user.is_manager,
        "group_id": group_id,  # Devolver el group_id en la respuesta para referencia adicional
        "id_github": usergithubquecoincidente.id if usergithubquecoincidente else None,
        "org_name": usergithubquecoincidente.organization if usergithubquecoincidente else None
    }


@router.get("/users/me")
async def read_users_me(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):

    github_user = db.query(GitHubUserModel).filter(GitHubUserModel.username == current_user.username).first()
    if not github_user:
        raise HTTPException(status_code=404, detail="No se encontró el usuario en GitHubUserModel.")

    return {
        "id": current_user.id,
        "username": current_user.username,
        "id_github": github_user.id,
        "avatar_url": github_user.avatar_url,
    }

from uuid import uuid4

@router.post("/register/", status_code=201)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Verificar si el usuario ya existe
    existing_user = db.query(UserModel).filter(UserModel.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Generar un token de confirmación
    confirmation_token = str(uuid4())

    # Crear el nuevo usuario
    new_user = UserModel(
        username=user.username,
        hashed_password=get_password_hash(user.password),
        email=user.email,
        is_active=False,  # La cuenta no está activa hasta que confirme el correo
        is_admin=False,
        is_manager=True if user.rol == "manager" else False,
        rol=user.rol,
        company=user.company,
        confirmation_token=confirmation_token,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Enviar correo de confirmación
    send_confirmation_email(user.email, confirmation_token)
    
    return {"message": "User created successfully. Please confirm your email to activate the account."}

from fastapi.responses import RedirectResponse


@router.get("/auth/confirm/{token}")
async def confirm_email(token: str, db: Session = Depends(get_db)):
    try:
        # Verifica el token JWT

        # Busca al usuario en la base de datos
        user = db.query(UserModel).filter(UserModel.confirmation_token == token).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Actualiza el estado del usuario a activo
        user.is_active = True
        db.commit()

        # Redirige al inicio de sesión
        return RedirectResponse(url="http://prodiasv21.fis.usal.es/login")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Error al confirmar el correo: " + str(e))

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

@router.get("/manager/users/details", response_model=List[GitHubUserDetails])
def get_users_details(user_ids: List[int], db: Session = Depends(get_db)):
    try:
        # Query para sumar las interacciones para cada usuario especificado en user_ids
        users = (
            db.query(
                GitHubUserModel.id,
                GitHubUserModel.username,
                GitHubUserModel.html_url,
                GitHubUserModel.avatar_url,
                GitHubUserModel.organization,
                GitHubUserModel.stars,
                GitHubUserModel.dominant_language,
                func.sum(UserInteractions.commits_juntos).label("commits"),
                func.sum(UserInteractions.contributions_juntas).label("contributions"),
                func.sum(UserInteractions.pull_requests_comentados).label("pullRequests"),
                func.sum(UserInteractions.revisiones).label("reviews"),
            )
            .join(UserInteractions, GitHubUserModel.id == UserInteractions.user_1)
            .filter(GitHubUserModel.id.in_(user_ids))
            .group_by(GitHubUserModel.id)
            .all()
        )

        if not users:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No users found with the provided IDs.")

        # Formatear los resultados para serializar fácilmente
        user_details = [
            {
                "id": user.id,
                "username": user.username,
                "html_url": user.html_url,
                "avatar_url": user.avatar_url,
                "organization": user.organization,
                "stars": user.stars,
                "dominant_language": user.dominant_language,
                "commits": user.commits or 0,  # Asigna 0 si el valor es None
                "contributions": user.contributions or 0,
                "pullRequests": user.pullRequests or 0,
                "reviews": user.reviews or 0,
            }
            for user in users
        ]

        return user_details

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))