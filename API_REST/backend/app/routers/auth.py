from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.database.database import get_db
from app.services.auth import authenticate_user, get_current_user
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
    user = authenticate_user(db, login_item.username, login_item.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Obtener el group_id del usuario
    group_membership = db.query(GruposTrabajo).filter(GruposTrabajo.usuario_id == user.id).first()
    group_id = group_membership.grupo_id if group_membership else None

    # Crear el token de acceso, incluyendo el rol y el group_id del usuario en el token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    access_token = create_access_token(
        data={
            "username": user.username,
            "is_admin": user.is_admin,
            "is_manager": user.is_manager,
            "group_id": group_id  # Agregar el group_id al token
        },
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token": "bearer",
        "username": user.username,
        "is_admin": user.is_admin,
        "is_manager": user.is_manager,
        "group_id": group_id  # Devolver el group_id en la respuesta para referencia adicional
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
    }

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