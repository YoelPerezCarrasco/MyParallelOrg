# models/user.py
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from pydantic import BaseModel

from app.database.database import Base

class GamificationConfig(Base):
    __tablename__ = 'gamification_config'

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(Integer)
class PullRequest(Base):
    __tablename__ = 'pull_requests'

    id = Column(Integer, primary_key=True, index=True)
    repo_name = Column(String, index=True)
    pr_number = Column(Integer)
    author_id = Column(Integer, ForeignKey('github_users.id'))
    created_at = Column(DateTime)
    state = Column(String)
    title = Column(String)
    body = Column(Text)
    comments = relationship("PullRequestComment", back_populates="pull_request")
    reviews = relationship("PullRequestReview", back_populates="pull_request")

class PullRequestComment(Base):
    __tablename__ = 'pull_request_comments'

    id = Column(Integer, primary_key=True, index=True)
    pull_request_id = Column(Integer, ForeignKey('pull_requests.id'))
    commenter_id = Column(Integer, ForeignKey('github_users.id'))
    comment = Column(Text)
    created_at = Column(DateTime)
    pull_request = relationship("PullRequest", back_populates="comments")
    commenter = relationship("GitHubUserModel")

class PullRequestReview(Base):
    __tablename__ = 'pull_request_reviews'

    id = Column(Integer, primary_key=True, index=True)
    pull_request_id = Column(Integer, ForeignKey('pull_requests.id'))
    reviewer_id = Column(Integer, ForeignKey('github_users.id'))
    state = Column(String)
    submitted_at = Column(DateTime)
    pull_request = relationship("PullRequest", back_populates="reviews")
    reviewer = relationship("GitHubUserModel")

# app/models/user.py

class UserInteractions(Base):
    __tablename__ = 'user_interactions'
    id = Column(Integer, primary_key=True, index=True)
    user_1 = Column(Integer, ForeignKey('github_users.id'))
    user_2 = Column(Integer, ForeignKey('github_users.id'))
    commits_juntos = Column(Integer, default=0)
    contributions_juntas = Column(Integer, default=0)
    pull_requests_comentados = Column(Integer, default=0)
    revisiones = Column(Integer, default=0)
    resultado = Column(Integer, default=0)


class GitHubUserModel(Base):
    __tablename__ = 'github_users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    html_url = Column(String)
    avatar_url = Column(String)
    repos_url = Column(String)
    contributions = relationship("UserRepoContributions", back_populates="user")
    commits = relationship("UserRepoCommits", back_populates="user")
    location = Column(String, nullable=True)
    stars = Column(Integer, default=0)
    dominant_language = Column(String)
    organization = Column(String, index=True)
    puntos = Column(Integer, default=0)  # Añadimos este campo


class UserRepoContributions(Base):
    __tablename__ = 'user_repo_contributions'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('github_users.id'))
    repo_name = Column(String, index=True)
    contribution_count = Column(Integer)
    user = relationship("GitHubUserModel", back_populates="contributions")
class UserRepoCommits(Base):
    __tablename__ = 'user_repo_commits'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('github_users.id'))
    repo_name = Column(String, index=True)
    commit_count = Column(Integer)
    last_commit_date = Column(DateTime)
    user = relationship("GitHubUserModel", back_populates="commits")
class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    email = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=False)  # Cambiar a False por defecto
    is_admin = Column(Boolean, default=True)
    is_manager = Column(Boolean, default=True)
    rol = Column(String, nullable=False)
    company = Column(String, nullable=False)
    confirmation_token = Column(String, nullable=True)  # Token para confirmar el correo electrónico

    # Relación con GitHubUserModel
    github_user_id = Column(Integer, ForeignKey("github_users.id"), nullable=True)

    # Relación bidireccional (opcional)
    github_user = relationship("GitHubUserModel", backref="user")

class LoginItem(BaseModel):
    username: str
    password: str


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

    sender = relationship("UserModel", foreign_keys=[sender_id])
    receiver = relationship("UserModel", foreign_keys=[receiver_id])

# models/user.py

class GruposTrabajo(Base):
    __tablename__ = 'grupos_trabajo'

    id = Column(Integer, primary_key=True, index=True)
    grupo_id = Column(Integer, index=True)
    usuario_id = Column(Integer, ForeignKey('github_users.id'), nullable=True)
    organizacion = Column(String, index=True)
    is_leader = Column(Boolean, default=False)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=True)  # Nuevo campo

    # Relaciones
    user = relationship("GitHubUserModel", backref="grupos_trabajo", foreign_keys=[usuario_id])
    project = relationship("ProjectModel", backref="grupos_trabajo")  # Relación con el proyecto
class ProjectModel(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    url = Column(String, nullable=True)  # Corresponde a "html_url"
    organization = Column(String, index=True)  # Organización a la que pertenece el proyecto
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    language = Column(String, nullable=True)
    stargazers_count = Column(Integer, default=0)
    forks_count = Column(Integer, default=0)
    organization = Column(String, index=True)  # Organización a la que pertenece el proyecto



class UpdateHistory(Base):
    __tablename__ = 'update_history'

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String, nullable=False)
    frequency = Column(String, nullable=True)
    user = Column(String, nullable=True)  # Para registrar quién hizo el cambio

    def __repr__(self):
        return f"<UpdateHistory(id={self.id}, action='{self.action}', frequency='{self.frequency}', timestamp='{self.timestamp}')>"