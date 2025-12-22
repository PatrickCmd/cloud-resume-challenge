"""
Unit tests for Projects API endpoints.

Tests all project-related endpoints including:
- List projects with filters and pagination
- Get single project
- Create, update, delete projects
- Publish/unpublish workflows
"""

from unittest.mock import Mock, patch

import pytest
from fastapi import status


@pytest.fixture
def mock_project_repo():
    """Mock project repository."""
    repo = Mock()
    repo.list_projects = Mock()
    repo.get_by_id = Mock()
    repo.create = Mock()
    repo.update = Mock()
    repo.delete = Mock()
    repo.publish = Mock()
    repo.unpublish = Mock()
    return repo


@pytest.fixture
def sample_project():
    """Sample project data from repository."""
    return {
        "id": "test-project-123",
        "name": "Test Project",
        "description": "A test project description",
        "longDescription": "A longer, more detailed description of the test project",
        "tech": ["Python", "FastAPI", "AWS"],
        "company": "Test Company",
        "featured": True,
        "status": "PUBLISHED",
        "githubUrl": "https://github.com/test/project",
        "liveUrl": "https://demo.example.com",
        "imageUrl": "https://images.example.com/project.png",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z",
    }


@pytest.fixture
def sample_project_list_response():
    """Sample project list response from repository."""
    return {
        "items": [
            {
                "id": "project-1",
                "name": "First Project",
                "description": "Description 1",
                "longDescription": "Long desc 1",
                "tech": ["Python"],
                "company": "Company A",
                "featured": True,
                "status": "PUBLISHED",
                "githubUrl": "https://github.com/test/proj1",
                "liveUrl": None,
                "imageUrl": None,
                "createdAt": "2024-01-15T10:00:00Z",
                "updatedAt": "2024-01-15T10:00:00Z",
            },
            {
                "id": "project-2",
                "name": "Second Project",
                "description": "Description 2",
                "longDescription": None,
                "tech": ["FastAPI", "AWS"],
                "company": None,
                "featured": False,
                "status": "PUBLISHED",
                "githubUrl": None,
                "liveUrl": "https://demo2.example.com",
                "imageUrl": None,
                "createdAt": "2024-01-16T10:00:00Z",
                "updatedAt": "2024-01-16T10:00:00Z",
            },
        ],
        "count": 2,
        "lastEvaluatedKey": None,
    }


