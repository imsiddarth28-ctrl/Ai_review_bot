from fastapi import APIRouter, Request, Header, HTTPException, Depends
from app.services.github_service import github_service
from app.services.reviewer import reviewer_service
from app.core.logger import logger
from typing import Optional

router = APIRouter()

CODE_EXTENSIONS = (
    ".py", ".java", ".js", ".ts", ".cpp", ".c", ".cs", ".go", ".rs"
)

@router.post("/webhook")
async def github_webhook(
    request: Request,
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
    repo = payload.get("repository", {})
    owner = repo.get("owner", {}).get("login")
    repo_name = repo.get("name")

    if not owner or not repo_name:
        raise HTTPException(status_code=400, detail="Missing repository info")

    logger.info(f"Processing PR #{pr_number} for {owner}/{repo_name}")

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
    else:
        logger.info(f"No code files found to review for PR #{pr_number}")

    return {"status": "ok"}
