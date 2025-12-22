"""
Project data models.

Defines all Pydantic models for projects including:
- API request/response models
- Internal DynamoDB model
"""

from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl


# API Request Models

class ProjectCreate(BaseModel):
    """Project creation request model."""
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    longDescription: Optional[str] = Field(None, description="Detailed project description")
    tech: List[str] = Field(default_factory=list, description="Technologies used")
    company: Optional[str] = Field(None, max_length=200)
    featured: bool = False
    githubUrl: Optional[HttpUrl] = None
    liveUrl: Optional[HttpUrl] = None
    imageUrl: Optional[HttpUrl] = None


class ProjectUpdate(BaseModel):
    """Project update request model."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    longDescription: Optional[str] = None
    tech: Optional[List[str]] = None
    company: Optional[str] = Field(None, max_length=200)
    featured: Optional[bool] = None
    githubUrl: Optional[HttpUrl] = None
    liveUrl: Optional[HttpUrl] = None
    imageUrl: Optional[HttpUrl] = None


# API Response Models

class ProjectResponse(BaseModel):
    """Project API response model."""
    id: str
    name: str
    description: str
    longDescription: Optional[str]
    tech: List[str]
    company: Optional[str]
    featured: bool
    status: str = Field(..., description="Publication status: DRAFT or PUBLISHED")
    githubUrl: Optional[str]
    liveUrl: Optional[str]
    imageUrl: Optional[str]
    createdAt: str = Field(..., description="ISO 8601 timestamp")
    updatedAt: str = Field(..., description="ISO 8601 timestamp")


class ProjectListResponse(BaseModel):
    """Project list response with pagination."""
    items: List[ProjectResponse]
    count: int
    lastEvaluatedKey: Optional[dict] = Field(None, description="Pagination token for next page")


