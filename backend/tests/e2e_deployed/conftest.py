"""
E2E Test Configuration for Deployed APIs.

Provides fixtures for testing against deployed backend APIs:
- api.patrickcmd.dev (production)
- api-dev.patrickcmd.dev (development)
"""

import json
import os
from pathlib import Path
from typing import Dict

import boto3
import httpx
import pytest
from dotenv import load_dotenv

# Load environment variables from .env file
env_file = Path(__file__).parent.parent.parent / ".env"
if env_file.exists():
    load_dotenv(env_file)


def pytest_addoption(parser):
    """Add custom command-line options for pytest."""
    parser.addoption(
        "--env",
        action="store",
        default="development",
        choices=["production", "development"],
        help="Environment to run tests against (production or development)",
    )


@pytest.fixture(scope="session")
def environment(request) -> str:
    """Get the environment from command-line option."""
    return request.config.getoption("--env")


@pytest.fixture(scope="session")
def environment_config(environment) -> Dict[str, str]:
    """
    Get environment-specific configuration.

    Returns configuration based on --env flag:
    - production: api.patrickcmd.dev
    - development: api-dev.patrickcmd.dev
    """
    # Load from environment variables
    if environment == "production":
        return {
            "api_url": os.getenv("PROD_API_URL", "https://api.patrickcmd.dev"),
            "cognito_user_pool_id": os.getenv(
                "PROD_COGNITO_USER_POOL_ID", "us-east-1_DESdNfOSv"
            ),
            "cognito_client_id": os.getenv(
                "PROD_COGNITO_CLIENT_ID", "62r2aeiu82mktf5inljmvn2dvb"
            ),
            "test_user_email": os.getenv("PROD_TEST_USER_EMAIL"),
            "test_user_password": os.getenv("PROD_TEST_USER_PASSWORD"),
            "aws_region": os.getenv("AWS_REGION", "us-east-1"),
            "aws_profile": os.getenv("AWS_PROFILE", "patrickcmd"),
        }
    else:  # development
        return {
            "api_url": os.getenv("DEV_API_URL", "https://api-dev.patrickcmd.dev"),
            "cognito_user_pool_id": os.getenv(
                "DEV_COGNITO_USER_POOL_ID", "us-east-1_DESdNfOSv"
            ),
            "cognito_client_id": os.getenv(
                "DEV_COGNITO_CLIENT_ID", "62r2aeiu82mktf5inljmvn2dvb"
            ),
            "test_user_email": os.getenv("DEV_TEST_USER_EMAIL"),
            "test_user_password": os.getenv("DEV_TEST_USER_PASSWORD"),
            "aws_region": os.getenv("AWS_REGION", "us-east-1"),
            "aws_profile": os.getenv("AWS_PROFILE", "patrickcmd"),
        }


@pytest.fixture(scope="session")
def api_client(environment_config) -> httpx.Client:
    """
    HTTP client for making API requests.

    Configured with:
    - Base URL from environment config
    - 30 second timeout for Lambda cold starts
    - Follow redirects
    """
    with httpx.Client(
        base_url=environment_config["api_url"],
        timeout=30.0,
        follow_redirects=True,
    ) as client:
        yield client


@pytest.fixture(scope="session")
def cognito_client(environment_config):
    """Boto3 Cognito client for authentication operations."""
    session = boto3.Session(
        profile_name=environment_config.get("aws_profile"),
        region_name=environment_config["aws_region"],
    )
    return session.client("cognito-idp")


@pytest.fixture(scope="session")
def dynamodb_client(environment_config):
    """Boto3 DynamoDB client for cleanup operations."""
    session = boto3.Session(
        profile_name=environment_config.get("aws_profile"),
        region_name=environment_config["aws_region"],
    )
    return session.client("dynamodb")


@pytest.fixture(scope="session")
def test_user_credentials(environment_config) -> Dict[str, str]:
    """
    Test user credentials for authentication.

    Raises:
        ValueError: If credentials not found in environment variables
    """
    email = environment_config.get("test_user_email")
    password = environment_config.get("test_user_password")

    if not email or not password:
        raise ValueError(
            "Test user credentials not found. Set PROD_TEST_USER_EMAIL and "
            "PROD_TEST_USER_PASSWORD (or DEV_*) environment variables."
        )

    return {"email": email, "password": password}


@pytest.fixture(scope="session")
def auth_tokens(api_client, test_user_credentials) -> Dict[str, str]:
    """
    Authenticate and get JWT tokens.

    Returns:
        dict: Contains access_token, id_token, refresh_token, expires_in
    """
    response = api_client.post("/auth/login", json=test_user_credentials)

    if response.status_code != 200:
        error_msg = (
            f"Authentication failed: {response.status_code} - {response.text}\n\n"
            f"Credentials used: {test_user_credentials.get('email', 'NOT SET')}\n"
            f"Please ensure:\n"
            f"  1. Test user exists in Cognito User Pool\n"
            f"  2. User is confirmed and not locked\n"
            f"  3. Credentials are correct in environment variables\n"
            f"  4. Environment variables are properly exported"
        )
        raise RuntimeError(error_msg)

    return response.json()


@pytest.fixture(scope="session")
def auth_headers(auth_tokens) -> Dict[str, str]:
    """
    Authorization headers with Bearer ID token.

    Uses ID token because our FastAPI endpoints use Depends(require_owner_role)
    which needs the custom:role claim that's ONLY in ID tokens.

    Access tokens don't have custom:role, so they return 403 Forbidden.

    Returns:
        dict: Headers with Authorization: Bearer {id_token}
    """
    return {"Authorization": f"Bearer {auth_tokens['id_token']}"}