class TestListProjects:
    """Tests for GET /projects endpoint."""

    def test_list_projects_default(
        self,
        test_client,
        override_get_project_repository,
        mock_project_repo,
        sample_project_list_response,
    ):
        """Test listing projects with default filters (published only)."""
        mock_project_repo.list_projects.return_value = sample_project_list_response

        response = test_client.get("/projects")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["count"] == 2
        assert len(data["items"]) == 2

    def test_list_projects_featured_only(
        self,
        test_client,
        override_get_project_repository,
        mock_project_repo,
        sample_project_list_response,
    ):
        """Test listing featured projects only."""
        mock_project_repo.list_projects.return_value = sample_project_list_response

        response = test_client.get("/projects?featured=true")

        assert response.status_code == status.HTTP_200_OK
        call_args = mock_project_repo.list_projects.call_args
        assert call_args.kwargs["featured"] is True

    def test_list_projects_with_status_filter(
        self,
        test_client,
        override_get_project_repository,
        mock_project_repo,
        sample_project_list_response,
    ):
        """Test listing projects with status filter."""
        mock_project_repo.list_projects.return_value = sample_project_list_response

        response = test_client.get("/projects?status=DRAFT")

        assert response.status_code == status.HTTP_200_OK
        call_args = mock_project_repo.list_projects.call_args
        assert call_args.kwargs["status"] == "DRAFT"

    def test_list_projects_invalid_status(
        self, test_client, override_get_project_repository, mock_project_repo
    ):
        """Test listing projects with invalid status filter."""
        response = test_client.get("/projects?status=INVALID")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestGetProject:
    """Tests for GET /projects/{project_id} endpoint."""

    def test_get_published_project(
        self, test_client, override_get_project_repository, mock_project_repo, sample_project
    ):
        """Test getting a published project."""
        mock_project_repo.get_by_id.return_value = sample_project

        response = test_client.get("/projects/test-project-123")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == "test-project-123"
        assert data["name"] == "Test Project"
        assert data["status"] == "PUBLISHED"

    def test_get_draft_project_as_public(
        self, test_client, override_get_project_repository, mock_project_repo, sample_project
    ):
        """Test that draft projects are not accessible to public."""
        draft_project = {**sample_project, "status": "DRAFT"}
        mock_project_repo.get_by_id.return_value = draft_project

        response = test_client.get("/projects/test-project-123")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_nonexistent_project(
        self, test_client, override_get_project_repository, mock_project_repo
    ):
        """Test getting a non-existent project."""
        mock_project_repo.get_by_id.return_value = None

        response = test_client.get("/projects/nonexistent-id")

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCreateProject:
    """Tests for POST /projects endpoint."""

    def test_create_project_success(
        self,
        test_client,
        override_get_project_repository,
        mock_project_repo,
        sample_project,
        mock_user_info,
    ):
        """Test creating a project as owner."""
        mock_project_repo.create.return_value = sample_project

        create_data = {
            "name": "Test Project",
            "description": "A test project description",
            "longDescription": "A longer description",
            "tech": ["Python", "FastAPI"],
            "company": "Test Company",
            "featured": False,
            "githubUrl": "https://github.com/test/project",
            "liveUrl": "https://demo.example.com",
            "imageUrl": None,
        }

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.post(
                "/projects", json=create_data, headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "Test Project"

    def test_create_project_without_auth(
        self, test_client, override_get_project_repository, mock_project_repo
    ):
        """Test creating a project without authentication."""
        create_data = {"name": "Test Project", "description": "Description", "tech": []}

        response = test_client.post("/projects", json=create_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_project_as_non_owner(
        self,
        test_client,
        override_get_project_repository,
        mock_project_repo,
        mock_visitor_user_info,
    ):
        """Test creating a project as non-owner user."""
        create_data = {"name": "Test Project", "description": "Description", "tech": []}

        with patch("src.dependencies.extract_user_from_token", return_value=mock_visitor_user_info):
            response = test_client.post(
                "/projects", json=create_data, headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestUpdateProject:
    """Tests for PUT /projects/{project_id} endpoint."""

    def test_update_project_success(
        self,
        test_client,
        override_get_project_repository,
        mock_project_repo,
        sample_project,
        mock_user_info,
    ):
        """Test updating a project."""
        updated_project = {**sample_project, "name": "Updated Project Name"}
        mock_project_repo.update.return_value = updated_project

        update_data = {"name": "Updated Project Name"}

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.put(
                "/projects/test-project-123",
                json=update_data,
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Updated Project Name"

    def test_update_nonexistent_project(
        self, test_client, override_get_project_repository, mock_project_repo, mock_user_info
    ):
        """Test updating a non-existent project."""
        mock_project_repo.update.return_value = None

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.put(
                "/projects/nonexistent-id",
                json={"name": "New Name"},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_project_empty_data(
        self, test_client, override_get_project_repository, mock_project_repo, mock_user_info
    ):
        """Test updating with no fields."""
        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.put(
                "/projects/test-project-123",
                json={},
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestDeleteProject:
    """Tests for DELETE /projects/{project_id} endpoint."""

    def test_delete_project_success(
        self, test_client, override_get_project_repository, mock_project_repo, mock_user_info
    ):
        """Test deleting a project."""
        mock_project_repo.delete.return_value = True

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.delete(
                "/projects/test-project-123", headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_nonexistent_project(
        self, test_client, override_get_project_repository, mock_project_repo, mock_user_info
    ):
        """Test deleting a non-existent project."""
        mock_project_repo.delete.return_value = False

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.delete(
                "/projects/nonexistent-id", headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestPublishProject:
    """Tests for POST /projects/{project_id}/publish endpoint."""

    def test_publish_project_success(
        self,
        test_client,
        override_get_project_repository,
        mock_project_repo,
        sample_project,
        mock_user_info,
    ):
        """Test publishing a draft project."""
        mock_project_repo.publish.return_value = sample_project

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.post(
                "/projects/test-project-123/publish",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "PUBLISHED"

    def test_publish_nonexistent_project(
        self, test_client, override_get_project_repository, mock_project_repo, mock_user_info
    ):
        """Test publishing a non-existent project."""
        mock_project_repo.publish.return_value = None

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.post(
                "/projects/nonexistent-id/publish", headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestUnpublishProject:
    """Tests for POST /projects/{project_id}/unpublish endpoint."""

    def test_unpublish_project_success(
        self,
        test_client,
        override_get_project_repository,
        mock_project_repo,
        sample_project,
        mock_user_info,
    ):
        """Test unpublishing a published project."""
        draft_project = {**sample_project, "status": "DRAFT"}
        mock_project_repo.unpublish.return_value = draft_project

        with patch("src.dependencies.extract_user_from_token", return_value=mock_user_info):
            response = test_client.post(
                "/projects/test-project-123/unpublish",
                headers={"Authorization": "Bearer valid-token"},
            )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "DRAFT"
