"""
Analytics data models.

Defines all Pydantic models for analytics including:
- API response models
- Internal aggregation models
"""

from typing import List
from pydantic import BaseModel, Field, ConfigDict
from datetime import date as date_type


# API Response Models

class PageView(BaseModel):
    """Page view analytics model."""
    page_path: str
    view_count: int
    unique_visitors: int


class DailyStats(BaseModel):
    """Daily statistics model."""
    date: date_type
    total_views: int
    unique_visitors: int


class AnalyticsOverview(BaseModel):
    """Analytics overview response model."""
    total_views: int
    unique_visitors: int
    top_pages: List[PageView]
    recent_activity: List[DailyStats]


class BlogPostStats(BaseModel):
    """Blog post statistics model."""
    post_id: str
    title: str
    view_count: int
    unique_visitors: int
    average_time_on_page: float = Field(default=0.0, description="Average time in seconds")
    bounce_rate: float = Field(default=0.0, description="Bounce rate percentage")


# Internal DynamoDB Models

class PageViewAggregate(BaseModel):
    """Page view aggregate model for DynamoDB."""

    # Primary Key
    pk: str = Field(..., description="Partition key: ANALYTICS#PAGE")
    sk: str = Field(..., description="Sort key: <page_path>")

    # GSI Keys
    gsi1_pk: str = Field(..., description="GSI1 PK: ANALYTICS")
    gsi1_sk: str = Field(..., description="GSI1 SK: VIEW_COUNT#<view_count>")

    # Entity Type
    entity_type: str = Field(default="page_view_aggregate", description="Entity type identifier")

    # Attributes
    page_path: str = Field(..., description="Page path")
    view_count: int = Field(default=0, description="Total view count")
    unique_visitors: int = Field(default=0, description="Unique visitor count")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "pk": "ANALYTICS#PAGE",
                "sk": "/blog/my-first-post",
                "gsi1_pk": "ANALYTICS",
                "gsi1_sk": "VIEW_COUNT#1234",
                "entity_type": "page_view_aggregate",
                "page_path": "/blog/my-first-post",
                "view_count": 1234,
                "unique_visitors": 567,
            }
        }
    )


class DailyStatsAggregate(BaseModel):
    """Daily statistics aggregate model for DynamoDB."""

    # Primary Key
    pk: str = Field(..., description="Partition key: ANALYTICS#DAILY")
    sk: str = Field(..., description="Sort key: <date>")

    # GSI Keys
    gsi1_pk: str = Field(..., description="GSI1 PK: ANALYTICS")
    gsi1_sk: str = Field(..., description="GSI1 SK: DAILY#<date>")

    # Entity Type
    entity_type: str = Field(default="daily_stats_aggregate", description="Entity type identifier")

    # Attributes
    date: date_type = Field(..., description="Statistics date")
    total_views: int = Field(default=0, description="Total views for the day")
    unique_visitors: int = Field(default=0, description="Unique visitors for the day")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "pk": "ANALYTICS#DAILY",
                "sk": "2025-01-01",
                "gsi1_pk": "ANALYTICS",
                "gsi1_sk": "DAILY#2025-01-01",
                "entity_type": "daily_stats_aggregate",
                "date": "2025-01-01",
                "total_views": 500,
                "unique_visitors": 123,
            }
        }
    )
