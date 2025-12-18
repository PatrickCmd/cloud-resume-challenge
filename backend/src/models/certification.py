"""
Certification data models.

Defines all Pydantic models for certifications including:
- API request/response models
- Internal DynamoDB model
"""

from typing import Optional
from pydantic import BaseModel, Field, HttpUrl
from datetime import date, datetime


# API Request Models

class CertificationCreate(BaseModel):
    """Certification creation request model."""
    title: str = Field(..., min_length=1, max_length=200)
    issuer: str = Field(..., min_length=1, max_length=200)
    issue_date: date
    expiry_date: Optional[date] = None
    credential_id: Optional[str] = None
    credential_url: Optional[HttpUrl] = None


class CertificationUpdate(BaseModel):
    """Certification update request model."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    issuer: Optional[str] = Field(None, min_length=1, max_length=200)
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    credential_id: Optional[str] = None
    credential_url: Optional[HttpUrl] = None


# API Response Models

class CertificationResponse(BaseModel):
    """Certification API response model."""
    cert_id: str
    title: str
    issuer: str
    issue_date: date
    expiry_date: Optional[date]
    credential_id: Optional[str]
    credential_url: Optional[str]
    created_at: datetime
    updated_at: datetime


# Internal DynamoDB Model

class Certification(BaseModel):
    """Certification internal model for DynamoDB."""

    # Primary Key
    pk: str = Field(..., description="Partition key: CERT#<cert_id>")
    sk: str = Field(..., description="Sort key: CERT#<cert_id>")

    # GSI Keys
    gsi1_pk: str = Field(..., description="GSI1 PK: CERTIFICATIONS")
    gsi1_sk: str = Field(..., description="GSI1 SK: <issue_date>#<cert_id>")

    # Entity Type
    entity_type: str = Field(default="certification", description="Entity type identifier")

    # Attributes
    cert_id: str = Field(..., description="Unique certification identifier (UUID)")
    title: str = Field(..., min_length=1, max_length=200, description="Certification title")
    issuer: str = Field(..., min_length=1, max_length=200, description="Issuing organization")
    issue_date: date = Field(..., description="Date certification was issued")
    expiry_date: Optional[date] = Field(None, description="Expiry date (if applicable)")
    credential_id: Optional[str] = Field(None, description="Credential/certificate ID")
    credential_url: Optional[str] = Field(None, description="Verification URL")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "pk": "CERT#123e4567-e89b-12d3-a456-426614174000",
                "sk": "CERT#123e4567-e89b-12d3-a456-426614174000",
                "gsi1_pk": "CERTIFICATIONS",
                "gsi1_sk": "2025-01-01#123e4567-e89b-12d3-a456-426614174000",
                "entity_type": "certification",
                "cert_id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "AWS Certified Solutions Architect - Professional",
                "issuer": "Amazon Web Services",
                "issue_date": "2025-01-01",
                "expiry_date": "2028-01-01",
                "credential_id": "ABC-DEF-123",
                "credential_url": "https://aws.amazon.com/verification/ABC-DEF-123",
            }
        }
