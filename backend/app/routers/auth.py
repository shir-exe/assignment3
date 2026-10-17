from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.db.database import get_database
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models.user import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db=Depends(get_database)):
    # Check if user already exists
    existing_user = await db["users"].find_one({
        "$or": [{"email": user_in.email}, {"username": user_in.username}]
    })
    if existing_user:
        if existing_user.get("email") == user_in.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken"
        )

    # Hash password & insert
    hashed_pwd = get_password_hash(user_in.password)
    new_user_doc = {
        "email": user_in.email,
        "username": user_in.username,
        "full_name": user_in.full_name,
        "preferred_profile": user_in.preferred_profile,
        "hashed_password": hashed_pwd,
        "created_at": datetime.utcnow(),
        "is_active": True,
    }
    result = await db["users"].insert_one(new_user_doc)
    user_id = str(result.inserted_id)

    access_token = create_access_token(subject=user_id)
    user_response = UserResponse(
        id=user_id,
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        preferred_profile=user_in.preferred_profile,
        created_at=new_user_doc["created_at"],
        is_active=True
    )
    return Token(access_token=access_token, token_type="bearer", user=user_response)


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db=Depends(get_database)):
    user_doc = await db["users"].find_one({
        "$or": [
            {"email": credentials.username_or_email},
            {"username": credentials.username_or_email}
        ]
    })
    if not user_doc or not verify_password(credentials.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_doc.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    user_id = str(user_doc["_id"])
    access_token = create_access_token(subject=user_id)
    user_response = UserResponse(
        id=user_id,
        email=user_doc["email"],
        username=user_doc["username"],
        full_name=user_doc.get("full_name"),
        preferred_profile=user_doc.get("preferred_profile", "standard"),
        created_at=user_doc.get("created_at"),
        is_active=user_doc.get("is_active", True)
    )
    return Token(access_token=access_token, token_type="bearer", user=user_response)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: UserResponse = Depends(get_current_user)):
    return current_user
