"""
Unit tests for Blog API endpoints.

Tests all blog-related endpoints including:
- List blogs with filters and pagination
- Get single blog post
- Create, update, delete blog posts
- Publish/unpublish workflows
- Category listing
"""

from unittest.mock import Mock, patch

import pytest
from fastapi import status


@pytest.fixture
def mock_blog_repo():
    """Mock blog repository."""
    repo = Mock()
    repo.list_posts = Mock()
    repo.get_by_id = Mock()
    repo.create = Mock()
    repo.update = Mock()
    repo.delete = Mock()
    repo.publish = Mock()
    repo.unpublish = Mock()
    repo.get_categories = Mock()
    return repo


@pytest.fixture
def sample_blog_post():
    """Sample blog post data from repository."""
    return {
        "id": "test-blog-123",
        "slug": "test-blog-post",
        "title": "Test Blog Post",
        "excerpt": "This is a test excerpt",
        "content": "This is the full content of the test blog post",
        "category": "Technology",
        "tags": ["python", "testing"],
        "status": "PUBLISHED",
        "readTime": 5,
        "publishedAt": "2024-01-15T10:00:00Z",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z",
    }


@pytest.fixture
def sample_blog_list_response():
    """Sample blog list response from repository."""
    return {
        "items": [
            {
                "id": "blog-1",
                "slug": "first-post",
                "title": "First Post",
                "excerpt": "Excerpt 1",
                "content": "Content 1",
                "category": "Tech",
                "tags": ["python"],
                "status": "PUBLISHED",
                "readTime": 3,
                "publishedAt": "2024-01-15T10:00:00Z",
                "createdAt": "2024-01-15T10:00:00Z",
                "updatedAt": "2024-01-15T10:00:00Z",
            },
            {
                "id": "blog-2",
                "slug": "second-post",
                "title": "Second Post",
                "excerpt": "Excerpt 2",
                "content": "Content 2",
                "category": "Tutorial",
                "tags": ["fastapi"],
                "status": "PUBLISHED",
                "readTime": 4,
                "publishedAt": "2024-01-16T10:00:00Z",
                "createdAt": "2024-01-16T10:00:00Z",
                "updatedAt": "2024-01-16T10:00:00Z",
            },
        ],
        "count": 2,
        "lastEvaluatedKey": None,
    }


