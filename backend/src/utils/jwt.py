"""
JWT token utilities.

Provides functions for validating and decoding JWT tokens from Cognito.
"""

from typing import Dict, Optional
from jose import jwt, JWTError
import requests
from functools import lru_cache

from src.config import settings


@lru_cache(maxsize=1)
def get_cognito_public_keys() -> Dict:
    """
    Fetch and cache Cognito public keys for JWT validation.

    Fetches JWKS from Cognito's well-known endpoint and caches the result.
    Following docs/AUTHENTICATION.md lines 222-230 for token validation.

    Returns:
        Dictionary of Cognito public keys (JWKs)

    Raises:
        Exception: If unable to fetch public keys from Cognito
    """
    jwks_url = f"https://cognito-idp.{settings.cognito_region}.amazonaws.com/{settings.cognito_user_pool_id}/.well-known/jwks.json"

    try:
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise Exception(f"Failed to fetch Cognito public keys: {str(e)}")


def decode_token(token: str) -> Optional[Dict]:
    """
    Decode and validate a JWT token from Cognito.

    Performs complete JWT validation following docs/AUTHENTICATION.md lines 221-231:
    1. Fetches public keys from Cognito JWKS endpoint
    2. Verifies token signature using the matching public key
    3. Validates token expiration (exp claim)
    4. Validates token issuer (iss claim)
    5. Validates token audience (aud claim)
    6. Returns decoded claims if all validations pass

    Args:
        token: JWT token string (IdToken from Cognito)

    Returns:
        Decoded token claims if valid, None if invalid or expired
    """
    try:
        # Fetch public keys from Cognito
        jwks = get_cognito_public_keys()

        # Extract key ID from token header
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find matching public key
        key = None
        for jwk in jwks.get("keys", []):
            if jwk.get("kid") == kid:
                key = jwk
                break

        if not key:
            raise JWTError("Public key not found")

        # Verify and decode token with full validation
        claims = jwt.decode(
            token,
            key,
            algorithms=[settings.jwt_algorithm],
            audience=settings.cognito_client_id,
            issuer=settings.jwt_issuer,
        )

        return claims

    except JWTError as e:
        # Token validation failed - invalid signature, expired, or wrong issuer/audience
        # In production, log this for security monitoring
        print(f"JWT validation failed: {str(e)}")
        return None


def extract_user_from_token(token: str) -> Optional[Dict]:
    """
    Extract user information from JWT token.

    Decodes and validates the JWT token, then extracts relevant user claims.
    Following docs/AUTHENTICATION.md lines 149-168 for ID token structure.

    Args:
        token: JWT token string (IdToken from Cognito)

    Returns:
        Dictionary with user information:
        - user_id: Cognito user ID (sub claim)
        - email: User email address
        - name: User display name
        - role: User role from custom:role attribute
        - email_verified: Whether email is verified

        Returns None if token is invalid or expired
    """
    claims = decode_token(token)

    if not claims:
        return None

    return {
        "user_id": claims.get("sub"),
        "email": claims.get("email"),
        "name": claims.get("name"),
        "role": claims.get("custom:role", ""),
        "email_verified": claims.get("email_verified", False),
    }
