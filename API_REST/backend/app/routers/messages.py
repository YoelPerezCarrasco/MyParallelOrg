# routes/messages.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.models.user import GitHubUserModel, UserModel, Message
from app.schemas.user import MemberResponse, MessageCreate, MessageResponse
from app.services.auth import can_send_message, get_current_user
from app.services.work_groups import get_users_in_group

router = APIRouter()

@router.get("/messages/members", response_model=List[MemberResponse])
def get_available_members(
    group_id: Optional[int] = None, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.is_manager:
        # Obtener todos los miembros de la misma organización
        users = db.query(UserModel).filter(UserModel.company == current_user.company).all()
    else:
        if group_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Group ID is required for workers"
            )
        # Obtener miembros del mismo grupo
        user = db.query(UserModel).filter(UserModel.username == current_user.username).first()
        users = get_users_in_group(db, group_id, user)

    # Obtener los usernames de los usuarios
    usernames = [user.username for user in users]

    # Consultar GitHubUserModel para obtener los avatar_url
    github_users = db.query(GitHubUserModel).filter(GitHubUserModel.username.in_(usernames)).all()
    github_user_map = {github_user.username: github_user.avatar_url for github_user in github_users}

    # Mapear los usuarios a MemberResponse, incluyendo el avatar_url correcto
    members = [
        MemberResponse(
            id=user.id,
            name=user.username,
            avatar=github_user_map.get(user.username, 'https://via.placeholder.com/60')  # URL por defecto si no se encuentra el avatar
        )
        for user in users if user.id != current_user.id  # Excluir al usuario actual
    ]

    return members


# routes/messages.py

@router.post("/messages/send", response_model=MessageResponse)
def send_message(message: MessageCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    # Verificar si el usuario tiene permiso para enviar mensajes al receptor
    if not can_send_message(current_user, message.receiver_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para enviar mensajes a este usuario")

    new_message = Message(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        message=message.message
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message


@router.get("/messages/conversation/{other_user_id}", response_model=List[MessageResponse])
def get_conversation(
    other_user_id: int, 
    db: Session = Depends(get_db), 
    current_user: UserModel = Depends(get_current_user)
):
    # Verificar si el usuario tiene permiso para ver la conversación con el otro usuario
    if not can_send_message(current_user, other_user_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tienes permiso para ver esta conversación"
        )

    # Realizar la consulta de mensajes con los detalles del remitente y receptor
    messages = db.query(
        Message.id,
        Message.message,
        Message.timestamp,
        Message.sender_id,
        Message.receiver_id,
        UserModel.username.label("sender_name"),
    ).join(UserModel, UserModel.id == Message.sender_id).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == other_user_id)) |
        ((Message.sender_id == other_user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp.asc()).all()

    # Obtener los usernames únicos de los emisores
    sender_usernames = list(set(msg.sender_name for msg in messages))

    # Consultar GitHubUserModel para obtener los avatar_url basados en username
    github_users = db.query(GitHubUserModel).filter(GitHubUserModel.username.in_(sender_usernames)).all()
    github_user_map = {user.username: user.avatar_url for user in github_users}

    # Mapear los mensajes a la estructura esperada en la respuesta
    result = [
        {
            "id": msg.id,
            "message": msg.message,
            "timestamp": msg.timestamp.isoformat(timespec='milliseconds'),  # Limita a milisegundos
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "sender_name": msg.sender_name,
            "sender_avatar": github_user_map.get(msg.sender_name, None)  # Obtener el avatar_url basado en el username
        }
        for msg in messages
    ]

    return result