@pytest.fixture(scope="session")
def auth_headers_id_token(auth_tokens) -> Dict[str, str]:
    """
    Authorization headers with Bearer ID token.

    Alias for auth_headers - kept for compatibility with tests that
    explicitly need ID token (like /auth/me endpoint).

    Returns:
        dict: Headers with Authorization: Bearer {id_token}
    """
    return {"Authorization": f"Bearer {auth_tokens['id_token']}"}


@pytest.fixture(scope="session")
def test_data_dir() -> Path:
    """Path to test data directory."""
    return Path(__file__).parent.parent.parent / "data"


@pytest.fixture(scope="session")
def test_blogs_data(test_data_dir) -> list:
    """Load test blog posts from JSON file."""
    with open(test_data_dir / "blogs.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def test_projects_data(test_data_dir) -> list:
    """Load test projects from JSON file."""
    with open(test_data_dir / "projects.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def test_certifications_data(test_data_dir) -> list:
    """Load test certifications from JSON file."""
    with open(test_data_dir / "certifications.json") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def all_created_items():
    """
    Track all items created during test session for cleanup.

    Stores items as (entity_type, pk, sk) tuples.
    """
    items = []
    yield items


@pytest.fixture
def created_blog_ids(all_created_items):
    """Track created blog IDs for cleanup."""
    ids = []
    yield ids
    # Add to session-wide tracking for final cleanup
    for blog_id in ids:
        all_created_items.append(("BLOG_POST", f"BLOG#{blog_id}", "METADATA"))


@pytest.fixture
def created_project_ids(all_created_items):
    """Track created project IDs for cleanup."""
    ids = []
    yield ids
    # Add to session-wide tracking for final cleanup
    for project_id in ids:
        all_created_items.append(("PROJECT", f"PROJECT#{project_id}", "METADATA"))


@pytest.fixture
def created_certification_ids(all_created_items):
    """Track created certification IDs for cleanup."""
    ids = []
    yield ids
    # Add to session-wide tracking for final cleanup
    for cert_id in ids:
        all_created_items.append(("CERTIFICATION", f"CERT#{cert_id}", "METADATA"))


# Test data helpers
@pytest.fixture
def sample_blog(test_blogs_data) -> Dict:
    """Get first blog from test data."""
    return test_blogs_data[0].copy()


@pytest.fixture
def sample_project(test_projects_data) -> Dict:
    """Get first project from test data."""
    return test_projects_data[0].copy()


@pytest.fixture
def sample_certification(test_certifications_data) -> Dict:
    """Get first certification from test data."""
    return test_certifications_data[0].copy()


# Utility fixtures
@pytest.fixture
def wait_for_eventual_consistency():
    """
    Wait for DynamoDB eventual consistency.

    DynamoDB is eventually consistent, so sometimes we need to wait
    for writes to propagate before reading.
    """
    import time

    def _wait(seconds=1):
        time.sleep(seconds)

    return _wait


@pytest.fixture
def retry_on_failure():
    """
    Retry helper for handling Lambda cold starts and network issues.

    Usage:
        @retry_on_failure(max_attempts=3, delay=2)
        def test_something(api_client):
            response = api_client.get("/blogs")
            assert response.status_code == 200
    """
    import time
    from functools import wraps

    def decorator(max_attempts=3, delay=1):
        def wrapper(func):
            @wraps(func)
            def inner(*args, **kwargs):
                last_exception = None
                for attempt in range(max_attempts):
                    try:
                        return func(*args, **kwargs)
                    except Exception as e:
                        last_exception = e
                        if attempt < max_attempts - 1:
                            wait_time = delay * (2**attempt)  # Exponential backoff
                            time.sleep(wait_time)
                        else:
                            raise
                raise last_exception

            return inner

        return wrapper

    return decorator


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data(request, dynamodb_client, environment_config, environment, all_created_items):
    """
    Cleanup test data from DynamoDB after all tests complete.

    This fixture runs automatically after all E2E tests finish and removes
    ONLY the test data that was tracked during the test session.

    This ensures we don't delete manually created data in the development table.

    WARNING: Only runs in development environment for safety.
    """
    # This runs after all tests complete
    yield

    # Skip cleanup if no items were tracked
    if not all_created_items:
        print("\n✨ No test items to clean up")
        return

    # Only cleanup in development environment to avoid accidentally
    # deleting production data
    if environment != "development":
        print(f"\n⚠️  Skipping cleanup - not in development environment (current: {environment})")
        return

    # Get table name based on environment
    table_name_env_var = f"{environment.upper()}_DYNAMODB_TABLE_NAME"
    table_name = os.getenv(table_name_env_var)

    if not table_name:
        # Fallback to default development table name
        table_name = "development-portfolio-api-table"
        print(f"\n⚠️  {table_name_env_var} not set, using default: {table_name}")

    print(f"\n🧹 Cleaning up {len(all_created_items)} test items from DynamoDB table: {table_name}")

    deleted_count = 0
    failed_count = 0

    for entity_type, pk, sk in all_created_items:
        try:
            dynamodb_client.delete_item(
                TableName=table_name,
                Key={
                    'PK': {'S': pk},
                    'SK': {'S': sk}
                }
            )
            deleted_count += 1
        except Exception as e:
            failed_count += 1
            print(f"   ⚠️  Failed to delete {entity_type} ({pk}): {e}")

    if deleted_count > 0:
        print(f"   ✅ Successfully deleted {deleted_count} test items")
    if failed_count > 0:
        print(f"   ⚠️  Failed to delete {failed_count} items")
