from pydantic import BaseModel
from datetime import datetime


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

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

#class TokenData(BaseModel):
#    username: str | None = None
