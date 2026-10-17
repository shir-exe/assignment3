import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, users, content, sessions

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
)
logger = logging.getLogger("focusflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager handling startup connections and shutdown cleanup."""
    logger.info("Initializing FocusFlow API services...")
    await connect_to_mongo()
    yield
    logger.info("Shutting down FocusFlow API services...")
    await close_mongo_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for FocusFlow real-time attention tracking & learning analysis.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint verifying system responsiveness."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected"
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to FocusFlow Attention Intelligence API",
        "docs": "/docs",
        "health": "/health"
    }


# Include Modular Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(content.router, prefix=settings.API_V1_STR)
app.include_router(sessions.router, prefix=settings.API_V1_STR)
