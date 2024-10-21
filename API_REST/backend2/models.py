
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship

Base = declarative_base()

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
    organization = Column(String, index=True)  # Nuevo campo para identificar la organización

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
