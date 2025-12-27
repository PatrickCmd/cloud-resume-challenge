#!/usr/bin/env python3
"""
Debug script to decode and inspect JWT tokens.

Usage:
    python backend/scripts/debug_tokens.py
"""

import base64
import json
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import boto3
import httpx
from dotenv import load_dotenv

# Load environment variables
env_file = backend_dir / ".env"
if env_file.exists():
    load_dotenv(env_file)


def decode_jwt_payload(token: str) -> dict:
    """Decode JWT token payload without verification."""
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid JWT token format")

    # Decode payload (add padding if needed)
    payload = parts[1]
    payload += "=" * (4 - len(payload) % 4)
    decoded = json.loads(base64.urlsafe_b64decode(payload))

    return decoded


def main():
    """Authenticate and decode tokens."""
    # Get credentials from environment
    api_url = os.getenv("DEV_API_URL", "https://api-dev.patrickcmd.dev")
    email = os.getenv("DEV_TEST_USER_EMAIL")
    password = os.getenv("DEV_TEST_USER_PASSWORD")

    if not email or not password:
        print("❌ Error: DEV_TEST_USER_EMAIL and DEV_TEST_USER_PASSWORD must be set")
        return 1

    print(f"🔐 Authenticating as: {email}")
    print(f"📡 API URL: {api_url}\n")

    # Login
    try:
        with httpx.Client(base_url=api_url, timeout=30.0) as client:
            response = client.post(
                "/auth/login", json={"email": email, "password": password}
            )

            if response.status_code != 200:
                print(f"❌ Login failed: {response.status_code}")
                print(f"Response: {response.text}")
                return 1

            tokens = response.json()
            print("✅ Login successful!\n")

            # Decode and display tokens
            print("=" * 80)
            print("ACCESS TOKEN")
            print("=" * 80)
            access_payload = decode_jwt_payload(tokens["access_token"])
            print(json.dumps(access_payload, indent=2))

            print("\n" + "=" * 80)
            print("ID TOKEN")
            print("=" * 80)
            id_payload = decode_jwt_payload(tokens["id_token"])
            print(json.dumps(id_payload, indent=2))

            print("\n" + "=" * 80)
            print("TOKEN COMPARISON")
            print("=" * 80)

            # Compare claims
            access_claims = set(access_payload.keys())
            id_claims = set(id_payload.keys())

            print(f"\n📋 Access Token Claims: {sorted(access_claims)}")
            print(f"📋 ID Token Claims: {sorted(id_claims)}")

            print(f"\n🔍 Only in Access Token: {sorted(access_claims - id_claims)}")
            print(f"🔍 Only in ID Token: {sorted(id_claims - access_claims)}")

            # Check specific claims
            print("\n" + "=" * 80)
            print("IMPORTANT CLAIMS FOR API GATEWAY AUTHORIZER")
            print("=" * 80)

            print("\n🎫 Access Token:")
            print(f"  - aud (audience): {access_payload.get('aud', 'NOT PRESENT')}")
            print(f"  - client_id: {access_payload.get('client_id', 'NOT PRESENT')}")
            print(f"  - scope: {access_payload.get('scope', 'NOT PRESENT')}")
            print(f"  - token_use: {access_payload.get('token_use', 'NOT PRESENT')}")

            print("\n🎫 ID Token:")
            print(f"  - aud (audience): {id_payload.get('aud', 'NOT PRESENT')}")
            print(f"  - email: {id_payload.get('email', 'NOT PRESENT')}")
            print(f"  - name: {id_payload.get('name', 'NOT PRESENT')}")
            print(f"  - custom:role: {id_payload.get('custom:role', 'NOT PRESENT')}")
            print(f"  - token_use: {id_payload.get('token_use', 'NOT PRESENT')}")

            print("\n" + "=" * 80)
            print("TEST WITH BLOG ENDPOINT")
            print("=" * 80)

            # Test with access token
            print("\n📝 Testing /blogs with ACCESS token...")
            access_headers = {"Authorization": f"Bearer {tokens['access_token']}"}
            blog_response = client.get("/blogs", headers=access_headers)
            print(
                f"   Status: {blog_response.status_code} - {blog_response.reason_phrase}"
            )
            if blog_response.status_code != 200:
                print(f"   Response: {blog_response.text[:200]}")

            # Test with ID token
            print("\n📝 Testing /blogs with ID token...")
            id_headers = {"Authorization": f"Bearer {tokens['id_token']}"}
            blog_response2 = client.get("/blogs", headers=id_headers)
            print(
                f"   Status: {blog_response2.status_code} - {blog_response2.reason_phrase}"
            )
            if blog_response2.status_code != 200:
                print(f"   Response: {blog_response2.text[:200]}")

            print("\n" + "=" * 80)

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
