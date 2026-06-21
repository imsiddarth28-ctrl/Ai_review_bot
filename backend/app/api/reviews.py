from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.db.models import Review, Repository, User
from app.db.schemas import ReviewResponse
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ReviewResponse])
async def read_reviews(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get reviews for repositories owned by the current user
    result = await db.execute(
        select(Review)
        .join(Repository)
        .where(Repository.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/{review_id}", response_model=ReviewResponse)
async def read_review(
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Review)
        .join(Repository)
        .where(Review.id == review_id, Repository.user_id == current_user.id)
    )
    review = result.scalars().first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review
