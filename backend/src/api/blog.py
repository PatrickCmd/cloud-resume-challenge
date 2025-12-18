"""
Blog API endpoints.

Handles blog post creation, retrieval, updates, and deletion.
Public endpoints for reading, owner-only for write operations.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query

from src.dependencies import require_owner_role
from src.models.blog import BlogPostCreate, BlogPostUpdate, BlogPostResponse

router = APIRouter()


@router.get("", response_model=List[BlogPostResponse])
async def list_blog_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    published_only: bool = Query(True),
):
    """
    List all blog posts with pagination.

    Public endpoint - returns published posts by default.
    """
    # TODO: Implement blog post listing from DynamoDB
    # TODO: Use GSI for published posts query
    # TODO: Implement pagination with page tokens
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Blog post listing not yet implemented",
    )


@router.get("/{slug}", response_model=BlogPostResponse)
async def get_blog_post(slug: str):
    """
    Get a single blog post by slug.

    Public endpoint - increments view count.
    """
    # TODO: Implement blog post retrieval by slug (GSI)
    # TODO: Increment view count
    # TODO: Return 404 if not found or not published
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Blog post retrieval not yet implemented",
    )


@router.post("", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
async def create_blog_post(
    post: BlogPostCreate,
    current_user: dict = Depends(require_owner_role),
):
    """
    Create a new blog post.

    Requires owner authentication.
    """
    # TODO: Implement blog post creation
    # TODO: Generate post_id (UUID)
    # TODO: Validate slug uniqueness
    # TODO: Save to DynamoDB
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Blog post creation not yet implemented",
    )


@router.put("/{post_id}", response_model=BlogPostResponse)
async def update_blog_post(
    post_id: str,
    post: BlogPostUpdate,
    current_user: dict = Depends(require_owner_role),
):
    """
    Update an existing blog post.

    Requires owner authentication.
    """
    # TODO: Implement blog post update
    # TODO: Validate slug uniqueness if changed
    # TODO: Update updated_at timestamp
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Blog post update not yet implemented",
    )


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_post(
    post_id: str,
    current_user: dict = Depends(require_owner_role),
):
    """
    Delete a blog post.

    Requires owner authentication.
    """
    # TODO: Implement blog post deletion
    # TODO: Consider soft delete vs hard delete
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Blog post deletion not yet implemented",
    )
