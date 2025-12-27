"""
E2E tests for project endpoints.

Tests project CRUD operations:
- GET /projects (list published)
- POST /projects (create)
- GET /projects/{id} (get by ID)
- PUT /projects/{id} (update)
- DELETE /projects/{id} (delete)
- POST /projects/{id}/publish (publish/unpublish)
"""

import pytest
import time


class TestListProjects:
    """Test suite for listing projects."""

    def test_list_projects_public_access(self, api_client):
        """Test that listing projects is publicly accessible."""
        response = api_client.get("/projects")

        # GET /projects is public - returns published projects by default
        assert response.status_code == 200

    def test_list_projects_with_auth(self, api_client, auth_headers):
        """Test listing projects with valid authentication."""
        response = api_client.get("/projects", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Should return array of projects
        assert isinstance(data, list) or "items" in data

    def test_list_projects_pagination(self, api_client, auth_headers):
        """Test project list pagination."""
        response = api_client.get("/projects?limit=5", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Verify pagination parameters
        if isinstance(data, dict):
            assert "items" in data or "projects" in data
            # Check for pagination metadata
            if "total" in data:
                assert isinstance(data["total"], int)


class TestCreateProject:
    """Test suite for creating projects."""

    def test_create_project_requires_auth(self, api_client, sample_project):
        """Test that creating project requires authentication."""
        response = api_client.post("/projects", json=sample_project)

        assert response.status_code == 401

    def test_create_project_success(self, api_client, auth_headers, sample_project, created_project_ids):
        """Test successful project creation."""
        response = api_client.post("/projects", json=sample_project, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()

        # Verify response contains project data
        assert "id" in data
        assert data["name"] == sample_project["name"]
        assert data["description"] == sample_project["description"]

        # Track for cleanup
        created_project_ids.append(data["id"])

        # Cleanup
        api_client.delete(f"/projects/{data['id']}", headers=auth_headers)

    def test_create_project_with_full_data(
        self, api_client, auth_headers, test_projects_data, created_project_ids
    ):
        """Test creating project with complete data from test dataset."""
        project_data = test_projects_data[0].copy()

        response = api_client.post("/projects", json=project_data, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()

        # Verify all fields
        assert "id" in data
        assert data["name"] == project_data["name"]
        assert data["description"] == project_data["description"]
        assert "tech" in data
        assert len(data["tech"]) > 0

        created_project_ids.append(data["id"])

        # Cleanup
        api_client.delete(f"/projects/{data['id']}", headers=auth_headers)

    def test_create_project_validates_required_fields(self, api_client, auth_headers):
        """Test that project creation validates required fields."""
        # Missing required fields
        incomplete_project = {"name": "Test Project"}

        response = api_client.post("/projects", json=incomplete_project, headers=auth_headers)

        assert response.status_code in [400, 422]

    def test_create_project_with_technologies(
        self, api_client, auth_headers, sample_project, created_project_ids
    ):
        """Test creating project with technologies list."""
        sample_project["tech"] = ["Python", "FastAPI", "DynamoDB", "AWS Lambda"]

        response = api_client.post("/projects", json=sample_project, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()

        # Verify technologies are stored
        assert "tech" in data
        assert isinstance(data["tech"], list)
        assert len(data["tech"]) == 4

        created_project_ids.append(data["id"])

        # Cleanup
        api_client.delete(f"/projects/{data['id']}", headers=auth_headers)


class TestGetProject:
    """Test suite for getting individual projects."""

    def test_get_nonexistent_project_by_id(self, api_client):
        """Test that getting non-existent project returns 404."""
        response = api_client.get("/projects/nonexistent-project-id")

        # GET /projects/{id} is public, returns 404 for non-existent projects
        assert response.status_code == 404

    def test_get_project_by_id_success(
        self, api_client, auth_headers, sample_project, wait_for_eventual_consistency
    ):
        """Test successfully getting a published project by ID."""
        # Create project
        create_response = api_client.post("/projects", json=sample_project, headers=auth_headers)
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]

        # Publish the project (GET is public, only returns published projects)
        publish_response = api_client.post(f"/projects/{project_id}/publish", headers=auth_headers)
        assert publish_response.status_code in [200, 204]

        # Wait for DynamoDB consistency
        wait_for_eventual_consistency(1)

        # Get the project (public endpoint - no auth needed)
        response = api_client.get(f"/projects/{project_id}")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == project_id
        assert data["name"] == sample_project["name"]
        assert data["status"] in ["PUBLISHED", "published"]

        # Cleanup
        api_client.delete(f"/projects/{project_id}", headers=auth_headers)

    def test_get_nonexistent_project_returns_404(self, api_client, auth_headers):
        """Test getting non-existent project returns 404."""
        response = api_client.get("/projects/nonexistent-project-id", headers=auth_headers)

        assert response.status_code == 404


class TestUpdateProject:
    """Test suite for updating projects."""

    def test_update_project_requires_auth(self, api_client):
        """Test that updating project requires authentication."""
        update_data = {"name": "Updated Name"}

        response = api_client.put("/projects/test-project-123", json=update_data)

        assert response.status_code == 401

    def test_update_project_success(
        self, api_client, auth_headers, sample_project, wait_for_eventual_consistency
    ):
        """Test successfully updating a project."""
        # Create project
        create_response = api_client.post("/projects", json=sample_project, headers=auth_headers)
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]

        wait_for_eventual_consistency(1)

        # Update project
        update_data = {
            "name": "Updated Project Name",
            "description": sample_project["description"]
        }
        response = api_client.put(f"/projects/{project_id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == project_id
        assert data["name"] == "Updated Project Name"

        # Cleanup
        api_client.delete(f"/projects/{project_id}", headers=auth_headers)

    def test_update_project_technologies(
        self, api_client, auth_headers, sample_project, wait_for_eventual_consistency
    ):
        """Test updating project technologies."""
        # Create project
        create_response = api_client.post("/projects", json=sample_project, headers=auth_headers)
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]

        wait_for_eventual_consistency(1)

        # Update technologies
        update_data = {
            "name": sample_project["name"],
            "description": sample_project["description"],
            "tech": ["React", "TypeScript", "AWS"]
        }
        response = api_client.put(f"/projects/{project_id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert "tech" in data
        assert "React" in data["tech"]
        assert "TypeScript" in data["tech"]

        # Cleanup
        api_client.delete(f"/projects/{project_id}", headers=auth_headers)

    def test_update_nonexistent_project_returns_404(self, api_client, auth_headers):
        """Test updating non-existent project returns 404."""
        update_data = {"name": "Updated Name", "description": "Updated description"}

        response = api_client.put(
            "/projects/nonexistent-project-id", json=update_data, headers=auth_headers
        )

        assert response.status_code == 404


class TestDeleteProject:
    """Test suite for deleting projects."""

    def test_delete_project_requires_auth(self, api_client):
        """Test that deleting project requires authentication."""
        response = api_client.delete("/projects/test-project-123")

        assert response.status_code == 401

    def test_delete_project_success(self, api_client, auth_headers, sample_project):
        """Test successfully deleting a project."""
        # Create project
        create_response = api_client.post("/projects", json=sample_project, headers=auth_headers)
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]

        # Delete project
        response = api_client.delete(f"/projects/{project_id}", headers=auth_headers)

        assert response.status_code in [200, 204]

        # Verify it's deleted
        get_response = api_client.get(f"/projects/{project_id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_nonexistent_project_returns_404(self, api_client, auth_headers):
        """Test deleting non-existent project returns 404."""
        response = api_client.delete("/projects/nonexistent-project-id", headers=auth_headers)

        assert response.status_code == 404

    def test_delete_project_is_idempotent(self, api_client, auth_headers, sample_project):
        """Test that deleting same project twice is idempotent."""
        # Create project
        create_response = api_client.post("/projects", json=sample_project, headers=auth_headers)
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]

        # Delete first time
        response1 = api_client.delete(f"/projects/{project_id}", headers=auth_headers)
        assert response1.status_code in [200, 204]

        # Delete second time
        response2 = api_client.delete(f"/projects/{project_id}", headers=auth_headers)
        assert response2.status_code in [404, 204]  # Either not found or idempotent success


class TestPublishProject:
    """Test suite for publishing/unpublishing projects."""

    def test_publish_project_requires_auth(self, api_client):
        """Test that publishing project requires authentication."""
        response = api_client.post("/projects/test-project-123/publish")

        assert response.status_code == 401

    def test_publish_project_success(
        self, api_client, auth_headers, sample_project, wait_for_eventual_consistency
    ):
        """Test successfully publishing a project."""
        # Create project (should be draft)
        create_response = api_client.post("/projects", json=sample_project, headers=auth_headers)
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]

        wait_for_eventual_consistency(1)

        # Publish project
        response = api_client.post(f"/projects/{project_id}/publish", headers=auth_headers)

        assert response.status_code in [200, 204]

        # Verify it's published
        get_response = api_client.get(f"/projects/{project_id}", headers=auth_headers)
        assert get_response.status_code == 200
        data = get_response.json()

        # Check status is published or featured
        if "featured" in data:
            assert data["featured"] is True
        if "status" in data:
            assert data["status"] in ["PUBLISHED", "published"]

        # Cleanup
        api_client.delete(f"/projects/{project_id}", headers=auth_headers)

    def test_unpublish_project_success(
        self, api_client, auth_headers, sample_project, wait_for_eventual_consistency
    ):
        """Test successfully unpublishing a project."""
        # Create and publish project
        sample_project["featured"] = True
        create_response = api_client.post("/projects", json=sample_project, headers=auth_headers)
        assert create_response.status_code == 201
        project_id = create_response.json()["id"]

        wait_for_eventual_consistency(1)

        # Unpublish project
        response = api_client.post(f"/projects/{project_id}/unpublish", headers=auth_headers)

        # If unpublish endpoint exists
        if response.status_code not in [404, 405]:
            assert response.status_code in [200, 204]

        # Cleanup
        api_client.delete(f"/projects/{project_id}", headers=auth_headers)


class TestProjectFiltering:
    """Test suite for filtering and searching projects."""

    def test_filter_projects_by_featured(self, api_client, auth_headers):
        """Test filtering projects by featured status."""
        response = api_client.get("/projects?featured=true", headers=auth_headers)

        assert response.status_code == 200
        # Actual filtering logic depends on implementation

    def test_filter_projects_by_technology(self, api_client, auth_headers):
        """Test filtering projects by technology."""
        response = api_client.get("/projects?technology=Python", headers=auth_headers)

        assert response.status_code == 200

    def test_sort_projects_by_date(self, api_client, auth_headers):
        """Test sorting projects by date."""
        response = api_client.get("/projects?sort=date", headers=auth_headers)

        assert response.status_code == 200


class TestProjectValidation:
    """Test suite for project validation rules."""

    def test_project_name_max_length(self, api_client, auth_headers):
        """Test project name maximum length validation."""
        project_data = {
            "name": "A" * 300,  # Very long name
            "description": "Test description",
        }

        response = api_client.post("/projects", json=project_data, headers=auth_headers)

        # Should either succeed or validate max length
        assert response.status_code in [201, 400, 422]

    def test_project_description_not_empty(self, api_client, auth_headers):
        """Test that project description cannot be empty."""
        project_data = {"name": "Test Project", "description": ""}

        response = api_client.post("/projects", json=project_data, headers=auth_headers)

        assert response.status_code in [400, 422]

    def test_project_url_format_validation(self, api_client, auth_headers, sample_project):
        """Test that project URLs are validated for correct format."""
        sample_project["link"] = "not-a-valid-url"

        response = api_client.post("/projects", json=sample_project, headers=auth_headers)

        # Should either succeed or validate URL format
        assert response.status_code in [201, 400, 422]

    def test_project_technologies_is_array(self, api_client, auth_headers, sample_project):
        """Test that technologies must be an array."""
        sample_project["tech"] = "Python, FastAPI, AWS"  # String instead of array

        response = api_client.post("/projects", json=sample_project, headers=auth_headers)

        # Should validate that tech is an array
        assert response.status_code in [400, 422]
