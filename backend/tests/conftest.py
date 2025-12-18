"""
Pytest configuration and shared fixtures.

This file contains pytest fixtures that are available to all test modules.
"""

import pytest
from unittest.mock import Mock
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from src.main import app
from src.config import settings


# Test client fixture
@pytest.fixture
def test_client():
    """FastAPI test client."""
    return TestClient(app)


# Mock Cognito fixtures
@pytest.fixture
def mock_cognito_client():
    """Mock boto3 Cognito client."""
    client = Mock()
    client.initiate_auth = Mock()
    client.admin_user_global_sign_out = Mock()
    return client


@pytest.fixture
def mock_cognito_success_response():
    """Mock successful Cognito authentication response."""
    return {
        "AuthenticationResult": {
            "AccessToken": "mock-access-token-12345",
            "IdToken": "mock-id-token-67890",
            "RefreshToken": "mock-refresh-token-abcde",
            "ExpiresIn": 3600,
            "TokenType": "Bearer"
        }
    }


@pytest.fixture
def mock_refresh_success_response():
    """Mock successful token refresh response."""
    return {
        "AuthenticationResult": {
            "AccessToken": "new-access-token-12345",
            "IdToken": "new-id-token-67890",
            "ExpiresIn": 3600,
            "TokenType": "Bearer"
        }
    }


# JWT and user fixtures
@pytest.fixture
def mock_jwks():
    """Mock JWKS response from Cognito."""
    return {
        "keys": [
            {
                "kid": "test-key-id-1",
                "alg": "RS256",
                "kty": "RSA",
                "use": "sig",
                "n": "test-modulus",
                "e": "AQAB"
            },
            {
                "kid": "test-key-id-2",
                "alg": "RS256",
                "kty": "RSA",
                "use": "sig",
                "n": "test-modulus-2",
                "e": "AQAB"
            }
        ]
    }


@pytest.fixture
def valid_token_claims():
    """Mock valid JWT token claims."""
    return {
        "sub": "test-user-id-123",
        "email": "test@example.com",
        "name": "Test User",
        "custom:role": "owner",
        "email_verified": True,
        "aud": settings.cognito_client_id,
        "iss": settings.jwt_issuer,
        "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
        "iat": int(datetime.utcnow().timestamp())
    }


@pytest.fixture
def expired_token_claims():
    """Mock expired JWT token claims."""
    return {
        "sub": "test-user-id-123",
        "email": "test@example.com",
        "name": "Test User",
        "custom:role": "owner",
        "email_verified": True,
        "aud": settings.cognito_client_id,
        "iss": settings.jwt_issuer,
        "exp": int((datetime.utcnow() - timedelta(hours=1)).timestamp()),
        "iat": int((datetime.utcnow() - timedelta(hours=2)).timestamp())
    }


@pytest.fixture
def mock_user_info():
    """Mock user information extracted from JWT."""
    return {
        "user_id": "test-user-id-123",
        "email": "test@example.com",
        "name": "Test User",
        "role": "owner",
        "email_verified": True
    }


@pytest.fixture
def mock_visitor_user_info():
    """Mock visitor (non-owner) user information."""
    return {
        "user_id": "visitor-user-456",
        "email": "visitor@example.com",
        "name": "Visitor User",
        "role": "visitor",
        "email_verified": True
    }


@pytest.fixture
def valid_auth_headers():
    """Mock valid authorization headers."""
    return {
        "Authorization": "Bearer valid.jwt.token"
    }


@pytest.fixture
def invalid_auth_headers():
    """Mock invalid authorization headers."""
    return {
        "Authorization": "Bearer invalid.jwt.token"
    }


# Mock DynamoDB fixtures
@pytest.fixture
def mock_dynamodb_table():
    """Mock DynamoDB table resource."""
    table = Mock()
    table.put_item = Mock()
    table.get_item = Mock()
    table.query = Mock()
    table.update_item = Mock()
    table.delete_item = Mock()
    table.scan = Mock()
    return table


@pytest.fixture
def mock_blog_post_item():
    """Mock blog post DynamoDB item."""
    return {
        "PK": "BLOG#test-slug",
        "SK": "METADATA",
        "GSI1PK": "BLOG",
        "GSI1SK": "2024-01-15T10:00:00",
        "id": "test-blog-id-123",
        "title": "Test Blog Post",
        "slug": "test-slug",
        "content": "This is test content",
        "excerpt": "Test excerpt",
        "tags": ["python", "testing"],
        "is_published": True,
        "created_at": "2024-01-15T10:00:00",
        "updated_at": "2024-01-15T10:00:00"
    }


@pytest.fixture
def mock_project_item():
    """Mock project DynamoDB item."""
    return {
        "PK": "PROJECT#test-project-id",
        "SK": "METADATA",
        "GSI1PK": "PROJECT",
        "GSI1SK": "2024-01-15T10:00:00",
        "id": "test-project-id",
        "title": "Test Project",
        "description": "Test project description",
        "technologies": ["Python", "FastAPI"],
        "github_url": "https://github.com/test/project",
        "demo_url": "https://demo.example.com",
        "is_featured": True,
        "created_at": "2024-01-15T10:00:00",
        "updated_at": "2024-01-15T10:00:00"
    }


# Test data helpers
@pytest.fixture
def sample_login_request():
    """Sample login request data."""
    return {
        "email": "test@example.com",
        "password": "SecurePassword123!"
    }


@pytest.fixture
def sample_blog_create_request():
    """Sample blog post creation request."""
    return {
        "title": "New Blog Post",
        "slug": "new-blog-post",
        "content": "This is the content of the new blog post.",
        "excerpt": "Brief excerpt of the blog post.",
        "tags": ["python", "fastapi", "testing"],
        "is_published": True
    }


@pytest.fixture
def sample_project_create_request():
    """Sample project creation request."""
    return {
        "title": "New Project",
        "description": "Description of the new project",
        "technologies": ["Python", "FastAPI", "AWS"],
        "github_url": "https://github.com/test/new-project",
        "demo_url": "https://demo-new.example.com",
        "is_featured": False
    }


# Cleanup fixture
@pytest.fixture(autouse=True)
def reset_mocks():
    """Reset all mocks after each test."""
    yield
    # Cleanup happens after test completes
