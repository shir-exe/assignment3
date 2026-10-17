from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from app.db.database import get_database
from app.models.content import ContentCreate, ContentResponse

router = APIRouter(prefix="/content", tags=["Content"])

# Initial default seed data for demonstration and immediate functionality
DEFAULT_CONTENT = [
    {
        "title": "Deep Focus & Neural Attentiveness",
        "description": "Learn the neuroscience behind high-performance cognitive focus, flow states, and mental stamina.",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "duration_seconds": 596,
        "category": "Neuroscience",
        "difficulty": "Medium",
        "thumbnail_url": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80",
        "tags": ["Focus", "Brain", "Cognition"],
        "created_at": datetime.utcnow()
    },
    {
        "title": "Mastering Deep Work in the Modern Era",
        "description": "Techniques for eliminating visual and cognitive distractions in digital workspace environments.",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "duration_seconds": 653,
        "category": "Productivity",
        "difficulty": "Easy",
        "thumbnail_url": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
        "tags": ["DeepWork", "Habits", "Focus"],
        "created_at": datetime.utcnow()
    },
    {
        "title": "Computer Vision & Gaze Tracking Essentials",
        "description": "An interactive dive into facial landmark detection, neural head pose estimation, and attention analytics.",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "duration_seconds": 15,
        "category": "Artificial Intelligence",
        "difficulty": "Hard",
        "thumbnail_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
        "tags": ["AI", "ONNX", "Vision"],
        "created_at": datetime.utcnow()
    }
]


@router.get("", response_model=List[ContentResponse])
async def list_content(
    category: Optional[str] = Query(None),
    db=Depends(get_database)
):
    query = {}
    if category:
        query["category"] = category

    cursor = db["content"].find(query)
    items = await cursor.to_list(length=100)

    # Seed if database is empty on first launch
    if not items and not category:
        await db["content"].insert_many(DEFAULT_CONTENT)
        cursor = db["content"].find(query)
        items = await cursor.to_list(length=100)

    return [
        ContentResponse(
            id=str(item["_id"]),
            title=item["title"],
            description=item["description"],
            video_url=item["video_url"],
            duration_seconds=item["duration_seconds"],
            category=item.get("category", "General"),
            difficulty=item.get("difficulty", "Medium"),
            thumbnail_url=item.get("thumbnail_url"),
            tags=item.get("tags", []),
            created_at=item.get("created_at", datetime.utcnow())
        )
        for item in items
    ]


@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(content_id: str, db=Depends(get_database)):
    try:
        doc = await db["content"].find_one({"_id": ObjectId(content_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid content ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Content not found")

    return ContentResponse(
        id=str(doc["_id"]),
        title=doc["title"],
        description=doc["description"],
        video_url=doc["video_url"],
        duration_seconds=doc["duration_seconds"],
        category=doc.get("category", "General"),
        difficulty=doc.get("difficulty", "Medium"),
        thumbnail_url=doc.get("thumbnail_url"),
        tags=doc.get("tags", []),
        created_at=doc.get("created_at", datetime.utcnow())
    )


@router.post("", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def create_content(content: ContentCreate, db=Depends(get_database)):
    doc = content.model_dump()
    doc["created_at"] = datetime.utcnow()
    result = await db["content"].insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return ContentResponse(**doc)
