from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from bson import ObjectId
from app.core.security import decode_access_token
from app.db.database import get_database
from app.models.user import UserResponse

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    db = get_database()
    try:
        user_doc = await db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception

    if user_doc is None:
        raise credentials_exception

    return UserResponse(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        username=user_doc["username"],
        full_name=user_doc.get("full_name"),
        preferred_profile=user_doc.get("preferred_profile", "standard"),
        created_at=user_doc.get("created_at"),
        is_active=user_doc.get("is_active", True)
    )
