import httpx
import hmac
import hashlib
from typing import List, Dict, Optional
from app.core.config import settings
from app.core.logger import logger
from tenacity import retry, stop_after_attempt, wait_exponential

class GitHubService:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }

    def verify_signature(self, payload: bytes, signature_header: str) -> bool:
        if not settings.GITHUB_WEBHOOK_SECRET:
            logger.warning("GITHUB_WEBHOOK_SECRET is not set, skipping signature verification")
            return True
            
        if not signature_header:
            return False

        hash_object = hmac.new(
            settings.GITHUB_WEBHOOK_SECRET.encode('utf-8'),
            msg=payload,
            digestmod=hashlib.sha256
        )
        expected_signature = "sha256=" + hash_object.hexdigest()
        return hmac.compare_digest(expected_signature, signature_header)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def get_pr_files(self, owner: str, repo: str, pr_number: int) -> List[Dict]:
        url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/files"
        files = []
        
        async with httpx.AsyncClient() as client:
            while url:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                files.extend(response.json())
                
                # Handle pagination
                if "next" in response.links:
                    url = response.links["next"]["url"]
                else:
                    url = None
                    
        return files

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def post_pr_comment(self, owner: str, repo: str, pr_number: int, comment: str) -> None:
        url = f"https://api.github.com/repos/{owner}/{repo}/issues/{pr_number}/comments"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=self.headers,
                json={"body": comment}
            )
            response.raise_for_status()

github_service = GitHubService()
