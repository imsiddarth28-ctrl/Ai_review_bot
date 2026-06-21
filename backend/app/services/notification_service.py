import httpx
from app.core.config import settings
from app.core.logger import logger

class NotificationService:
    async def send_slack_notification(self, message: str):
        if not settings.SLACK_WEBHOOK_URL:
            return
        
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    settings.SLACK_WEBHOOK_URL,
                    json={"text": message}
                )
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {e}")

    async def send_discord_notification(self, message: str):
        if not settings.DISCORD_WEBHOOK_URL:
            return
            
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    settings.DISCORD_WEBHOOK_URL,
                    json={"content": message}
                )
        except Exception as e:
            logger.error(f"Failed to send Discord notification: {e}")

    async def send_teams_notification(self, message: str):
        if not settings.TEAMS_WEBHOOK_URL:
            return
            
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    settings.TEAMS_WEBHOOK_URL,
                    json={"text": message}
                )
        except Exception as e:
            logger.error(f"Failed to send Teams notification: {e}")

    async def notify_review_completed(self, pr_number: int, repo_name: str, issues_count: int):
        message = f"✅ Code Review Completed for {repo_name} PR #{pr_number}. Found {issues_count} issues."
        await self.send_slack_notification(message)
        await self.send_discord_notification(message)
        await self.send_teams_notification(message)

notification_service = NotificationService()
