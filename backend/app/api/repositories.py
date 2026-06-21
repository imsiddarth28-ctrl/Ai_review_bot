from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.db.models import Repository, User
from app.db.schemas import RepositoryCreate, RepositoryResponse
from app.api.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=RepositoryResponse)
async def create_repository(
    repo_in: RepositoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo = Repository(
        user_id=current_user.id,
        repo_name=repo_in.repo_name,
        provider=repo_in.provider,
        owner=repo_in.owner,
        webhook_secret=repo_in.webhook_secret
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)
    return repo

@router.get("/", response_model=List[RepositoryResponse])
async def read_repositories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Repository).where(Repository.user_id == current_user.id)
    )
    return result.scalars().all()

@router.delete("/{repo_id}")
async def delete_repository(
    repo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id)
    )
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
        
    await db.delete(repo)
    await db.commit()
    return {"status": "deleted"}
