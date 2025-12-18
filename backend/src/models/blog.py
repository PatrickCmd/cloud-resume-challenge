"""
Blog post data models.

Defines all Pydantic models for blog posts including:
- API request/response models
- Internal DynamoDB model
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


# API Request Models

class BlogPostCreate(BaseModel):
    """Blog post creation request model."""
    title: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    excerpt: str = Field(..., max_length=500)
    tags: List[str] = Field(default_factory=list)
    is_published: bool = False


class BlogPostUpdate(BaseModel):
    """Blog post update request model."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    excerpt: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None


# API Response Models

class BlogPostResponse(BaseModel):
    """Blog post API response model."""
    post_id: str
    title: str
    slug: str
    content: str
    excerpt: str
    tags: List[str]
    is_published: bool
    created_at: datetime
    updated_at: datetime
    view_count: int


# Internal DynamoDB Model

class BlogPost(BaseModel):
    """Blog post internal model."""

    # Primary Key
    pk: str = Field(..., description="Partition key: POST#<post_id>")
    sk: str = Field(..., description="Sort key: POST#<post_id>")

    # GSI Keys
    gsi1_pk: str = Field(..., description="GSI1 PK: BLOG")
    gsi1_sk: str = Field(..., description="GSI1 SK: <created_at>#<post_id>")
    gsi2_pk: Optional[str] = Field(None, description="GSI2 PK: SLUG#<slug>")
    gsi2_sk: Optional[str] = Field(None, description="GSI2 SK: SLUG#<slug>")

    # Entity Type
    entity_type: str = Field(default="blog_post", description="Entity type identifier")

    # Attributes
    post_id: str = Field(..., description="Unique post identifier (UUID)")
    title: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200, description="URL-friendly slug")
    content: str = Field(..., min_length=1, description="Post content in Markdown")
    excerpt: str = Field(..., max_length=500, description="Short excerpt/summary")
    tags: List[str] = Field(default_factory=list, description="Post tags")

    # Status
    is_published: bool = Field(default=False, description="Publication status")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Analytics
    view_count: int = Field(default=0, description="Number of views")

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "pk": "POST#123e4567-e89b-12d3-a456-426614174000",
                "sk": "POST#123e4567-e89b-12d3-a456-426614174000",
                "gsi1_pk": "BLOG",
                "gsi1_sk": "2025-01-01T00:00:00#123e4567-e89b-12d3-a456-426614174000",
                "gsi2_pk": "SLUG#my-first-blog-post",
                "gsi2_sk": "SLUG#my-first-blog-post",
                "entity_type": "blog_post",
                "post_id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "My First Blog Post",
                "slug": "my-first-blog-post",
                "content": "# Hello World\n\nThis is my first blog post!",
                "excerpt": "This is my first blog post!",
                "tags": ["tutorial", "getting-started"],
                "is_published": True,
                "view_count": 0,
            }
        }
