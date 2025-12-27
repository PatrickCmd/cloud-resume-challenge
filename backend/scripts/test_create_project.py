#!/usr/bin/env python3
"""Test creating a project post."""

import os
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import httpx
from dotenv import load_dotenv
import json

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

        # Test creating a project with ID token
        print("\n📝 Testing POST /projects with ID token...")
        id_headers = {"Authorization": f"Bearer {tokens['id_token']}"}

        # Load project data from data/projects.json
        projects_file = backend_dir / "data" / "projects.json"
        with open(projects_file) as f:
            projects = json.load(f)

        project_data = projects[0]  # Use first project
        print(f"\nProject data keys: {list(project_data.keys())}")
        print(f"Project name: {project_data['name']}")
        print(f"Project tech: {project_data['tech']}")
        print(f"Project githubUrl: {project_data.get('githubUrl')}")
        print(f"Project liveUrl: {project_data.get('liveUrl')}")
        print(f"Project imageUrl: {project_data.get('imageUrl')}")

        create_resp = client.post("/projects", json=project_data, headers=id_headers)
        print(f"\n   Status: {create_resp.status_code}")
        print(f"   Response: {create_resp.text}")

        # If successful, cleanup
        if create_resp.status_code == 201:
            project_id = create_resp.json()["id"]
            print(f"\n🧹 Cleaning up project {project_id}...")
            delete_resp = client.delete(f"/projects/{project_id}", headers=id_headers)
            print(f"   Delete: {delete_resp.status_code}")

    return 0

if __name__ == "__main__":
    sys.exit(main())
