"""
End-to-end tests for complete authentication flows.

These tests verify the complete authentication flow from login to
token refresh to logout, simulating real user scenarios.
"""

from unittest.mock import Mock, patch

from botocore.exceptions import ClientError


class TestCompleteAuthenticationFlow:
    """Test complete authentication flow from login to logout."""

    @patch("src.api.auth.get_cognito_client")
    @patch("src.dependencies.extract_user_from_token")
    def test_login_get_user_logout_flow(self, mock_extract_user, mock_get_client, test_client):
        """Test complete flow: login -> get user info -> logout."""
        # Setup mocks
        mock_cognito = Mock()

        # Mock login response
        login_response = {
            "AuthenticationResult": {
                "AccessToken": "test-access-token",
                "IdToken": "test-id-token",
                "RefreshToken": "test-refresh-token",
                "ExpiresIn": 3600,
            }
        }
        mock_cognito.initiate_auth.return_value = login_response
        mock_cognito.admin_user_global_sign_out.return_value = {}
        mock_get_client.return_value = mock_cognito

        # Mock user extraction
        user_info = {
            "user_id": "test-user-123",
            "email": "test@example.com",
            "name": "Test User",
            "role": "owner",
            "email_verified": True,
        }
        mock_extract_user.return_value = user_info

        # Step 1: Login
        login_result = test_client.post(
            "/auth/login", json={"email": "test@example.com", "password": "Password123!"}
        )
        assert login_result.status_code == 200
        login_data = login_result.json()
        assert "access_token" in login_data
        assert "id_token" in login_data
        assert "refresh_token" in login_data
        id_token = login_data["id_token"]

        # Step 2: Get user info with token
        user_result = test_client.get("/auth/me", headers={"Authorization": f"Bearer {id_token}"})
        assert user_result.status_code == 200
        user_data = user_result.json()
        assert user_data["email"] == "test@example.com"
        assert user_data["role"] == "owner"

        # Step 3: Logout
        logout_result = test_client.post(
            "/auth/logout", headers={"Authorization": f"Bearer {id_token}"}
        )
        assert logout_result.status_code == 200
        assert logout_result.json()["message"] == "Logged out successfully"

    @patch("src.api.auth.get_cognito_client")
    def test_login_refresh_token_flow(self, mock_get_client, test_client):
        """Test complete flow: login -> refresh token."""
        # Setup mocks
        mock_cognito = Mock()

        # Mock login response
        login_response = {
            "AuthenticationResult": {
                "AccessToken": "original-access-token",
                "IdToken": "original-id-token",
                "RefreshToken": "refresh-token",
                "ExpiresIn": 3600,
            }
        }

        # Mock refresh response
        refresh_response = {
            "AuthenticationResult": {
                "AccessToken": "new-access-token",
                "IdToken": "new-id-token",
                "ExpiresIn": 3600,
            }
        }

        mock_cognito.initiate_auth.side_effect = [login_response, refresh_response]
        mock_get_client.return_value = mock_cognito

        # Step 1: Login
        login_result = test_client.post(
            "/auth/login", json={"email": "test@example.com", "password": "Password123!"}
        )
        assert login_result.status_code == 200
        login_data = login_result.json()
        refresh_token = login_data["refresh_token"]

        # Step 2: Refresh token
        refresh_result = test_client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert refresh_result.status_code == 200
        refresh_data = refresh_result.json()
        assert refresh_data["access_token"] == "new-access-token"
        assert refresh_data["id_token"] == "new-id-token"


