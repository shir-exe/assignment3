from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    preferred_profile: str = Field(default="standard", description="standard, high, or relaxed")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Plain text password")


class UserLogin(BaseModel):
    username_or_email: str
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime
    is_active: bool = True

    class Config:
        populate_by_name = True


class UserInDB(UserBase):
    id: Optional[str] = None
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
