"""
Unit tests for authentication endpoints.

Tests the auth API endpoints including:
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me
"""

import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from botocore.exceptions import ClientError

from src.main import app
from src.config import settings


# Test client
client = TestClient(app)


# Test fixtures
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


@pytest.fixture
def mock_user_info():
    """Mock user information extracted from JWT."""
    return {
        "user_id": "test-user-123",
        "email": "test@example.com",
        "name": "Test User",
        "role": "owner",
        "email_verified": True
    }


@pytest.fixture
def valid_auth_headers():
    """Mock valid authorization headers."""
    return {
        "Authorization": "Bearer valid.jwt.token"
    }


class TestLoginEndpoint:
    """Test suite for POST /auth/login endpoint."""

    @patch('src.api.auth.get_cognito_client')
    def test_login_success(self, mock_get_client, mock_cognito_success_response):
        """Test successful login with valid credentials."""
        # Setup mock Cognito client
        mock_cognito = Mock()
        mock_cognito.initiate_auth.return_value = mock_cognito_success_response
        mock_get_client.return_value = mock_cognito

        # Execute
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "SecurePassword123!"
            }
        )

        # Verify
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "mock-access-token-12345"
        assert data["id_token"] == "mock-id-token-67890"
        assert data["refresh_token"] == "mock-refresh-token-abcde"
        assert data["token_type"] == "Bearer"
        assert data["expires_in"] == 3600

        # Verify Cognito was called correctly
        mock_cognito.initiate_auth.assert_called_once_with(
            AuthFlow="USER_PASSWORD_AUTH",
            ClientId=settings.cognito_client_id,
            AuthParameters={
                "USERNAME": "test@example.com",
                "PASSWORD": "SecurePassword123!"
            }
        )

    @patch('src.api.auth.get_cognito_client')
    def test_login_invalid_credentials(self, mock_get_client):
        """Test login with invalid credentials."""
        # Setup mock to raise NotAuthorizedException
        mock_cognito = Mock()
        error_response = {"Error": {"Code": "NotAuthorizedException"}}
        mock_cognito.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_get_client.return_value = mock_cognito

        # Execute
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "WrongPassword"
            }
        )

        # Verify
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["error"]

    @patch('src.api.auth.get_cognito_client')
    def test_login_user_not_confirmed(self, mock_get_client):
        """Test login with unconfirmed user."""
        # Setup mock to raise UserNotConfirmedException
        mock_cognito = Mock()
        error_response = {"Error": {"Code": "UserNotConfirmedException"}}
        mock_cognito.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_get_client.return_value = mock_cognito

        # Execute
        response = client.post(
            "/auth/login",
            json={
                "email": "unconfirmed@example.com",
                "password": "Password123!"
            }
        )

        # Verify
        assert response.status_code == 403
        assert "Email not verified" in response.json()["error"]

    @patch('src.api.auth.get_cognito_client')
    def test_login_user_not_found(self, mock_get_client):
        """Test login with non-existent user."""
        # Setup mock to raise UserNotFoundException
        mock_cognito = Mock()
        error_response = {"Error": {"Code": "UserNotFoundException"}}
        mock_cognito.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_get_client.return_value = mock_cognito

        # Execute
        response = client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "Password123!"
            }
        )

        # Verify
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["error"]

    @patch('src.api.auth.get_cognito_client')
    def test_login_too_many_requests(self, mock_get_client):
        """Test login with rate limiting."""
        # Setup mock to raise TooManyRequestsException
        mock_cognito = Mock()
        error_response = {"Error": {"Code": "TooManyRequestsException"}}
        mock_cognito.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_get_client.return_value = mock_cognito

        # Execute
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "Password123!"
            }
        )

        # Verify
        assert response.status_code == 429
        assert "Too many requests" in response.json()["error"]

    @patch('src.api.auth.get_cognito_client')
    def test_login_invalid_parameter(self, mock_get_client):
        """Test login with invalid parameters from Cognito."""
        # Setup mock to raise InvalidParameterException
        mock_cognito = Mock()
        error_response = {"Error": {"Code": "InvalidParameterException"}}
        mock_cognito.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_get_client.return_value = mock_cognito

        # Execute with valid format but parameters rejected by Cognito
        response = client.post(
            "/auth/login",
            json={
                "email": "valid@email.com",
                "password": "Password123!"
            }
        )

        # Verify
        assert response.status_code == 422  # ValidationException returns 422
        assert "Invalid email or password format" in response.json()["error"]

    def test_login_missing_email(self):
        """Test login without email."""
        response = client.post(
            "/auth/login",
            json={
                "password": "Password123!"
            }
        )

        # Verify
        assert response.status_code == 422  # Validation error

    def test_login_missing_password(self):
        """Test login without password."""
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com"
            }
        )

        # Verify
        assert response.status_code == 422  # Validation error

    def test_login_invalid_email_format(self):
        """Test login with invalid email format."""
        response = client.post(
            "/auth/login",
            json={
                "email": "not-an-email",
                "password": "Password123!"
            }
        )

        # Verify
        assert response.status_code == 422  # Validation error


