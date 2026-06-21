import asyncio
from sqlalchemy import select
from app.db.session import async_session_maker
from app.db.models import User

async def test_db():
    print("Testing DB connection...")
    try:
        async with async_session_maker() as session:
            print("Session created.")
            result = await session.execute(select(User))
            users = result.scalars().all()
            print(f"Found {len(users)} users.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_db())
