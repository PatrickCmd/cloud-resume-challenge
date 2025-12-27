#!/usr/bin/env python3
"""Test project validation to debug 422 errors."""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from src.models.project import ProjectCreate

# Test data similar to what's in projects.json
test_data_1 = {
    "name": "Test Project",
    "description": "Test description",
    "longDescription": "Long description here",
    "tech": ["Python", "FastAPI"],
    "company": "Test Company",
    "featured": True,
    "githubUrl": "https://github.com/test/repo",
    "liveUrl": "https://example.com",
    "imageUrl": ""  # Empty string - this will fail validation
}

test_data_2 = {
    "name": "Test Project",
    "description": "Test description",
    "longDescription": "Long description here",
    "tech": ["Python", "FastAPI"],
    "company": "Test Company",
    "featured": True,
    "githubUrl": "https://github.com/test/repo",
    "liveUrl": "https://example.com",
    "imageUrl": None  # None - this should work
}

test_data_3 = {
    "name": "Test Project",
    "description": "Test description",
    "longDescription": "Long description here",
    "tech": ["Python", "FastAPI"],
    "company": "Test Company",
    "featured": True,
    "githubUrl": "https://github.com/test/repo",
    "liveUrl": "https://example.com",
    # imageUrl omitted - this should work
}

print("Testing validation with empty string URLs...")
try:
    project1 = ProjectCreate(**test_data_1)
    print("✅ Empty string: PASSED")
except Exception as e:
    print(f"❌ Empty string: FAILED - {e}")

print("\nTesting validation with None URLs...")
try:
    project2 = ProjectCreate(**test_data_2)
    print("✅ None: PASSED")
except Exception as e:
    print(f"❌ None: FAILED - {e}")

print("\nTesting validation with omitted URLs...")
try:
    project3 = ProjectCreate(**test_data_3)
    print("✅ Omitted: PASSED")
except Exception as e:
    print(f"❌ Omitted: FAILED - {e}")
