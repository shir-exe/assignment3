import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("focusflow.db")


class MongoManager:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db_manager = MongoManager()


async def connect_to_mongo():
    """Initializes the MongoDB Motor connection pool and creates indexes."""
    logger.info("Connecting to MongoDB at: %s", settings.MONGO_URI.split("@")[-1])
    db_manager.client = AsyncIOMotorClient(
        settings.MONGO_URI,
        maxPoolSize=20,
        minPoolSize=5
    )
    db_manager.db = db_manager.client[settings.DATABASE_NAME]
    
    # Create indexes for optimized queries
    try:
        await db_manager.db["users"].create_index("email", unique=True)
        await db_manager.db["users"].create_index("username", unique=True)
        await db_manager.db["sessions"].create_index("user_id")
        await db_manager.db["content"].create_index("title")
        logger.info("MongoDB connected and indexes verified successfully.")
    except Exception as e:
        logger.warning("MongoDB index initialization note: %s", e)


async def close_mongo_connection():
    """Closes the MongoDB connection pool."""
    logger.info("Closing MongoDB connection pool.")
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Dependency helper to get the active Mongo database instance."""
    return db_manager.db
