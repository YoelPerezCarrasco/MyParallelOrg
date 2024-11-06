# routes/messages.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.database import get_db
from app.models.user import UserModel, Message
from app.schemas.user import MemberResponse, MessageCreate, MessageResponse
from app.services.auth import can_send_message, get_current_user
from app.services.work_groups import get_users_in_group

router = APIRouter()

@router.get("/messages/members", response_model=List[MemberResponse])
def get_available_members(group_id: Optional[int] = None, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if current_user.is_manager:
        # Obtener todos los miembros de la misma organización
        users = db.query(UserModel).filter(UserModel.company == current_user.company).all()
    else:
        if group_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group ID is required for workers")
        # Obtener miembros del mismo grupo
        users = get_users_in_group(db, group_id)
    # Mapear los usuarios a MemberResponse
    members = [MemberResponse(
        id=user.id,
        name=user.username,
        avatar=user.avatar_url,  # Asumiendo que tienes este campo
    ) for user in users if user.id != current_user.id]  # Excluir al usuario actual
    return members


# routes/messages.py

@router.post("/messages/send", response_model=MessageResponse)
def send_message(message: MessageCreate, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
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
def get_conversation(other_user_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    # Verificar si el usuario tiene permiso para ver la conversación con el otro usuario
    if not can_send_message(current_user, other_user_id, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para ver esta conversación")

    messages = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == other_user_id)) |
        ((Message.sender_id == other_user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp.asc()).all()
    return messages
