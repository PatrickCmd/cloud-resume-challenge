"""
Blog API endpoints.

Handles blog post creation, retrieval, updates, and deletion.
Public endpoints for reading, owner-only for write operations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.dependencies import get_blog_repository, require_owner_role
from src.models.blog import BlogPostCreate, BlogPostListResponse, BlogPostResponse, BlogPostUpdate
from src.repositories.blog import BlogRepository

router = APIRouter()


@router.get("", response_model=BlogPostListResponse)
async def list_blog_posts(
    status_filter: str | None = Query(
        None, alias="status", description="Filter by status: PUBLISHED, DRAFT, or omit for all"
    ),
    category: str | None = Query(None, description="Filter by category"),
    limit: int = Query(20, ge=1, le=100),
    last_key: str | None = Query(None, description="Pagination token from previous response"),
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    """
    List all blog posts with pagination.

    Public endpoint - returns published posts by default if no status filter provided.
    """
    # Default to PUBLISHED if no filter specified
    if status_filter is None:
        status_filter = "PUBLISHED"

    # Validate status filter
    if status_filter and status_filter.upper() not in ["PUBLISHED", "DRAFT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status filter. Must be PUBLISHED or DRAFT",
        )

    # Parse last_evaluated_key if provided (simplified - in production use base64 encoding)
    last_evaluated_key = None
    if last_key:
        try:
            import json

            last_evaluated_key = json.loads(last_key)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid pagination token",
            )

    # Query repository
    result = blog_repo.list_posts(
        status=status_filter.upper() if status_filter else None,
        category=category,
        limit=limit,
        last_evaluated_key=last_evaluated_key,
    )

    return result


@router.get("/{blog_id}", response_model=BlogPostResponse)
async def get_blog_post(
    blog_id: str,
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    """
    Get a single blog post by ID.

    Public endpoint - returns post if published.
    """
    post = blog_repo.get_by_id(blog_id)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )

    # Only return published posts to public
    if post.get("status") != "PUBLISHED":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )

    return post


@router.post("", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
async def create_blog_post(
    post: BlogPostCreate,
    current_user: dict = Depends(require_owner_role),
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    """
    Create a new blog post.

    Requires owner authentication.
    """
    # Convert Pydantic model to dict
    post_data = post.model_dump()

    # Create the blog post
    created_post = blog_repo.create(post_data)

    if not created_post:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create blog post",
        )

    return created_post


@router.put("/{blog_id}", response_model=BlogPostResponse)
async def update_blog_post(
    blog_id: str,
    post: BlogPostUpdate,
    current_user: dict = Depends(require_owner_role),
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    """
    Update an existing blog post.

    Requires owner authentication.
    """
    # Convert Pydantic model to dict, excluding unset fields
    post_data = post.model_dump(exclude_unset=True)

    if not post_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    # Update the blog post
    updated_post = blog_repo.update(blog_id, post_data)

    if not updated_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )

    return updated_post


@router.delete("/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_post(
    blog_id: str,
    current_user: dict = Depends(require_owner_role),
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    """
    Delete a blog post.

    Requires owner authentication.
    """
    deleted = blog_repo.delete(blog_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )

    return None


@router.post("/{blog_id}/publish", response_model=BlogPostResponse)
async def publish_blog_post(
    blog_id: str,
    current_user: dict = Depends(require_owner_role),
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    """
    Publish a blog post (change status from DRAFT to PUBLISHED).

    Requires owner authentication.
    """
    published_post = blog_repo.publish(blog_id)

    if not published_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found or already published",
        )

    return published_post


@router.post("/{blog_id}/unpublish", response_model=BlogPostResponse)
async def unpublish_blog_post(
    blog_id: str,
    current_user: dict = Depends(require_owner_role),
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    """
    Unpublish a blog post (change status from PUBLISHED to DRAFT).

    Requires owner authentication.
    """
    unpublished_post = blog_repo.unpublish(blog_id)

    if not unpublished_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found or already unpublished",
        )

    return unpublished_post


@router.get("/categories/list", response_model=list[dict])
async def list_categories(
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    """
    Get all blog categories with post counts.

    Public endpoint.
    """
    categories = blog_repo.get_categories()
    return categories
