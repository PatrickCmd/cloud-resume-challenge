"""
Visitor tracking API endpoints.

Handles visitor tracking and analytics (view counting).
Public endpoint for tracking, owner-only for viewing stats.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Request, Depends, Query

from src.dependencies import get_visitor_repository, require_owner_role
from src.models.visitor import VisitorTrackRequest, VisitorCountResponse
from src.repositories.visitor import VisitorRepository

router = APIRouter()


@router.post("/track")
async def track_visitor(
    request: Request,
    data: VisitorTrackRequest,
    visitor_repo: VisitorRepository = Depends(get_visitor_repository),
):
    """
    Track a visitor page view.

    Public endpoint - records visitor statistics.
    """
    # Generate or retrieve session ID from cookies
    session_id = request.cookies.get("session_id")
    if not session_id:
        session_id = str(uuid.uuid4())

    # Track visitor
    result = visitor_repo.track_visitor(session_id)

    return {
        "message": "Visitor tracked successfully",
        "sessionId": session_id,
        "count": result.get("count", 0)
    }


@router.get("/count", response_model=VisitorCountResponse)
async def get_visitor_count(
    visitor_repo: VisitorRepository = Depends(get_visitor_repository),
):
    """
    Get total visitor count.

    Public endpoint - returns aggregated visitor statistics.
    """
    total_count = visitor_repo.get_total_count()

    return VisitorCountResponse(
        total_visitors=total_count,
        last_updated=datetime.now(timezone.utc)
    )


@router.get("/trends/daily")
async def get_daily_trends(
    days: int = Query(30, ge=1, le=365, description="Number of days to retrieve"),
    current_user: dict = Depends(require_owner_role),
    visitor_repo: VisitorRepository = Depends(get_visitor_repository),
) -> List[Dict[str, Any]]:
    """
    Get daily visitor trends.

    Requires owner authentication.
    """
    trends = visitor_repo.get_daily_trends(days=days)
    return trends


@router.get("/trends/monthly")
async def get_monthly_trends(
    months: int = Query(6, ge=1, le=24, description="Number of months to retrieve"),
    current_user: dict = Depends(require_owner_role),
    visitor_repo: VisitorRepository = Depends(get_visitor_repository),
) -> List[Dict[str, Any]]:
    """
    Get monthly visitor trends.

    Requires owner authentication.
    """
    trends = visitor_repo.get_monthly_trends(months=months)
    return trends
