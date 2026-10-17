from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class ContentBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: str
    video_url: str
    duration_seconds: int = Field(..., gt=0)
    category: str = Field(default="Education")
    difficulty: str = Field(default="Medium", description="Easy, Medium, Hard")
    thumbnail_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class ContentCreate(ContentBase):
    pass


class ContentResponse(ContentBase):
    id: str
    created_at: datetime

    class Config:
        populate_by_name = True


class ContentItem(ContentResponse):
    pass
