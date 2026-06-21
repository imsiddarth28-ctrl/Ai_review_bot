import httpx
import asyncio

async def test_api():
    print("Sending POST request to /api/v1/auth/register...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://127.0.0.1:8000/api/v1/auth/register",
                json={
                    "name": "test",
                    "email": "test@test.com",
                    "password": "test"
                },
                timeout=10.0
            )
            print(f"Status: {response.status_code}")
            print(f"Body: {response.text}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error: {repr(e)}")

if __name__ == "__main__":
    asyncio.run(test_api())
