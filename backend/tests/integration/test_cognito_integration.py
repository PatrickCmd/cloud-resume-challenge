"""
Integration tests for AWS Cognito integration.

These tests verify the integration between the API and AWS Cognito,
focusing on authentication flows and token management.
"""

from unittest.mock import Mock, patch

import pytest
from botocore.exceptions import ClientError

from src.api.auth import get_cognito_client
from src.config import settings


class TestCognitoClientInitialization:
    """Test Cognito client initialization and configuration."""

    def test_get_cognito_client_initialization(self):
        """Test that Cognito client is properly initialized."""
        client = get_cognito_client()

        assert client is not None
        assert hasattr(client, "initiate_auth")
        assert hasattr(client, "admin_user_global_sign_out")

    @patch("boto3.client")
    def test_cognito_client_region_configuration(self, mock_boto_client):
        """Test that Cognito client uses correct region configuration."""
        mock_client = Mock()
        mock_boto_client.return_value = mock_client

        client = get_cognito_client()

        # Verify boto3.client was called with correct parameters
        mock_boto_client.assert_called_once_with("cognito-idp", region_name=settings.cognito_region)


class TestCognitoAuthenticationFlow:
    """Test Cognito authentication flows."""

    @patch("boto3.client")
    def test_initiate_auth_with_valid_parameters(self, mock_boto_client):
        """Test InitiateAuth call with valid parameters."""
        # Setup mock
        mock_client = Mock()
        mock_auth_response = {
            "AuthenticationResult": {
                "AccessToken": "test-access-token",
                "IdToken": "test-id-token",
                "RefreshToken": "test-refresh-token",
                "ExpiresIn": 3600,
            }
        }
        mock_client.initiate_auth.return_value = mock_auth_response
        mock_boto_client.return_value = mock_client

        # Execute
        client = get_cognito_client()
        response = client.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            ClientId=settings.cognito_client_id,
            AuthParameters={"USERNAME": "test@example.com", "PASSWORD": "TestPassword123!"},
        )

        # Verify
        assert response == mock_auth_response
        assert "AuthenticationResult" in response
        assert "AccessToken" in response["AuthenticationResult"]
        assert "IdToken" in response["AuthenticationResult"]
        assert "RefreshToken" in response["AuthenticationResult"]

        # Verify initiate_auth was called with correct parameters
        mock_client.initiate_auth.assert_called_once_with(
            AuthFlow="USER_PASSWORD_AUTH",
            ClientId=settings.cognito_client_id,
            AuthParameters={"USERNAME": "test@example.com", "PASSWORD": "TestPassword123!"},
        )

    @patch("boto3.client")
    def test_initiate_auth_not_authorized_exception(self, mock_boto_client):
        """Test InitiateAuth with NotAuthorizedException."""
        # Setup mock
        mock_client = Mock()
        error_response = {
            "Error": {
                "Code": "NotAuthorizedException",
                "Message": "Incorrect username or password.",
            }
        }
        mock_client.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_boto_client.return_value = mock_client

        # Execute and verify
        client = get_cognito_client()
        with pytest.raises(ClientError) as exc_info:
            client.initiate_auth(
                AuthFlow="USER_PASSWORD_AUTH",
                ClientId=settings.cognito_client_id,
                AuthParameters={"USERNAME": "test@example.com", "PASSWORD": "WrongPassword"},
            )

        assert exc_info.value.response["Error"]["Code"] == "NotAuthorizedException"

    @patch("boto3.client")
    def test_initiate_auth_user_not_confirmed(self, mock_boto_client):
        """Test InitiateAuth with UserNotConfirmedException."""
        # Setup mock
        mock_client = Mock()
        error_response = {
            "Error": {"Code": "UserNotConfirmedException", "Message": "User is not confirmed."}
        }
        mock_client.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_boto_client.return_value = mock_client

        # Execute and verify
        client = get_cognito_client()
        with pytest.raises(ClientError) as exc_info:
            client.initiate_auth(
                AuthFlow="USER_PASSWORD_AUTH",
                ClientId=settings.cognito_client_id,
                AuthParameters={"USERNAME": "unconfirmed@example.com", "PASSWORD": "Password123!"},
            )

        assert exc_info.value.response["Error"]["Code"] == "UserNotConfirmedException"


