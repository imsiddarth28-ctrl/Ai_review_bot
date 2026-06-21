from typing import Optional
from groq import AsyncGroq
from openai import AsyncOpenAI
from google import genai
from app.core.config import settings
from app.core.logger import logger

class AIProviderFactory:
    @staticmethod
    async def get_review(provider: str, model: str, prompt: str) -> Optional[str]:
        try:
            if provider == "groq":
                client = AsyncGroq(api_key=settings.GROQ_API_KEY)
                response = await client.chat.completions.create(
                    model=model or settings.GROQ_MODEL,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.choices[0].message.content
                
            elif provider == "openai":
                client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                response = await client.chat.completions.create(
                    model=model or "gpt-4o",
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.choices[0].message.content
                
            elif provider == "gemini":
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                response = client.models.generate_content(
                    model=model or "gemini-2.0-flash",
                    contents=prompt
                )
                return response.text
                
            else:
                logger.error(f"Unknown AI provider: {provider}")
                return None
        except Exception as e:
            logger.error(f"Error calling {provider} API: {e}")
            raise
