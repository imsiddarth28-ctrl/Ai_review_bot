from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
import httpx
from app.db.session import get_db
from app.db.models import User
from app.api.auth import get_current_user

router = APIRouter()

@router.get("/repositories", response_model=List[Dict[str, Any]])
async def get_github_repositories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches the connected user's repositories from GitHub.
    """
    if not current_user.github_access_token:
        raise HTTPException(status_code=400, detail="GitHub account not connected")
        
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://api.github.com/user/repos?sort=updated&per_page=100",
            headers={
                "Authorization": f"Bearer {current_user.github_access_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Antigravity-AI-Review-Bot"
            }
        )
        
        if res.status_code == 401:
            raise HTTPException(status_code=401, detail="GitHub token expired or invalid")
        elif res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to fetch repositories from GitHub: {res.text}")
            
        repos = res.json()
        
        # Format the response
        formatted_repos = []
        for r in repos:
            formatted_repos.append({
                "id": r["id"],
                "name": r["name"],
                "full_name": r["full_name"],
                "owner": r["owner"]["login"],
                "private": r["private"],
                "html_url": r["html_url"],
                "description": r["description"],
                "updated_at": r["updated_at"]
            })
            
        return formatted_repos
