"""
Authentication API endpoints.

Handles user authentication, token refresh, and user profile management.
"""

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Annotated

from src.models.auth import LoginRequest, LoginResponse, RefreshTokenRequest, UserInfoResponse
from src.config import settings
from src.dependencies import get_current_user
from src.utils.errors import UnauthorizedException, ValidationException

router = APIRouter()


def get_cognito_client():
    """Get Cognito Identity Provider client."""
    return boto3.client(
        "cognito-idp",
        region_name=settings.cognito_region,
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate user with email and password.

    Returns JWT tokens (access, id, refresh) from Cognito.

    Following AUTHENTICATION.md lines 419-458:
    - Uses USER_PASSWORD_AUTH flow
    - Returns IdToken, AccessToken, and RefreshToken
    - Handles various Cognito error responses
    """
    try:
        cognito = get_cognito_client()

        # Initiate authentication with Cognito
        response = cognito.initiate_auth(
            AuthFlow="USER_PASSWORD_AUTH",
            ClientId=settings.cognito_client_id,
            AuthParameters={
                "USERNAME": request.email,
                "PASSWORD": request.password,
            }
        )

        # Extract tokens from response
        auth_result = response.get("AuthenticationResult")

        if not auth_result:
            raise UnauthorizedException("Authentication failed")

        # Return tokens to frontend
        return LoginResponse(
            access_token=auth_result["AccessToken"],
            id_token=auth_result["IdToken"],
            refresh_token=auth_result["RefreshToken"],
            token_type="Bearer",
            expires_in=auth_result["ExpiresIn"]
        )

    except ClientError as e:
        error_code = e.response["Error"]["Code"]

        # Map Cognito errors to appropriate HTTP responses
        # Following AUTHENTICATION.md lines 454-458
        if error_code == "NotAuthorizedException":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        elif error_code == "UserNotConfirmedException":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified"
            )
        elif error_code == "UserNotFoundException":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        elif error_code == "InvalidParameterException":
            raise ValidationException("Invalid email or password format")
        elif error_code == "TooManyRequestsException":
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests, please try again later"
            )
        else:
            # Log the actual error for debugging
            print(f"Cognito error: {error_code} - {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    except Exception as e:
        print(f"Unexpected error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token.

    Returns new access and id tokens.

    Following AUTHENTICATION.md lines 528-563:
    - Uses REFRESH_TOKEN_AUTH flow
    - Returns new IdToken and AccessToken
    - May return new RefreshToken
    """
    try:
        cognito = get_cognito_client()

        # Refresh tokens with Cognito
        response = cognito.initiate_auth(
            AuthFlow="REFRESH_TOKEN_AUTH",
            ClientId=settings.cognito_client_id,
            AuthParameters={
                "REFRESH_TOKEN": request.refresh_token,
            }
        )

        auth_result = response.get("AuthenticationResult")

        if not auth_result:
            raise UnauthorizedException("Token refresh failed")

        # Note: Cognito may or may not return a new refresh token
        refresh_token = auth_result.get("RefreshToken", request.refresh_token)

        return LoginResponse(
            access_token=auth_result["AccessToken"],
            id_token=auth_result["IdToken"],
            refresh_token=refresh_token,
            token_type="Bearer",
            expires_in=auth_result["ExpiresIn"]
        )

    except ClientError as e:
        error_code = e.response["Error"]["Code"]

        if error_code == "NotAuthorizedException":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired or invalid"
            )
        else:
            print(f"Cognito refresh error: {error_code} - {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    except Exception as e:
        print(f"Unexpected error during token refresh: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/logout")
async def logout(current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Logout user and invalidate tokens.

    Following AUTHENTICATION.md lines 460-487:
    - Requires valid JWT token
    - Calls Cognito GlobalSignOut to invalidate all tokens
    - Frontend should clear stored tokens

    Note: With JWT, actual logout requires token revocation on client side.
    This endpoint calls GlobalSignOut for audit logging and security.
    """
    try:
        cognito = get_cognito_client()

        # Extract access token from user context
        # In production, the access token should be passed from the Lambda event
        # For now, we'll use the IdToken's sub (user ID) to sign out

        # Global sign out - invalidates all tokens for the user
        cognito.admin_user_global_sign_out(
            UserPoolId=settings.cognito_user_pool_id,
            Username=current_user["email"]
        )

        return {"message": "Logged out successfully"}

    except ClientError as e:
        # Even if global sign out fails, return success
        # Frontend will clear tokens anyway
        print(f"Cognito logout error: {str(e)}")
        return {"message": "Logged out successfully"}
    except Exception as e:
        print(f"Unexpected error during logout: {str(e)}")
        return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserInfoResponse)
async def get_current_user_info(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """
    Get current authenticated user information.

    Following AUTHENTICATION.md lines 489-515:
    - Requires valid JWT token in Authorization header
    - Extracts user info from JWT claims (done by dependency)
    - Returns user profile

    Requires valid JWT token in Authorization header.
    """
    # User info already extracted from JWT by dependency
    return UserInfoResponse(
        user_id=current_user["user_id"],
        email=current_user["email"],
        name=current_user.get("name", ""),
        role=current_user.get("role", ""),
        email_verified=current_user.get("email_verified", False)
    )
