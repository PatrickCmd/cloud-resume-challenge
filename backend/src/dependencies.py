"""
FastAPI dependency injection functions.

Provides reusable dependencies for authentication, authorization,
database connections, and service layer initialization.
"""

from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.config import settings
from src.utils.jwt import extract_user_from_token
from src.utils.errors import ForbiddenException

# Security scheme for JWT Bearer tokens
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> dict:
    """
    Dependency to extract and validate the current user from JWT token.

    Following AUTHENTICATION.md lines 353-374:
    - Extracts JWT token from Authorization header
    - Validates token signature with Cognito public keys
    - Extracts and returns user claims

    Args:
        credentials: Bearer token from Authorization header

    Returns:
        User information extracted from JWT token

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials

    # Validate and decode JWT token
    user = extract_user_from_token(token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_optional(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(optional_security)]
) -> Optional[dict]:
    """
    Optional authentication dependency.

    Following AUTHENTICATION.md lines 290-301:
    - Returns user if valid token provided
    - Returns None if no token or invalid token
    - Used for endpoints with optional authentication (different data for owner)

    Args:
        credentials: Optional Bearer token from Authorization header

    Returns:
        User information if valid token, None otherwise
    """
    if not credentials:
        return None

    token = credentials.credentials
    user = extract_user_from_token(token)

    return user


async def require_owner_role(
    current_user: Annotated[dict, Depends(get_current_user)]
) -> dict:
    """
    Dependency to require owner role for protected endpoints.

    Following AUTHENTICATION.md lines 303-313:
    - Requires valid JWT token
    - Checks if user has 'owner' role
    - Raises 403 if not owner

    Args:
        current_user: Current authenticated user

    Returns:
        User information if role is 'owner'

    Raises:
        HTTPException: If user doesn't have owner role
    """
    user_role = current_user.get("role", "")

    if user_role != "owner":
        raise ForbiddenException("Owner role required for this operation")

    return current_user


def get_dynamodb_client():
    """
    Dependency to get DynamoDB client.

    Returns:
        Configured boto3 DynamoDB client
    """
    # TODO: Implement DynamoDB client initialization
    # TODO: Use boto3.resource('dynamodb') with proper configuration
    pass


def get_dynamodb_table():
    """
    Dependency to get DynamoDB table resource.

    Returns:
        DynamoDB table resource for the portfolio data table
    """
    # TODO: Implement table resource initialization
    # TODO: Return table from get_dynamodb_client()
    pass
