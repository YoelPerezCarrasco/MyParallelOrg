from email.mime.multipart import MIMEMultipart
import os
from typing import List
from app.models.user import GitHubUserModel, GruposTrabajo, UserModel
from app.core.config import SECRET_KEY, ALGORITHM
from app.database.database import get_db
from app.core.security import verify_password
from app.services.work_groups import get_user_groups
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
import smtplib
from email.mime.text import MIMEText

from jose import JWTError, jwt

# Importar oauth2_scheme dentro de la función para evitar problemas de importación circular
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

EMAIL_CONFIRMATION_EXPIRES_HOURS = 24
EMAIL_SENDER = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD= os.getenv("EMAIL_PASSWORD")

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

    # Obtener el receptor por ID
    receiver = db.query(UserModel).filter(UserModel.id == receiver_id).first()
    if not receiver:
        return False

    if current_user.is_manager:
        # Managers pueden enviar mensajes a cualquier usuario de su organización
        return receiver.company == current_user.company
    else:
        # Workers solo pueden enviar mensajes a miembros de su grupo
        current_user_groups = get_user_groups_by_username(db, current_user.username)
        receiver_groups = get_user_groups_by_username(db, receiver.username)
        return bool(set(current_user_groups) & set(receiver_groups))


def get_user_groups_by_username(db: Session, username: str) -> List[int]:
    """
    Obtiene los IDs de los grupos a los que pertenece un usuario usando el `username` como base.
    
    :param db: Sesión de la base de datos.
    :param username: Username del usuario.
    :return: Lista de IDs de grupos a los que pertenece el usuario.
    """
    # Obtener el usuario GitHub asociado al username
    github_user = db.query(GitHubUserModel).filter(GitHubUserModel.username == username).first()
    if not github_user:
        return []

    # Consultar los grupos del usuario en la tabla GruposTrabajo
    user_groups = db.query(GruposTrabajo.grupo_id).filter(GruposTrabajo.usuario_id == github_user.id).all()

    # Extraer los IDs de grupo de los resultados y devolver como lista
    return [group[0] for group in user_groups]




def send_confirmation_email(email: str, token: str):
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = EMAIL_SENDER
    sender_password = EMAIL_PASSWORD

    # Crear el enlace de confirmación
    confirmation_url = f"/api//auth/auth/confirm/{token}"

    # Contenido HTML del correo
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirma tu cuenta</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 50px auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                overflow: hidden;
            }}
            .header {{
                background-color: #4CAF50;
                color: white;
                padding: 20px;
                text-align: center;
            }}
            .content {{
                padding: 20px;
                text-align: center;
            }}
            .content p {{
                line-height: 1.6;
            }}
            .button {{
                display: inline-block;
                margin: 20px 0;
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-size: 16px;
            }}
            .footer {{
                text-align: center;
                padding: 10px;
                background-color: #f1f1f1;
                color: #888;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Bienvenido a Nuestro Servicio</h1>
            </div>
            <div class="content">
                <p>¡Gracias por registrarte!</p>
                <p>Para activar tu cuenta, por favor haz clic en el botón de abajo:</p>
                <a href="{confirmation_url}" class="button">Confirmar Cuenta</a>
                <p>Si no creaste esta cuenta, ignora este mensaje.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Tu Compañía. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """

    # Crear el mensaje
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Confirma tu cuenta"
    msg["From"] = sender_email
    msg["To"] = email

    # Adjuntar el contenido HTML
    msg.attach(MIMEText(html_content, "html"))

    # Enviar el correo
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, email, msg.as_string())
        