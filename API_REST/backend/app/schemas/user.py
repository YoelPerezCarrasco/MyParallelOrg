from pydantic import BaseModel,Field
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    rol: str
    username: str
    password: Optional[str] = Field(None, description="Password can be empty when not updating")
    company: str

     
    model_config = {
        "from_attributes": True
    }

class LoginItem(BaseModel):
    username: str
    password: str

class GamificationConfigInput(BaseModel):
    puntos_commit: int
    puntos_revision: int
    puntos_pr_aceptado: int
    
class GitHubUserSchema(BaseModel):
    id: int
    username: str
    html_url: str
    avatar_url: str
    repos_url: str
    location : str
    stars : int
    dominant_language : str
    
    model_config = {
        "from_attributes": True
    }
    
class UserResponse(BaseModel):
    id: int
    rol: str
    username: str
    company: str

class ChangePasswordRequest(BaseModel):
    username: str
    current_password: str
    new_password: str

class UserRepoContributionsSchema(BaseModel):
    id: int
    user_id: int
    repo_name: str
    contribution_count: int

    model_config = {
        "from_attributes": True
    }


class UserRepoCommitsSchema(BaseModel):
    id: int
    user_id: int
    repo_name: str
    commit_count: int
    last_commit_date: datetime

    model_config = {
        "from_attributes": True
    }

class Token(BaseModel):
    access_token: str
    token_type: str
    is_admin: Optional[bool] = False

class TokenData(BaseModel):
    username: Optional[str] = None
    is_admin: Optional[bool] = False
