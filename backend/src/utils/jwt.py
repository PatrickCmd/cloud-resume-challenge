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

    Returns:
        Dictionary of Cognito public keys (JWKs)
    """
    # TODO: Implement fetching Cognito JWKS
    # URL format: https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json
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

    Args:
        token: JWT token string

    Returns:
        Decoded token claims if valid, None otherwise
    """
    # TODO: Implement JWT token validation
    # 1. Fetch public keys from Cognito
    # 2. Verify token signature
    # 3. Verify token expiration
    # 4. Verify token issuer
    # 5. Return decoded claims

    try:
        # Get public keys
        jwks = get_cognito_public_keys()

        # Decode token header to get kid (key ID)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Find matching key
        key = None
        for jwk in jwks.get("keys", []):
            if jwk.get("kid") == kid:
                key = jwk
                break

        if not key:
            raise JWTError("Public key not found")

        # Verify and decode token
        claims = jwt.decode(
            token,
            key,
            algorithms=[settings.jwt_algorithm],
            audience=settings.cognito_client_id,
            issuer=settings.jwt_issuer,
        )

        return claims

    except JWTError as e:
        # Log error in production
        return None


def extract_user_from_token(token: str) -> Optional[Dict]:
    """
    Extract user information from JWT token.

    Args:
        token: JWT token string

    Returns:
        Dictionary with user information (sub, email, role, etc.)
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