class TestCognitoTokenRefresh:
    """Test Cognito token refresh flows."""

    @patch("boto3.client")
    def test_refresh_token_flow(self, mock_boto_client):
        """Test REFRESH_TOKEN_AUTH flow."""
        # Setup mock
        mock_client = Mock()
        mock_refresh_response = {
            "AuthenticationResult": {
                "AccessToken": "new-access-token",
                "IdToken": "new-id-token",
                "ExpiresIn": 3600,
            }
        }
        mock_client.initiate_auth.return_value = mock_refresh_response
        mock_boto_client.return_value = mock_client

        # Execute
        client = get_cognito_client()
        response = client.initiate_auth(
            AuthFlow="REFRESH_TOKEN_AUTH",
            ClientId=settings.cognito_client_id,
            AuthParameters={"REFRESH_TOKEN": "test-refresh-token"},
        )

        # Verify
        assert response == mock_refresh_response
        assert "AuthenticationResult" in response
        assert "AccessToken" in response["AuthenticationResult"]
        assert "IdToken" in response["AuthenticationResult"]

        # Verify initiate_auth was called with correct parameters
        mock_client.initiate_auth.assert_called_once_with(
            AuthFlow="REFRESH_TOKEN_AUTH",
            ClientId=settings.cognito_client_id,
            AuthParameters={"REFRESH_TOKEN": "test-refresh-token"},
        )

    @patch("boto3.client")
    def test_refresh_token_with_new_refresh_token(self, mock_boto_client):
        """Test token refresh that returns a new refresh token."""
        # Setup mock
        mock_client = Mock()
        mock_refresh_response = {
            "AuthenticationResult": {
                "AccessToken": "new-access-token",
                "IdToken": "new-id-token",
                "RefreshToken": "new-refresh-token",
                "ExpiresIn": 3600,
            }
        }
        mock_client.initiate_auth.return_value = mock_refresh_response
        mock_boto_client.return_value = mock_client

        # Execute
        client = get_cognito_client()
        response = client.initiate_auth(
            AuthFlow="REFRESH_TOKEN_AUTH",
            ClientId=settings.cognito_client_id,
            AuthParameters={"REFRESH_TOKEN": "old-refresh-token"},
        )

        # Verify new refresh token is included
        assert "RefreshToken" in response["AuthenticationResult"]
        assert response["AuthenticationResult"]["RefreshToken"] == "new-refresh-token"

    @patch("boto3.client")
    def test_refresh_token_expired(self, mock_boto_client):
        """Test token refresh with expired refresh token."""
        # Setup mock
        mock_client = Mock()
        error_response = {
            "Error": {"Code": "NotAuthorizedException", "Message": "Refresh Token has expired"}
        }
        mock_client.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_boto_client.return_value = mock_client

        # Execute and verify
        client = get_cognito_client()
        with pytest.raises(ClientError) as exc_info:
            client.initiate_auth(
                AuthFlow="REFRESH_TOKEN_AUTH",
                ClientId=settings.cognito_client_id,
                AuthParameters={"REFRESH_TOKEN": "expired-refresh-token"},
            )

        assert exc_info.value.response["Error"]["Code"] == "NotAuthorizedException"


class TestCognitoGlobalSignOut:
    """Test Cognito global sign out functionality."""

    @patch("boto3.client")
    def test_admin_global_sign_out_success(self, mock_boto_client):
        """Test successful admin global sign out."""
        # Setup mock
        mock_client = Mock()
        mock_client.admin_user_global_sign_out.return_value = {}
        mock_boto_client.return_value = mock_client

        # Execute
        client = get_cognito_client()
        response = client.admin_user_global_sign_out(
            UserPoolId=settings.cognito_user_pool_id, Username="test@example.com"
        )

        # Verify
        assert response == {}
        mock_client.admin_user_global_sign_out.assert_called_once_with(
            UserPoolId=settings.cognito_user_pool_id, Username="test@example.com"
        )

    @patch("boto3.client")
    def test_admin_global_sign_out_user_not_found(self, mock_boto_client):
        """Test global sign out with non-existent user."""
        # Setup mock
        mock_client = Mock()
        error_response = {
            "Error": {"Code": "UserNotFoundException", "Message": "User does not exist."}
        }
        mock_client.admin_user_global_sign_out.side_effect = ClientError(
            error_response, "AdminUserGlobalSignOut"
        )
        mock_boto_client.return_value = mock_client

        # Execute and verify
        client = get_cognito_client()
        with pytest.raises(ClientError) as exc_info:
            client.admin_user_global_sign_out(
                UserPoolId=settings.cognito_user_pool_id, Username="nonexistent@example.com"
            )

        assert exc_info.value.response["Error"]["Code"] == "UserNotFoundException"


class TestCognitoErrorHandling:
    """Test Cognito error handling and edge cases."""

    @patch("boto3.client")
    def test_too_many_requests_exception(self, mock_boto_client):
        """Test TooManyRequestsException handling."""
        # Setup mock
        mock_client = Mock()
        error_response = {"Error": {"Code": "TooManyRequestsException", "Message": "Rate exceeded"}}
        mock_client.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_boto_client.return_value = mock_client

        # Execute and verify
        client = get_cognito_client()
        with pytest.raises(ClientError) as exc_info:
            client.initiate_auth(
                AuthFlow="USER_PASSWORD_AUTH",
                ClientId=settings.cognito_client_id,
                AuthParameters={"USERNAME": "test@example.com", "PASSWORD": "Password123!"},
            )

        assert exc_info.value.response["Error"]["Code"] == "TooManyRequestsException"

    @patch("boto3.client")
    def test_invalid_parameter_exception(self, mock_boto_client):
        """Test InvalidParameterException handling."""
        # Setup mock
        mock_client = Mock()
        error_response = {
            "Error": {"Code": "InvalidParameterException", "Message": "Invalid parameters"}
        }
        mock_client.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_boto_client.return_value = mock_client

        # Execute and verify
        client = get_cognito_client()
        with pytest.raises(ClientError) as exc_info:
            client.initiate_auth(
                AuthFlow="USER_PASSWORD_AUTH",
                ClientId=settings.cognito_client_id,
                AuthParameters={"USERNAME": "invalid", "PASSWORD": "short"},
            )

        assert exc_info.value.response["Error"]["Code"] == "InvalidParameterException"

    @patch("boto3.client")
    def test_internal_error_exception(self, mock_boto_client):
        """Test InternalErrorException handling."""
        # Setup mock
        mock_client = Mock()
        error_response = {"Error": {"Code": "InternalErrorException", "Message": "Internal error"}}
        mock_client.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")
        mock_boto_client.return_value = mock_client

        # Execute and verify
        client = get_cognito_client()
        with pytest.raises(ClientError) as exc_info:
            client.initiate_auth(
                AuthFlow="USER_PASSWORD_AUTH",
                ClientId=settings.cognito_client_id,
                AuthParameters={"USERNAME": "test@example.com", "PASSWORD": "Password123!"},
            )

        assert exc_info.value.response["Error"]["Code"] == "InternalErrorException"
