"""
Unit tests for JWT utilities.

Tests the JWT validation functions including:
- Cognito public key fetching
- Token decoding and validation
- User extraction from tokens
"""

import pytest
from unittest.mock import patch, Mock
from jose import jwt, JWTError
from datetime import datetime, timedelta
import json

from src.utils.jwt import get_cognito_public_keys, decode_token, extract_user_from_token
from src.config import settings


# Test fixtures
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
def mock_valid_token_claims():
    """Mock valid JWT token claims."""
    return {
        "sub": "test-user-id-123",
        "email": "test@example.com",
        "name": "Test User",
        "custom:role": "owner",
        "email_verified": True,
        "aud": settings.cognito_client_id,
        "iss": settings.jwt_issuer,
        "exp": int((datetime.now() + timedelta(hours=1)).timestamp())
    }


@pytest.fixture
def mock_expired_token_claims():
    """Mock expired JWT token claims."""
    return {
        "sub": "test-user-id-123",
        "email": "test@example.com",
        "name": "Test User",
        "custom:role": "owner",
        "email_verified": True,
        "aud": settings.cognito_client_id,
        "iss": settings.jwt_issuer,
        "exp": int((datetime.now() - timedelta(hours=1)).timestamp())
    }


class TestGetCognitoPublicKeys:
    """Test suite for get_cognito_public_keys function."""

    @patch('src.utils.jwt.requests.get')
    def test_get_cognito_public_keys_success(self, mock_get, mock_jwks):
        """Test successful retrieval of Cognito public keys."""
        # Setup mock response
        mock_response = Mock()
        mock_response.json.return_value = mock_jwks
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        # Clear cache before test
        get_cognito_public_keys.cache_clear()

        # Execute
        result = get_cognito_public_keys()

        # Verify
        assert result == mock_jwks
        assert len(result["keys"]) == 2
        assert result["keys"][0]["kid"] == "test-key-id-1"

        # Verify correct URL was called
        expected_url = f"https://cognito-idp.{settings.cognito_region}.amazonaws.com/{settings.cognito_user_pool_id}/.well-known/jwks.json"
        mock_get.assert_called_once_with(expected_url, timeout=5)

    @patch('src.utils.jwt.requests.get')
    def test_get_cognito_public_keys_http_error(self, mock_get):
        """Test handling of HTTP errors when fetching public keys."""
        # Setup mock to raise HTTP error
        mock_get.side_effect = Exception("HTTP 404 Not Found")

        # Clear cache before test
        get_cognito_public_keys.cache_clear()

        # Execute and verify exception
        with pytest.raises(Exception) as exc_info:
            get_cognito_public_keys()

        assert "Failed to fetch Cognito public keys" in str(exc_info.value)

    @patch('src.utils.jwt.requests.get')
    def test_get_cognito_public_keys_caching(self, mock_get, mock_jwks):
        """Test that public keys are cached after first fetch."""
        # Setup mock response
        mock_response = Mock()
        mock_response.json.return_value = mock_jwks
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        # Clear cache before test
        get_cognito_public_keys.cache_clear()

        # First call
        result1 = get_cognito_public_keys()

        # Second call
        result2 = get_cognito_public_keys()

        # Verify
        assert result1 == result2
        # Should only call once due to caching
        assert mock_get.call_count == 1


