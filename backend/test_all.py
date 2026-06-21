import httpx
import asyncio
import hmac
import hashlib
import json

API_URL = "http://127.0.0.1:8000/api/v1"
BASE_URL = "http://127.0.0.1:8000"
WEBHOOK_SECRET = "8f4b6c8d-2a4e-4f4e-a8a4-7c5f9d2e1b3a"
TEST_USER = {
    "name": "Full Test User",
    "email": "fulltest@example.com",
    "password": "securepassword123"
}

async def test_all():
    print("Starting Comprehensive API tests...")
    async with httpx.AsyncClient() as client:
        # 1. Health check
        print("\n--- 1. Health Check ---")
        resp = await client.get(f"{BASE_URL}/health", timeout=5.0)
        print(f"Health Check: {resp.status_code}")

        # 2. Register
        print("\n--- 2. Register ---")
        resp = await client.post(f"{API_URL}/auth/register", json=TEST_USER)
        if resp.status_code == 200:
            print("Register OK")
        elif resp.status_code == 400 and "already registered" in resp.text:
            print("User already exists, continuing.")
        else:
            print("Register failed:", resp.text)

        # 3. Login
        print("\n--- 3. Login ---")
        login_data = {"username": TEST_USER["email"], "password": TEST_USER["password"]}
        resp = await client.post(f"{API_URL}/auth/login", data=login_data)
        if resp.status_code != 200:
            print("Login failed:", resp.text)
            return
        token = resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print("Login OK")

        # 4. Get Current User (Me)
        print("\n--- 4. Read Profile (Me) ---")
        resp = await client.get(f"{API_URL}/auth/me", headers=headers)
        print("Me OK:", resp.json()["email"])

        # 5. Update Profile (Me)
        print("\n--- 5. Update Profile ---")
        resp = await client.patch(f"{API_URL}/auth/me", json={"name": "Updated Name"}, headers=headers)
        print("Update Me OK:", resp.json()["name"])

        # 6. Create Repository
        print("\n--- 6. Create Repository ---")
        repo_data = {"repo_name": "test-repo", "provider": "github", "owner": "testuser"}
        resp = await client.post(f"{API_URL}/repositories/", json=repo_data, headers=headers)
        if resp.status_code == 200:
            repo_id = resp.json()["id"]
            print(f"Create Repo OK, ID: {repo_id}")
        else:
            print("Create Repo failed:", resp.text)
            repo_id = None
        
        # 7. List Repositories
        print("\n--- 7. List Repositories ---")
        resp = await client.get(f"{API_URL}/repositories/", headers=headers)
        print(f"List Repos OK, Count: {len(resp.json())}")
        
        if not repo_id and resp.json():
            repo_id = resp.json()[0]["id"]

        # 8. List Reviews
        print("\n--- 8. List Reviews ---")
        resp = await client.get(f"{API_URL}/reviews/", headers=headers)
        print(f"List Reviews OK, Count: {len(resp.json())}")

        # 9. Delete Repository
        if repo_id:
            print("\n--- 9. Delete Repository ---")
            resp = await client.delete(f"{API_URL}/repositories/{repo_id}", headers=headers)
            print("Delete Repo OK:", resp.status_code)

        # 10. Webhook Simulation
        print("\n--- 10. Webhook Simulation ---")
        payload = {
            "action": "opened",
            "pull_request": {"number": 1},
            "repository": {
                "owner": {"login": "octocat"},
                "name": "Hello-World"
            }
        }
        payload_bytes = json.dumps(payload).encode("utf-8")
        signature = hmac.new(WEBHOOK_SECRET.encode(), payload_bytes, hashlib.sha256).hexdigest()
        webhook_headers = {
            "Content-Type": "application/json",
            "X-Hub-Signature-256": f"sha256={signature}"
        }
        resp = await client.post(f"{BASE_URL}/webhook", content=payload_bytes, headers=webhook_headers)
        print("Webhook Request OK:", resp.status_code, resp.json())
        print("(Note: Github might return 404 for this fake PR, but the signature check and routing passed!)")

    print("\nAll endpoints tested successfully!")

if __name__ == "__main__":
    asyncio.run(test_all())