class TestRefreshTokenEndpoint:
    """Test suite for POST /auth/refresh endpoint."""

    @patch('src.api.auth.get_cognito_client')
    def test_refresh_token_success(self, mock_get_client, mock_refresh_success_response):
        """Test successful token refresh."""
        # Setup mock Cognito client
        mock_cognito = Mock()
        mock_cognito.initiate_auth.return_value = mock_refresh_success_response
        mock_get_client.return_value = mock_cognito

        # Execute
        response = client.post(
            "/auth/refresh",
            json={
                "refresh_token": "mock-refresh-token-abcde"
            }
        )

        # Verify
        assert response.status_code == 200
        data = response.json()
        assert data["access_token"] == "new-access-token-12345"
        assert data["id_token"] == "new-id-token-67890"
        assert data["token_type"] == "Bearer"
        assert data["expires_in"] == 3600

        # Verify Cognito was called correctly
        mock_cognito.initiate_auth.assert_called_once_with(
            AuthFlow="REFRESH_TOKEN_AUTH",
            ClientId=settings.cognito_client_id,
            AuthParameters={
                "REFRESH_TOKEN": "mock-refresh-token-abcde"
            }
        )

    @patch('src.api.auth.get_cognito_client')
    def test_refresh_token_with_new_refresh_token(self, mock_get_client):
        """Test token refresh when Cognito returns a new refresh token."""
        # Setup mock with new refresh token
        mock_response = {
            "AuthenticationResult": {
                "AccessToken": "new-access-token",
                "IdToken": "new-id-token",
                "RefreshToken": "new-refresh-token",
                "ExpiresIn": 3600
            }
        }
        mock_cognito = Mock()
        mock_cognito.initiate_auth.return_value = mock_response
        mock_get_client.return_value = mock_cognito

        # Execute
        response = client.post(
            "/auth/refresh",
            json={
                "refresh_token": "old-refresh-token"
            }
        )

        # Verify
        assert response.status_code == 200
        data = response.json()
        assert data["refresh_token"] == "new-refresh-token"

    @patch('src.api.auth.get_cognito_client')
    def test_refresh_token_expired(self, mock_get_client):
        """Test refresh with expired refresh token."""
        # Setup mock to raise NotAuthorizedException
        mock_cognito = Mock()
        error_response = {"Error": {"Code": "NotAuthorizedException"}}
        mock_cognito.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_get_client.return_value = mock_cognito

        # Execute
        response = client.post(
            "/auth/refresh",
            json={
                "refresh_token": "expired-refresh-token"
            }
        )

        # Verify
        assert response.status_code == 401
        assert "Refresh token expired or invalid" in response.json()["error"]

    def test_refresh_token_missing(self):
        """Test refresh without refresh token."""
        response = client.post(
            "/auth/refresh",
            json={}
        )

        # Verify
        assert response.status_code == 422  # Validation error


