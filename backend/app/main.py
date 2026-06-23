from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.logger import logger
from app.api import auth, webhooks, repositories, reviews, github

from app.db.session import engine
from app.db.models import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Antigravity Platform...")
    from sqlalchemy import text
    
    # 1. Attempt standard create_all
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logger.error(f"Base.metadata.create_all failed: {e}")

    # 2. Safe migration for new columns
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE users ADD COLUMN github_access_token VARCHAR"))
    except Exception as e:
        pass # Column likely already exists
        
    # 3. Fallback to forcefully create chat_messages if create_all failed
    try:
        async with engine.begin() as conn:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id UUID PRIMARY KEY,
                    review_id UUID REFERENCES reviews(id),
                    role VARCHAR NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
                );
            """))
    except Exception as e:
        logger.error(f"Failed to manually create chat_messages table: {e}")
        pass
            
    logger.info("Database tables created/verified")
    yield
    logger.info("Shutting down Antigravity Platform...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(github.router, prefix=f"{settings.API_V1_STR}/github", tags=["GitHub Integration"])
app.include_router(repositories.router, prefix=f"{settings.API_V1_STR}/repositories", tags=["Repositories"])
app.include_router(reviews.router, prefix=f"{settings.API_V1_STR}/reviews", tags=["Reviews"])
app.include_router(webhooks.router, tags=["Webhooks"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}

@app.get("/")
async def root():
    return {"message": "Welcome to Antigravity Platform API. Go to /docs for Swagger documentation."}
