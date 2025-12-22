"""
Unit tests for Certifications API endpoints.

Tests all certification-related endpoints including:
- List certifications with filters and pagination
- Get single certification
- Create, update, delete certifications
- Publish/unpublish workflows
"""

import pytest
from unittest.mock import Mock, patch
from fastapi import status


@pytest.fixture
def mock_cert_repo():
    """Mock certification repository."""
    repo = Mock()
    repo.list_certifications = Mock()
    repo.get_by_id = Mock()
    repo.create = Mock()
    repo.update = Mock()
    repo.delete = Mock()
    repo.publish = Mock()
    repo.unpublish = Mock()
    return repo


@pytest.fixture
def sample_certification():
    """Sample certification data from repository."""
    return {
        "id": "test-cert-123",
        "name": "AWS Certified Solutions Architect",
        "issuer": "Amazon Web Services",
        "icon": "aws-icon",
        "type": "certification",
        "featured": True,
        "status": "PUBLISHED",
        "description": "Professional level AWS certification",
        "credentialUrl": "https://aws.amazon.com/verify/cert123",
        "dateEarned": "2024-01-15",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
    }


@pytest.fixture
def sample_cert_list_response():
    """Sample certification list response from repository."""
    return {
        "items": [
            {
                "id": "cert-1",
                "name": "Certification 1",
                "issuer": "Issuer A",
                "icon": "icon-1",
                "type": "certification",
                "featured": True,
                "status": "PUBLISHED",
                "description": "Desc 1",
                "credentialUrl": None,
                "dateEarned": "2024-01-15",
                "createdAt": "2024-01-15T10:00:00Z",
                "updatedAt": "2024-01-15T10:00:00Z"
            }
        ],
        "count": 1,
        "lastEvaluatedKey": None
    }


class TestListCertifications:
    """Tests for GET /certifications endpoint."""

    def test_list_certifications_default(self, test_client, override_get_certification_repository, mock_cert_repo, sample_cert_list_response):
        """Test listing certifications with default filters."""
        mock_cert_repo.list_certifications.return_value = sample_cert_list_response

        response = test_client.get("/certifications")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["count"] == 1

    def test_list_certifications_by_type(self, test_client, override_get_certification_repository, mock_cert_repo, sample_cert_list_response):
        """Test listing certifications by type."""
        mock_cert_repo.list_certifications.return_value = sample_cert_list_response

        response = test_client.get("/certifications?cert_type=course")

        assert response.status_code == status.HTTP_200_OK
        call_args = mock_cert_repo.list_certifications.call_args
        assert call_args.kwargs['cert_type'] == 'course'

    def test_list_certifications_invalid_type(self, test_client, override_get_certification_repository, mock_cert_repo):
        """Test listing certifications with invalid type."""
        response = test_client.get("/certifications?cert_type=invalid")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestGetCertification:
    """Tests for GET /certifications/{cert_id} endpoint."""

    def test_get_published_certification(self, test_client, override_get_certification_repository, mock_cert_repo, sample_certification):
        """Test getting a published certification."""
        mock_cert_repo.get_by_id.return_value = sample_certification

        response = test_client.get("/certifications/test-cert-123")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == "test-cert-123"

    def test_get_draft_certification_as_public(self, test_client, override_get_certification_repository, mock_cert_repo, sample_certification):
        """Test that draft certifications are not accessible to public."""
        draft_cert = {**sample_certification, "status": "DRAFT"}
        mock_cert_repo.get_by_id.return_value = draft_cert

        response = test_client.get("/certifications/test-cert-123")

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestCreateCertification:
    """Tests for POST /certifications endpoint."""

    def test_create_certification_success(self, test_client, override_get_certification_repository, mock_cert_repo, sample_certification, mock_user_info):
        """Test creating a certification as owner."""
        mock_cert_repo.create.return_value = sample_certification

        create_data = {
            "name": "AWS Certified Solutions Architect",
            "issuer": "Amazon Web Services",
            "icon": "aws-icon",
            "type": "certification",
            "featured": True,
            "description": "Professional level AWS certification",
            "credentialUrl": "https://aws.amazon.com/verify/cert123",
            "dateEarned": "2024-01-15"
        }

        with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
            response = test_client.post(
                "/certifications",
                json=create_data,
                headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_201_CREATED


class TestUpdateCertification:
    """Tests for PUT /certifications/{cert_id} endpoint."""

    def test_update_certification_success(self, test_client, override_get_certification_repository, mock_cert_repo, sample_certification, mock_user_info):
        """Test updating a certification."""
        updated_cert = {**sample_certification, "name": "Updated Cert Name"}
        mock_cert_repo.update.return_value = updated_cert

        with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
            response = test_client.put(
                "/certifications/test-cert-123",
                json={"name": "Updated Cert Name"},
                headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_200_OK


class TestDeleteCertification:
    """Tests for DELETE /certifications/{cert_id} endpoint."""

    def test_delete_certification_success(self, test_client, override_get_certification_repository, mock_cert_repo, mock_user_info):
        """Test deleting a certification."""
        mock_cert_repo.delete.return_value = True

        with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
            response = test_client.delete(
                "/certifications/test-cert-123",
                headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_204_NO_CONTENT


class TestPublishCertification:
    """Tests for POST /certifications/{cert_id}/publish endpoint."""

    def test_publish_certification_success(self, test_client, override_get_certification_repository, mock_cert_repo, sample_certification, mock_user_info):
        """Test publishing a certification."""
        mock_cert_repo.publish.return_value = sample_certification

        with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
            response = test_client.post(
                "/certifications/test-cert-123/publish",
                headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_200_OK


class TestUnpublishCertification:
    """Tests for POST /certifications/{cert_id}/unpublish endpoint."""

    def test_unpublish_certification_success(self, test_client, override_get_certification_repository, mock_cert_repo, sample_certification, mock_user_info):
        """Test unpublishing a certification."""
        draft_cert = {**sample_certification, "status": "DRAFT"}
        mock_cert_repo.unpublish.return_value = draft_cert

        with patch('src.dependencies.extract_user_from_token', return_value=mock_user_info):
            response = test_client.post(
                "/certifications/test-cert-123/unpublish",
                headers={"Authorization": "Bearer valid-token"}
            )

        assert response.status_code == status.HTTP_200_OK
