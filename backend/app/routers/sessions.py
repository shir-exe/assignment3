from datetime import datetime
from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from app.db.database import get_database
from app.core.deps import get_current_user
from app.models.user import UserResponse
from app.models.drive_session import (
    DriveSessionCreate,
    DriveSessionUpdate,
    DriveSessionResponse,
    DriveReading,
)

router = APIRouter(prefix="/sessions", tags=["Drive Sessions & Telemetry"])


@router.post("", response_model=DriveSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    session_data: DriveSessionCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Open a new driving session strictly tied to current authenticated driver."""
    cid = session_data.content_id or session_data.route_id or "default"
    content_title = session_data.content_title or session_data.route_title or "מסלול נהיגה פעיל"

    # Lookup content title from database if content_id is a valid ObjectId
    try:
        content_doc = await db["content"].find_one({"_id": ObjectId(cid)})
        if content_doc:
            content_title = content_doc.get("title", content_title)
    except Exception:
        pass

    session_doc = {
        "user_id": current_user.id,
        "content_id": cid,
        "content_title": content_title,
        "attention_profile": session_data.attention_profile,
        "start_time": datetime.utcnow(),
        "end_time": None,
        "duration_watched_sec": 0.0,
        "average_score": 0.0,
        "is_completed": False,
        "readings": []
    }
    result = await db["sessions"].insert_one(session_doc)
    session_id = str(result.inserted_id)

    return DriveSessionResponse(
        id=session_id,
        user_id=current_user.id,
        content_id=cid,
        content_title=content_title,
        attention_profile=session_data.attention_profile,
        start_time=session_doc["start_time"],
        end_time=None,
        duration_watched_sec=0.0,
        average_score=0.0,
        is_completed=False,
        readings_count=0,
        readings=[],
        samples=[]
    )


@router.post("/{session_id}/readings", response_model=dict)
async def append_readings(
    session_id: str,
    readings: Union[DriveReading, List[DriveReading]],
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Receive live driver alertness readings with score and position."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    # Strict user separation check
    session_doc = await db["sessions"].find_one({"_id": oid, "user_id": current_user.id})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Drive session not found or unauthorized")

    items = [readings] if isinstance(readings, DriveReading) else readings
    serialized = [r.model_dump() for r in items]

    await db["sessions"].update_one(
        {"_id": oid},
        {"$push": {"readings": {"$each": serialized}}}
    )

    return {"status": "ok", "appended": len(serialized)}


@router.put("/{session_id}", response_model=DriveSessionResponse)
async def update_or_finish_session(
    session_id: str,
    update_data: DriveSessionUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update or finalize driving session, calculating average alertness score."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    # Enforce strict user separation
    session_doc = await db["sessions"].find_one({"_id": oid, "user_id": current_user.id})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Drive session not found or unauthorized")

    update_fields = {}
    if update_data.duration_watched_sec is not None:
        update_fields["duration_watched_sec"] = update_data.duration_watched_sec
    if update_data.is_completed is not None:
        update_fields["is_completed"] = update_data.is_completed
        if update_data.is_completed:
            update_fields["end_time"] = datetime.utcnow()

    # Collect incoming readings / samples
    incoming_readings = update_data.readings or update_data.samples
    if incoming_readings:
        serialized = [r.model_dump() for r in incoming_readings]
        update_fields["readings"] = serialized

        # Compute average score if not provided
        if update_data.average_score is None and serialized:
            scores = [r["score"] for r in serialized if r.get("score") is not None]
            if scores:
                avg = sum(scores) / len(scores)
                # Keep normalized format (0-1 or 0-100)
                update_fields["average_score"] = round(avg, 2) if avg <= 1.0 else round(avg, 1)

    if update_data.average_score is not None:
        update_fields["average_score"] = update_data.average_score

    if update_fields:
        await db["sessions"].update_one({"_id": oid}, {"$set": update_fields})

    updated = await db["sessions"].find_one({"_id": oid})
    readings_list = updated.get("readings") or updated.get("samples") or []
    reading_models = [DriveReading(**r) for r in readings_list]

    return DriveSessionResponse(
        id=str(updated["_id"]),
        user_id=updated["user_id"],
        content_id=updated["content_id"],
        content_title=updated.get("content_title", "מסלול נהיגה"),
        attention_profile=updated.get("attention_profile", "standard"),
        start_time=updated["start_time"],
        end_time=updated.get("end_time"),
        duration_watched_sec=updated.get("duration_watched_sec", 0.0),
        average_score=updated.get("average_score", 0.0),
        is_completed=updated.get("is_completed", False),
        readings_count=len(readings_list),
        readings=reading_models,
        samples=reading_models
    )


@router.get("", response_model=List[DriveSessionResponse])
async def list_user_sessions(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """List sessions strictly belonging to the currently authenticated driver."""
    cursor = db["sessions"].find({"user_id": current_user.id}).sort("start_time", -1)
    sessions = await cursor.to_list(length=100)

    result = []
    for s in sessions:
        r_list = s.get("readings") or s.get("samples") or []
        result.append(
            DriveSessionResponse(
                id=str(s["_id"]),
                user_id=s["user_id"],
                content_id=s["content_id"],
                content_title=s.get("content_title", "מסלול נהיגה"),
                attention_profile=s.get("attention_profile", "standard"),
                start_time=s["start_time"],
                end_time=s.get("end_time"),
                duration_watched_sec=s.get("duration_watched_sec", 0.0),
                average_score=s.get("average_score", 0.0),
                is_completed=s.get("is_completed", False),
                readings_count=len(r_list),
                readings=None,
                samples=None
            )
        )
    return result


@router.get("/{session_id}", response_model=DriveSessionResponse)
async def get_session_detail(
    session_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Retrieve full details of a drive session, enforcing strict user separation."""
    try:
        oid = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID")

    session_doc = await db["sessions"].find_one({"_id": oid, "user_id": current_user.id})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Drive session not found or unauthorized")

    r_list = session_doc.get("readings") or session_doc.get("samples") or []
    reading_models = [DriveReading(**r) for r in r_list]

    return DriveSessionResponse(
        id=str(session_doc["_id"]),
        user_id=session_doc["user_id"],
        content_id=session_doc["content_id"],
        content_title=session_doc.get("content_title", "מסלול נהיגה"),
        attention_profile=session_doc.get("attention_profile", "standard"),
        start_time=session_doc["start_time"],
        end_time=session_doc.get("end_time"),
        duration_watched_sec=session_doc.get("duration_watched_sec", 0.0),
        average_score=session_doc.get("average_score", 0.0),
        is_completed=session_doc.get("is_completed", False),
        readings_count=len(r_list),
        readings=reading_models,
        samples=reading_models
    )
