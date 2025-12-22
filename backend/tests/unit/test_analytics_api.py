"""
Unit tests for Analytics API endpoints.

Tests analytics tracking and reporting endpoints.
"""

import pytest
from unittest.mock import Mock, patch
from fastapi import status


@pytest.fixture
def mock_analytics_repo():
    """Mock analytics repository."""
    repo = Mock()
    repo.track_view = Mock()
    repo.get_view_count = Mock()
    repo.get_total_views = Mock()
    repo.get_top_content = Mock()
    repo.get_all_views_for_type = Mock()
    return repo


@pytest.fixture
def mock_blog_repo():
    """Mock blog repository for analytics tests."""
    repo = Mock()
    repo.get_by_id = Mock()
    return repo


class TestTrackContentView:
    """Tests for POST /analytics/track/{content_type}/{content_id} endpoint."""

    def test_track_blog_view(self, test_client, override_get_analytics_repository, mock_analytics_repo):
        """Test tracking a blog post view."""
        mock_analytics_repo.track_view.return_value = {"views": 42}

        response = test_client.post("/analytics/track/blog/post-123")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["views"] == 42
        assert "sessionId" in data

    def test_track_project_view(self, test_client, override_get_analytics_repository, mock_analytics_repo):
        """Test tracking a project view."""
        mock_analytics_repo.track_view.return_value = {"views": 15}

        response = test_client.post("/analytics/track/project/proj-456")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["views"] == 15

    def test_track_certification_view(self, test_client, override_get_analytics_repository, mock_analytics_repo):
        """Test tracking a certification view."""
        mock_analytics_repo.track_view.return_value = {"views": 8}

        response = test_client.post("/analytics/track/certification/cert-789")

        assert response.status_code == status.HTTP_200_OK

    def test_track_invalid_content_type(self, test_client, override_get_analytics_repository, mock_analytics_repo):
        """Test tracking with invalid content type."""
        response = test_client.post("/analytics/track/invalid/content-123")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestGetContentViewCount:
    """Tests for GET /analytics/views/{content_type}/{content_id} endpoint."""

    def test_get_blog_view_count(self, test_client, override_get_analytics_repository, mock_analytics_repo):
        """Test getting view count for a blog post."""
        mock_analytics_repo.get_view_count.return_value = 100

        response = test_client.get("/analytics/views/blog/post-123")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["views"] == 100
        assert data["contentType"] == "blog"
        assert data["contentId"] == "post-123"

    def test_get_view_count_invalid_type(self, test_client, override_get_analytics_repository, mock_analytics_repo):
        """Test getting view count with invalid content type."""
        response = test_client.get("/analytics/views/invalid/content-123")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestGetTotalViews:
    """Tests for GET /analytics/views/total endpoint."""

    def test_get_total_views(self, test_client, override_get_analytics_repository, mock_analytics_repo):
        """Test getting total views across all content."""
        mock_analytics_repo.get_total_views.return_value = 5000

        response = test_client.get("/analytics/views/total")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["totalViews"] == 5000


class TestGetTopContent:
    """Tests for GET /analytics/top-content endpoint."""

    def test_get_top_content(self, test_client, override_get_analytics_repository, mock_analytics_repo, mock_user_info):
        """Test getting top viewed content."""
        mock_analytics_repo.get_top_content.return_value = {
            "blogs": [
                {"contentId": "blog-1", "views": 500},
                {"contentId": "blog-2", "views": 300}
            ],
            "projects": [
                {"contentId": "proj-1", "views": 200}
            ],
            "certifications": []
        }

        with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
            response = test_client.get(
                "/analytics/top-content?limit=5",
                headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "blogs" in data
        assert "projects" in data
        assert len(data["blogs"]) == 2

    def test_get_top_content_without_auth(self, test_client, override_get_analytics_repository, mock_analytics_repo):
        """Test that top content requires authentication."""
        response = test_client.get("/analytics/top-content")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestGetAnalyticsOverview:
    """Tests for GET /analytics/overview endpoint."""

    def test_get_analytics_overview(self, test_client, override_get_analytics_repository, mock_analytics_repo, mock_user_info):
        """Test getting analytics overview."""
        mock_analytics_repo.get_total_views.return_value = 10000
        mock_analytics_repo.get_top_content.return_value = {
            "blogs": [
                {"contentId": "blog-1", "views": 500}
            ],
            "projects": [],
            "certifications": []
        }

        with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
            response = test_client.get(
                "/analytics/overview?days=30",
                headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_views"] == 10000
        assert "top_pages" in data
        assert "recent_activity" in data


class TestGetPageAnalytics:
    """Tests for GET /analytics/pages endpoint."""

    def test_get_page_analytics_for_blogs(self, test_client, override_get_analytics_repository, mock_analytics_repo, mock_user_info):
        """Test getting page analytics for blogs."""
        mock_analytics_repo.get_all_views_for_type.return_value = {
            "blog-1": 500,
            "blog-2": 300,
            "blog-3": 100
        }

        with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
            response = test_client.get(
                "/analytics/pages?content_type=blog",
                headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 3
        # Should be sorted by view count descending
        assert data[0]["view_count"] >= data[1]["view_count"]

    def test_get_page_analytics_invalid_type(self, test_client, override_get_analytics_repository, mock_analytics_repo, mock_user_info):
        """Test getting page analytics with invalid content type."""
        with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
            response = test_client.get(
                "/analytics/pages?content_type=invalid",
                headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestGetBlogPostStats:
    """Tests for GET /analytics/blog/{post_id}/stats endpoint."""

    def test_get_blog_post_stats(self, test_client, override_get_analytics_repository, mock_analytics_repo, mock_blog_repo, mock_user_info):
        """Test getting statistics for a specific blog post."""
        from src.main import app
        from src.dependencies import get_blog_repository

        mock_blog_repo.get_by_id.return_value = {
            "id": "blog-123",
            "title": "Test Blog Post",
            "status": "PUBLISHED"
        }
        mock_analytics_repo.get_view_count.return_value = 250

        app.dependency_overrides[get_blog_repository] = lambda: mock_blog_repo
        try:
            with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
                response = test_client.get(
                    "/analytics/blog/blog-123/stats",
                    headers={"Authorization": "Bearer valid-token"}
                )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["post_id"] == "blog-123"
            assert data["title"] == "Test Blog Post"
            assert data["view_count"] == 250
        finally:
            app.dependency_overrides.clear()

    def test_get_blog_post_stats_not_found(self, test_client, override_get_analytics_repository, mock_analytics_repo, mock_blog_repo, mock_user_info):
        """Test getting stats for non-existent blog post."""
        from src.main import app
        from src.dependencies import get_blog_repository

        mock_blog_repo.get_by_id.return_value = None

        app.dependency_overrides[get_blog_repository] = lambda: mock_blog_repo
        try:
            with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
                response = test_client.get(
                    "/analytics/blog/nonexistent/stats",
                    headers={"Authorization": "Bearer valid-token"}
                )

            assert response.status_code == status.HTTP_404_NOT_FOUND
        finally:
            app.dependency_overrides.clear()
