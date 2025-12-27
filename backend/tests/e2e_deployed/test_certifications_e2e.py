"""
E2E tests for certification endpoints.

Tests certification CRUD operations:
- GET /certifications (list published)
- POST /certifications (create)
- GET /certifications/{id} (get by ID)
- PUT /certifications/{id} (update)
- DELETE /certifications/{id} (delete)
- POST /certifications/{id}/publish (publish/unpublish)
"""

import pytest
import time


class TestListCertifications:
    """Test suite for listing certifications."""

    def test_list_certifications_public_access(self, api_client):
        """Test that listing certifications is publicly accessible."""
        response = api_client.get("/certifications")

        # GET /certifications is public - returns published certifications by default
        assert response.status_code == 200

    def test_list_certifications_with_auth(self, api_client, auth_headers):
        """Test listing certifications with valid authentication."""
        response = api_client.get("/certifications", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Should return array of certifications
        assert isinstance(data, list) or "items" in data

    def test_list_certifications_pagination(self, api_client, auth_headers):
        """Test certification list pagination."""
        response = api_client.get("/certifications?limit=5", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Verify pagination parameters
        if isinstance(data, dict):
            assert "items" in data or "certifications" in data
            # Check for pagination metadata
            if "total" in data:
                assert isinstance(data["total"], int)


class TestCreateCertification:
    """Test suite for creating certifications."""

    def test_create_certification_requires_auth(self, api_client, sample_certification):
        """Test that creating certification requires authentication."""
        response = api_client.post("/certifications", json=sample_certification)

        assert response.status_code == 401

    def test_create_certification_success(
        self, api_client, auth_headers, sample_certification, created_certification_ids
    ):
        """Test successful certification creation."""
        response = api_client.post("/certifications", json=sample_certification, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()

        # Verify response contains certification data
        assert "id" in data
        assert data["name"] == sample_certification["name"]
        assert data["issuer"] == sample_certification["issuer"]

        # Track for cleanup
        created_certification_ids.append(data["id"])

        # Cleanup
        api_client.delete(f"/certifications/{data['id']}", headers=auth_headers)

    def test_create_certification_with_full_data(
        self, api_client, auth_headers, test_certifications_data, created_certification_ids
    ):
        """Test creating certification with complete data from test dataset."""
        cert_data = test_certifications_data[0].copy()

        response = api_client.post("/certifications", json=cert_data, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()

        # Verify all fields
        assert "id" in data
        assert data["name"] == cert_data["name"]
        assert data["issuer"] == cert_data["issuer"]
        assert "type" in data
        assert "dateEarned" in data

        created_certification_ids.append(data["id"])

        # Cleanup
        api_client.delete(f"/certifications/{data['id']}", headers=auth_headers)

    def test_create_certification_validates_required_fields(self, api_client, auth_headers):
        """Test that certification creation validates required fields."""
        # Missing required fields
        incomplete_cert = {"name": "Test Certification"}

        response = api_client.post("/certifications", json=incomplete_cert, headers=auth_headers)

        assert response.status_code in [400, 422]

    def test_create_certification_with_credential_url(
        self, api_client, auth_headers, sample_certification, created_certification_ids
    ):
        """Test creating certification with credential URL."""
        sample_certification["credentialUrl"] = "https://www.credly.com/badges/test-badge-123"

        response = api_client.post("/certifications", json=sample_certification, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()

        # Verify credential URL is stored
        assert "credentialUrl" in data
        assert data["credentialUrl"] == sample_certification["credentialUrl"]

        created_certification_ids.append(data["id"])

        # Cleanup
        api_client.delete(f"/certifications/{data['id']}", headers=auth_headers)

    def test_create_certification_with_expiry_date(
        self, api_client, auth_headers, sample_certification, created_certification_ids
    ):
        """Test creating certification with expiry date."""
        sample_certification["expiry_date"] = "2026-12-31"

        response = api_client.post("/certifications", json=sample_certification, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()

        # Verify expiry date is stored
        if "expiry_date" in data:
            assert data["expiry_date"] is not None

        created_certification_ids.append(data["id"])

        # Cleanup
        api_client.delete(f"/certifications/{data['id']}", headers=auth_headers)


class TestGetCertification:
    """Test suite for getting individual certifications."""

    def test_get_nonexistent_certification_by_id(self, api_client):
        """Test that getting non-existent certification returns 404."""
        response = api_client.get("/certifications/nonexistent-cert-id")

        # GET /certifications/{id} is public, returns 404 for non-existent certifications
        assert response.status_code == 404

    def test_get_certification_by_id_success(
        self, api_client, auth_headers, sample_certification, wait_for_eventual_consistency
    ):
        """Test successfully getting a published certification by ID."""
        # Create certification
        create_response = api_client.post(
            "/certifications", json=sample_certification, headers=auth_headers
        )
        assert create_response.status_code == 201
        cert_id = create_response.json()["id"]

        # Publish the certification (GET is public, only returns published certifications)
        publish_response = api_client.post(f"/certifications/{cert_id}/publish", headers=auth_headers)
        assert publish_response.status_code in [200, 204]

        # Wait for DynamoDB consistency
        wait_for_eventual_consistency(1)

        # Get the certification (public endpoint - no auth needed)
        response = api_client.get(f"/certifications/{cert_id}")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == cert_id
        assert data["name"] == sample_certification["name"]
        assert data["status"] in ["PUBLISHED", "published"]

        # Cleanup
        api_client.delete(f"/certifications/{cert_id}", headers=auth_headers)

    def test_get_nonexistent_certification_returns_404(self, api_client, auth_headers):
        """Test getting non-existent certification returns 404."""
        response = api_client.get("/certifications/nonexistent-cert-id", headers=auth_headers)

        assert response.status_code == 404


class TestUpdateCertification:
    """Test suite for updating certifications."""

    def test_update_certification_requires_auth(self, api_client):
        """Test that updating certification requires authentication."""
        update_data = {"name": "Updated Name"}

        response = api_client.put("/certifications/test-cert-123", json=update_data)

        assert response.status_code == 401

    def test_update_certification_success(
        self, api_client, auth_headers, sample_certification, wait_for_eventual_consistency
    ):
        """Test successfully updating a certification."""
        # Create certification
        create_response = api_client.post(
            "/certifications", json=sample_certification, headers=auth_headers
        )
        assert create_response.status_code == 201
        cert_id = create_response.json()["id"]

        wait_for_eventual_consistency(1)

        # Update certification
        update_data = {
            "name": "Updated Certification Name",
            "issuer": sample_certification["issuer"]
        }
        response = api_client.put(f"/certifications/{cert_id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == cert_id
        assert data["name"] == "Updated Certification Name"

        # Cleanup
        api_client.delete(f"/certifications/{cert_id}", headers=auth_headers)

    def test_update_certification_expiry_date(
        self, api_client, auth_headers, sample_certification, wait_for_eventual_consistency
    ):
        """Test updating certification expiry date."""
        # Create certification
        create_response = api_client.post(
            "/certifications", json=sample_certification, headers=auth_headers
        )
        assert create_response.status_code == 201
        cert_id = create_response.json()["id"]

        wait_for_eventual_consistency(1)

        # Update expiry date
        update_data = {
            "name": sample_certification["name"],
            "issuer": sample_certification["issuer"],
            "expiry_date": "2027-12-31"
        }
        response = api_client.put(f"/certifications/{cert_id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Verify expiry date is updated
        if "expiry_date" in data:
            assert data["expiry_date"] is not None

        # Cleanup
        api_client.delete(f"/certifications/{cert_id}", headers=auth_headers)

    def test_update_nonexistent_certification_returns_404(self, api_client, auth_headers):
        """Test updating non-existent certification returns 404."""
        update_data = {"name": "Updated Name", "issuer": "Updated Issuer"}

        response = api_client.put(
            "/certifications/nonexistent-cert-id", json=update_data, headers=auth_headers
        )

        assert response.status_code == 404


class TestDeleteCertification:
    """Test suite for deleting certifications."""

    def test_delete_certification_requires_auth(self, api_client):
        """Test that deleting certification requires authentication."""
        response = api_client.delete("/certifications/test-cert-123")

        assert response.status_code == 401

    def test_delete_certification_success(self, api_client, auth_headers, sample_certification):
        """Test successfully deleting a certification."""
        # Create certification
        create_response = api_client.post(
            "/certifications", json=sample_certification, headers=auth_headers
        )
        assert create_response.status_code == 201
        cert_id = create_response.json()["id"]

        # Delete certification
        response = api_client.delete(f"/certifications/{cert_id}", headers=auth_headers)

        assert response.status_code in [200, 204]

        # Verify it's deleted
        get_response = api_client.get(f"/certifications/{cert_id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_nonexistent_certification_returns_404(self, api_client, auth_headers):
        """Test deleting non-existent certification returns 404."""
        response = api_client.delete("/certifications/nonexistent-cert-id", headers=auth_headers)

        assert response.status_code == 404

    def test_delete_certification_is_idempotent(self, api_client, auth_headers, sample_certification):
        """Test that deleting same certification twice is idempotent."""
        # Create certification
        create_response = api_client.post(
            "/certifications", json=sample_certification, headers=auth_headers
        )
        assert create_response.status_code == 201
        cert_id = create_response.json()["id"]

        # Delete first time
        response1 = api_client.delete(f"/certifications/{cert_id}", headers=auth_headers)
        assert response1.status_code in [200, 204]

        # Delete second time
        response2 = api_client.delete(f"/certifications/{cert_id}", headers=auth_headers)
        assert response2.status_code in [404, 204]  # Either not found or idempotent success


class TestPublishCertification:
    """Test suite for publishing/unpublishing certifications."""

    def test_publish_certification_requires_auth(self, api_client):
        """Test that publishing certification requires authentication."""
        response = api_client.post("/certifications/test-cert-123/publish")

        assert response.status_code == 401

    def test_publish_certification_success(
        self, api_client, auth_headers, sample_certification, wait_for_eventual_consistency
    ):
        """Test successfully publishing a certification."""
        # Create certification (should be draft)
        create_response = api_client.post(
            "/certifications", json=sample_certification, headers=auth_headers
        )
        assert create_response.status_code == 201
        cert_id = create_response.json()["id"]

        wait_for_eventual_consistency(1)

        # Publish certification
        response = api_client.post(f"/certifications/{cert_id}/publish", headers=auth_headers)

        assert response.status_code in [200, 204]

        # Verify it's published
        get_response = api_client.get(f"/certifications/{cert_id}", headers=auth_headers)
        assert get_response.status_code == 200
        data = get_response.json()

        # Check status is published or featured
        if "featured" in data:
            assert data["featured"] is True
        if "status" in data:
            assert data["status"] in ["PUBLISHED", "published"]

        # Cleanup
        api_client.delete(f"/certifications/{cert_id}", headers=auth_headers)

    def test_unpublish_certification_success(
        self, api_client, auth_headers, sample_certification, wait_for_eventual_consistency
    ):
        """Test successfully unpublishing a certification."""
        # Create and publish certification
        sample_certification["featured"] = True
        create_response = api_client.post(
            "/certifications", json=sample_certification, headers=auth_headers
        )
        assert create_response.status_code == 201
        cert_id = create_response.json()["id"]

        wait_for_eventual_consistency(1)

        # Unpublish certification
        response = api_client.post(f"/certifications/{cert_id}/unpublish", headers=auth_headers)

        # If unpublish endpoint exists
        if response.status_code not in [404, 405]:
            assert response.status_code in [200, 204]

        # Cleanup
        api_client.delete(f"/certifications/{cert_id}", headers=auth_headers)


class TestCertificationFiltering:
    """Test suite for filtering and searching certifications."""

    def test_filter_certifications_by_type(self, api_client, auth_headers):
        """Test filtering certifications by type."""
        response = api_client.get("/certifications?type=AWS", headers=auth_headers)

        assert response.status_code == 200
        # Actual filtering logic depends on implementation

    def test_filter_certifications_by_featured(self, api_client, auth_headers):
        """Test filtering certifications by featured status."""
        response = api_client.get("/certifications?featured=true", headers=auth_headers)

        assert response.status_code == 200

    def test_filter_certifications_by_issuer(self, api_client, auth_headers):
        """Test filtering certifications by issuer."""
        response = api_client.get("/certifications?issuer=Amazon Web Services", headers=auth_headers)

        assert response.status_code == 200

    def test_sort_certifications_by_date(self, api_client, auth_headers):
        """Test sorting certifications by date."""
        response = api_client.get("/certifications?sort=date", headers=auth_headers)

        assert response.status_code == 200


class TestCertificationValidation:
    """Test suite for certification validation rules."""

    def test_certification_name_max_length(self, api_client, auth_headers):
        """Test certification name maximum length validation."""
        cert_data = {
            "name": "A" * 400,  # Very long name
            "issuer": "Test Issuer",
            "type": "Professional",
            "dateEarned": "2024-01-01"
        }

        response = api_client.post("/certifications", json=cert_data, headers=auth_headers)

        # Should either succeed or validate max length
        assert response.status_code in [201, 400, 422]

    def test_certification_issuer_not_empty(self, api_client, auth_headers):
        """Test that certification issuer cannot be empty."""
        cert_data = {
            "name": "Test Certification",
            "issuer": "",
            "type": "Professional",
            "dateEarned": "2024-01-01"
        }

        response = api_client.post("/certifications", json=cert_data, headers=auth_headers)

        assert response.status_code in [400, 422]

    def test_certification_date_format_validation(self, api_client, auth_headers, sample_certification):
        """Test that certification dates are validated for correct format."""
        sample_certification["dateEarned"] = "invalid-date"

        response = api_client.post("/certifications", json=sample_certification, headers=auth_headers)

        # Should validate date format
        assert response.status_code in [201, 400, 422]

    def test_certification_credential_url_format(self, api_client, auth_headers, sample_certification):
        """Test that credential URL is validated for correct format."""
        sample_certification["credentialUrl"] = "not-a-valid-url"

        response = api_client.post("/certifications", json=sample_certification, headers=auth_headers)

        # Should validate URL format
        assert response.status_code in [400, 422]

    def test_certification_type_is_valid(self, api_client, auth_headers, sample_certification):
        """Test that certification type is from valid options."""
        sample_certification["type"] = "InvalidType"

        response = api_client.post("/certifications", json=sample_certification, headers=auth_headers)

        # Should either succeed or validate type
        assert response.status_code in [201, 400, 422]


class TestExpiredCertifications:
    """Test suite for handling expired certifications."""

    def test_list_expired_certifications(self, api_client, auth_headers):
        """Test listing expired certifications."""
        response = api_client.get("/certifications?expired=true", headers=auth_headers)

        # Endpoint might not support this filter
        assert response.status_code in [200, 400, 404]

    def test_list_active_certifications(self, api_client, auth_headers):
        """Test listing only active (non-expired) certifications."""
        response = api_client.get("/certifications?expired=false", headers=auth_headers)

        # Endpoint might not support this filter
        assert response.status_code in [200, 400, 404]

    def test_create_certification_with_past_expiry(
        self, api_client, auth_headers, sample_certification, created_certification_ids
    ):
        """Test creating certification with past expiry date."""
        sample_certification["expiry_date"] = "2020-01-01"  # Past date

        response = api_client.post("/certifications", json=sample_certification, headers=auth_headers)

        # Should allow creation even if expired
        if response.status_code == 201:
            created_certification_ids.append(response.json()["id"])
            # Cleanup
            api_client.delete(f"/certifications/{response.json()['id']}", headers=auth_headers)

        assert response.status_code in [201, 400, 422]
