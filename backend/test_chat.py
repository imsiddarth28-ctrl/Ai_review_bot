import asyncio
from app.services.reviewer import reviewer_service

async def main():
    try:
        response = await reviewer_service.chat_with_review(
            review_text="This is a dummy review",
            history=[],
            user_message="How do I fix this?",
            provider="groq",
            model="llama-3.3-70b-versatile"
        )
        print("Success:")
        print(response)
    except Exception as e:
        print("Error:")
        print(e)

if __name__ == "__main__":
    asyncio.run(main())
