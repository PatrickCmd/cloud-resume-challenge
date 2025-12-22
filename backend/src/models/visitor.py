"""
Visitor tracking data models.

Defines all Pydantic models for visitor tracking including:
- API request/response models
- Internal DynamoDB model
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# API Request Models


class VisitorTrackRequest(BaseModel):
    """Visitor tracking request model."""

    page_path: str
    referrer: str = ""


# API Response Models


class VisitorCountResponse(BaseModel):
    """Visitor count response model."""

    total_visitors: int
    last_updated: datetime


# Internal DynamoDB Model


class VisitorLog(BaseModel):
    """Visitor log internal model for DynamoDB."""

    # Primary Key
    pk: str = Field(..., description="Partition key: VISITOR#<date>")
    sk: str = Field(..., description="Sort key: <timestamp>#<visitor_id>")

    # GSI Keys
    gsi1_pk: str = Field(..., description="GSI1 PK: VISITORS")
    gsi1_sk: str = Field(..., description="GSI1 SK: <timestamp>")

    # Entity Type
    entity_type: str = Field(default="visitor_log", description="Entity type identifier")

    # Attributes
    visitor_id: str = Field(..., description="Unique visitor session identifier")
    page_path: str = Field(..., description="Page path visited")
    referrer: str | None = Field(None, description="Referrer URL")
    ip_address: str | None = Field(None, description="Visitor IP address (anonymized)")
    user_agent: str | None = Field(None, description="User agent string")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Visit timestamp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "pk": "VISITOR#2025-01-01",
                "sk": "2025-01-01T12:00:00#abc123",
                "gsi1_pk": "VISITORS",
                "gsi1_sk": "2025-01-01T12:00:00",
                "entity_type": "visitor_log",
                "visitor_id": "abc123",
                "page_path": "/blog/my-first-post",
                "referrer": "https://google.com",
                "ip_address": "192.168.xxx.xxx",
                "user_agent": "Mozilla/5.0...",
            }
        }
    )


class VisitorCount(BaseModel):
    """Visitor count aggregate model for DynamoDB."""

    # Primary Key
    pk: str = Field(..., description="Partition key: ANALYTICS")
    sk: str = Field(..., description="Sort key: VISITOR_COUNT")

    # Entity Type
    entity_type: str = Field(default="visitor_count", description="Entity type identifier")

    # Attributes
    total_visitors: int = Field(default=0, description="Total visitor count")
    last_updated: datetime = Field(
        default_factory=datetime.utcnow, description="Last update timestamp"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "pk": "ANALYTICS",
                "sk": "VISITOR_COUNT",
                "entity_type": "visitor_count",
                "total_visitors": 1234,
                "last_updated": "2025-01-01T12:00:00",
            }
        }
    )