class TestAuthenticationErrorScenarios:
    """Test error scenarios in authentication flow."""

    @patch("src.api.auth.get_cognito_client")
    def test_login_with_invalid_credentials_then_valid(self, mock_get_client, test_client):
        """Test login failure then success with correct credentials."""
        # Setup mocks
        mock_cognito = Mock()

        # First call: invalid credentials
        error_response = {"Error": {"Code": "NotAuthorizedException"}}
        invalid_error = ClientError(error_response, "InitiateAuth")

        # Second call: valid credentials
        success_response = {
            "AuthenticationResult": {
                "AccessToken": "test-access-token",
                "IdToken": "test-id-token",
                "RefreshToken": "test-refresh-token",
                "ExpiresIn": 3600,
            }
        }

        mock_cognito.initiate_auth.side_effect = [invalid_error, success_response]
        mock_get_client.return_value = mock_cognito

        # Step 1: Try with invalid credentials
        invalid_result = test_client.post(
            "/auth/login", json={"email": "test@example.com", "password": "WrongPassword"}
        )
        assert invalid_result.status_code == 401
        assert "Invalid email or password" in invalid_result.json()["error"]

        # Step 2: Try with valid credentials
        valid_result = test_client.post(
            "/auth/login", json={"email": "test@example.com", "password": "CorrectPassword123!"}
        )
        assert valid_result.status_code == 200
        assert "access_token" in valid_result.json()

    @patch("src.api.auth.get_cognito_client")
    def test_expired_refresh_token_requires_relogin(self, mock_get_client, test_client):
        """Test that expired refresh token requires user to log in again."""
        # Setup mocks
        mock_cognito = Mock()

        # Mock expired refresh token error
        error_response = {"Error": {"Code": "NotAuthorizedException"}}
        mock_cognito.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_get_client.return_value = mock_cognito

        # Try to refresh with expired token
        refresh_result = test_client.post(
            "/auth/refresh", json={"refresh_token": "expired-refresh-token"}
        )
        assert refresh_result.status_code == 401
        assert "Refresh token expired or invalid" in refresh_result.json()["error"]

    @patch("src.dependencies.extract_user_from_token")
    def test_access_protected_route_without_token(self, mock_extract_user, test_client):
        """Test accessing protected route without authentication token."""
        # Try to access protected route without token
        result = test_client.get("/auth/me")

        assert result.status_code == 401

    @patch("src.dependencies.extract_user_from_token")
    def test_access_protected_route_with_invalid_token(self, mock_extract_user, test_client):
        """Test accessing protected route with invalid token."""
        # Mock invalid token
        mock_extract_user.return_value = None

        # Try to access protected route with invalid token
        result = test_client.get("/auth/me", headers={"Authorization": "Bearer invalid.token"})

        assert result.status_code == 401
        assert "Invalid or expired token" in result.json()["error"]


class TestTokenExpirationScenarios:
    """Test token expiration and refresh scenarios."""

    @patch("src.api.auth.get_cognito_client")
    @patch("src.dependencies.extract_user_from_token")
    def test_access_token_expires_refresh_continues(
        self, mock_extract_user, mock_get_client, test_client
    ):
        """Test that when access token expires, refresh token allows continuation."""
        # Setup mocks
        mock_cognito = Mock()

        # Mock refresh response
        refresh_response = {
            "AuthenticationResult": {
                "AccessToken": "new-access-token",
                "IdToken": "new-id-token",
                "ExpiresIn": 3600,
            }
        }
        mock_cognito.initiate_auth.return_value = refresh_response
        mock_get_client.return_value = mock_cognito

        # First call: simulate expired token
        # Second call: simulate new valid token
        user_info = {
            "user_id": "test-user-123",
            "email": "test@example.com",
            "name": "Test User",
            "role": "owner",
            "email_verified": True,
        }
        mock_extract_user.side_effect = [None, user_info]

        # Step 1: Try with expired access token
        expired_result = test_client.get(
            "/auth/me", headers={"Authorization": "Bearer expired.access.token"}
        )
        assert expired_result.status_code == 401

        # Step 2: Refresh token
        refresh_result = test_client.post(
            "/auth/refresh", json={"refresh_token": "valid-refresh-token"}
        )
        assert refresh_result.status_code == 200
        new_id_token = refresh_result.json()["id_token"]

        # Step 3: Access with new token
        success_result = test_client.get(
            "/auth/me", headers={"Authorization": f"Bearer {new_id_token}"}
        )
        assert success_result.status_code == 200
        assert success_result.json()["email"] == "test@example.com"


