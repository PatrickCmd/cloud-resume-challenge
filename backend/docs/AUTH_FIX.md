# Authentication Endpoint Fix

## Problem

The E2E authentication tests were failing with 401 Unauthorized errors when trying to login at `/auth/login`.

## Root Cause

The SAM template ([aws/backend.yaml](../../aws/backend.yaml)) has a catch-all route `/{proxy+}` that uses the default Cognito authorizer for all API routes. The authentication endpoints (`/auth/login`, `/auth/refresh`) were not explicitly defined with `Auth: Authorizer: NONE`, so they were being caught by the proxy route and **requiring authentication to login** - a chicken-and-egg problem!

## Analysis

1. **Direct Cognito Authentication Works**: Testing with AWS Cognito SDK directly confirmed the user credentials are correct:
   ```bash
   Email: p.walukagga@gmail.com
   Status: CONFIRMED
   Authentication: ✅ Successful
   ```

2. **API Gateway Blocking Requests**: The API was returning a generic `{"message":"Unauthorized"}` before the request even reached the Lambda function, indicating API Gateway level authorization failure.

3. **SAM Template Configuration**:
   - Default authorizer: `CognitoAuthorizer` (line 197)
   - Catch-all route: `/{proxy+}` with `Method: ANY` (line 190-195)
   - No explicit auth routes with `Authorizer: NONE`

## Solution

Added explicit API Gateway events for ALL authentication endpoints with `Auth: Authorizer: NONE`.

This allows the requests to reach FastAPI, where authentication is handled by the application layer using JWT validation:

```yaml
# Authentication endpoints (no API Gateway auth - FastAPI handles it)
AuthLoginApi:
  Type: Api
  Properties:
    RestApiId: !Ref PortfolioApiGateway
    Path: /auth/login
    Method: POST
    Auth:
      Authorizer: NONE

AuthRefreshApi:
  Type: Api
  Properties:
    RestApiId: !Ref PortfolioApiGateway
    Path: /auth/refresh
    Method: POST
    Auth:
      Authorizer: NONE

AuthMeApi:
  Type: Api
  Properties:
    RestApiId: !Ref PortfolioApiGateway
    Path: /auth/me
    Method: GET
    Auth:
      Authorizer: NONE

AuthLogoutApi:
  Type: Api
  Properties:
    RestApiId: !Ref PortfolioApiGateway
    Path: /auth/logout
    Method: POST
    Auth:
      Authorizer: NONE
```

**Why all auth endpoints need `Authorizer: NONE`:**
- `/auth/login` and `/auth/refresh` are truly public (no auth needed)
- `/auth/me` and `/auth/logout` require authentication, but it's handled by FastAPI using `Depends(get_current_user)`, not by API Gateway
- FastAPI validates JWT tokens at the application layer for more flexible control

## Deployment

To apply this fix, redeploy the SAM stack:

```bash
# Using the deployment playbook
cd deployment
ansible-playbook -i inventories/production backend_deploy.yml

# Or using SAM CLI directly
cd aws
sam build
sam deploy --config-file samconfig.toml --config-env production
```

## Verification

After deployment, verify the fix:

```bash
# Test login endpoint
curl -X POST https://api-dev.patrickcmd.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"p.walukagga@gmail.com","password":"your-password"}'

# Should return 200 with tokens:
# {
#   "access_token": "eyJ...",
#   "id_token": "eyJ...",
#   "refresh_token": "eyJ...",
#   "token_type": "Bearer",
#   "expires_in": 3600
# }
```

## E2E Tests

After deployment, the E2E tests should pass:

```bash
./backend/scripts/run_e2e_tests.sh --env development
```

## Lessons Learned

1. **Explicit Route Definition**: When using a default authorizer with API Gateway, ALL public endpoints must be explicitly defined with `Auth: Authorizer: NONE`, not just health checks and docs.

2. **Authentication Endpoints**: Auth endpoints like `/auth/login`, `/auth/refresh`, `/auth/register` should ALWAYS be public (no authorizer) as they're used to obtain authentication tokens.

3. **Catch-All Routes**: Be careful with catch-all routes (`/{proxy+}`) when using default authorizers - they will apply the authorizer to ALL unmatched paths.

4. **Authorization Scopes**: When configuring API Gateway Cognito authorizer, **avoid specifying AuthorizationScopes** unless your Cognito app client is explicitly configured to issue tokens with those scopes. The default Cognito tokens have scope `aws.cognito.signin.user.admin`, not `openid`, `email`, `profile`. If you specify scopes that don't match the token, ALL requests will be rejected with 401 Unauthorized.

5. **Access Token vs ID Token**: API Gateway Cognito authorizer can validate EITHER token type (both are signed by Cognito), but:
   - Access tokens have `client_id` claim (no `aud` claim)
   - ID tokens have `aud` (audience) claim
   - For user identity endpoints like `/auth/me`, use ID tokens (they contain email, name, role)
   - For other protected endpoints, access tokens work fine with the authorizer

6. **Testing Strategy**: Always test authentication flows early in E2E testing to catch authorization configuration issues.

## Related Files

- SAM Template: [aws/backend.yaml](../../aws/backend.yaml:172-188)
- Backend Auth API: [src/api/auth.py](../src/api/auth.py:29-100)
- E2E Auth Tests: [tests/e2e_deployed/test_auth_e2e.py](../tests/e2e_deployed/test_auth_e2e.py)
- Test Configuration: [tests/e2e_deployed/conftest.py](../tests/e2e_deployed/conftest.py)
