"""
Project data models.

Defines all Pydantic models for projects including:
- API request/response models
- Internal DynamoDB model
"""

from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime


# API Request Models

class ProjectCreate(BaseModel):
    """Project creation request model."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    technologies: List[str] = Field(default_factory=list)
    github_url: Optional[HttpUrl] = None
    demo_url: Optional[HttpUrl] = None
    is_featured: bool = False


class ProjectUpdate(BaseModel):
    """Project update request model."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    technologies: Optional[List[str]] = None
    github_url: Optional[HttpUrl] = None
    demo_url: Optional[HttpUrl] = None
    is_featured: Optional[bool] = None


# API Response Models

class ProjectResponse(BaseModel):
    """Project API response model."""
    project_id: str
    title: str
    description: str
    technologies: List[str]
    github_url: Optional[str]
    demo_url: Optional[str]
    is_featured: bool
    created_at: datetime
    updated_at: datetime


# Internal DynamoDB Model

class Project(BaseModel):
    """Project internal model for DynamoDB."""

    # Primary Key
    pk: str = Field(..., description="Partition key: PROJECT#<project_id>")
    sk: str = Field(..., description="Sort key: PROJECT#<project_id>")

    # GSI Keys
    gsi1_pk: str = Field(..., description="GSI1 PK: PROJECTS")
    gsi1_sk: str = Field(..., description="GSI1 SK: <created_at>#<project_id>")

    # Entity Type
    entity_type: str = Field(default="project", description="Entity type identifier")

    # Attributes
    project_id: str = Field(..., description="Unique project identifier (UUID)")
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, description="Project description")
    technologies: List[str] = Field(default_factory=list, description="Technologies used")
    github_url: Optional[str] = Field(None, description="GitHub repository URL")
    demo_url: Optional[str] = Field(None, description="Live demo URL")
    is_featured: bool = Field(default=False, description="Featured project flag")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "pk": "PROJECT#123e4567-e89b-12d3-a456-426614174000",
                "sk": "PROJECT#123e4567-e89b-12d3-a456-426614174000",
                "gsi1_pk": "PROJECTS",
                "gsi1_sk": "2025-01-01T00:00:00#123e4567-e89b-12d3-a456-426614174000",
                "entity_type": "project",
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Cloud Resume Challenge",
                "description": "Serverless portfolio with AWS Lambda, DynamoDB, and Cognito",
                "technologies": ["Python", "AWS Lambda", "DynamoDB", "FastAPI"],
                "github_url": "https://github.com/patrickcmd/cloud-resume-challenge",
                "demo_url": "https://patrickcmd.com",
                "is_featured": True,
            }
        }