class TestMultipleUserSessions:
    """Test scenarios with multiple user sessions."""

    @patch("src.api.auth.get_cognito_client")
    @patch("src.dependencies.extract_user_from_token")
    def test_owner_and_visitor_sessions(self, mock_extract_user, mock_get_client, test_client):
        """Test that owner and visitor have different access levels."""
        # Setup mocks
        mock_cognito = Mock()

        owner_login_response = {
            "AuthenticationResult": {
                "AccessToken": "owner-access-token",
                "IdToken": "owner-id-token",
                "RefreshToken": "owner-refresh-token",
                "ExpiresIn": 3600,
            }
        }

        visitor_login_response = {
            "AuthenticationResult": {
                "AccessToken": "visitor-access-token",
                "IdToken": "visitor-id-token",
                "RefreshToken": "visitor-refresh-token",
                "ExpiresIn": 3600,
            }
        }

        mock_cognito.initiate_auth.side_effect = [owner_login_response, visitor_login_response]
        mock_get_client.return_value = mock_cognito

        # Mock user extraction for owner and visitor
        owner_info = {
            "user_id": "owner-123",
            "email": "owner@example.com",
            "name": "Owner User",
            "role": "owner",
            "email_verified": True,
        }

        visitor_info = {
            "user_id": "visitor-456",
            "email": "visitor@example.com",
            "name": "Visitor User",
            "role": "visitor",
            "email_verified": True,
        }

        mock_extract_user.side_effect = [owner_info, visitor_info]

        # Step 1: Owner login
        owner_login = test_client.post(
            "/auth/login", json={"email": "owner@example.com", "password": "OwnerPassword123!"}
        )
        assert owner_login.status_code == 200
        owner_token = owner_login.json()["id_token"]

        # Step 2: Get owner info
        owner_me = test_client.get("/auth/me", headers={"Authorization": f"Bearer {owner_token}"})
        assert owner_me.status_code == 200
        assert owner_me.json()["role"] == "owner"

        # Step 3: Visitor login
        visitor_login = test_client.post(
            "/auth/login", json={"email": "visitor@example.com", "password": "VisitorPassword123!"}
        )
        assert visitor_login.status_code == 200
        visitor_token = visitor_login.json()["id_token"]

        # Step 4: Get visitor info
        visitor_me = test_client.get(
            "/auth/me", headers={"Authorization": f"Bearer {visitor_token}"}
        )
        assert visitor_me.status_code == 200
        assert visitor_me.json()["role"] == "visitor"


class TestAuthFlowEdgeCases:
    """Test edge cases in authentication flow."""

    @patch("src.api.auth.get_cognito_client")
    def test_rate_limiting_then_success(self, mock_get_client, test_client):
        """Test rate limiting error followed by successful retry."""
        # Setup mocks
        mock_cognito = Mock()

        # First call: rate limited
        error_response = {"Error": {"Code": "TooManyRequestsException"}}
        rate_limit_error = ClientError(error_response, "InitiateAuth")

        # Second call: success
        success_response = {
            "AuthenticationResult": {
                "AccessToken": "test-access-token",
                "IdToken": "test-id-token",
                "RefreshToken": "test-refresh-token",
                "ExpiresIn": 3600,
            }
        }

        mock_cognito.initiate_auth.side_effect = [rate_limit_error, success_response]
        mock_get_client.return_value = mock_cognito

        # Step 1: First attempt - rate limited
        rate_limited = test_client.post(
            "/auth/login", json={"email": "test@example.com", "password": "Password123!"}
        )
        assert rate_limited.status_code == 429
        assert "Too many requests" in rate_limited.json()["error"]

        # Step 2: Retry - success
        success = test_client.post(
            "/auth/login", json={"email": "test@example.com", "password": "Password123!"}
        )
        assert success.status_code == 200
        assert "access_token" in success.json()

    def test_malformed_request_bodies(self, test_client):
        """Test handling of malformed request bodies."""
        # Missing email
        result1 = test_client.post("/auth/login", json={"password": "Password123!"})
        assert result1.status_code == 422

        # Missing password
        result2 = test_client.post("/auth/login", json={"email": "test@example.com"})
        assert result2.status_code == 422

        # Invalid email format
        result3 = test_client.post(
            "/auth/login", json={"email": "not-an-email", "password": "Password123!"}
        )
        assert result3.status_code == 422

        # Missing refresh token
        result4 = test_client.post("/auth/refresh", json={})
        assert result4.status_code == 422
