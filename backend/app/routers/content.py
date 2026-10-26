from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from app.db.database import get_database
from app.models.route import RouteCreate, RouteResponse

router = APIRouter(prefix="/content", tags=["Content & Driving Routes"])

# Pre-seeded realistic driving video routes
DEFAULT_DRIVING_ROUTES = [
    {
        "title": "כביש 6 – נסיעת לילה בין-עירונית",
        "description": "נסיעה מהירה בכביש מהיר בשעות החשכה. דורשת רמת ערנות גבוהה ומיקוד מתמשך למניעת עייפות והירדמות על ההגה.",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "duration_seconds": 180,
        "category": "Highway",
        "difficulty": "Challenging",
        "thumbnail_url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
        "tags": ["כביש מהיר", "לילה", "מניעת הירדמות"],
        "created_at": datetime.utcnow()
    },
    {
        "title": "כביש 90 – נסיעה מונוטונית בערבה וים המלח",
        "description": "כביש ארוך וישר ברובו המועד להסחות דעת וירידה איטית ברמת הדריכות. מושלם לכיול והדגמת זיהוי עייפות ורפיון עפעפיים.",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "duration_seconds": 596,
        "category": "Desert Cruise",
        "difficulty": "Extreme",
        "thumbnail_url": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
        "tags": ["ים המלח", "מונוטוני", "בדיקת ערנות"],
        "created_at": datetime.utcnow()
    },
    {
        "title": "נתיבי איילון – תנועה עירונית צפופה",
        "description": "עומס תנועה, בלימות פתאומיות והשתלבויות מהירות. מבחן מעולה לתגובתיות ושמירה על קשר עין רציף עם הדרך.",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "duration_seconds": 653,
        "category": "Urban Traffic",
        "difficulty": "Normal",
        "thumbnail_url": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
        "tags": ["עירוני", "עומס תנועה", "תגובתיות"],
        "created_at": datetime.utcnow()
    },
    {
        "title": "מעבר הרים מפותל – ירידות סדום וערד",
        "description": "פיתולים חדים, שינויי גובה ותנאי ראות משתנים הדורשים ריכוז מלא ותנועות מבט חדות לכל כיווני התנועה.",
        "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "duration_seconds": 120,
        "category": "Mountain Pass",
        "difficulty": "Challenging",
        "thumbnail_url": "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80",
        "tags": ["הרים", "עיקולים", "דריכות שיא"],
        "created_at": datetime.utcnow()
    }
]


@router.get("", response_model=List[RouteResponse])
async def list_routes(
    category: Optional[str] = Query(None),
    db=Depends(get_database)
):
    """Retrieve driving routes with optional category filtering."""
    query = {}
    if category and category != "הכל":
        query["category"] = category

    cursor = db["content"].find(query)
    items = await cursor.to_list(length=100)

    # Seed initial default routes if collection is empty
    if not items and not category:
        await db["content"].insert_many(DEFAULT_DRIVING_ROUTES)
        cursor = db["content"].find(query)
        items = await cursor.to_list(length=100)

    return [
        RouteResponse(
            id=str(item["_id"]),
            title=item["title"],
            description=item["description"],
            video_url=item["video_url"],
            duration_seconds=item["duration_seconds"],
            category=item.get("category", "Highway"),
            difficulty=item.get("difficulty", "Normal"),
            thumbnail_url=item.get("thumbnail_url"),
            tags=item.get("tags", []),
            created_at=item.get("created_at", datetime.utcnow())
        )
        for item in items
    ]


@router.get("/{content_id}", response_model=RouteResponse)
async def get_route(content_id: str, db=Depends(get_database)):
    """Retrieve a single driving route by ID."""
    try:
        doc = await db["content"].find_one({"_id": ObjectId(content_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid route ID format")

    if not doc:
        raise HTTPException(status_code=404, detail="Driving route not found")

    return RouteResponse(
        id=str(doc["_id"]),
        title=doc["title"],
        description=doc["description"],
        video_url=doc["video_url"],
        duration_seconds=doc["duration_seconds"],
        category=doc.get("category", "Highway"),
        difficulty=doc.get("difficulty", "Normal"),
        thumbnail_url=doc.get("thumbnail_url"),
        tags=doc.get("tags", []),
        created_at=doc.get("created_at", datetime.utcnow())
    )


@router.post("", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
async def create_route(route_in: RouteCreate, db=Depends(get_database)):
    """Add a new driving video route."""
    doc = route_in.model_dump()
    doc["created_at"] = datetime.utcnow()
    result = await db["content"].insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return RouteResponse(**doc)