class TestListBlogs:
    """Tests for GET /blogs endpoint."""

    def test_list_blogs_default(
        self, test_client, override_get_blog_repository, mock_blog_repo, sample_blog_list_response
    ):
        """Test listing blogs with default filters (published only)."""
        mock_blog_repo.list_posts.return_value = sample_blog_list_response

        response = test_client.get("/blogs")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["count"] == 2
        assert len(data["items"]) == 2
        mock_blog_repo.list_posts.assert_called_once()

    def test_list_blogs_with_status_filter(
        self, test_client, override_get_blog_repository, mock_blog_repo, sample_blog_list_response
    ):
        """Test listing blogs with status filter."""
        mock_blog_repo.list_posts.return_value = sample_blog_list_response

        response = test_client.get("/blogs?status=DRAFT")

        assert response.status_code == status.HTTP_200_OK
        mock_blog_repo.list_posts.assert_called_once()
        call_args = mock_blog_repo.list_posts.call_args
        assert call_args.kwargs["status"] == "DRAFT"

    def test_list_blogs_with_category_filter(
        self, test_client, override_get_blog_repository, mock_blog_repo, sample_blog_list_response
    ):
        """Test listing blogs with category filter."""
        mock_blog_repo.list_posts.return_value = sample_blog_list_response

        response = test_client.get("/blogs?category=Technology")

        assert response.status_code == status.HTTP_200_OK
        call_args = mock_blog_repo.list_posts.call_args
        assert call_args.kwargs["category"] == "Technology"

    def test_list_blogs_with_pagination(
        self, test_client, override_get_blog_repository, mock_blog_repo, sample_blog_list_response
    ):
        """Test listing blogs with pagination limit."""
        mock_blog_repo.list_posts.return_value = sample_blog_list_response

        response = test_client.get("/blogs?limit=10")

        assert response.status_code == status.HTTP_200_OK
        call_args = mock_blog_repo.list_posts.call_args
        assert call_args.kwargs["limit"] == 10

    def test_list_blogs_invalid_status(
        self, test_client, override_get_blog_repository, mock_blog_repo
    ):
        """Test listing blogs with invalid status filter."""
        response = test_client.get("/blogs?status=INVALID")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestGetBlogPost:
    """Tests for GET /blogs/{blog_id} endpoint."""

    def test_get_published_blog_post(
        self, test_client, override_get_blog_repository, mock_blog_repo, sample_blog_post
    ):
        """Test getting a published blog post."""
        mock_blog_repo.get_by_id.return_value = sample_blog_post

        response = test_client.get("/blogs/test-blog-123")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == "test-blog-123"
        assert data["title"] == "Test Blog Post"
        assert data["status"] == "PUBLISHED"

    def test_get_draft_blog_post_as_public(
        self, test_client, override_get_blog_repository, mock_blog_repo, sample_blog_post
    ):
        """Test that draft posts are not accessible to public."""
        draft_post = {**sample_blog_post, "status": "DRAFT"}
        mock_blog_repo.get_by_id.return_value = draft_post

        response = test_client.get("/blogs/test-blog-123")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_nonexistent_blog_post(
        self, test_client, override_get_blog_repository, mock_blog_repo
    ):
        """Test getting a non-existent blog post."""
        mock_blog_repo.get_by_id.return_value = None

        response = test_client.get("/blogs/nonexistent-id")

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCreateBlogPost:
    """Tests for POST /blogs endpoint."""

    def test_create_blog_post_success(
        self,
        test_client,
        override_get_blog_repository,
        mock_blog_repo,
        sample_blog_post,
        mock_user_info,
    ):
        """Test creating a blog post as owner."""
        mock_blog_repo.create.return_value = sample_blog_post

        create_data = {
            "title": "Test Blog Post",
            "slug": "test-blog-post",
            "content": "This is the full content",
            "excerpt": "This is a test excerpt",
            "category": "Technology",
            "tags": ["python", "testing"],
        }

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.post(
                "/blogs", json=create_data, headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "Test Blog Post"
        mock_blog_repo.create.assert_called_once()

    def test_create_blog_post_without_auth(
        self, test_client, override_get_blog_repository, mock_blog_repo
    ):
        """Test creating a blog post without authentication."""
        create_data = {
            "title": "Test Blog Post",
            "content": "Content",
            "excerpt": "Excerpt",
            "category": "Tech",
            "tags": [],
        }

        response = test_client.post("/blogs", json=create_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_blog_post_as_non_owner(
        self, test_client, override_get_blog_repository, mock_blog_repo, mock_visitor_user_info
    ):
        """Test creating a blog post as non-owner user."""
        create_data = {
            "title": "Test Blog Post",
            "content": "Content",
            "excerpt": "Excerpt",
            "category": "Tech",
            "tags": [],
        }

        with patch("src.dependencies.extract_user_from_token", return_value=mock_visitor_user_info):
            response = test_client.post(
                "/blogs", json=create_data, headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestUpdateBlogPost:
    """Tests for PUT /blogs/{blog_id} endpoint."""

    def test_update_blog_post_success(
        self,
        test_client,
        override_get_blog_repository,
        mock_blog_repo,
        sample_blog_post,
        mock_user_info,
    ):
        """Test updating a blog post."""
        updated_post = {**sample_blog_post, "title": "Updated Title"}
        mock_blog_repo.update.return_value = updated_post

        update_data = {"title": "Updated Title"}

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.put(
                "/blogs/test-blog-123",
                json=update_data,
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Title"

    def test_update_nonexistent_blog_post(
        self, test_client, override_get_blog_repository, mock_blog_repo, mock_user_info
    ):
        """Test updating a non-existent blog post."""
        mock_blog_repo.update.return_value = None

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.put(
                "/blogs/nonexistent-id",
                json={"title": "New Title"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_blog_post_empty_data(
        self, test_client, override_get_blog_repository, mock_blog_repo, mock_user_info
    ):
        """Test updating with no fields."""
        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.put(
                "/blogs/test-blog-123", json={}, headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestDeleteBlogPost:
    """Tests for DELETE /blogs/{blog_id} endpoint."""

    def test_delete_blog_post_success(
        self, test_client, override_get_blog_repository, mock_blog_repo, mock_user_info
    ):
        """Test deleting a blog post."""
        mock_blog_repo.delete.return_value = True

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.delete(
                "/blogs/test-blog-123", headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_nonexistent_blog_post(
        self, test_client, override_get_blog_repository, mock_blog_repo, mock_user_info
    ):
        """Test deleting a non-existent blog post."""
        mock_blog_repo.delete.return_value = False

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.delete(
                "/blogs/nonexistent-id", headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestPublishBlogPost:
    """Tests for POST /blogs/{blog_id}/publish endpoint."""

    def test_publish_blog_post_success(
        self,
        test_client,
        override_get_blog_repository,
        mock_blog_repo,
        sample_blog_post,
        mock_user_info,
    ):
        """Test publishing a draft blog post."""
        mock_blog_repo.publish.return_value = sample_blog_post

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.post(
                "/blogs/test-blog-123/publish", headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "PUBLISHED"

    def test_publish_nonexistent_blog_post(
        self, test_client, override_get_blog_repository, mock_blog_repo, mock_user_info
    ):
        """Test publishing a non-existent blog post."""
        mock_blog_repo.publish.return_value = None

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.post(
                "/blogs/nonexistent-id/publish", headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestUnpublishBlogPost:
    """Tests for POST /blogs/{blog_id}/unpublish endpoint."""

    def test_unpublish_blog_post_success(
        self,
        test_client,
        override_get_blog_repository,
        mock_blog_repo,
        sample_blog_post,
        mock_user_info,
    ):
        """Test unpublishing a published blog post."""
        draft_post = {**sample_blog_post, "status": "DRAFT", "publishedAt": None}
        mock_blog_repo.unpublish.return_value = draft_post

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.post(
                "/blogs/test-blog-123/unpublish", headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "DRAFT"


class TestListCategories:
    """Tests for GET /blogs/categories/list endpoint."""

    def test_list_categories(self, test_client, override_get_blog_repository, mock_blog_repo):
        """Test listing all blog categories."""
        categories = [
            {"name": "Technology", "count": 5},
            {"name": "Tutorial", "count": 3},
            {"name": "News", "count": 2},
        ]
        mock_blog_repo.get_categories.return_value = categories

        response = test_client.get("/blogs/categories/list")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 3
        assert data[0]["name"] == "Technology"
        assert data[0]["count"] == 5
