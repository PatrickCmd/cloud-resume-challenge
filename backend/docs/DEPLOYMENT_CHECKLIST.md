# Deployment Checklist - E2E Testing & Auth Fixes

## Overview

This deployment includes critical authentication fixes and a comprehensive E2E testing framework.

## Changes Summary

### 1. API Gateway Authentication Fixes (CRITICAL)

**File**: `aws/backend.yaml`

Two critical fixes to the API Gateway configuration:

#### Fix 1: Explicit Auth Endpoint Routes
Added explicit routes for authentication endpoints with `Authorizer: NONE` to prevent chicken-and-egg authentication problem:

- `/auth/login` (POST) - Public endpoint for obtaining tokens
- `/auth/refresh` (POST) - Public endpoint for refreshing tokens
- `/auth/me` (GET) - FastAPI handles JWT validation
- `/auth/logout` (POST) - FastAPI handles JWT validation

**Why**: The catch-all route `/{proxy+}` was applying the default Cognito authorizer to ALL routes including login endpoints, requiring users to be authenticated before they could authenticate.

**See**: [backend/docs/AUTH_FIX.md](backend/docs/AUTH_FIX.md) for detailed explanation

#### Fix 2: Remove API Gateway Authorization Entirely
Moved ALL authentication from API Gateway to FastAPI application layer:

```yaml
# Catch-all route - no API Gateway auth
ApiProxy:
  Type: Api
  Properties:
    Path: /{proxy+}
    Method: ANY
    # No Auth block - FastAPI handles ALL authentication

# API Gateway configuration
PortfolioApiGateway:
  Auth:
    # No DefaultAuthorizer - all routes are open at API Gateway level
    Authorizers:
      CognitoAuthorizer:  # Defined but not used
        UserPoolArn: !Sub arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${CognitoUserPoolId}
```

**Why**:
- API Gateway authorizers (both Cognito and AWS_IAM) conflict with FastAPI's JWT Bearer tokens
- Cognito authorizer: requires scopes we don't have, applies to ALL routes
- AWS_IAM authorizer: expects AWS Signature V4, not Bearer tokens (causes 403 errors)
- **Solution**: No API Gateway auth at all - FastAPI handles everything
- FastAPI provides granular control: public endpoints, authenticated endpoints, role-based endpoints
- Each endpoint specifies its own requirements using `Depends(get_current_user)` or `Depends(require_owner_role)`

**See**:
- [backend/docs/FASTAPI_AUTHENTICATION.md](backend/docs/FASTAPI_AUTHENTICATION.md) - Architecture explanation
- [backend/docs/COGNITO_SCOPES_FIX.md](backend/docs/COGNITO_SCOPES_FIX.md) - Original scope mismatch issue

### 2. E2E Testing Framework (NEW)

**Location**: `backend/tests/e2e_deployed/`

Comprehensive E2E test suite with 133+ tests:
- `test_health_e2e.py` - 28 tests for health checks
- `test_auth_e2e.py` - 18 tests for authentication
- `test_blogs_e2e.py` - 24 tests for blog CRUD
- `test_projects_e2e.py` - 28 tests for project CRUD
- `test_certifications_e2e.py` - 35 tests for certification CRUD
- `conftest.py` - Test fixtures and configuration

**Features**:
- Environment-specific configuration (dev/prod)
- Automatic `.env` file loading
- Dual token fixtures (access_token for API endpoints, id_token for user profile)
- Cleanup fixtures for test isolation
- Retry logic for Lambda cold starts

**See**: [backend/tests/e2e_deployed/README.md](backend/tests/e2e_deployed/README.md)

### 3. Test Data (NEW)

**Location**: `backend/data/`

Production-quality test data:
- `blogs.json` - 3 technical blog posts converted from documentation
- `projects.json` - 7 portfolio projects
- `certifications.json` - 12 certifications

### 4. Supporting Scripts (NEW)

**Location**: `backend/scripts/`

- `run_e2e_tests.sh` - Test runner with environment selection
- `seed_deployed.py` - Data seeding script for deployed environments
- `create_test_user.sh` - Helper to create Cognito test users
- `debug_tokens.py` - Token debugging and inspection tool

### 5. Documentation (NEW)

**Location**: `backend/docs/`

- `AUTH_FIX.md` - Authentication endpoint fixes documentation
- `COGNITO_SCOPES_FIX.md` - Authorization scopes fix documentation
- `E2E_TESTING_SETUP.md` - E2E testing setup guide

## Deployment Steps

### Step 1: Verify Prerequisites

```bash
# Ensure Docker is running (required for SAM build)
docker ps

# Ensure you're in the project root
pwd  # Should end with /cloud-resume-challenge
```