class TestLogoutEndpoint:
    """Test suite for POST /auth/logout endpoint."""

    @patch('src.api.auth.get_cognito_client')
    @patch('src.dependencies.extract_user_from_token')
    def test_logout_success(self, mock_extract_user, mock_get_client, mock_user_info):
        """Test successful logout."""
        # Setup mocks
        mock_extract_user.return_value = mock_user_info
        mock_cognito = Mock()
        mock_cognito.admin_user_global_sign_out.return_value = {}
        mock_get_client.return_value = mock_cognito

        # Execute
        response = client.post(
            "/auth/logout",
            headers={"Authorization": "Bearer valid.jwt.token"}
        )

        # Verify
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"

        # Verify global sign out was called
        mock_cognito.admin_user_global_sign_out.assert_called_once_with(
            UserPoolId=settings.cognito_user_pool_id,
            Username=mock_user_info["email"]
        )

    @patch('src.api.auth.get_cognito_client')
    @patch('src.dependencies.extract_user_from_token')
    def test_logout_cognito_error(self, mock_extract_user, mock_get_client, mock_user_info):
        """Test logout when Cognito sign out fails (should still return success)."""
        # Setup mocks
        mock_extract_user.return_value = mock_user_info
        mock_cognito = Mock()
        error_response = {"Error": {"Code": "InternalErrorException"}}
        mock_cognito.admin_user_global_sign_out.side_effect = ClientError(error_response, "AdminUserGlobalSignOut")
        mock_get_client.return_value = mock_cognito

        # Execute
        response = client.post(
            "/auth/logout",
            headers={"Authorization": "Bearer valid.jwt.token"}
        )

        # Verify - should still return success
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out successfully"

    @patch('src.dependencies.extract_user_from_token')
    def test_logout_invalid_token(self, mock_extract_user):
        """Test logout with invalid token."""
        # Setup mock to return None (invalid token)
        mock_extract_user.return_value = None

        # Execute
        response = client.post(
            "/auth/logout",
            headers={"Authorization": "Bearer invalid.jwt.token"}
        )

        # Verify
        assert response.status_code == 401
        assert "Invalid or expired token" in response.json()["error"]

    def test_logout_missing_token(self):
        """Test logout without authorization header."""
        response = client.post("/auth/logout")

        # Verify
        assert response.status_code == 401  # HTTPBearer raises 401 for missing auth (per FastAPI docs)


class TestGetCurrentUserEndpoint:
    """Test suite for GET /auth/me endpoint."""

    @patch('src.dependencies.extract_user_from_token')
    def test_get_current_user_success(self, mock_extract_user, mock_user_info):
        """Test successful retrieval of current user info."""
        # Setup mock
        mock_extract_user.return_value = mock_user_info

        # Execute
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer valid.jwt.token"}
        )

        # Verify
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "test-user-123"
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
        assert data["role"] == "owner"
        assert data["email_verified"] is True

    @patch('src.dependencies.extract_user_from_token')
    def test_get_current_user_minimal_info(self, mock_extract_user):
        """Test retrieval with minimal user info."""
        # Setup mock with minimal user info
        mock_extract_user.return_value = {
            "user_id": "test-user-123",
            "email": "test@example.com",
            "name": "",  # Empty string instead of None
            "role": "",
            "email_verified": False
        }

        # Execute
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer valid.jwt.token"}
        )

        # Verify
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "test-user-123"
        assert data["email"] == "test@example.com"
        assert data["name"] == ""
        assert data["role"] == ""
        assert data["email_verified"] is False

    @patch('src.dependencies.extract_user_from_token')
    def test_get_current_user_invalid_token(self, mock_extract_user):
        """Test retrieval with invalid token."""
        # Setup mock to return None
        mock_extract_user.return_value = None

        # Execute
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid.jwt.token"}
        )

        # Verify
        assert response.status_code == 401
        assert "Invalid or expired token" in response.json()["error"]

    def test_get_current_user_missing_token(self):
        """Test retrieval without authorization header."""
        response = client.get("/auth/me")

        # Verify
        assert response.status_code == 401  # HTTPBearer raises 401 for missing auth (per FastAPI docs)
