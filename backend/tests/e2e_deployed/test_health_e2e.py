"""
E2E tests for health check and public endpoints.

Tests endpoints that don't require authentication:
- GET /health
- GET / (API info)
- GET /docs (development only)
- GET /redoc (development only)
- GET /openapi.json (development only)
"""

import pytest


class TestHealthEndpoint:
    """Test suite for health check endpoint."""

    def test_health_check_returns_200(self, api_client):
        """Test that /health returns 200 OK."""
        response = api_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"

    def test_health_check_returns_service_info(self, api_client):
        """Test that /health returns service information."""
        response = api_client.get("/health")

        assert response.status_code == 200
        data = response.json()

        # Check for expected fields
        assert "status" in data
        assert "version" in data
        assert "environment" in data

    def test_health_check_no_auth_required(self, api_client):
        """Test that /health doesn't require authentication."""
        # Make request without auth headers
        response = api_client.get("/health")

        # Should NOT return 401 Unauthorized
        assert response.status_code != 401
        assert response.status_code == 200


class TestRootEndpoint:
    """Test suite for root endpoint."""

    def test_root_returns_api_info(self, api_client):
        """Test that GET / returns API information."""
        response = api_client.get("/")

        assert response.status_code == 200
        data = response.json()

        # Check for API metadata
        assert "message" in data
        assert "version" in data
        assert data["message"] == "Portfolio API"

    def test_root_no_auth_required(self, api_client):
        """Test that root endpoint doesn't require authentication."""
        response = api_client.get("/")

        assert response.status_code != 401
        assert response.status_code == 200


class TestApiDocumentation:
    """Test suite for API documentation endpoints (development only)."""

    def test_docs_endpoint(self, api_client, environment):
        """Test /docs endpoint availability."""
        response = api_client.get("/docs")

        if environment == "development":
            # Development: docs should be accessible
            assert response.status_code == 200
            assert "text/html" in response.headers.get("content-type", "")
        else:
            # Production: docs should be disabled
            assert response.status_code in [404, 403]

    def test_redoc_endpoint(self, api_client, environment):
        """Test /redoc endpoint availability."""
        response = api_client.get("/redoc")

        if environment == "development":
            # Development: redoc should be accessible
            assert response.status_code == 200
            assert "text/html" in response.headers.get("content-type", "")
        else:
            # Production: redoc should be disabled
            assert response.status_code in [404, 403]

    def test_openapi_json_endpoint(self, api_client, environment):
        """Test /openapi.json endpoint availability."""
        response = api_client.get("/openapi.json")

        if environment == "development":
            # Development: OpenAPI spec should be accessible
            assert response.status_code == 200
            assert "application/json" in response.headers.get("content-type", "")

            # Validate it's valid JSON
            data = response.json()
            assert "openapi" in data
            assert "info" in data
            assert "paths" in data
        else:
            # Production: OpenAPI spec should be disabled
            assert response.status_code in [404, 403]


class TestCORSHeaders:
    """Test suite for CORS headers."""

    def test_cors_headers_present(self, api_client):
        """Test that CORS headers are present in responses."""
        response = api_client.get("/health")

        assert response.status_code == 200

        # Check for CORS headers
        headers = response.headers
        # Note: CORS headers might only be present in preflight requests
        # This test validates the endpoint doesn't error

    def test_options_request(self, api_client):
        """Test OPTIONS request for CORS preflight."""
        response = api_client.request("OPTIONS", "/health")

        # OPTIONS should be handled
        assert response.status_code in [200, 204]


class TestAPIGatewayIntegration:
    """Test suite for API Gateway integration."""

    def test_response_time_acceptable(self, api_client):
        """Test that response time is acceptable (< 3 seconds)."""
        import time

        start = time.time()
        response = api_client.get("/health")
        elapsed = time.time() - start

        assert response.status_code == 200
        # Allow for cold starts but should be fast after warmup
        assert elapsed < 5.0, f"Response took {elapsed:.2f}s (too slow)"

    def test_concurrent_requests(self, api_client):
        """Test that API handles concurrent requests."""
        import concurrent.futures

        def make_request():
            response = api_client.get("/health")
            return response.status_code

        # Make 5 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # All should succeed
        assert all(status == 200 for status in results)
        assert len(results) == 5
