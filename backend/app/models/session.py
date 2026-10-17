from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class MetricSample(BaseModel):
    timestamp_sec: float = Field(..., description="Seconds from start of session")
    attention_score: float = Field(..., ge=0.0, le=100.0, description="Score 0-100")
    face_detected: bool = True
    gaze_state: str = Field(default="focused", description="focused, distracted, away")
    metadata: Optional[Dict[str, Any]] = None


class SessionCreate(BaseModel):
    content_id: str
    content_title: Optional[str] = "Interactive Session"
    attention_profile: str = Field(default="standard", description="standard, high, relaxed")


class SessionUpdate(BaseModel):
    samples: Optional[List[MetricSample]] = None
    average_score: Optional[float] = None
    duration_watched_sec: Optional[float] = None
    is_completed: Optional[bool] = False


class SessionResponse(BaseModel):
    id: str
    user_id: str
    content_id: str
    content_title: str
    attention_profile: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_watched_sec: float = 0.0
    average_score: float = 0.0
    is_completed: bool = False
    samples_count: int = 0
    samples: Optional[List[MetricSample]] = None

    class Config:
        populate_by_name = True
