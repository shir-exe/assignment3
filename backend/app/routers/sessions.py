from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.db.database import get_database
from app.core.deps import get_current_user
from app.models.user import UserResponse
from app.models.session import SessionCreate, SessionUpdate, SessionResponse, MetricSample

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    session_data: SessionCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    # Lookup content title if possible
    content_title = session_data.content_title
    try:
        content_doc = await db["content"].find_one({"_id": ObjectId(session_data.content_id)})
        if content_doc:
            content_title = content_doc.get("title", content_title)
    except Exception:
        pass

    session_doc = {
        "user_id": current_user.id,
        "content_id": session_data.content_id,
        "content_title": content_title,
        "attention_profile": session_data.attention_profile,
        "start_time": datetime.utcnow(),
        "end_time": None,
        "duration_watched_sec": 0.0,
        "average_score": 0.0,
        "is_completed": False,
        "samples": []
    }
    result = await db["sessions"].insert_one(session_doc)
    session_id = str(result.inserted_id)

    return SessionResponse(
        id=session_id,
        user_id=current_user.id,
        content_id=session_data.content_id,
        content_title=content_title,
        attention_profile=session_data.attention_profile,
        start_time=session_doc["start_time"],
        end_time=None,
        duration_watched_sec=0.0,
        average_score=0.0,
        is_completed=False,
        samples_count=0,
        samples=[]
    )


@router.put("/{session_id}", response_model=SessionResponse)
async def update_or_finish_session(
    session_id: str,
    update_data: SessionUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    session_doc = await db["sessions"].find_one({"_id": oid, "user_id": current_user.id})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")

    update_fields = {}
    if update_data.duration_watched_sec is not None:
        update_fields["duration_watched_sec"] = update_data.duration_watched_sec
    if update_data.average_score is not None:
        update_fields["average_score"] = update_data.average_score
    if update_data.is_completed is not None:
        update_fields["is_completed"] = update_data.is_completed
        if update_data.is_completed:
            update_fields["end_time"] = datetime.utcnow()

    # Append or replace samples
    if update_data.samples:
        samples_dict = [s.model_dump() for s in update_data.samples]
        update_fields["samples"] = samples_dict
        if not update_data.average_score and samples_dict:
            scores = [s["attention_score"] for s in samples_dict if s.get("attention_score") is not None]
            if scores:
                update_fields["average_score"] = round(sum(scores) / len(scores), 1)

    if update_fields:
        await db["sessions"].update_one({"_id": oid}, {"$set": update_fields})

    updated = await db["sessions"].find_one({"_id": oid})
    samples_list = updated.get("samples", [])
    return SessionResponse(
        id=str(updated["_id"]),
        user_id=updated["user_id"],
        content_id=updated["content_id"],
        content_title=updated.get("content_title", "Session"),
        attention_profile=updated.get("attention_profile", "standard"),
        start_time=updated["start_time"],
        end_time=updated.get("end_time"),
        duration_watched_sec=updated.get("duration_watched_sec", 0.0),
        average_score=updated.get("average_score", 0.0),
        is_completed=updated.get("is_completed", False),
        samples_count=len(samples_list),
        samples=[MetricSample(**s) for s in samples_list]
    )


@router.get("", response_model=List[SessionResponse])
async def list_user_sessions(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    cursor = db["sessions"].find({"user_id": current_user.id}).sort("start_time", -1)
    sessions = await cursor.to_list(length=100)
    
    return [
        SessionResponse(
            id=str(s["_id"]),
            user_id=s["user_id"],
            content_id=s["content_id"],
            content_title=s.get("content_title", "Session"),
            attention_profile=s.get("attention_profile", "standard"),
            start_time=s["start_time"],
            end_time=s.get("end_time"),
            duration_watched_sec=s.get("duration_watched_sec", 0.0),
            average_score=s.get("average_score", 0.0),
            is_completed=s.get("is_completed", False),
            samples_count=len(s.get("samples", [])),
            samples=None  # Do not transfer heavy array in summary list
        )
        for s in sessions
    ]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session_detail(
    session_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    session_doc = await db["sessions"].find_one({"_id": oid, "user_id": current_user.id})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")

    samples_list = session_doc.get("samples", [])
    return SessionResponse(
        id=str(session_doc["_id"]),
        user_id=session_doc["user_id"],
        content_id=session_doc["content_id"],
        content_title=session_doc.get("content_title", "Session"),
        attention_profile=session_doc.get("attention_profile", "standard"),
        start_time=session_doc["start_time"],
        end_time=session_doc.get("end_time"),
        duration_watched_sec=session_doc.get("duration_watched_sec", 0.0),
        average_score=session_doc.get("average_score", 0.0),
        is_completed=session_doc.get("is_completed", False),
        samples_count=len(samples_list),
        samples=[MetricSample(**s) for s in samples_list]
    )
