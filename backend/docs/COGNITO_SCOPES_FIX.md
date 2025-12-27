# Cognito Authorization Scopes Fix

## Problem

E2E tests for blog, project, and certification endpoints were failing with 401 Unauthorized errors, even with valid Cognito access tokens.

## Root Cause

The API Gateway Cognito authorizer was configured with explicit `AuthorizationScopes`:

```yaml
CognitoAuthorizer:
  UserPoolArn: !Sub arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${CognitoUserPoolId}
  AuthorizationScopes:
    - openid
    - email
    - profile
```

However, the Cognito access tokens issued by AWS Cognito have a **different scope**:

```json
{
  "scope": "aws.cognito.signin.user.admin"
}
```

This mismatch caused API Gateway to reject ALL requests with 401 Unauthorized, because the token scope didn't match the required scopes.

## Investigation

Using the debug script (`backend/scripts/debug_tokens.py`), we discovered:

**Access Token Claims:**
```json
{
  "sub": "a4688478-90c1-70a5-7d9c-fc4668e07773",
  "client_id": "62r2aeiu82mktf5inljmvn2dvb",
  "scope": "aws.cognito.signin.user.admin",  // ← Only this scope
  "token_use": "access"
}
```

**ID Token Claims:**
```json
{
  "sub": "a4688478-90c1-70a5-7d9c-fc4668e07773",
  "aud": "62r2aeiu82mktf5inljmvn2dvb",
  "email": "p.walukagga@gmail.com",
  "name": "Patrick Walukagga",
  "custom:role": "owner",
  "token_use": "id"
}
```

**Test Results:**
- `/blogs` with access token: 401 Unauthorized ❌
- `/blogs` with ID token: 401 Unauthorized ❌

Both tokens were rejected because neither has the scopes `openid`, `email`, `profile` that the authorizer was configured to require.

## Solution

Remove the `AuthorizationScopes` from the Cognito authorizer configuration:

```yaml
# Before (INCORRECT)
CognitoAuthorizer:
  UserPoolArn: !Sub arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${CognitoUserPoolId}
  AuthorizationScopes:
    - openid
    - email
    - profile

# After (CORRECT)
CognitoAuthorizer:
  UserPoolArn: !Sub arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${CognitoUserPoolId}
```

Without explicit scopes, the authorizer will:
1. Validate the token signature using Cognito's public keys
2. Verify the token issuer matches the User Pool
3. Check the token is not expired
4. Allow the request to proceed to the Lambda function

The Lambda function (FastAPI) can then perform additional authorization checks using the `Depends(require_owner_role)` dependency.

## Why This Happened

The `AuthorizationScopes` configuration is used when you have an OAuth2 resource server with specific scopes. For example:
- `read:blogs` - Permission to read blogs
- `write:blogs` - Permission to write blogs

However, the default Cognito User Pool authentication flow issues tokens with the generic scope `aws.cognito.signin.user.admin`, not custom resource server scopes.

To use custom scopes, you would need to:
1. Create a Cognito Resource Server
2. Define custom scopes
3. Configure the app client to request those scopes
4. Update the authorization flow to include those scopes

Since we're using Cognito for authentication (not as an OAuth2 resource server), we don't need explicit scopes in the authorizer configuration.

## Deployment

To apply this fix, redeploy the SAM stack:

```bash
# Using the deployment playbook
cd deployment
ansible-playbook -i inventories/development backend_deploy.yml

# Or using SAM CLI directly
cd aws
sam build
sam deploy --config-file samconfig.toml --config-env development
```

## Verification

After deployment, verify the fix:

```bash
# Run the debug script to test tokens
cd backend
uv run python scripts/debug_tokens.py

# Should show:
# ✅ Testing /blogs with ACCESS token... Status: 200
```

Or run the E2E tests:

```bash
./backend/scripts/run_e2e_tests.sh --env development --test test_blogs_e2e.py
```

## Related Documentation

- [AUTH_FIX.md](./AUTH_FIX.md) - Authentication endpoint fixes
- [API Gateway Cognito Authorizer Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html)
- [Cognito OAuth2 Scopes](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-define-resource-servers.html)

## Files Modified

- [aws/backend.yaml](../../aws/backend.yaml:229-234) - Removed AuthorizationScopes from CognitoAuthorizer
- [backend/scripts/debug_tokens.py](../scripts/debug_tokens.py) - Debug script to inspect and test tokens
