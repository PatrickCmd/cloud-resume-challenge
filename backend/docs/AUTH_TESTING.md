# Authentication Testing Documentation

This document provides comprehensive documentation for the authentication system tests implemented for the Portfolio API.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Test Coverage](#test-coverage)
- [Running Tests](#running-tests)
- [Test Files](#test-files)
- [Testing Patterns](#testing-patterns)
- [Continuous Integration](#continuous-integration)

## Overview

The authentication system has comprehensive test coverage across three testing levels:

- **Unit Tests**: Test individual functions and endpoints in isolation
- **Integration Tests**: Test integration with AWS Cognito
- **End-to-End Tests**: Test complete authentication flows

### Test Statistics

- **Total Tests**: 58 authentication tests
- **Pass Rate**: 100% (58/58 passing)
- **Execution Time**: ~2.1 seconds
- **Coverage**: All authentication endpoints, JWT utilities, and dependencies

## Test Structure

```
tests/
├── conftest.py                          # Shared fixtures and test configuration
├── unit/
│   ├── test_jwt.py                     # JWT utilities tests (14 tests)
│   └── test_auth.py                    # Auth endpoint tests (21 tests)
├── integration/
│   └── test_cognito_integration.py     # Cognito integration tests (13 tests)
└── e2e/
    └── test_auth_flow.py               # End-to-end flow tests (10 tests)
```

## Test Coverage

### 1. Unit Tests - JWT Utilities (14 tests)

**File**: `tests/unit/test_jwt.py`

Tests for JWT token validation and user extraction:

#### `get_cognito_public_keys()` Tests (3 tests)
- ✅ Successful fetch from Cognito JWKS endpoint
- ✅ HTTP error handling
- ✅ Caching mechanism verification

#### `decode_token()` Tests (6 tests)
- ✅ Valid token decoding
- ✅ Expired token handling
- ✅ Invalid signature detection
- ✅ Wrong issuer validation
- ✅ Wrong audience validation
- ✅ Missing public key handling

#### `extract_user_from_token()` Tests (5 tests)
- ✅ Successful user extraction
- ✅ Invalid token handling
- ✅ Missing custom:role attribute
- ✅ Missing email_verified attribute
- ✅ Minimal claims handling

### 2. Unit Tests - Auth Endpoints (21 tests)

**File**: `tests/unit/test_auth.py`

Tests for authentication API endpoints:

#### Login Endpoint Tests (9 tests)
- ✅ Successful login with valid credentials
- ✅ Invalid credentials (NotAuthorizedException)
- ✅ Unconfirmed user (UserNotConfirmedException)
- ✅ User not found (UserNotFoundException)
- ✅ Rate limiting (TooManyRequestsException)
- ✅ Invalid parameters from Cognito
- ✅ Missing email field
- ✅ Missing password field
- ✅ Invalid email format

#### Refresh Token Endpoint Tests (4 tests)
- ✅ Successful token refresh
- ✅ New refresh token returned
- ✅ Expired refresh token
- ✅ Missing refresh token

#### Logout Endpoint Tests (4 tests)
- ✅ Successful logout with global sign out
- ✅ Cognito error handling (still returns success)
- ✅ Invalid token rejection
- ✅ Missing token handling

#### Get Current User Endpoint Tests (4 tests)
- ✅ Successful user info retrieval
- ✅ Minimal user info handling
- ✅ Invalid token rejection
- ✅ Missing token handling

### 3. Integration Tests - Cognito (13 tests)

**File**: `tests/integration/test_cognito_integration.py`

Tests for AWS Cognito integration:

#### Client Initialization Tests (2 tests)
- ✅ Cognito client initialization
- ✅ Region configuration

#### Authentication Flow Tests (3 tests)
- ✅ InitiateAuth with valid parameters
- ✅ NotAuthorizedException handling
- ✅ UserNotConfirmedException handling

#### Token Refresh Tests (3 tests)
- ✅ REFRESH_TOKEN_AUTH flow
- ✅ New refresh token handling
- ✅ Expired refresh token

#### Global Sign Out Tests (2 tests)
- ✅ AdminUserGlobalSignOut success
- ✅ User not found handling

#### Error Handling Tests (3 tests)
- ✅ TooManyRequestsException
- ✅ InvalidParameterException
- ✅ InternalErrorException

### 4. End-to-End Tests - Complete Flows (10 tests)

**File**: `tests/e2e/test_auth_flow.py`

Tests for complete authentication flows:

#### Complete Authentication Flows (2 tests)
- ✅ Login → Get User Info → Logout
- ✅ Login → Refresh Token

#### Error Scenarios (4 tests)
- ✅ Invalid credentials then valid retry
- ✅ Expired refresh token requires relogin
- ✅ Protected route without token
- ✅ Protected route with invalid token

#### Token Expiration Scenarios (1 test)
- ✅ Access token expires, refresh continues session

#### Multiple User Sessions (1 test)
- ✅ Owner and visitor different access levels

#### Edge Cases (2 tests)
- ✅ Rate limiting then successful retry
- ✅ Malformed request bodies

## Running Tests

### Run All Authentication Tests

```bash
uv run pytest tests/unit/test_jwt.py tests/unit/test_auth.py tests/integration/test_cognito_integration.py tests/e2e/test_auth_flow.py -v
```

### Run by Test Level

```bash
# Unit tests only
uv run pytest tests/unit/ -v

# Integration tests only
uv run pytest tests/integration/ -v

# End-to-end tests only
uv run pytest tests/e2e/ -v
```

### Run Specific Test Files

```bash
# JWT utilities tests
uv run pytest tests/unit/test_jwt.py -v

# Auth endpoints tests
uv run pytest tests/unit/test_auth.py -v

# Cognito integration tests
uv run pytest tests/integration/test_cognito_integration.py -v

# Complete flow tests
uv run pytest tests/e2e/test_auth_flow.py -v
```

### Run Specific Test Classes or Functions

```bash
# Run specific test class
uv run pytest tests/unit/test_auth.py::TestLoginEndpoint -v

# Run specific test function
uv run pytest tests/unit/test_auth.py::TestLoginEndpoint::test_login_success -v
```

### Run with Coverage Report

```bash
# Generate coverage report
uv run pytest tests/ --cov=src --cov-report=term-missing --cov-report=html

# View HTML coverage report
open htmlcov/index.html
```

### Run with Different Verbosity

```bash
# Minimal output
uv run pytest tests/unit/test_auth.py -q

# Normal verbosity
uv run pytest tests/unit/test_auth.py

# Verbose output
uv run pytest tests/unit/test_auth.py -v

# Very verbose with full output
uv run pytest tests/unit/test_auth.py -vv
```

### Run Failed Tests Only

```bash
# Run only tests that failed in the last run
uv run pytest --lf

# Run failed tests first, then the rest
uv run pytest --ff
```

## Test Files

### `conftest.py` - Shared Test Fixtures

**Location**: `tests/conftest.py`

Provides reusable fixtures for all tests:

#### FastAPI Test Client
```python
@pytest.fixture
def test_client():
    """FastAPI test client."""
    return TestClient(app)
```

#### Mock Cognito Fixtures
```python
@pytest.fixture
def mock_cognito_client():
    """Mock boto3 Cognito client."""

@pytest.fixture
def mock_cognito_success_response():
    """Mock successful Cognito authentication response."""

@pytest.fixture
def mock_refresh_success_response():
    """Mock successful token refresh response."""
```

#### JWT and User Fixtures
```python
@pytest.fixture
def mock_jwks():
    """Mock JWKS response from Cognito."""

@pytest.fixture
def valid_token_claims():
    """Mock valid JWT token claims."""

@pytest.fixture
def expired_token_claims():
    """Mock expired JWT token claims."""

@pytest.fixture
def mock_user_info():
    """Mock user information extracted from JWT."""

@pytest.fixture
def mock_visitor_user_info():
    """Mock visitor (non-owner) user information."""
```

#### Authentication Headers
```python
@pytest.fixture
def valid_auth_headers():
    """Mock valid authorization headers."""

@pytest.fixture
def invalid_auth_headers():
    """Mock invalid authorization headers."""
```

#### Request Data Fixtures
```python
@pytest.fixture
def sample_login_request():
    """Sample login request data."""

@pytest.fixture
def sample_blog_create_request():
    """Sample blog post creation request."""
```

### Using Fixtures in Tests

```python
def test_example(test_client, mock_user_info):
    """Example test using fixtures."""
    # Use the fixtures directly
    response = test_client.get("/auth/me")
    assert response.status_code == 200
```

## Testing Patterns

### 1. Mocking External Dependencies

All tests use mocking to isolate functionality:

```python
@patch('src.api.auth.get_cognito_client')
def test_login_success(self, mock_get_client):
    # Setup mock
    mock_cognito = Mock()
    mock_cognito.initiate_auth.return_value = {...}
    mock_get_client.return_value = mock_cognito

    # Execute and verify
    response = client.post("/auth/login", json={...})
    assert response.status_code == 200
```

### 2. Testing Error Scenarios

Comprehensive error testing using ClientError:

```python
from botocore.exceptions import ClientError

@patch('src.api.auth.get_cognito_client')
def test_login_invalid_credentials(self, mock_get_client):
    # Setup error
    error_response = {"Error": {"Code": "NotAuthorizedException"}}
    mock_cognito.initiate_auth.side_effect = ClientError(error_response, "InitiateAuth")

    # Execute and verify error handling
    response = client.post("/auth/login", json={...})
    assert response.status_code == 401
```

### 3. Testing Complete Flows

E2E tests verify complete user journeys:

```python
def test_login_get_user_logout_flow(self, mock_extract_user, mock_get_client):
    # Step 1: Login
    login_result = test_client.post("/auth/login", json={...})
    token = login_result.json()["id_token"]

    # Step 2: Get user info
    user_result = test_client.get("/auth/me", headers={...})

    # Step 3: Logout
    logout_result = test_client.post("/auth/logout", headers={...})
```

### 4. Parametrized Tests

For testing multiple scenarios efficiently:

```python
@pytest.mark.parametrize("email,password,expected_status", [
    ("test@example.com", "ValidPassword123!", 200),
    ("invalid-email", "Password123!", 422),
    ("test@example.com", "", 422),
])
def test_login_validation(email, password, expected_status):
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == expected_status
```

## Continuous Integration

### GitHub Actions Configuration

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.12'

    - name: Install uv
      run: pip install uv

    - name: Install dependencies
      run: uv sync

    - name: Run tests
      run: uv run pytest tests/ -v --cov=src --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
```

### Pre-commit Hooks

**File**: `.pre-commit-config.yaml`

```yaml
repos:
  - repo: local
    hooks:
      - id: pytest
        name: pytest
        entry: uv run pytest tests/unit/ tests/integration/
        language: system
        pass_filenames: false
        always_run: true
```

Install pre-commit hooks:
```bash
pip install pre-commit
pre-commit install
```

## Test Maintenance

### Adding New Tests

1. **Identify the test level**: Unit, integration, or e2e
2. **Create test file** in appropriate directory
3. **Use existing fixtures** from `conftest.py`
4. **Follow naming conventions**: `test_<functionality>_<scenario>`
5. **Add docstrings** explaining what is being tested
6. **Verify all tests pass**: `uv run pytest tests/ -v`

### Example New Test

```python
@patch('src.api.auth.get_cognito_client')
def test_new_auth_feature(self, mock_get_client, test_client):
    """Test description of what this test validates."""
    # Arrange - Setup mocks and test data
    mock_cognito = Mock()
    mock_cognito.some_method.return_value = {...}
    mock_get_client.return_value = mock_cognito

    # Act - Execute the functionality
    response = test_client.post("/auth/endpoint", json={...})

    # Assert - Verify the results
    assert response.status_code == 200
    assert response.json()["field"] == "expected_value"
```

### Debugging Failed Tests

```bash
# Run with full traceback
uv run pytest tests/ -v --tb=long

# Run with print statements visible
uv run pytest tests/ -v -s

# Run with debugger on failure
uv run pytest tests/ -v --pdb

# Show local variables on failure
uv run pytest tests/ -v -l
```

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clear Naming**: Test names should describe what they test
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **Mock External Services**: Don't call real AWS services
5. **Test Edge Cases**: Include error scenarios and boundary conditions
6. **Keep Tests Fast**: Unit tests should run in milliseconds
7. **Document Complex Tests**: Add comments for complex scenarios
8. **Use Fixtures**: Leverage shared fixtures for common setup
9. **Verify Cleanup**: Ensure tests don't leave state behind
10. **Run Tests Frequently**: Run tests before committing code

## Troubleshooting

### Common Issues

#### Issue: "Module not found" errors
```bash
# Ensure you're in the backend directory
cd /path/to/backend

# Ensure dependencies are installed
uv sync
```

#### Issue: Tests passing locally but failing in CI
```bash
# Check Python version matches CI
python --version

# Ensure all dependencies are in pyproject.toml
uv add --dev <missing-package>
```

#### Issue: Slow test execution
```bash
# Run only unit tests (faster)
uv run pytest tests/unit/ -v

# Use pytest-xdist for parallel execution
uv add --dev pytest-xdist
uv run pytest tests/ -n auto
```

#### Issue: Mocking not working
```python
# Ensure you're mocking the correct import path
# Mock where it's used, not where it's defined
@patch('src.api.auth.get_cognito_client')  # Correct
# NOT @patch('boto3.client')  # Incorrect
```

## Additional Resources

- [pytest Documentation](https://docs.pytest.org/)
- [unittest.mock Documentation](https://docs.python.org/3/library/unittest.mock.html)
- [FastAPI Testing Guide](https://fastapi.tiangolo.com/tutorial/testing/)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Backend AUTHENTICATION.md](../AUTHENTICATION.md) - Authentication specification
