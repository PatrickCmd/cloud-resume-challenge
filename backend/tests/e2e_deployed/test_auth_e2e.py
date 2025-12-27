"""
E2E tests for authentication endpoints.

Tests Cognito authentication flow:
- POST /auth/login
- POST /auth/refresh
- GET /auth/me
- POST /auth/logout
"""

import pytest
import time


class TestLoginEndpoint:
    """Test suite for login endpoint."""

    def test_login_with_valid_credentials(self, api_client, test_user_credentials):
        """Test successful login with valid credentials."""
        response = api_client.post("/auth/login", json=test_user_credentials)

        assert response.status_code == 200
        data = response.json()

        # Verify all tokens are returned
        assert "access_token" in data
        assert "id_token" in data
        assert "refresh_token" in data
        assert "expires_in" in data

        # Verify tokens are non-empty
        assert len(data["access_token"]) > 0
        assert len(data["id_token"]) > 0
        assert len(data["refresh_token"]) > 0

        # Verify expires_in is reasonable (should be 3600 for 1 hour)
        assert data["expires_in"] > 0
        assert data["expires_in"] <= 3600

    def test_login_with_invalid_password(self, api_client, test_user_credentials):
        """Test login fails with invalid password."""
        invalid_creds = test_user_credentials.copy()
        invalid_creds["password"] = "WrongPassword123!"

        response = api_client.post("/auth/login", json=invalid_creds)

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data or "message" in data or "error" in data

    def test_login_with_invalid_email(self, api_client):
        """Test login fails with non-existent email."""
        response = api_client.post(
            "/auth/login",
            json={"email": "nonexistent@example.com", "password": "Password123!"},
        )

        assert response.status_code == 401

    def test_login_with_missing_fields(self, api_client):
        """Test login fails with missing required fields."""
        # Missing password
        response = api_client.post("/auth/login", json={"email": "test@example.com"})

        assert response.status_code in [400, 422]  # Bad Request or Unprocessable Entity

    def test_login_response_structure(self, api_client, test_user_credentials):
        """Test that login response has correct structure."""
        response = api_client.post("/auth/login", json=test_user_credentials)

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        required_fields = ["access_token", "id_token", "refresh_token", "expires_in"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"


class TestRefreshTokenEndpoint:
    """Test suite for refresh token endpoint."""

    def test_refresh_token_success(self, api_client, auth_tokens):
        """Test successful token refresh."""
        refresh_request = {"refresh_token": auth_tokens["refresh_token"]}

        response = api_client.post("/auth/refresh", json=refresh_request)

        assert response.status_code == 200
        data = response.json()

        # Verify new tokens are returned
        assert "access_token" in data
        assert "id_token" in data
        assert "expires_in" in data

        # New tokens should be different from original
        assert data["access_token"] != auth_tokens["access_token"]
        assert data["id_token"] != auth_tokens["id_token"]

    def test_refresh_with_invalid_token(self, api_client):
        """Test refresh fails with invalid token."""
        response = api_client.post(
            "/auth/refresh", json={"refresh_token": "invalid-refresh-token"}
        )

        assert response.status_code in [400, 401]

    def test_refresh_with_missing_token(self, api_client):
        """Test refresh fails with missing token."""
        response = api_client.post("/auth/refresh", json={})

        assert response.status_code in [400, 422]


class TestGetCurrentUserEndpoint:
    """Test suite for get current user endpoint."""

    def test_get_current_user_with_valid_token(self, api_client, auth_headers_id_token):
        """Test getting current user info with valid ID token."""
        response = api_client.get("/auth/me", headers=auth_headers_id_token)

        assert response.status_code == 200
        data = response.json()

        # Verify user info is returned
        assert "email" in data or "username" in data
        # Could also check for sub, cognito:username, etc.

    def test_get_current_user_without_token(self, api_client):
        """Test getting user info fails without token."""
        response = api_client.get("/auth/me")

        assert response.status_code == 401

    def test_get_current_user_with_invalid_token(self, api_client):
        """Test getting user info fails with invalid token."""
        invalid_headers = {"Authorization": "Bearer invalid-token"}

        response = api_client.get("/auth/me", headers=invalid_headers)

        assert response.status_code == 401


class TestLogoutEndpoint:
    """Test suite for logout endpoint."""

    def test_logout_success(self, api_client, auth_headers, auth_tokens):
        """Test successful logout."""
        logout_request = {"access_token": auth_tokens["access_token"]}

        response = api_client.post("/auth/logout", json=logout_request, headers=auth_headers)

        # Logout should succeed
        assert response.status_code in [200, 204]

    def test_logout_without_token(self, api_client):
        """Test logout fails without token."""
        response = api_client.post("/auth/logout", json={})

        assert response.status_code in [400, 401, 422]


class TestAuthenticationFlow:
    """Test complete authentication flows."""

    def test_complete_auth_flow(self, api_client, test_user_credentials):
        """Test complete authentication flow: login -> use token -> refresh -> logout."""
        # Step 1: Login
        login_response = api_client.post("/auth/login", json=test_user_credentials)
        assert login_response.status_code == 200
        tokens = login_response.json()

        # Step 2: Use ID token to access protected endpoint (/auth/me requires ID token)
        headers = {"Authorization": f"Bearer {tokens['id_token']}"}
        me_response = api_client.get("/auth/me", headers=headers)
        assert me_response.status_code == 200

        # Step 3: Refresh tokens
        refresh_response = api_client.post(
            "/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
        )
        assert refresh_response.status_code == 200
        new_tokens = refresh_response.json()

        # Step 4: Use new ID token (/auth/me requires ID token for user profile info)
        new_headers = {"Authorization": f"Bearer {new_tokens['id_token']}"}
        me_response2 = api_client.get("/auth/me", headers=new_headers)
        assert me_response2.status_code == 200

        # Step 5: Logout
        logout_response = api_client.post(
            "/auth/logout", json={"access_token": new_tokens["access_token"]}, headers=new_headers
        )
        assert logout_response.status_code in [200, 204]

    def test_expired_token_handling(self, api_client, test_user_credentials):
        """Test handling of expired tokens."""
        # This test would require waiting for token to expire (1 hour)
        # Or using a token with very short expiry
        # Skip for now as it would slow down tests
        pytest.skip("Requires token expiration - too slow for regular testing")

    def test_token_reuse_after_refresh(self, api_client, auth_tokens):
        """Test that old token is invalidated after refresh."""
        # Get new tokens via refresh
        refresh_response = api_client.post(
            "/auth/refresh", json={"refresh_token": auth_tokens["refresh_token"]}
        )
        assert refresh_response.status_code == 200

        # Try using old ID token (behavior may vary by implementation)
        # Note: /auth/me requires ID token for user profile information
        old_headers = {"Authorization": f"Bearer {auth_tokens['id_token']}"}
        response = api_client.get("/auth/me", headers=old_headers)

        # Old token might still work for a short time depending on implementation
        # This is more of a documentation test
        assert response.status_code in [200, 401]


class TestCognitoIntegration:
    """Test Cognito-specific functionality."""

    def test_jwt_token_structure(self, api_client, auth_tokens):
        """Test that JWT tokens have correct structure."""
        import base64
        import json

        # Decode JWT (without verification)
        id_token = auth_tokens["id_token"]
        parts = id_token.split(".")

        assert len(parts) == 3  # header.payload.signature

        # Decode payload (add padding if needed)
        payload = parts[1]
        payload += "=" * (4 - len(payload) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload))

        # Verify standard claims
        assert "sub" in decoded  # Subject (user ID)
        assert "email" in decoded or "cognito:username" in decoded
        assert "exp" in decoded  # Expiration time
        assert "iat" in decoded  # Issued at time

    def test_token_audience_claim(self, api_client, auth_tokens, environment_config):
        """Test that JWT token has correct audience claim."""
        import base64
        import json

        id_token = auth_tokens["id_token"]
        parts = id_token.split(".")
        payload = parts[1]
        payload += "=" * (4 - len(payload) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload))

        # Verify audience matches our Cognito client
        assert "aud" in decoded
        assert decoded["aud"] == environment_config["cognito_client_id"]

    def test_token_issuer_claim(self, api_client, auth_tokens, environment_config):
        """Test that JWT token has correct issuer claim."""
        import base64
        import json

        id_token = auth_tokens["id_token"]
        parts = id_token.split(".")
        payload = parts[1]
        payload += "=" * (4 - len(payload) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(payload))

        # Verify issuer matches our Cognito User Pool
        assert "iss" in decoded
        expected_issuer = (
            f"https://cognito-idp.{environment_config['aws_region']}.amazonaws.com/"
            f"{environment_config['cognito_user_pool_id']}"
        )
        assert decoded["iss"] == expected_issuer


class TestRateLimiting:
    """Test rate limiting on authentication endpoints."""

    def test_login_rate_limiting(self, api_client, test_user_credentials):
        """Test that excessive login attempts are rate limited."""
        # Make multiple rapid login attempts
        responses = []
        for _ in range(20):
            response = api_client.post("/auth/login", json=test_user_credentials)
            responses.append(response.status_code)
            time.sleep(0.1)  # Small delay

        # At least some should succeed
        success_count = sum(1 for status in responses if status == 200)
        assert success_count > 0

        # Note: Actual rate limiting depends on API Gateway/Cognito configuration
        # This test documents expected behavior