class TestDecodeToken:
    """Test suite for decode_token function."""

    @patch('src.utils.jwt.get_cognito_public_keys')
    @patch('src.utils.jwt.jwt.get_unverified_header')
    @patch('src.utils.jwt.jwt.decode')
    def test_decode_token_valid(self, mock_decode, mock_header, mock_keys, mock_jwks, mock_valid_token_claims):
        """Test successful decoding of a valid JWT token."""
        # Setup mocks
        mock_keys.return_value = mock_jwks
        mock_header.return_value = {"kid": "test-key-id-1"}
        mock_decode.return_value = mock_valid_token_claims

        # Execute
        result = decode_token("valid.jwt.token")

        # Verify
        assert result == mock_valid_token_claims
        assert result["sub"] == "test-user-id-123"
        assert result["email"] == "test@example.com"

        # Verify jwt.decode was called with correct parameters
        mock_decode.assert_called_once()
        call_args = mock_decode.call_args
        assert call_args[1]["algorithms"] == [settings.jwt_algorithm]
        assert call_args[1]["audience"] == settings.cognito_client_id
        assert call_args[1]["issuer"] == settings.jwt_issuer

    @patch('src.utils.jwt.get_cognito_public_keys')
    @patch('src.utils.jwt.jwt.get_unverified_header')
    def test_decode_token_key_not_found(self, mock_header, mock_keys, mock_jwks):
        """Test handling when public key ID doesn't match any keys."""
        # Setup mocks
        mock_keys.return_value = mock_jwks
        mock_header.return_value = {"kid": "unknown-key-id"}

        # Execute
        result = decode_token("token.with.unknown.kid")

        # Verify
        assert result is None

    @patch('src.utils.jwt.get_cognito_public_keys')
    @patch('src.utils.jwt.jwt.get_unverified_header')
    @patch('src.utils.jwt.jwt.decode')
    def test_decode_token_expired(self, mock_decode, mock_header, mock_keys, mock_jwks):
        """Test handling of expired JWT token."""
        # Setup mocks
        mock_keys.return_value = mock_jwks
        mock_header.return_value = {"kid": "test-key-id-1"}
        mock_decode.side_effect = JWTError("Token is expired")

        # Execute
        result = decode_token("expired.jwt.token")

        # Verify
        assert result is None

    @patch('src.utils.jwt.get_cognito_public_keys')
    @patch('src.utils.jwt.jwt.get_unverified_header')
    @patch('src.utils.jwt.jwt.decode')
    def test_decode_token_invalid_signature(self, mock_decode, mock_header, mock_keys, mock_jwks):
        """Test handling of token with invalid signature."""
        # Setup mocks
        mock_keys.return_value = mock_jwks
        mock_header.return_value = {"kid": "test-key-id-1"}
        mock_decode.side_effect = JWTError("Signature verification failed")

        # Execute
        result = decode_token("invalid.signature.token")

        # Verify
        assert result is None

    @patch('src.utils.jwt.get_cognito_public_keys')
    @patch('src.utils.jwt.jwt.get_unverified_header')
    @patch('src.utils.jwt.jwt.decode')
    def test_decode_token_wrong_issuer(self, mock_decode, mock_header, mock_keys, mock_jwks):
        """Test handling of token with wrong issuer."""
        # Setup mocks
        mock_keys.return_value = mock_jwks
        mock_header.return_value = {"kid": "test-key-id-1"}
        mock_decode.side_effect = JWTError("Invalid issuer")

        # Execute
        result = decode_token("wrong.issuer.token")

        # Verify
        assert result is None

    @patch('src.utils.jwt.get_cognito_public_keys')
    @patch('src.utils.jwt.jwt.get_unverified_header')
    @patch('src.utils.jwt.jwt.decode')
    def test_decode_token_wrong_audience(self, mock_decode, mock_header, mock_keys, mock_jwks):
        """Test handling of token with wrong audience."""
        # Setup mocks
        mock_keys.return_value = mock_jwks
        mock_header.return_value = {"kid": "test-key-id-1"}
        mock_decode.side_effect = JWTError("Invalid audience")

        # Execute
        result = decode_token("wrong.audience.token")

        # Verify
        assert result is None


class TestExtractUserFromToken:
    """Test suite for extract_user_from_token function."""

    @patch('src.utils.jwt.decode_token')
    def test_extract_user_from_token_success(self, mock_decode, mock_valid_token_claims):
        """Test successful extraction of user information from token."""
        # Setup mock
        mock_decode.return_value = mock_valid_token_claims

        # Execute
        result = extract_user_from_token("valid.jwt.token")

        # Verify
        assert result is not None
        assert result["user_id"] == "test-user-id-123"
        assert result["email"] == "test@example.com"
        assert result["name"] == "Test User"
        assert result["role"] == "owner"
        assert result["email_verified"] is True

    @patch('src.utils.jwt.decode_token')
    def test_extract_user_from_token_invalid_token(self, mock_decode):
        """Test extraction from invalid token returns None."""
        # Setup mock
        mock_decode.return_value = None

        # Execute
        result = extract_user_from_token("invalid.jwt.token")

        # Verify
        assert result is None

    @patch('src.utils.jwt.decode_token')
    def test_extract_user_from_token_missing_custom_role(self, mock_decode):
        """Test extraction when custom:role attribute is missing."""
        # Setup mock with claims missing custom:role
        claims = {
            "sub": "test-user-id-123",
            "email": "test@example.com",
            "name": "Test User",
            "email_verified": True
        }
        mock_decode.return_value = claims

        # Execute
        result = extract_user_from_token("token.without.role")

        # Verify
        assert result is not None
        assert result["role"] == ""  # Should default to empty string
        assert result["user_id"] == "test-user-id-123"

    @patch('src.utils.jwt.decode_token')
    def test_extract_user_from_token_missing_email_verified(self, mock_decode):
        """Test extraction when email_verified is missing."""
        # Setup mock with claims missing email_verified
        claims = {
            "sub": "test-user-id-123",
            "email": "test@example.com",
            "name": "Test User",
            "custom:role": "owner"
        }
        mock_decode.return_value = claims

        # Execute
        result = extract_user_from_token("token.without.email.verified")

        # Verify
        assert result is not None
        assert result["email_verified"] is False  # Should default to False
        assert result["user_id"] == "test-user-id-123"

    @patch('src.utils.jwt.decode_token')
    def test_extract_user_from_token_minimal_claims(self, mock_decode):
        """Test extraction with minimal required claims."""
        # Setup mock with only required claims
        claims = {
            "sub": "test-user-id-123",
            "email": "test@example.com"
        }
        mock_decode.return_value = claims

        # Execute
        result = extract_user_from_token("minimal.token")

        # Verify
        assert result is not None
        assert result["user_id"] == "test-user-id-123"
        assert result["email"] == "test@example.com"
        assert result["name"] is None  # No default for name
        assert result["role"] == ""  # Defaults to empty string
        assert result["email_verified"] is False  # Defaults to False
