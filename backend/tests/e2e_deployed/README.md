# E2E Tests for Deployed APIs

End-to-end tests that run against deployed backend APIs (`api.patrickcmd.dev` and `api-dev.patrickcmd.dev`) with real data.

## Overview

These tests validate the complete system including:
- API Gateway
- Lambda functions
- DynamoDB
- Cognito authentication
- CloudFront distribution
- DNS routing

## Directory Structure

```
tests/e2e_deployed/
├── README.md                    # This file
├── conftest.py                  # Test configuration and fixtures
├── test_auth_e2e.py            # Authentication flow tests
├── test_blogs_e2e.py           # Blog CRUD operations
├── test_projects_e2e.py        # Project CRUD operations
├── test_certifications_e2e.py  # Certification CRUD operations
├── test_analytics_e2e.py       # Visitor tracking and analytics
└── test_health_e2e.py          # Health check and public endpoints
```

## Prerequisites

1. **Environment Variables**: Set up `.env` file with:
```bash
# Production API
PROD_API_URL=https://api.patrickcmd.dev
PROD_COGNITO_USER_POOL_ID=us-east-1_DESdNfOSv
PROD_COGNITO_CLIENT_ID=62r2aeiu82mktf5inljmvn2dvb
PROD_TEST_USER_EMAIL=owner@patrickcmd.dev
PROD_TEST_USER_PASSWORD=<secure-password>

# Development API
DEV_API_URL=https://api-dev.patrickcmd.dev
DEV_COGNITO_USER_POOL_ID=us-east-1_DESdNfOSv
DEV_COGNITO_CLIENT_ID=62r2aeiu82mktf5inljmvn2dvb
DEV_TEST_USER_EMAIL=owner@patrickcmd.dev
DEV_TEST_USER_PASSWORD=<secure-password>

# AWS Credentials for Cognito user creation
AWS_PROFILE=patrickcmd
AWS_REGION=us-east-1
```

2. **Test User**: Create a test user in Cognito (or use existing owner account)

3. **Dependencies**: Install test dependencies
```bash
cd backend
uv sync --group dev
```

## Running Tests

### Run all E2E tests against production
```bash
pytest tests/e2e_deployed/ -v --env=production
```

### Run all E2E tests against development
```bash
pytest tests/e2e_deployed/ -v --env=development
```

### Run specific test file
```bash
pytest tests/e2e_deployed/test_blogs_e2e.py -v --env=production
```

### Run tests in parallel (faster)
```bash
pytest tests/e2e_deployed/ -v --env=production -n auto
```

### Run with detailed output
```bash
pytest tests/e2e_deployed/ -vvs --env=production
```

## Test Categories

### 1. Health & Public Endpoints
- ✓ GET /health
- ✓ GET / (API info)
- ✓ GET /docs (development only)
- ✓ GET /redoc (development only)

### 2. Authentication
- ✓ POST /auth/login (get JWT tokens)
- ✓ POST /auth/refresh (refresh tokens)
- ✓ GET /auth/me (get current user)
- ✓ POST /auth/logout

### 3. Blog Posts
- ✓ GET /blogs (list all published)
- ✓ POST /blogs (create new)
- ✓ GET /blogs/{id} (get by ID)
- ✓ PUT /blogs/{id} (update)
- ✓ DELETE /blogs/{id} (delete)
- ✓ POST /blogs/{id}/publish (publish)

### 4. Projects
- ✓ GET /projects (list all published)
- ✓ POST /projects (create new)
- ✓ GET /projects/{id} (get by ID)
- ✓ PUT /projects/{id} (update)
- ✓ DELETE /projects/{id} (delete)

### 5. Certifications
- ✓ GET /certifications (list all published)
- ✓ POST /certifications (create new)
- ✓ GET /certifications/{id} (get by ID)
- ✓ PUT /certifications/{id} (update)
- ✓ DELETE /certifications/{id} (delete)

### 6. Analytics
- ✓ POST /visitors (track visitor)
- ✓ GET /analytics (get analytics)

## Key Features

