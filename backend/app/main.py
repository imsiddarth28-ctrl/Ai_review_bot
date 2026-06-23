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
    # Initialize DB connections, Redis, etc. here
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Safe migration for new columns
        from sqlalchemy import text
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN github_access_token VARCHAR"))
        except Exception as e:
            pass # Column likely already exists
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
    allow_origins=["http://localhost:3000", "https://ai-review-bot-delta.vercel.app"],
    allow_credentials=True,
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
