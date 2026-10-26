from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class RouteBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=150, description="Name of the driving route")
    description: str = Field(..., description="Details and driving conditions")
    video_url: str = Field(..., description="Direct link or stream URL of the driving road video")
    duration_seconds: int = Field(..., gt=0, description="Video duration in seconds")
    category: str = Field(default="Highway", description="Highway, Urban, Mountain, Night Drive")
    difficulty: str = Field(default="Normal", description="Easy, Normal, Challenging, Extreme")
    thumbnail_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class RouteCreate(RouteBase):
    pass


class RouteResponse(RouteBase):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


# Aliases for backward compatibility with Content naming
RouteItem = RouteResponse
ContentBase = RouteBase
ContentCreate = RouteCreate
ContentResponse = RouteResponse
ContentItem = RouteResponse