### 1. Environment-Specific Configuration
Tests can run against different environments using `--env` flag:
- `production`: Tests against `api.patrickcmd.dev`
- `development`: Tests against `api-dev.patrickcmd.dev`

### 2. Real Data Testing
Tests use real test data from `backend/data/`:
- `blogs.json`: Blog posts converted from documentation
- `projects.json`: Portfolio projects
- `certifications.json`: Certifications and courses

### 3. Authentication Flow
All tests that require auth:
1. Login with test user credentials
2. Get JWT access token
3. Include `Authorization: Bearer {token}` header
4. Validate responses

### 4. Automatic Test Data Cleanup
Tests automatically clean up after execution to prevent test data accumulation:
- **Session-scoped tracking**: All created items (blogs, projects, certifications) are tracked during the test session
- **Automatic cleanup**: After all tests complete, tracked items are deleted from DynamoDB
- **Development-only**: Cleanup only runs in development environment for safety
- **Selective deletion**: Only deletes items created during the test run, preserving manually created data
- **Non-blocking**: Cleanup failures don't fail the test suite
- **Detailed reporting**: Shows cleanup status (items deleted, failures)

**How it works**:
1. Tests create items and add their IDs to tracking fixtures (`created_blog_ids`, `created_project_ids`, `created_certification_ids`)
2. Tracking fixtures append items to session-scoped `all_created_items` list
3. `cleanup_test_data` autouse fixture runs after all tests and deletes tracked items
4. Cleanup output shows summary: "✅ Successfully deleted X test items"

