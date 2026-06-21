from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime
from app.db.models import UserRole, Provider, ReviewStatus, Severity, IssueCategory

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class UserResponse(UserBase):
    id: UUID
    role: UserRole
    oauth_provider: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class RepositoryBase(BaseModel):
    repo_name: str
    provider: Provider
    owner: str

class RepositoryCreate(RepositoryBase):
    webhook_secret: Optional[str] = None

class RepositoryResponse(RepositoryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ReviewBase(BaseModel):
    pr_number: int
    pr_title: Optional[str] = None
    status: ReviewStatus
    severity_summary: Optional[Dict[str, int]] = None
    ai_model: Optional[str] = None

class ReviewResponse(ReviewBase):
    id: UUID
    repository_id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
