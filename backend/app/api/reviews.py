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

from app.db.models import ChatMessage, ChatRole
from app.db.schemas import ChatMessageResponse, ChatMessageCreate
from app.services.reviewer import reviewer_service

@router.get("/{review_id}/chat", response_model=List[ChatMessageResponse])
async def get_chat_history(
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify access
    review = await read_review(review_id, current_user, db)
    
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.review_id == review_id)
        .order_by(ChatMessage.created_at.asc())
    )
    return result.scalars().all()

@router.post("/{review_id}/chat", response_model=ChatMessageResponse)
async def post_chat_message(
    review_id: UUID,
    message: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify access
    review = await read_review(review_id, current_user, db)
    
    # Save user message
    user_msg = ChatMessage(review_id=review_id, role=ChatRole.USER, content=message.content)
    db.add(user_msg)
    await db.commit()
    
    # Generate AI response
    try:
        # In a real app we would pass chat history here
        ai_response_text = await reviewer_service.chat_with_review(
            review_text=review.review_text or "",
            history=[],
            user_message=message.content,
            model="llama-3.3-70b-versatile"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get AI response")
        
    # Save AI message
    ai_msg = ChatMessage(review_id=review_id, role=ChatRole.AI, content=ai_response_text)
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)
    
    return ai_msg