See [conftest.py:308-395](conftest.py#L308-L395) for implementation details.

### 5. Retry Logic
Tests include retry logic for:
- DNS propagation delays
- Lambda cold starts
- DynamoDB eventual consistency

## Test Data

Test data is loaded from JSON files in `backend/data/`:

### Blogs (`blogs.json`)
- 3 blog posts converted from documentation
- Topics: Authentication, DynamoDB Design, Troubleshooting
- Real markdown content with code examples

### Projects (`projects.json`)
- 7 portfolio projects
- Includes Cloud Resume Challenge
- Real technical descriptions

### Certifications (`certifications.json`)
- 12 certifications and courses
- AWS, Python, DevOps topics
- Real credential information

## Best Practices

### 1. Test Isolation
Each test should be independent:
```python
@pytest.fixture
def created_blog(api_client, auth_headers, test_blog_data):
    # Create blog for test
    response = api_client.post(\"/blogs\", json=test_blog_data, headers=auth_headers)
    blog_id = response.json()[\"id\"]

    yield response.json()

    # Cleanup
    api_client.delete(f\"/blogs/{blog_id}\", headers=auth_headers)
```

### 2. Use Fixtures for Common Setup
```python
@pytest.fixture(scope=\"session\")
def auth_headers(api_client, test_user_credentials):
    \"\"\"Get JWT token and return auth headers.\"\"\"
    response = api_client.post(\"/auth/login\", json=test_user_credentials)
    token = response.json()[\"access_token\"]
    return {\"Authorization\": f\"Bearer {token}\"}
```

### 3. Test Both Success and Failure Cases
```python
def test_create_blog_success(api_client, auth_headers, test_blog_data):
    response = api_client.post(\"/blogs\", json=test_blog_data, headers=auth_headers)
    assert response.status_code == 201

def test_create_blog_unauthorized(api_client, test_blog_data):
    response = api_client.post(\"/blogs\", json=test_blog_data)
    assert response.status_code == 401
```

### 4. Use Descriptive Test Names
```python
def test_list_blogs_returns_published_only(api_client, auth_headers):
    \"\"\"Test that GET /blogs only returns published blog posts.\"\"\"
    # ...

def test_create_blog_validates_required_fields(api_client, auth_headers):
    \"\"\"Test that POST /blogs validates required fields.\"\"\"
    # ...
```

## Debugging Failed Tests

### 1. Check API Status
```bash
curl -i https://api.patrickcmd.dev/health
```

### 2. Check Lambda Logs
```bash
aws logs tail \
  /aws/lambda/production-portfolio-backend-api-PortfolioApiFunction \
  --follow \
  --region us-east-1 \
  --profile patrickcmd
```

### 3. Verify DNS Resolution
```bash
dig api.patrickcmd.dev
nslookup api.patrickcmd.dev
```

### 4. Test Authentication Manually
```bash
# Get token
TOKEN=$(./aws/bin/test-api get-token testuser MyPass123!)

# Test endpoint
curl -i -H \"Authorization: Bearer $TOKEN\" https://api.patrickcmd.dev/blogs
```

### 5. Check DynamoDB Data
```bash
# List blog items
aws dynamodb query \
  --table-name portfolio-api-table \
  --index-name GSI1 \
  --key-condition-expression \"GSI1PK = :pk\" \
  --expression-attribute-values '{\":pk\":{\"S\":\"BLOG#STATUS#PUBLISHED\"}}' \
  --region us-east-1 \
  --profile patrickcmd
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          cd backend
          pip install uv
          uv sync --group dev

      - name: Run E2E tests (Production)
        env:
          PROD_API_URL: ${{ secrets.PROD_API_URL }}
          PROD_TEST_USER_EMAIL: ${{ secrets.PROD_TEST_USER_EMAIL }}
          PROD_TEST_USER_PASSWORD: ${{ secrets.PROD_TEST_USER_PASSWORD }}
        run: |
          cd backend
          pytest tests/e2e_deployed/ -v --env=production

      - name: Run E2E tests (Development)
        env:
          DEV_API_URL: ${{ secrets.DEV_API_URL }}
          DEV_TEST_USER_EMAIL: ${{ secrets.DEV_TEST_USER_EMAIL }}
          DEV_TEST_USER_PASSWORD: ${{ secrets.DEV_TEST_USER_PASSWORD }}
        run: |
          cd backend
          pytest tests/e2e_deployed/ -v --env=development
```

## Cost Considerations

E2E tests hit real AWS services:
- **API Gateway**: ~$3.50 per million requests
- **Lambda**: ~$0.20 per million requests
- **DynamoDB**: ~$1.25 per million writes, ~$0.25 per million reads

For 100 test runs per day (3,000/month):
- API Gateway: ~$0.01/month
- Lambda: ~$0.001/month
- DynamoDB: ~$0.01/month

**Total**: ~$0.02/month (negligible)

## Monitoring Test Results

Track test metrics over time:
- Success rate per endpoint
- Average response time
- Error rates by category
- Test execution duration

Consider using:
- pytest-html for HTML reports
- pytest-json-report for JSON metrics
- Grafana for visualization
- CloudWatch for AWS metrics correlation

## Security Considerations

1. **Never commit credentials**: Use environment variables or secrets management
2. **Use test-specific users**: Don't use production owner account for tests
3. **Limit test user permissions**: Scope permissions to test operations only
4. **Rotate credentials regularly**: Update test credentials monthly
5. **Monitor for abuse**: Alert on unusual test activity

## Troubleshooting Common Issues

### Issue: Tests timeout
**Solution**: Increase timeout in `conftest.py`:
```python
@pytest.fixture
def api_client(environment_config):
    with httpx.Client(
        base_url=environment_config[\"api_url\"],
        timeout=30.0  # Increase from 10.0
    ) as client:
        yield client
```

### Issue: Authentication fails
**Solution**: Verify credentials and regenerate tokens:
```bash
# Test login
./aws/bin/test-api get-token testuser MyPass123!
```

### Issue: DNS resolution fails
**Solution**: Wait for DNS propagation:
```bash
dig api.patrickcmd.dev
# Check TTL and wait if needed
```

### Issue: Cold start timeouts
**Solution**: Add retry logic with exponential backoff:
```python
import time

def test_with_retry(api_client):
    for attempt in range(3):
        try:
            response = api_client.get(\"/blogs\")
            assert response.status_code == 200
            break
        except Exception as e:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)  # 1s, 2s, 4s
```

## Resources

- [pytest Documentation](https://docs.pytest.org/)
- [httpx Documentation](https://www.python-httpx.org/)
- [AWS API Gateway Testing](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html)
- [Backend API Documentation](../../docs/TESTING_API.md)
- [Troubleshooting Guide](../../docs/TROUBLESHOOTING.md)
