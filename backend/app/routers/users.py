from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
from app.db.database import get_database
from app.core.deps import get_current_user
from app.models.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_profile: Optional[str] = Field(None, description="standard, high, or relaxed")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Explicit /api/users/me endpoint returning current authenticated user profile."""
    return current_user


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: UserResponse = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    update_dict = {}
    if profile_data.full_name is not None:
        update_dict["full_name"] = profile_data.full_name
    if profile_data.preferred_profile is not None:
        if profile_data.preferred_profile not in ["standard", "high", "relaxed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid profile type. Must be 'standard', 'high', or 'relaxed'"
            )
        update_dict["preferred_profile"] = profile_data.preferred_profile

    if update_dict:
        await db["users"].update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": update_dict}
        )
        updated_doc = await db["users"].find_one({"_id": ObjectId(current_user.id)})
        return UserResponse(
            id=str(updated_doc["_id"]),
            email=updated_doc["email"],
            username=updated_doc["username"],
            full_name=updated_doc.get("full_name"),
            preferred_profile=updated_doc.get("preferred_profile", "standard"),
            created_at=updated_doc.get("created_at"),
            is_active=updated_doc.get("is_active", True)
        )

    return current_user


@router.get("/stats")
async def get_user_statistics(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Aggregate driving stats strictly for the current authenticated user."""
    pipeline = [
        {"$match": {"user_id": current_user.id}},
        {
            "$group": {
                "_id": None,
                "total_sessions": {"$sum": 1},
                "completed_sessions": {
                    "$sum": {"$cond": [{"$eq": ["$is_completed", True]}, 1, 0]}
                },
                "total_watch_seconds": {"$sum": "$duration_watched_sec"},
                "overall_avg_score": {"$avg": "$average_score"}
            }
        }
    ]
    cursor = db["sessions"].aggregate(pipeline)
    results = await cursor.to_list(length=1)
    
    if not results:
        return {
            "total_sessions": 0,
            "completed_sessions": 0,
            "total_watch_seconds": 0.0,
            "overall_avg_score": 0.0
        }
    
    data = results[0]
    avg = data.get("overall_avg_score", 0.0)
    # Normalized representation if average was stored as 0-1 or 0-100
    display_avg = round(avg, 2) if avg <= 1.0 else round(avg, 1)

    return {
        "total_sessions": data.get("total_sessions", 0),
        "completed_sessions": data.get("completed_sessions", 0),
        "total_watch_seconds": round(data.get("total_watch_seconds", 0.0), 1),
        "overall_avg_score": display_avg
    }
