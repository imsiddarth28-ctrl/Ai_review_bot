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
    
    # Fetch previous messages (excluding the one we just inserted, to pass history up to now)
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.review_id == review_id, ChatMessage.id != user_msg.id)
        .order_by(ChatMessage.created_at.asc())
    )
    chat_history_objs = history_result.scalars().all()
    history = [{"role": msg.role, "content": msg.content} for msg in chat_history_objs]
    
    # Generate AI response
    try:
        # Determine provider from original review's model
        model_name = review.ai_model or "llama-3.3-70b-versatile"
        provider = "groq"
        if "gemini" in model_name.lower():
            provider = "gemini"
        elif "gpt" in model_name.lower() or "o1" in model_name.lower():
            provider = "openai"

        from app.core.logger import logger
        logger.info(f"Generating AI chat response for review {review_id} using {provider} / {model_name}")
        ai_response_text = await reviewer_service.chat_with_review(
            review_text=review.review_text or "",
            history=history,
            user_message=message.content,
            provider=provider,
            model=model_name
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        from app.core.logger import logger
        logger.error(f"Chat AI Error: {str(e)}")
        ai_response_text = "Sorry, I encountered an internal error while trying to process your request. Please try again later."
        
    # Save AI message
    ai_msg = ChatMessage(review_id=review_id, role=ChatRole.AI, content=ai_response_text)
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)
    
    return ai_msg

