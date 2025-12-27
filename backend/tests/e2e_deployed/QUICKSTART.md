# E2E Tests Quick Start Guide

Quick reference for running E2E tests against deployed APIs.

## Prerequisites

1. **Install uv** (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Install dependencies**:
   ```bash
   cd backend
   uv sync --group dev
   ```

3. **Configure environment variables**:

   The test credentials are automatically loaded from `backend/.env` file.

   The `.env` file should contain:
   ```bash
   # Development Environment
   DEV_API_URL=https://api-dev.patrickcmd.dev
   DEV_TEST_USER_EMAIL=your-test-email@example.com
   DEV_TEST_USER_PASSWORD=your-test-password

   # Production Environment (optional)
   PROD_API_URL=https://api.patrickcmd.dev
   PROD_TEST_USER_EMAIL=your-prod-email@example.com
   PROD_TEST_USER_PASSWORD=your-prod-password
   ```

   **Creating a Test User** (if you don't have one yet):

   You can use the helper script to create a test user in Cognito:

   ```bash
   # Create test user for development
   ./backend/scripts/create_test_user.sh \
     --email testuser@example.com \
     --password SecurePass123!

   # Create test user for production
   ./backend/scripts/create_test_user.sh \
     --email produser@example.com \
     --password ProdPass123! \
     --env production
   ```

   Or manually using AWS CLI:

   ```bash
   # Create user
   aws cognito-idp admin-create-user \
     --user-pool-id us-east-1_DESdNfOSv \
     --username testuser@example.com \
     --user-attributes Name=email,Value=testuser@example.com Name=email_verified,Value=true \
     --message-action SUPPRESS \
     --profile patrickcmd

   # Set permanent password
   aws cognito-idp admin-set-user-password \
     --user-pool-id us-east-1_DESdNfOSv \
     --username testuser@example.com \
     --password YourSecurePassword123! \
     --permanent \
     --profile patrickcmd
   ```

   **Tips**:
   - The `.env` file is automatically loaded by the test runner
   - Never commit credentials to version control (`.env` is in `.gitignore`)
   - Use different users for dev and production environments
   - Ensure the user is confirmed and email verified in Cognito

## Running Tests

### Run All Tests

```bash
# Development environment
./backend/scripts/run_e2e_tests.sh --env development

# Production environment
./backend/scripts/run_e2e_tests.sh --env production
```

### Run Specific Test Files

```bash
# Authentication tests only
./backend/scripts/run_e2e_tests.sh --env development --test test_auth_e2e.py

# Blog tests only
./backend/scripts/run_e2e_tests.sh --env development --test test_blogs_e2e.py

# Project tests only
./backend/scripts/run_e2e_tests.sh --env development --test test_projects_e2e.py

# Certification tests only
./backend/scripts/run_e2e_tests.sh --env development --test test_certifications_e2e.py
```

### Run with Options

```bash
# Verbose output
./backend/scripts/run_e2e_tests.sh --env development --verbose

# Exit on first failure
./backend/scripts/run_e2e_tests.sh --env development --exitfirst

# Run in parallel (faster)
./backend/scripts/run_e2e_tests.sh --env development --parallel

# Generate coverage report
./backend/scripts/run_e2e_tests.sh --env development --coverage
```

### Advanced Usage

```bash
# Combine multiple options
./backend/scripts/run_e2e_tests.sh --env development --test test_auth_e2e.py --verbose --exitfirst

# Run specific test class
./backend/scripts/run_e2e_tests.sh --env development --test "test_auth_e2e.py::TestLoginEndpoint"

# Run specific test method
./backend/scripts/run_e2e_tests.sh --env development --test "test_auth_e2e.py::TestLoginEndpoint::test_login_with_valid_credentials"
```

## Direct pytest Usage

You can also run pytest directly from the backend directory:

```bash
cd backend

# Run all E2E tests
uv run pytest tests/e2e_deployed/ --rootdir=tests/e2e_deployed --env=development

# Run specific test file
uv run pytest tests/e2e_deployed/test_auth_e2e.py --rootdir=tests/e2e_deployed --env=development -v

# Run with custom pytest options
uv run pytest tests/e2e_deployed/ --rootdir=tests/e2e_deployed --env=development -v -s --tb=short
```

## Test Coverage

Current test coverage:

- ✅ **Health Endpoints** (28 tests) - `test_health_e2e.py`
  - Health checks, CORS, API documentation, error handling

- ✅ **Authentication** (18 tests) - `test_auth_e2e.py`
  - Login, token refresh, get current user, logout, JWT validation

- ✅ **Blogs** (24 tests) - `test_blogs_e2e.py`
  - CRUD operations, publish/unpublish, filtering, validation

- ✅ **Projects** (28 tests) - `test_projects_e2e.py`
  - CRUD operations, publish/unpublish, filtering, validation

- ✅ **Certifications** (35 tests) - `test_certifications_e2e.py`
  - CRUD operations, publish/unpublish, filtering, expiry handling

**Total**: 133+ test cases

## Seeding Test Data

Before running tests, you may want to seed the database with test data:

```bash
# Seed development environment
python backend/scripts/seed_deployed.py --env development

# Seed production environment (requires confirmation)
python backend/scripts/seed_deployed.py --env production

# Dry run (preview what would be seeded)
python backend/scripts/seed_deployed.py --env development --dry-run

# Seed specific data types
python backend/scripts/seed_deployed.py --env development --blogs-only
python backend/scripts/seed_deployed.py --env development --projects-only
python backend/scripts/seed_deployed.py --env development --certifications-only
```

## Troubleshooting

### API Health Check Fails

```bash
# Verify API is accessible
curl https://api-dev.patrickcmd.dev/health

# Check DNS resolution
nslookup api-dev.patrickcmd.dev

# Check AWS credentials
aws sts get-caller-identity --profile patrickcmd
```

### Authentication Fails

- Verify test user exists in Cognito User Pool
- Check credentials are correct
- Ensure user is confirmed and not locked out
- Verify Cognito User Pool ID and Client ID are correct

### Module Not Found Errors

```bash
# Reinstall dependencies
cd backend
uv sync --group dev

# Verify pytest is available
uv run pytest --version
```

### Tests Failing Due to Data

- Ensure test data exists (run seeding script)
- Check for conflicting data in database
- Verify DynamoDB tables exist and are accessible

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Run E2E Tests
  env:
    DEV_TEST_USER_EMAIL: ${{ secrets.DEV_TEST_USER_EMAIL }}
    DEV_TEST_USER_PASSWORD: ${{ secrets.DEV_TEST_USER_PASSWORD }}
  run: |
    ./backend/scripts/run_e2e_tests.sh --env development --parallel
```

## Additional Resources

- [Complete E2E Testing Documentation](README.md)
- [E2E Testing Setup Guide](../../E2E_TESTING_SETUP.md)
- [Seeding Script Documentation](../../scripts/seed_deployed.py)
