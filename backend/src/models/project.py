"""
Project data models.

Defines all Pydantic models for projects including:
- API request/response models
- Internal DynamoDB model
"""

from pydantic import BaseModel, Field, HttpUrl

# API Request Models


class ProjectCreate(BaseModel):
    """Project creation request model."""

    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    longDescription: str | None = Field(None, description="Detailed project description")
    tech: list[str] = Field(default_factory=list, description="Technologies used")
    company: str | None = Field(None, max_length=200)
    featured: bool = False
    githubUrl: HttpUrl | None = None
    liveUrl: HttpUrl | None = None
    imageUrl: HttpUrl | None = None


class ProjectUpdate(BaseModel):
    """Project update request model."""

    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, min_length=1)
    longDescription: str | None = None
    tech: list[str] | None = None
    company: str | None = Field(None, max_length=200)
    featured: bool | None = None
    githubUrl: HttpUrl | None = None
    liveUrl: HttpUrl | None = None
    imageUrl: HttpUrl | None = None


# API Response Models


class ProjectResponse(BaseModel):
    """Project API response model."""

    id: str
    name: str
    description: str
    longDescription: str | None
    tech: list[str]
    company: str | None
    featured: bool
    status: str = Field(..., description="Publication status: DRAFT or PUBLISHED")
    githubUrl: str | None
    liveUrl: str | None
    imageUrl: str | None
    createdAt: str = Field(..., description="ISO 8601 timestamp")
    updatedAt: str = Field(..., description="ISO 8601 timestamp")


class ProjectListResponse(BaseModel):
    """Project list response with pagination."""

    items: list[ProjectResponse]
    count: int
    lastEvaluatedKey: dict | None = Field(None, description="Pagination token for next page")
