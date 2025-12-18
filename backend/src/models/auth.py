"""
Authentication data models.

Defines all Pydantic models for authentication including:
- API request/response models
- User information models
"""

from pydantic import BaseModel, EmailStr


# API Request Models

class LoginRequest(BaseModel):
    """Login request model."""
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request model."""
    refresh_token: str


# API Response Models

class LoginResponse(BaseModel):
    """Login response model with JWT tokens."""
    access_token: str
    id_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class UserInfoResponse(BaseModel):
    """User information response model."""
    user_id: str
    email: str
    name: str
    role: str
    email_verified: bool


# Internal Models

class TokenPayload(BaseModel):
    """JWT token payload model."""
    sub: str  # User ID (Cognito sub)
    email: str
    name: str
    role: str
    email_verified: bool
    iat: int  # Issued at timestamp
    exp: int  # Expiration timestamp
    iss: str  # Issuer (Cognito User Pool)
    aud: str  # Audience (Client ID)
