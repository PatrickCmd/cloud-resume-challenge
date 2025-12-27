#!/usr/bin/env python3
"""Quick test of /blogs endpoint with tokens."""

import os
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import httpx
from dotenv import load_dotenv

env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(env_file)

def main():
    api_url = os.getenv("DEV_API_URL", "https://api-dev.patrickcmd.dev")
    email = os.getenv("DEV_TEST_USER_EMAIL")
    password = os.getenv("DEV_TEST_USER_PASSWORD")

    print(f"🔐 Logging in as: {email}")

    with httpx.Client(base_url=api_url, timeout=30.0) as client:
        # Login
        login_resp = client.post("/auth/login", json={"email": email, "password": password})
        print(f"Login: {login_resp.status_code}")

        if login_resp.status_code != 200:
            print(f"Error: {login_resp.text}")
            return 1

        tokens = login_resp.json()

        # Test /blogs with access token
        print("\n📝 Testing /blogs with ACCESS token...")
        access_headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        blogs_resp = client.get("/blogs", headers=access_headers)
        print(f"   Status: {blogs_resp.status_code}")
        print(f"   Response: {blogs_resp.text[:500]}")

        # Test /blogs with ID token
        print("\n📝 Testing /blogs with ID token...")
        id_headers = {"Authorization": f"Bearer {tokens['id_token']}"}
        blogs_resp2 = client.get("/blogs", headers=id_headers)
        print(f"   Status: {blogs_resp2.status_code}")
        print(f"   Response: {blogs_resp2.text[:500]}")

    return 0

if __name__ == "__main__":
    sys.exit(main())
