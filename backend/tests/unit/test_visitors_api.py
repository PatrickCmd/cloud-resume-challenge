"""
Unit tests for Visitors API endpoints.

Tests visitor tracking and analytics endpoints.
"""

import pytest
from unittest.mock import Mock, patch
from fastapi import status
from datetime import datetime, timezone


@pytest.fixture
def mock_visitor_repo():
    """Mock visitor repository."""
    repo = Mock()
    repo.track_visitor = Mock()
    repo.get_total_count = Mock()
    repo.get_daily_trends = Mock()
    repo.get_monthly_trends = Mock()
    return repo


class TestTrackVisitor:
    """Tests for POST /visitors/track endpoint."""

    def test_track_visitor_success(self, test_client, override_get_visitor_repository, mock_visitor_repo):
        """Test tracking a visitor."""
        mock_visitor_repo.track_visitor.return_value = {"count": 100, "sessionId": "session-123"}

        track_data = {
            "page_path": "/blog/my-post",
            "referrer": "https://google.com"
        }

        response = test_client.post("/visitors/track", json=track_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "sessionId" in data
        assert data["count"] == 100

    def test_track_visitor_with_existing_session(self, test_client, override_get_visitor_repository, mock_visitor_repo):
        """Test tracking a visitor with existing session cookie."""
        mock_visitor_repo.track_visitor.return_value = {"count": 100, "sessionId": "existing-session"}

        track_data = {
            "page_path": "/",
            "referrer": ""
        }

        test_client.cookies.set("session_id", "existing-session")

        response = test_client.post("/visitors/track", json=track_data)

        assert response.status_code == status.HTTP_200_OK


class TestGetVisitorCount:
    """Tests for GET /visitors/count endpoint."""

    def test_get_visitor_count(self, test_client, override_get_visitor_repository, mock_visitor_repo):
        """Test getting total visitor count."""
        mock_visitor_repo.get_total_count.return_value = 1234

        response = test_client.get("/visitors/count")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_visitors"] == 1234
        assert "last_updated" in data


class TestGetDailyTrends:
    """Tests for GET /visitors/trends/daily endpoint."""

    def test_get_daily_trends(self, test_client, override_get_visitor_repository, mock_visitor_repo, mock_user_info):
        """Test getting daily visitor trends."""
        mock_visitor_repo.get_daily_trends.return_value = [
            {"date": "2024-01-15", "visitors": 100},
            {"date": "2024-01-16", "visitors": 150}
        ]

        with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
            response = test_client.get(
                "/visitors/trends/daily?days=7",
                headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        assert data[0]["date"] == "2024-01-15"

    def test_get_daily_trends_without_auth(self, test_client, override_get_visitor_repository, mock_visitor_repo):
        """Test that trends require authentication."""
        response = test_client.get("/visitors/trends/daily")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestGetMonthlyTrends:
    """Tests for GET /visitors/trends/monthly endpoint."""

    def test_get_monthly_trends(self, test_client, override_get_visitor_repository, mock_visitor_repo, mock_user_info):
        """Test getting monthly visitor trends."""
        mock_visitor_repo.get_monthly_trends.return_value = [
            {"month": "2024-01", "visitors": 3000},
            {"month": "2024-02", "visitors": 3500}
        ]

        with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
            response = test_client.get(
                "/visitors/trends/monthly?months=6",
                headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