### Step 2: Deploy to Development

```bash
# Option 1: Using Ansible playbook (RECOMMENDED)
cd deployment
ansible-playbook -i inventories/development backend_deploy.yml

# Option 2: Using SAM CLI directly
cd aws
sam build
sam deploy --config-file samconfig.toml --config-env development
```

### Step 3: Verify Authentication Endpoints

```bash
# Test login endpoint
curl -X POST https://api-dev.patrickcmd.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"p.walukagga@gmail.com","password":"your-password"}'

# Should return 200 with tokens (not 401!)
```

### Step 4: Run Debug Script

```bash
cd backend
uv run python scripts/debug_tokens.py

# Should show:
# ✅ Testing /blogs with ACCESS token... Status: 200
```

### Step 5: Run E2E Tests

```bash
# Set environment variables (if not already set)
export DEV_TEST_USER_EMAIL="p.walukagga@gmail.com"
export DEV_TEST_USER_PASSWORD="your-password"

# Run all tests
./backend/scripts/run_e2e_tests.sh --env development -v

# Or run specific test modules
./backend/scripts/run_e2e_tests.sh --env development --test test_auth_e2e.py -v
./backend/scripts/run_e2e_tests.sh --env development --test test_blogs_e2e.py -v
```

### Step 6: Deploy to Production (Optional)

Only after development tests pass:

```bash
# Deploy to production
cd deployment
ansible-playbook -i inventories/production backend_deploy.yml

# Run production E2E tests
export PROD_TEST_USER_EMAIL="prod@example.com"
export PROD_TEST_USER_PASSWORD="your-prod-password"
./backend/scripts/run_e2e_tests.sh --env production -v
```

## Expected Results

### Before Deployment
- ❌ Login fails with 401 Unauthorized
- ❌ All authenticated endpoints return 401
- ❌ E2E tests cannot run

### After Deployment
- ✅ Login succeeds and returns tokens
- ✅ Blog/project/certification endpoints work with access token
- ✅ `/auth/me` endpoint works with ID token
- ✅ All 133+ E2E tests pass

## Rollback Plan

If deployment fails, rollback using AWS CloudFormation:

```bash
# Get stack name
aws cloudformation describe-stacks \
  --profile patrickcmd \
  --query "Stacks[?contains(StackName, 'development-portfolio')].StackName"

# Rollback to previous version
aws cloudformation rollback-stack \
  --stack-name <stack-name> \
  --profile patrickcmd
```

## Testing Checklist

After deployment, verify:

- [ ] Login endpoint returns 200 with tokens
- [ ] Refresh endpoint works
- [ ] `/auth/me` endpoint returns user info with ID token
- [ ] Blog list endpoint returns 200 with access token
- [ ] Blog create requires authentication
- [ ] Project endpoints work
- [ ] Certification endpoints work
- [ ] All E2E tests pass

## Troubleshooting

### Issue: 401 Unauthorized on login
**Cause**: Auth endpoints still using default authorizer
**Fix**: Verify SAM template has explicit auth routes with `Authorizer: NONE`

### Issue: 401 on blog/project/certification endpoints
**Cause**: AuthorizationScopes still present
**Fix**: Verify SAM template has NO `AuthorizationScopes` in CognitoAuthorizer

### Issue: E2E tests fail with "credentials not found"
**Cause**: Environment variables not set
**Fix**: Set `DEV_TEST_USER_EMAIL` and `DEV_TEST_USER_PASSWORD` in `.env` file or export them

### Issue: Lambda returns 500 on `/auth/me`
**Cause**: Using access token instead of ID token
**Fix**: Use ID token for `/auth/me` endpoint (contains email, name, role)

## Documentation

For detailed information, see:

- [AUTH_FIX.md](backend/docs/AUTH_FIX.md) - Authentication endpoint fixes
- [COGNITO_SCOPES_FIX.md](backend/docs/COGNITO_SCOPES_FIX.md) - Authorization scopes fix
- [E2E Testing README](backend/tests/e2e_deployed/README.md) - Complete E2E testing guide
- [E2E Testing Quickstart](backend/tests/e2e_deployed/QUICKSTART.md) - Quick reference

## Contact

If issues persist, check:
- CloudWatch logs for Lambda function
- API Gateway logs
- CloudFormation events

## Success Criteria

Deployment is successful when:
1. ✅ SAM deployment completes without errors
2. ✅ All API endpoints are accessible
3. ✅ Authentication flow works (login → use token → refresh)
4. ✅ E2E test suite passes with 133+ tests
5. ✅ No 401 errors on authenticated endpoints with valid tokens
