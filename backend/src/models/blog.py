"""
Blog post data models.

Defines all Pydantic models for blog posts including:
- API request/response models
- Internal DynamoDB model
"""

from pydantic import BaseModel, Field

# API Request Models


class BlogPostCreate(BaseModel):
    """Blog post creation request model."""

    title: str = Field(..., min_length=1, max_length=200)
    slug: str | None = Field(
        None,
        min_length=1,
        max_length=200,
        description="URL-friendly slug (auto-generated from title if not provided)",
    )
    content: str = Field(..., min_length=1)
    excerpt: str = Field(..., max_length=500)
    category: str = Field(..., min_length=1, max_length=100, description="Blog post category")
    tags: list[str] = Field(default_factory=list)


class BlogPostUpdate(BaseModel):
    """Blog post update request model."""

    title: str | None = Field(None, min_length=1, max_length=200)
    slug: str | None = Field(None, min_length=1, max_length=200)
    content: str | None = Field(None, min_length=1)
    excerpt: str | None = Field(None, max_length=500)
    category: str | None = Field(None, min_length=1, max_length=100)
    tags: list[str] | None = None


# API Response Models


class BlogPostResponse(BaseModel):
    """Blog post API response model."""

    id: str
    slug: str
    title: str
    excerpt: str
    content: str
    category: str
    tags: list[str]
    status: str = Field(..., description="Publication status: DRAFT or PUBLISHED")
    readTime: int = Field(..., description="Estimated read time in minutes")
    publishedAt: str | None = Field(None, description="ISO 8601 timestamp when published")
    createdAt: str = Field(..., description="ISO 8601 timestamp when created")
    updatedAt: str = Field(..., description="ISO 8601 timestamp when last updated")


class BlogPostListResponse(BaseModel):
    """Blog post list response with pagination."""

    items: list[BlogPostResponse]
    count: int
    lastEvaluatedKey: dict | None = Field(None, description="Pagination token for next page")
