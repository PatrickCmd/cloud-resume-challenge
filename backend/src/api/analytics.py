"""
Analytics API endpoints.

Provides analytics and statistics for the portfolio.
Owner-only endpoints for viewing detailed analytics.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from src.dependencies import get_analytics_repository, get_blog_repository, require_owner_role
from src.models.analytics import AnalyticsOverview, BlogPostStats, PageView
from src.repositories.analytics import AnalyticsRepository
from src.repositories.blog import BlogRepository

router = APIRouter()


@router.post("/track/{content_type}/{content_id}")
async def track_content_view(
    content_type: str,
    content_id: str,
    request: Request,
    analytics_repo: AnalyticsRepository = Depends(get_analytics_repository),
):
    """
    Track content view.

    Public endpoint - records content view with deduplication.
    """
    # Validate content_type
    if content_type not in ["blog", "project", "certification"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Must be blog, project, or certification",
        )

    # Generate or retrieve session ID from cookies
    session_id = request.cookies.get("session_id")
    if not session_id:
        session_id = str(uuid.uuid4())

    # Track view
    result = analytics_repo.track_view(content_type, content_id, session_id)

    return {
        "message": "View tracked successfully",
        "sessionId": session_id,
        "views": result.get("views", 0),
    }


@router.get("/views/{content_type}/{content_id}")
async def get_content_view_count(
    content_type: str,
    content_id: str,
    analytics_repo: AnalyticsRepository = Depends(get_analytics_repository),
):
    """
    Get view count for specific content.

    Public endpoint.
    """
    # Validate content_type
    if content_type not in ["blog", "project", "certification"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Must be blog, project, or certification",
        )

    view_count = analytics_repo.get_view_count(content_type, content_id)

    return {"contentType": content_type, "contentId": content_id, "views": view_count}


@router.get("/views/total")
async def get_total_views(
    analytics_repo: AnalyticsRepository = Depends(get_analytics_repository),
):
    """
    Get total views across all content.

    Public endpoint.
    """
    total_views = analytics_repo.get_total_views()

    return {"totalViews": total_views}


@router.get("/top-content")
async def get_top_content(
    limit: int = Query(5, ge=1, le=20, description="Number of items per type"),
    current_user: dict = Depends(require_owner_role),
    analytics_repo: AnalyticsRepository = Depends(get_analytics_repository),
) -> dict[str, list[dict[str, Any]]]:
    """
    Get top viewed content across all types.

    Requires owner authentication.
    """
    top_content = analytics_repo.get_top_content(limit=limit)
    return top_content


@router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(require_owner_role),
    analytics_repo: AnalyticsRepository = Depends(get_analytics_repository),
):
    """
    Get analytics overview for the last N days.

    Requires owner authentication.
    """
    total_views = analytics_repo.get_total_views()
    top_content = analytics_repo.get_top_content(limit=5)

    # Build top pages list
    top_pages = []
    for content_type, items in top_content.items():
        for item in items:
            top_pages.append(
                PageView(
                    page_path=f"/{content_type}/{item['contentId']}",
                    view_count=item["views"],
                    unique_visitors=0,  # Not tracked separately yet
                )
            )

    # Sort by view count
    top_pages.sort(key=lambda x: x.view_count, reverse=True)
    top_pages = top_pages[:10]  # Top 10

    return AnalyticsOverview(
        total_views=total_views,
        unique_visitors=0,  # Not tracked separately yet
        top_pages=top_pages,
        recent_activity=[],  # Could be implemented later
    )


@router.get("/pages", response_model=list[PageView])
async def get_page_analytics(
    content_type: str = Query(
        ..., description="Filter by content type: blog, project, or certification"
    ),
    current_user: dict = Depends(require_owner_role),
    analytics_repo: AnalyticsRepository = Depends(get_analytics_repository),
):
    """
    Get analytics for all pages of a specific type.

    Requires owner authentication.
    """
    # Validate content_type
    if content_type not in ["blog", "project", "certification"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Must be blog, project, or certification",
        )

    view_stats = analytics_repo.get_all_views_for_type(content_type)

    pages = []
    for content_id, view_count in view_stats.items():
        pages.append(
            PageView(
                page_path=f"/{content_type}/{content_id}",
                view_count=view_count,
                unique_visitors=0,  # Not tracked separately yet
            )
        )

    # Sort by view count
    pages.sort(key=lambda x: x.view_count, reverse=True)

    return pages


@router.get("/blog/{post_id}/stats", response_model=BlogPostStats)
async def get_blog_post_stats(
    post_id: str,
    current_user: dict = Depends(require_owner_role),
    analytics_repo: AnalyticsRepository = Depends(get_analytics_repository),
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    """
    Get detailed statistics for a specific blog post.

    Requires owner authentication.
    """
    # Get blog post
    blog_post = blog_repo.get_by_id(post_id)

    if not blog_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog post not found",
        )

    # Get view count
    view_count = analytics_repo.get_view_count("blog", post_id)

    return BlogPostStats(
        post_id=post_id,
        title=blog_post.get("title", ""),
        view_count=view_count,
        unique_visitors=0,  # Not tracked separately yet
        average_time_on_page=0.0,  # Not tracked yet
        bounce_rate=0.0,  # Not tracked yet
    )
