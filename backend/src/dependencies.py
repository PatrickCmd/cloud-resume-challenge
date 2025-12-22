"""
FastAPI dependency injection functions.

Provides reusable dependencies for authentication, authorization,
database connections, and service layer initialization.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.config import settings
from src.utils.errors import ForbiddenException
from src.utils.jwt import extract_user_from_token

# Security scheme for JWT Bearer tokens
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> dict:
    """
    Dependency to extract and validate the current user from JWT token.

    Following docs/AUTHENTICATION.md lines 353-374:
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
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(optional_security)],
) -> dict | None:
    """
    Optional authentication dependency.

    Following docs/AUTHENTICATION.md lines 290-301:
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


async def require_owner_role(current_user: Annotated[dict, Depends(get_current_user)]) -> dict:
    """
    Dependency to require owner role for protected endpoints.

    Following docs/AUTHENTICATION.md lines 303-313:
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


def get_dynamodb_resource():
    """
    Dependency to get DynamoDB resource.

    Returns:
        Configured boto3 DynamoDB resource
    """
    import boto3

    # Configure DynamoDB resource based on environment
    if settings.dynamodb_endpoint:
        # Local DynamoDB
        resource = boto3.resource(
            "dynamodb",
            endpoint_url=settings.dynamodb_endpoint,
            region_name=settings.aws_region,
            aws_access_key_id="test",
            aws_secret_access_key="test",
        )
    else:
        # AWS DynamoDB
        resource = boto3.resource("dynamodb", region_name=settings.aws_region)

    return resource


def get_dynamodb_table():
    """
    Dependency to get DynamoDB table resource.

    Returns:
        DynamoDB table resource for the portfolio data table
    """
    resource = get_dynamodb_resource()
    return resource.Table(settings.dynamodb_table_name)


# Repository Dependencies


def get_blog_repository():
    """
    Dependency to get BlogRepository instance.

    Returns:
        BlogRepository instance
    """
    from src.repositories.blog import BlogRepository

    table = get_dynamodb_table()
    return BlogRepository(table)


def get_project_repository():
    """
    Dependency to get ProjectRepository instance.

    Returns:
        ProjectRepository instance
    """
    from src.repositories.project import ProjectRepository

    table = get_dynamodb_table()
    return ProjectRepository(table)


def get_certification_repository():
    """
    Dependency to get CertificationRepository instance.

    Returns:
        CertificationRepository instance
    """
    from src.repositories.certification import CertificationRepository

    table = get_dynamodb_table()
    return CertificationRepository(table)


def get_visitor_repository():
    """
    Dependency to get VisitorRepository instance.

    Returns:
        VisitorRepository instance
    """
    from src.repositories.visitor import VisitorRepository

    table = get_dynamodb_table()
    return VisitorRepository(table)


def get_analytics_repository():
    """
    Dependency to get AnalyticsRepository instance.

    Returns:
        AnalyticsRepository instance
    """
    from src.repositories.analytics import AnalyticsRepository

    table = get_dynamodb_table()
    return AnalyticsRepository(table)
