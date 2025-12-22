"""
Certification data models.

Defines all Pydantic models for certifications including:
- API request/response models
- Internal DynamoDB model
"""

from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl


# API Request Models

class CertificationCreate(BaseModel):
    """Certification creation request model."""
    name: str = Field(..., min_length=1, max_length=200)
    issuer: str = Field(..., min_length=1, max_length=200)
    icon: Optional[str] = Field(None, description="Icon identifier or URL")
    type: str = Field("certification", description="Type: certification or course")
    featured: bool = False
    description: Optional[str] = None
    credentialUrl: Optional[HttpUrl] = None
    dateEarned: Optional[str] = Field(None, description="ISO 8601 date when earned")


class CertificationUpdate(BaseModel):
    """Certification update request model."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    issuer: Optional[str] = Field(None, min_length=1, max_length=200)
    icon: Optional[str] = None
    type: Optional[str] = Field(None, description="Type: certification or course")
    featured: Optional[bool] = None
    description: Optional[str] = None
    credentialUrl: Optional[HttpUrl] = None
    dateEarned: Optional[str] = None


# API Response Models

class CertificationResponse(BaseModel):
    """Certification API response model."""
    id: str
    name: str
    issuer: str
    icon: Optional[str]
    type: str
    featured: bool
    status: str = Field(..., description="Publication status: DRAFT or PUBLISHED")
    description: Optional[str]
    credentialUrl: Optional[str]
    dateEarned: str
    createdAt: str = Field(..., description="ISO 8601 timestamp")
    updatedAt: str = Field(..., description="ISO 8601 timestamp")


class CertificationListResponse(BaseModel):
    """Certification list response with pagination."""
    items: List[CertificationResponse]
    count: int
    lastEvaluatedKey: Optional[dict] = Field(None, description="Pagination token for next page")


