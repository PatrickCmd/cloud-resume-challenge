"""
Certification data models.

Defines all Pydantic models for certifications including:
- API request/response models
- Internal DynamoDB model
"""

from pydantic import BaseModel, Field, HttpUrl

# API Request Models


class CertificationCreate(BaseModel):
    """Certification creation request model."""

    name: str = Field(..., min_length=1, max_length=200)
    issuer: str = Field(..., min_length=1, max_length=200)
    icon: str | None = Field(None, description="Icon identifier or URL")
    type: str = Field("certification", description="Type: certification or course")
    featured: bool = False
    description: str | None = None
    credentialUrl: HttpUrl | None = None
    dateEarned: str | None = Field(None, description="ISO 8601 date when earned")


class CertificationUpdate(BaseModel):
    """Certification update request model."""

    name: str | None = Field(None, min_length=1, max_length=200)
    issuer: str | None = Field(None, min_length=1, max_length=200)
    icon: str | None = None
    type: str | None = Field(None, description="Type: certification or course")
    featured: bool | None = None
    description: str | None = None
    credentialUrl: HttpUrl | None = None
    dateEarned: str | None = None


# API Response Models


class CertificationResponse(BaseModel):
    """Certification API response model."""

    id: str
    name: str
    issuer: str
    icon: str | None
    type: str
    featured: bool
    status: str = Field(..., description="Publication status: DRAFT or PUBLISHED")
    description: str | None
    credentialUrl: str | None
    dateEarned: str
    createdAt: str = Field(..., description="ISO 8601 timestamp")
    updatedAt: str = Field(..., description="ISO 8601 timestamp")


class CertificationListResponse(BaseModel):
    """Certification list response with pagination."""

    items: list[CertificationResponse]
    count: int
    lastEvaluatedKey: dict | None = Field(None, description="Pagination token for next page")
