from groq import AsyncGroq
from app.core.config import settings
from app.core.logger import logger
from app.prompts.templates import JAVA_PROMPT, PYTHON_PROMPT, JS_PROMPT, TS_PROMPT, DEFAULT_PROMPT
from tenacity import retry, stop_after_attempt, wait_exponential

from app.services.ai_providers import AIProviderFactory

class ReviewerService:
    def get_prompt(self, filename: str) -> str:
        if filename.endswith(".java"):
            return JAVA_PROMPT
        if filename.endswith(".py"):
            return PYTHON_PROMPT
        if filename.endswith(".js"):
            return JS_PROMPT
        if filename.endswith(".ts"):
            return TS_PROMPT
        return DEFAULT_PROMPT

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def review_code(self, code: str, filename: str, provider: str = "groq", model: str = None) -> str:
        prompt_template = self.get_prompt(filename)
        prompt = prompt_template.format(code=code)

        try:
            return await AIProviderFactory.get_review(provider, model, prompt)
        except Exception as e:
            logger.error(f"Error reviewing {filename}: {e}")
            raise

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def chat_with_review(self, review_text: str, history: list[dict], user_message: str, provider: str = "groq", model: str = None) -> str:
        prompt = f"""You are an AI code reviewer assistant. 
Here is the code review you previously generated:
---
{review_text}
---

The user is asking a question about this review or the code it references.
Answer the user's question directly, clearly, and concisely. Keep the tone helpful and professional.

User's new message:
{user_message}
"""
        # Note: In a fully implemented version, we'd pass the actual history array to the provider. 
        # For simplicity, we just pass the constructed prompt to get_review since it abstracts the API calls.
        
        try:
            return await AIProviderFactory.get_review(provider, model, prompt)
        except Exception as e:
            logger.error(f"Error in chat_with_review: {e}")
            raise

reviewer_service = ReviewerService()
