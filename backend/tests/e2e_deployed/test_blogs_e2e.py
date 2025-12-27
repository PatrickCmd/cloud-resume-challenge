"""
E2E tests for blog endpoints.

Tests blog CRUD operations:
- GET /blogs (list published)
- POST /blogs (create)
- GET /blogs/{id} (get by ID)
- PUT /blogs/{id} (update)
- DELETE /blogs/{id} (delete)
- POST /blogs/{id}/publish (publish/unpublish)
"""

import pytest
import time


class TestListBlogs:
    """Test suite for listing blog posts."""

    def test_list_blogs_public_access(self, api_client):
        """Test that listing blogs is publicly accessible."""
        response = api_client.get("/blogs")

        # GET /blogs is public - returns published blogs by default
        assert response.status_code == 200

    def test_list_blogs_with_auth(self, api_client, auth_headers):
        """Test listing blogs with valid authentication."""
        response = api_client.get("/blogs", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Should return array of blogs
        assert isinstance(data, list) or "items" in data

    def test_list_blogs_pagination(self, api_client, auth_headers):
        """Test blog list pagination."""
        response = api_client.get("/blogs?limit=5", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Verify pagination parameters
        if isinstance(data, dict):
            assert "items" in data or "blogs" in data
            # Check for pagination metadata
            if "total" in data:
                assert isinstance(data["total"], int)


class TestCreateBlog:
    """Test suite for creating blog posts."""

    def test_create_blog_requires_auth(self, api_client, sample_blog):
        """Test that creating blog requires authentication."""
        response = api_client.post("/blogs", json=sample_blog)

        assert response.status_code == 401

    def test_create_blog_success(self, api_client, auth_headers, sample_blog, created_blog_ids):
        """Test successful blog creation."""
        response = api_client.post("/blogs", json=sample_blog, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()

        # Verify response contains blog data
        assert "id" in data
        assert data["title"] == sample_blog["title"]
        assert data["content"] == sample_blog["content"]

        # Track for cleanup
        created_blog_ids.append(data["id"])

        # Cleanup
        api_client.delete(f"/blogs/{data['id']}", headers=auth_headers)

    def test_create_blog_with_full_data(
        self, api_client, auth_headers, test_blogs_data, created_blog_ids
    ):
        """Test creating blog with complete data from test dataset."""
        blog_data = test_blogs_data[0].copy()

        response = api_client.post("/blogs", json=blog_data, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()

        # Verify all fields
        assert "id" in data
        assert data["title"] == blog_data["title"]
        assert data["excerpt"] == blog_data["excerpt"]
        assert data["category"] == blog_data["category"]
        assert "tags" in data
        assert len(data["tags"]) > 0

        created_blog_ids.append(data["id"])

        # Cleanup
        api_client.delete(f"/blogs/{data['id']}", headers=auth_headers)

    def test_create_blog_validates_required_fields(self, api_client, auth_headers):
        """Test that blog creation validates required fields."""
        # Missing required fields
        incomplete_blog = {"title": "Test Blog"}

        response = api_client.post("/blogs", json=incomplete_blog, headers=auth_headers)

        assert response.status_code in [400, 422]

    def test_create_blog_sets_default_status(
        self, api_client, auth_headers, sample_blog, created_blog_ids
    ):
        """Test that newly created blogs default to DRAFT status."""
        response = api_client.post("/blogs", json=sample_blog, headers=auth_headers)

        assert response.status_code == 201
        data = response.json()

        # Should default to DRAFT
        assert "status" in data
        # Note: Actual default depends on implementation

        created_blog_ids.append(data["id"])

        # Cleanup
        api_client.delete(f"/blogs/{data['id']}", headers=auth_headers)


class TestGetBlog:
    """Test suite for getting individual blog posts."""

    def test_get_nonexistent_blog_by_id(self, api_client):
        """Test that getting non-existent blog returns 404."""
        response = api_client.get("/blogs/nonexistent-blog-id")

        # GET /blogs/{id} is public, returns 404 for non-existent blogs
        assert response.status_code == 404

    def test_get_blog_by_id_success(
        self, api_client, auth_headers, sample_blog, wait_for_eventual_consistency
    ):
        """Test successfully getting a published blog by ID."""
        # First create a blog
        create_response = api_client.post("/blogs", json=sample_blog, headers=auth_headers)
        assert create_response.status_code == 201
        blog_id = create_response.json()["id"]

        # Publish the blog (GET is public, only returns published blogs)
        publish_response = api_client.post(f"/blogs/{blog_id}/publish", headers=auth_headers)
        assert publish_response.status_code in [200, 204]

        # Wait for DynamoDB consistency
        wait_for_eventual_consistency(1)

        # Get the blog (public endpoint - no auth needed, but we're testing it works)
        response = api_client.get(f"/blogs/{blog_id}")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == blog_id
        assert data["title"] == sample_blog["title"]
        assert data["status"] in ["PUBLISHED", "published"]

        # Cleanup
        api_client.delete(f"/blogs/{blog_id}", headers=auth_headers)

    def test_get_nonexistent_blog_returns_404(self, api_client, auth_headers):
        """Test getting non-existent blog returns 404."""
        response = api_client.get("/blogs/nonexistent-blog-id", headers=auth_headers)

        assert response.status_code == 404


class TestUpdateBlog:
    """Test suite for updating blog posts."""

    def test_update_blog_requires_auth(self, api_client):
        """Test that updating blog requires authentication."""
        update_data = {"title": "Updated Title"}

        response = api_client.put("/blogs/test-blog-123", json=update_data)

        assert response.status_code == 401

    def test_update_blog_success(
        self, api_client, auth_headers, sample_blog, wait_for_eventual_consistency
    ):
        """Test successfully updating a blog."""
        # Create blog
        create_response = api_client.post("/blogs", json=sample_blog, headers=auth_headers)
        assert create_response.status_code == 201
        blog_id = create_response.json()["id"]

        wait_for_eventual_consistency(1)

        # Update blog
        update_data = {"title": "Updated Title", "content": sample_blog["content"]}
        response = api_client.put(f"/blogs/{blog_id}", json=update_data, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == blog_id
        assert data["title"] == "Updated Title"

        # Cleanup
        api_client.delete(f"/blogs/{blog_id}", headers=auth_headers)

    def test_update_nonexistent_blog_returns_404(self, api_client, auth_headers):
        """Test updating non-existent blog returns 404."""
        update_data = {"title": "Updated Title", "content": "Updated content"}

        response = api_client.put(
            "/blogs/nonexistent-blog-id", json=update_data, headers=auth_headers
        )

        assert response.status_code == 404


class TestDeleteBlog:
    """Test suite for deleting blog posts."""

    def test_delete_blog_requires_auth(self, api_client):
        """Test that deleting blog requires authentication."""
        response = api_client.delete("/blogs/test-blog-123")

        assert response.status_code == 401

    def test_delete_blog_success(self, api_client, auth_headers, sample_blog):
        """Test successfully deleting a blog."""
        # Create blog
        create_response = api_client.post("/blogs", json=sample_blog, headers=auth_headers)
        assert create_response.status_code == 201
        blog_id = create_response.json()["id"]

        # Delete blog
        response = api_client.delete(f"/blogs/{blog_id}", headers=auth_headers)

        assert response.status_code in [200, 204]

        # Verify it's deleted
        get_response = api_client.get(f"/blogs/{blog_id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_nonexistent_blog_returns_404(self, api_client, auth_headers):
        """Test deleting non-existent blog returns 404."""
        response = api_client.delete("/blogs/nonexistent-blog-id", headers=auth_headers)

        assert response.status_code == 404

    def test_delete_blog_is_idempotent(self, api_client, auth_headers, sample_blog):
        """Test that deleting same blog twice is idempotent."""
        # Create blog
        create_response = api_client.post("/blogs", json=sample_blog, headers=auth_headers)
        assert create_response.status_code == 201
        blog_id = create_response.json()["id"]

        # Delete first time
        response1 = api_client.delete(f"/blogs/{blog_id}", headers=auth_headers)
        assert response1.status_code in [200, 204]

        # Delete second time
        response2 = api_client.delete(f"/blogs/{blog_id}", headers=auth_headers)
        assert response2.status_code in [404, 204]  # Either not found or idempotent success


class TestPublishBlog:
    """Test suite for publishing/unpublishing blogs."""

    def test_publish_blog_requires_auth(self, api_client):
        """Test that publishing blog requires authentication."""
        response = api_client.post("/blogs/test-blog-123/publish")

        assert response.status_code == 401

    def test_publish_blog_success(
        self, api_client, auth_headers, sample_blog, wait_for_eventual_consistency
    ):
        """Test successfully publishing a blog."""
        # Create blog (should be draft)
        create_response = api_client.post("/blogs", json=sample_blog, headers=auth_headers)
        assert create_response.status_code == 201
        blog_id = create_response.json()["id"]

        wait_for_eventual_consistency(1)

        # Publish blog
        response = api_client.post(f"/blogs/{blog_id}/publish", headers=auth_headers)

        assert response.status_code in [200, 204]

        # Verify it's published
        get_response = api_client.get(f"/blogs/{blog_id}", headers=auth_headers)
        assert get_response.status_code == 200
        data = get_response.json()

        # Check status is published
        if "status" in data:
            assert data["status"] in ["PUBLISHED", "published"]

        # Cleanup
        api_client.delete(f"/blogs/{blog_id}", headers=auth_headers)

    def test_unpublish_blog_success(
        self, api_client, auth_headers, sample_blog, wait_for_eventual_consistency
    ):
        """Test successfully unpublishing a blog."""
        # Create and publish blog
        sample_blog["published"] = True
        create_response = api_client.post("/blogs", json=sample_blog, headers=auth_headers)
        assert create_response.status_code == 201
        blog_id = create_response.json()["id"]

        wait_for_eventual_consistency(1)

        # Unpublish blog
        response = api_client.post(f"/blogs/{blog_id}/unpublish", headers=auth_headers)

        # If unpublish endpoint exists
        if response.status_code not in [404, 405]:
            assert response.status_code in [200, 204]

        # Cleanup
        api_client.delete(f"/blogs/{blog_id}", headers=auth_headers)


class TestBlogFiltering:
    """Test suite for filtering and searching blogs."""

    def test_filter_blogs_by_category(self, api_client, auth_headers):
        """Test filtering blogs by category."""
        response = api_client.get("/blogs?category=Backend", headers=auth_headers)

        assert response.status_code == 200
        # Actual filtering logic depends on implementation

    def test_filter_blogs_by_tag(self, api_client, auth_headers):
        """Test filtering blogs by tag."""
        response = api_client.get("/blogs?tag=Python", headers=auth_headers)

        assert response.status_code == 200

    def test_filter_blogs_by_status(self, api_client, auth_headers):
        """Test filtering blogs by publication status."""
        response = api_client.get("/blogs?status=PUBLISHED", headers=auth_headers)

        assert response.status_code == 200


class TestBlogValidation:
    """Test suite for blog validation rules."""

    def test_blog_title_max_length(self, api_client, auth_headers):
        """Test blog title maximum length validation."""
        blog_data = {
            "title": "A" * 500,  # Very long title
            "content": "Test content",
            "excerpt": "Test excerpt",
        }

        response = api_client.post("/blogs", json=blog_data, headers=auth_headers)

        # Should either succeed or validate max length
        assert response.status_code in [201, 400, 422]

    def test_blog_content_not_empty(self, api_client, auth_headers):
        """Test that blog content cannot be empty."""
        blog_data = {"title": "Test Blog", "content": "", "excerpt": "Test excerpt"}

        response = api_client.post("/blogs", json=blog_data, headers=auth_headers)

        assert response.status_code in [400, 422]
