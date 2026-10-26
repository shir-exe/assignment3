from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DriveReading(BaseModel):
    position: float = Field(default=0.0, description="Playback position along driving route in seconds")
    timestamp_sec: Optional[float] = Field(default=None, description="Seconds elapsed in session")
    score: float = Field(..., ge=0.0, le=100.0, description="Driver alertness score between 0.0 and 1.0 (or 0-100)")
    attention_score: Optional[float] = Field(default=None, description="Alias for score")
    face_detected: bool = Field(default=True, description="Whether driver face was detected by camera")
    gaze_state: str = Field(default="focused", description="focused, drowsy, distracted, away")
    is_drowsy: Optional[bool] = Field(default=None, description="True if score < 0.4 or drowsy")
    metadata: Optional[Dict[str, Any]] = None

    def model_post_init(self, __context):
        if self.timestamp_sec is None:
            self.timestamp_sec = self.position
        if self.attention_score is None:
            self.attention_score = self.score
        if self.is_drowsy is None:
            # Score can be 0.0-1.0 or 0-100
            val = self.score if self.score <= 1.0 else self.score / 100.0
            self.is_drowsy = (val < 0.4) or (not self.face_detected)


# Alias for backward compatibility
MetricSample = DriveReading


class DriveSessionCreate(BaseModel):
    content_id: Optional[str] = None
    route_id: Optional[str] = None
    content_title: Optional[str] = "Driving Session"
    route_title: Optional[str] = None
    attention_profile: str = Field(default="standard", description="standard, high, relaxed")


SessionCreate = DriveSessionCreate


class DriveSessionUpdate(BaseModel):
    readings: Optional[List[DriveReading]] = None
    samples: Optional[List[DriveReading]] = None
    average_score: Optional[float] = None
    duration_watched_sec: Optional[float] = None
    is_completed: Optional[bool] = False


SessionUpdate = DriveSessionUpdate


class DriveSessionResponse(BaseModel):
    id: str
    user_id: str
    content_id: str
    content_title: str
    attention_profile: str = "standard"
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_watched_sec: float = 0.0
    average_score: float = 0.0
    is_completed: bool = False
    readings_count: int = 0
    readings: Optional[List[DriveReading]] = None
    samples: Optional[List[DriveReading]] = None

    class Config:
        populate_by_name = True


SessionResponse = DriveSessionResponse
