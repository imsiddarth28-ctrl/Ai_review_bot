from fastapi import APIRouter, Request, Header, HTTPException, Depends, BackgroundTasks
from app.services.github_service import github_service
from app.services.reviewer import reviewer_service
from app.core.logger import logger
from typing import Optional
from sqlalchemy.future import select
from app.db.session import async_session_maker
from app.db.models import Repository, Review, ReviewStatus

router = APIRouter()

CODE_EXTENSIONS = (
    ".py", ".java", ".js", ".ts", ".cpp", ".c", ".cs", ".go", ".rs"
)

async def process_pr_review_background(owner: str, repo_name: str, pr_number: int, pr_title: str):
    logger.info(f"Processing PR #{pr_number} for {owner}/{repo_name}")
    try:
        files = await github_service.get_pr_files(owner, repo_name, pr_number)
        
        all_reviews = []

        for file in files:
            filename = file.get("filename")
            if not filename or not filename.endswith(CODE_EXTENSIONS):
                continue

            patch = file.get("patch")
            if not patch:
                continue

            try:
                review = await reviewer_service.review_code(patch, filename)
                all_reviews.append(f"## File: {filename}\n\n{review}")
            except Exception as e:
                logger.error(f"Failed to review {filename}: {e}")

        if all_reviews:
            final_review = "# AI Code Review\n\n" + "\n\n---\n\n".join(all_reviews)
            await github_service.post_pr_comment(owner, repo_name, pr_number, final_review)
            logger.info(f"Posted review to PR #{pr_number}")
            
            # Save to database
            async with async_session_maker() as session:
                result = await session.execute(
                    select(Repository).where(Repository.owner == owner, Repository.repo_name == repo_name)
                )
                repo = result.scalars().first()
                if repo:
                    db_review = Review(
                        repository_id=repo.id,
                        pr_number=pr_number,
                        pr_title=pr_title,
                        status=ReviewStatus.COMPLETED,
                        review_text=final_review,
                        ai_model="llama-3.3-70b-versatile" # Default model or fetch from config
                    )
                    session.add(db_review)
                    await session.commit()
                    logger.info(f"Saved review to database for PR #{pr_number}")
                else:
                    logger.warning(f"Repository {owner}/{repo_name} not found in DB. Review not saved.")
        else:
            logger.info(f"No code files found to review for PR #{pr_number}")
    except Exception as e:
        logger.error(f"Error processing PR #{pr_number}: {e}")

@router.post("/webhook")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_hub_signature_256: Optional[str] = Header(None)
):
    payload_bytes = await request.body()
    
    # Signature Verification
    if not github_service.verify_signature(payload_bytes, x_hub_signature_256):
        logger.warning("Invalid webhook signature")
        raise HTTPException(status_code=403, detail="Invalid signature")

    payload = await request.json()
    action = payload.get("action")

    if action not in ["opened", "synchronize"]:
        return {"message": "Ignored event"}

    pr = payload.get("pull_request")
    if not pr:
        return {"message": "Not a pull request event"}

    pr_number = pr["number"]
    pr_title = pr.get("title", f"PR #{pr_number}")
    repo = payload.get("repository", {})
    owner = repo.get("owner", {}).get("login")
    repo_name = repo.get("name")

    if not owner or not repo_name:
        raise HTTPException(status_code=400, detail="Missing repository info")

    # Add the review generation to background tasks so GitHub doesn't timeout
    background_tasks.add_task(
        process_pr_review_background,
        owner=owner,
        repo_name=repo_name,
        pr_number=pr_number,
        pr_title=pr_title
    )

    return {"status": "ok", "message": "Review task queued"}
