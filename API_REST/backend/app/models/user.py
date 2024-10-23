# models/user.py
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
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=True)
    is_manager = Column(Boolean, default=True)
    rol = Column(String, nullable=False)
    company = Column(String, nullable=False)

class LoginItem(BaseModel):
    username: str
    password: str