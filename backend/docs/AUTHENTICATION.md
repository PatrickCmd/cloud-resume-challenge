# Authentication & Authorization Planning

**Amazon Cognito Integration for Owner-Only Portfolio Backend**

## Overview

This document outlines the authentication and authorization strategy for the serverless portfolio API backend using Amazon Cognito User Pools. The system implements an owner-only model where a single user (the portfolio owner) has full CRUD access to all resources, while public users can only read published content.

## Authentication Flow

### High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│  Application    │
└────────┬────────┘
         │
         │ 1. Login Request (email/password)
         ▼
┌─────────────────────────────────────────────┐
│           AWS Lambda (FastAPI)              │
│  POST /auth/login                           │
│  - Receives credentials                     │
│  - Initiates Cognito authentication         │
└────────┬────────────────────────────────────┘
         │
         │ 2. InitiateAuth API call
         ▼
┌─────────────────────────────────────────────┐
│        Amazon Cognito User Pool             │
│  - Validates credentials                    │
│  - Returns JWT tokens                       │
└────────┬────────────────────────────────────┘
         │
         │ 3. JWT Tokens (IdToken, AccessToken, RefreshToken)
         ▼
┌─────────────────┐
│   Frontend      │
│  Stores tokens  │
│  in localStorage│
└────────┬────────┘
         │
         │ 4. Authenticated Request
         │    Authorization: Bearer {IdToken}
         ▼
┌─────────────────────────────────────────────┐
│         API Gateway                         │
│  JWT Authorizer validates token             │
│  - Verifies signature with Cognito          │
│  - Checks expiration                        │
│  - Extracts user claims                     │
└────────┬────────────────────────────────────┘
         │
         │ 5. Request + User Context
         ▼
┌─────────────────────────────────────────────┐
│           AWS Lambda (FastAPI)              │
│  - Receives decoded JWT claims              │
│  - Implements authorization logic           │
│  - Processes business logic                 │
└─────────────────────────────────────────────┘
```

## Amazon Cognito User Pool Configuration

### User Pool Settings

**Basic Configuration**:
- **User Pool Name**: `portfolio-api-user-pool`
- **Sign-in Options**: Email address only
- **MFA**: Optional (recommended for production)
- **Password Policy**:
  - Minimum length: 12 characters
  - Require uppercase letters
  - Require lowercase letters
  - Require numbers
  - Require special characters
  - Password expiration: 90 days (optional)

**Account Recovery**:
- Email-based account recovery
- Verified email required

**Email Configuration**:
- Use Amazon SES for production (higher sending limits)
- Cognito default for development/testing
- Custom "from" email: `noreply@patrickcmd.dev`

### User Pool Client Configuration

**App Client Settings**:
- **Client Name**: `portfolio-frontend-client`
- **Client Secret**: Not used (public single-page application)
- **Auth Flows Enabled**:
  - `ALLOW_USER_PASSWORD_AUTH` - For login with email/password
  - `ALLOW_REFRESH_TOKEN_AUTH` - For token refresh
  - `ALLOW_USER_SRP_AUTH` - Secure Remote Password (optional, enhanced security)
- **OAuth 2.0 Flows**: Not required (using direct authentication)
- **Token Validity**:
  - **ID Token**: 1 hour (3600 seconds)
  - **Access Token**: 1 hour (3600 seconds)
  - **Refresh Token**: 30 days (2,592,000 seconds)

### Custom Attributes

**User Attributes**:
```json
{
  "email": "p.walukagga@gmail.com",     // Standard attribute (verified)
  "name": "Patrick Walukagga",          // Standard attribute
  "custom:role": "owner"                // Custom attribute for authorization
}
```

**Attribute Configuration**:
- `email`: Required, mutable, used for sign-in
- `name`: Required, mutable
- `custom:role`: Custom attribute, string type, mutable (for future multi-user support)

### Owner Account Setup

**Single Owner Account**:
- **Email**: `p.walukagga@gmail.com`
- **Name**: Patrick Walukagga
- **Role**: `owner` (custom attribute)
- **Account Creation**: Pre-created using AWS Console or AWS CLI
- **Email Verification**: Required before first login

**Account Creation Command** (for reference):
```bash
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username p.walukagga@gmail.com \
  --user-attributes \
    Name=email,Value=p.walukagga@gmail.com \
    Name=email_verified,Value=true \
    Name=name,Value="Patrick Walukagga" \
    Name=custom:role,Value=owner \
  --message-action SUPPRESS \
  --temporary-password "TempPassword123!" \
  --profile <AWS_PROFILE>
```

## JWT Token Flow

### Token Types and Usage

#### 1. ID Token (IdToken)
**Purpose**: Contains user identity and claims

**Structure**:
```json
{
  "sub": "uuid-user-id",
  "email": "p.walukagga@gmail.com",
  "name": "Patrick Walukagga",
  "custom:role": "owner",
  "cognito:username": "p.walukagga@gmail.com",
  "email_verified": true,
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXX",
  "aud": "client-id",
  "token_use": "id",
  "auth_time": 1702800000,
  "iat": 1702800000,
  "exp": 1702803600
}
```

**Usage**:
- **Primary token for API authentication**
- Sent in `Authorization: Bearer {IdToken}` header
- Validated by API Gateway JWT Authorizer
- Contains user identity and custom claims (role)

#### 2. Access Token (AccessToken)
**Purpose**: OAuth 2.0 access token for Cognito User Pool operations

**Usage**:
- Used for Cognito User Pool API calls (e.g., user info, update attributes)
- Not used for our API authentication (we use ID token instead)
- Can be used for future integrations with Cognito-protected resources

#### 3. Refresh Token (RefreshToken)
**Purpose**: Long-lived token for obtaining new ID and Access tokens

**Characteristics**:
- Valid for 30 days
- Single-use (new refresh token issued with each refresh)
- Stored securely by frontend
- Used when ID token expires

**Refresh Flow**:
```
Frontend detects ID token expiration (or receives 401)
  └─> Sends refresh token to backend
      └─> Backend calls Cognito InitiateAuth with REFRESH_TOKEN_AUTH
          └─> Cognito returns new IdToken and AccessToken
              └─> Frontend updates stored tokens
                  └─> Retry original request
```

### Token Validation

**API Gateway JWT Authorizer Configuration**:
```yaml
# In SAM template.yaml
JwtAuthorizer:
  Type: AWS::ApiGateway::Authorizer
  Properties:
    Name: CognitoAuthorizer
    Type: JWT
    IdentitySource: $request.header.Authorization
    JwtConfiguration:
      Issuer: https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXX
      Audience:
        - <CLIENT_ID>
    AuthorizerResultTtlInSeconds: 300  # Cache validation for 5 minutes
```

**Validation Steps** (performed by API Gateway):
1. Extract token from `Authorization: Bearer {token}` header
2. Decode JWT header to get `kid` (Key ID)
3. Fetch public keys from Cognito JWKS endpoint
4. Verify token signature using public key
5. Validate `iss` (issuer) matches Cognito User Pool
6. Validate `aud` (audience) matches Client ID
7. Validate `exp` (expiration) is in the future
8. Validate `token_use` is "id"
9. Pass decoded claims to Lambda in event context

## API Endpoint Authentication

### Endpoint Access Control

| Endpoint Category | Public Access | Owner Access | Authentication Required |
|-------------------|---------------|--------------|------------------------|
| **Authentication** | | | |
| POST /auth/login | Yes | Yes | No |
| POST /auth/logout | Yes | Yes | Yes (ID token) |
| GET /auth/me | No | Yes | Yes (ID token) |
| **Blog Posts** | | | |
| GET /blog/posts | Yes (published) | Yes (all) | Optional |
| POST /blog/posts | No | Yes | Yes (owner) |
| GET /blog/posts/{id} | Yes (published) | Yes (all) | Optional |
| PUT /blog/posts/{id} | No | Yes | Yes (owner) |
| DELETE /blog/posts/{id} | No | Yes | Yes (owner) |
| POST /blog/posts/{id}/publish | No | Yes | Yes (owner) |
| POST /blog/posts/{id}/unpublish | No | Yes | Yes (owner) |
| GET /blog/categories | Yes | Yes | No |
| **Projects** | | | |
| GET /projects | Yes (published) | Yes (all) | Optional |
| POST /projects | No | Yes | Yes (owner) |
| GET /projects/{id} | Yes (published) | Yes (all) | Optional |
| PUT /projects/{id} | No | Yes | Yes (owner) |
| DELETE /projects/{id} | No | Yes | Yes (owner) |
| POST /projects/{id}/publish | No | Yes | Yes (owner) |
| POST /projects/{id}/unpublish | No | Yes | Yes (owner) |
| **Certifications** | | | |
| GET /certifications | Yes (published) | Yes (all) | Optional |
| POST /certifications | No | Yes | Yes (owner) |
| GET /certifications/{id} | Yes (published) | Yes (all) | Optional |
| PUT /certifications/{id} | No | Yes | Yes (owner) |
| DELETE /certifications/{id} | No | Yes | Yes (owner) |
| POST /certifications/{id}/publish | No | Yes | Yes (owner) |
| POST /certifications/{id}/unpublish | No | Yes | Yes (owner) |
| **Visitor Tracking** | | | |
| POST /visitors/track | Yes | Yes | No |
| GET /visitors/count | Yes | Yes | No |
| GET /visitors/trends/daily | No | Yes | Yes (owner) |
| GET /visitors/trends/monthly | No | Yes | Yes (owner) |
| **Analytics** | | | |
| POST /analytics/track | Yes | Yes | No |
| GET /analytics/views/{type}/{id} | Yes | Yes | No |
| GET /analytics/views/{type} | Yes | Yes | No |
| GET /analytics/top-content | No | Yes | Yes (owner) |
| GET /analytics/total-views | Yes | Yes | No |

### Authorization Logic Patterns

#### Pattern 1: Public Endpoints (No Authentication)
```
Examples: POST /visitors/track, GET /blog/categories

API Gateway: No authorizer required
Lambda: No user context available
Authorization: Allow all requests
```

#### Pattern 2: Optional Authentication (Different Data for Owner)
```
Examples: GET /blog/posts, GET /projects

API Gateway: Authorizer optional (uses $default route or separate routes)
Lambda: Check if user context exists
  - If no user: Return only published items
  - If user with role=owner: Return all items (published + draft)
Authorization:
  - Public: Filter by status=PUBLISHED
  - Owner: No filter, return all
```

#### Pattern 3: Owner-Only Endpoints
```
Examples: POST /blog/posts, PUT /blog/posts/{id}, DELETE /blog/posts/{id}

API Gateway: JWT Authorizer required
Lambda: User context must exist and role must be "owner"
Authorization:
  1. Check user context exists (401 if missing)
  2. Check custom:role == "owner" (403 if not owner)
  3. Proceed with operation
```

#### Pattern 4: Authenticated Endpoints (Any User)
```
Examples: POST /auth/logout, GET /auth/me

API Gateway: JWT Authorizer required
Lambda: User context must exist
Authorization:
  1. Check user context exists (401 if missing)
  2. Proceed with operation
```

## FastAPI Integration

### User Context from API Gateway

When API Gateway JWT Authorizer validates the token, it passes decoded claims to Lambda in the event context:

```python
# Lambda event structure
{
  "requestContext": {
    "authorizer": {
      "jwt": {
        "claims": {
          "sub": "uuid-user-id",
          "email": "p.walukagga@gmail.com",
          "name": "Patrick Walukagga",
          "custom:role": "owner",
          "cognito:username": "p.walukagga@gmail.com",
          "email_verified": "true"
        }
      }
    }
  },
  # ... other event properties
}
```

### Dependency Injection for User Context

**Approach**: Create a FastAPI dependency that extracts user information from the Lambda event context.

**Dependency Pattern**:
```python
# Pseudo-code structure (planning only)

# Dependency: get_current_user (optional)
# Returns: User object or None
# Used for endpoints that optionally use authentication

# Dependency: require_current_user
# Returns: User object
# Raises: 401 HTTPException if no user
# Used for authenticated endpoints

# Dependency: require_owner
# Returns: User object (with role=owner)
# Raises: 401 if no user, 403 if not owner
# Used for owner-only endpoints
```

### Authorization Decorators/Dependencies

**Pattern for Optional Authentication**:
```python
# Endpoint planning pattern
@router.get("/blog/posts")
async def get_blog_posts(
    current_user: Optional[User] = Depends(get_current_user)
):
    # If current_user exists and role == "owner":
    #     Query all posts (published + draft)
    # Else:
    #     Query only published posts
    pass
```

**Pattern for Owner-Only Operations**:
```python
# Endpoint planning pattern
@router.post("/blog/posts")
async def create_blog_post(
    post_data: BlogPostCreate,
    current_user: User = Depends(require_owner)
):
    # current_user is guaranteed to be owner
    # Proceed with creation
    pass
```

**Pattern for Authenticated Operations**:
```python
# Endpoint planning pattern
@router.post("/auth/logout")
async def logout(
    current_user: User = Depends(require_current_user)
):
    # current_user exists (any authenticated user)
    # Proceed with logout logic
    pass
```

## Login and Logout Implementation

### Login Flow (POST /auth/login)

**Request**:
```json
{
  "email": "p.walukagga@gmail.com",
  "password": "SecurePassword123!"
}
```

**Backend Process**:
1. Receive email and password from request body
2. Call AWS Cognito `InitiateAuth` API with:
   - AuthFlow: `USER_PASSWORD_AUTH`
   - ClientId: User Pool Client ID
   - AuthParameters: { USERNAME: email, PASSWORD: password }
3. Cognito validates credentials
4. Cognito returns authentication result with tokens
5. Extract user attributes from IdToken claims
6. Return user object and tokens to frontend

**Response**:
```json
{
  "user": {
    "id": "uuid-user-id",
    "email": "p.walukagga@gmail.com",
    "name": "Patrick Walukagga",
    "role": "owner"
  },
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ..."
}
```

**Error Handling**:
- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account not verified or disabled
- `500 Internal Server Error`: Cognito service error

### Logout Flow (POST /auth/logout)

**Request**:
```http
POST /auth/logout
Authorization: Bearer {IdToken}
```

**Backend Process**:
1. Validate ID token (done by API Gateway)
2. Optionally call Cognito `GlobalSignOut` API to invalidate all user tokens
3. Return success response

**Response**:
```json
{
  "message": "Successfully logged out"
}
```

**Frontend Action**:
- Clear stored tokens from localStorage
- Redirect to login page or home page

**Note**:
- Global sign out invalidates all tokens for the user across all sessions
- For single-session logout, frontend can simply discard tokens without calling backend
- Calling backend logout is recommended for audit logging and security

### Current User Flow (GET /auth/me)

**Request**:
```http
GET /auth/me
Authorization: Bearer {IdToken}
```

**Backend Process**:
1. Validate ID token (done by API Gateway)
2. Extract user claims from token
3. Return user object

**Response**:
```json
{
  "id": "uuid-user-id",
  "email": "p.walukagga@gmail.com",
  "name": "Patrick Walukagga",
  "role": "owner"
}
```

**Use Case**:
- Frontend calls on app initialization to restore user session
- Validates that stored token is still valid
- Retrieves current user information

## Token Refresh Strategy

### When to Refresh

**Frontend Strategy**:
1. **Proactive Refresh**: Refresh token when it's 5 minutes from expiration
2. **Reactive Refresh**: Refresh when API returns 401 Unauthorized
3. **Background Refresh**: Set interval to check token expiration while app is active

### Refresh Process

**Endpoint**: `POST /auth/refresh`

**Request**:
```json
{
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ..."
}
```

**Backend Process**:
1. Receive refresh token from request body
2. Call AWS Cognito `InitiateAuth` API with:
   - AuthFlow: `REFRESH_TOKEN_AUTH`
   - ClientId: User Pool Client ID
   - AuthParameters: { REFRESH_TOKEN: refreshToken }
3. Cognito validates refresh token
4. Cognito returns new IdToken and AccessToken (new refresh token may be included)
5. Return new tokens to frontend

**Response**:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ..."
}
```

**Frontend Action**:
- Update stored IdToken
- Update stored RefreshToken (if new one provided)
- Retry failed request with new token

**Error Handling**:
- `401 Unauthorized`: Refresh token expired or invalid → Force logout
- `500 Internal Server Error`: Cognito service error → Retry or force logout

### Token Storage (Frontend)

**Recommended Storage**: `localStorage`

**Stored Items**:
```javascript
{
  "portfolio_id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "portfolio_refresh_token": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ...",
  "portfolio_token_expiry": "1702803600"  // Unix timestamp
}
```

**Security Considerations**:
- `localStorage` is vulnerable to XSS attacks
- Tokens should have short expiration (1 hour for IdToken)
- Use HTTPS only for all API communication
- Implement Content Security Policy (CSP)
- Consider `httpOnly` cookies for enhanced security (requires backend session management)

## Security Considerations

### Token Security

1. **Short Token Lifetime**:
   - ID Token: 1 hour (limits exposure window)
   - Refresh Token: 30 days (balance between security and UX)

2. **Token Validation**:
   - All tokens validated by API Gateway before reaching Lambda
   - Signature verification using Cognito public keys
   - Expiration checking
   - Issuer and audience validation

3. **Token Transmission**:
   - Always use HTTPS/TLS for token transmission
   - Tokens in Authorization header (not URL parameters)
   - Never log full tokens (log only last 4 characters for debugging)

### User Pool Security

1. **Password Policy**:
   - Strong password requirements (12+ chars, mixed case, numbers, special chars)
   - Regular password rotation (90 days)
   - Account lockout after failed login attempts

2. **MFA (Multi-Factor Authentication)**:
   - Optional for development
   - Recommended for production (SMS or TOTP)
   - Enhances account security

3. **Account Protection**:
   - Email verification required
   - Account recovery via email
   - Advanced security features (compromised credentials detection)

### API Security

1. **Rate Limiting**:
   - Implement rate limiting at API Gateway level
   - Prevent brute force attacks on login endpoint
   - Limit requests per IP address

2. **CORS Configuration**:
   - Whitelist only allowed origins (e.g., `https://patrickcmd.dev`)
   - Restrict allowed methods and headers
   - Do not use wildcard (*) in production

3. **Input Validation**:
   - Validate all inputs in Lambda functions
   - Sanitize user inputs to prevent injection attacks
   - Use Pydantic models for request validation

4. **Audit Logging**:
   - Log all authentication attempts (success and failure)
   - Log all owner operations (create, update, delete)
   - Use CloudWatch Logs for centralized logging
   - Set up alarms for suspicious activity

### IAM Permissions

**Lambda Execution Role Permissions**:
- `cognito-idp:InitiateAuth` - For login
- `cognito-idp:GlobalSignOut` - For logout
- `cognito-idp:GetUser` - For user info retrieval
- `dynamodb:*` - For database operations (scoped to portfolio table)
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` - For CloudWatch logging

**Principle of Least Privilege**:
- Grant only necessary permissions
- Scope permissions to specific resources
- Use resource-based policies where possible

## Error Handling

### Authentication Errors

| Error Code | Error Type | Message | Cause |
|------------|------------|---------|-------|
| 400 | `InvalidRequest` | Missing or invalid email/password | Validation failure |
| 401 | `InvalidCredentials` | Invalid email or password | Wrong credentials |
| 401 | `TokenExpired` | Token has expired | ID token expired |
| 401 | `InvalidToken` | Token is invalid or malformed | Signature verification failed |
| 403 | `AccountNotVerified` | Email not verified | Email verification pending |
| 403 | `AccountDisabled` | Account has been disabled | Admin disabled account |
| 403 | `Forbidden` | Insufficient permissions | Non-owner attempting owner operation |
| 429 | `TooManyRequests` | Too many requests, please try again later | Rate limit exceeded |
| 500 | `InternalError` | Internal server error | Cognito service error |

### Error Response Format

```json
{
  "error": {
    "code": "InvalidCredentials",
    "message": "Invalid email or password",
    "details": null
  }
}
```

## Future Enhancements

### Multi-User Support (Future)

If expanding beyond owner-only model:

1. **User Roles**:
   - `owner`: Full CRUD access
   - `editor`: Create and edit content, cannot delete
   - `viewer`: Read-only access to all content
   - `public`: Published content only

2. **User Management Endpoints**:
   - POST /users - Create new user (owner only)
   - GET /users - List users (owner only)
   - PUT /users/{id} - Update user (owner only)
   - DELETE /users/{id} - Delete user (owner only)
   - PUT /users/{id}/role - Change user role (owner only)

3. **Cognito Groups**:
   - Use Cognito User Pool Groups for role management
   - Assign users to groups (owner, editor, viewer)
   - Include group membership in JWT claims

### Advanced Security Features

1. **Session Management**:
   - Track active sessions per user
   - Allow users to view and revoke sessions
   - Automatic session cleanup

2. **Login History**:
   - Store login attempts in DynamoDB
   - Display login history to owner
   - Alert on suspicious login patterns

3. **API Key Authentication**:
   - Alternative authentication for programmatic access
   - API keys with scoped permissions
   - Rate limiting per API key

4. **OAuth 2.0 Integration**:
   - Social login (Google, GitHub)
   - Configure Cognito identity providers
   - Map social profiles to user attributes

## Testing Strategy

### Unit Tests

**Test Authentication Flow**:
- Test successful login with valid credentials
- Test login with invalid credentials (401 error)
- Test login with missing email or password (400 error)
- Test token validation logic
- Test user context extraction from JWT claims
- Test authorization logic (owner vs public access)

### Integration Tests

**Test Cognito Integration**:
- Test InitiateAuth API call with mock credentials
- Test token refresh flow
- Test global sign out
- Test token expiration handling

### Security Tests

**Test Authorization**:
- Test owner can access all endpoints
- Test public cannot access owner-only endpoints (403 error)
- Test invalid token is rejected (401 error)
- Test expired token is rejected (401 error)
- Test missing token for protected endpoint (401 error)

## Deployment Checklist

### Pre-Deployment

- [ ] Create Cognito User Pool with configured settings
- [ ] Create User Pool Client with correct auth flows
- [ ] Create owner account with verified email
- [ ] Set custom:role attribute to "owner" for owner account
- [ ] Note User Pool ID and Client ID for SAM template
- [ ] Configure email sending (SES or Cognito default)

### SAM Template Configuration

- [ ] Add Cognito User Pool resource to template.yaml
- [ ] Add User Pool Client resource to template.yaml
- [ ] Configure API Gateway JWT Authorizer
- [ ] Set environment variables for Lambda (USER_POOL_ID, CLIENT_ID)
- [ ] Grant Lambda execution role necessary Cognito permissions

### Post-Deployment

- [ ] Test login endpoint with owner credentials
- [ ] Test token validation at API Gateway
- [ ] Test owner-only endpoints require authentication
- [ ] Test public endpoints work without authentication
- [ ] Test token refresh flow
- [ ] Test logout flow
- [ ] Set up CloudWatch alarms for authentication failures
- [ ] Review and rotate any temporary passwords

## Monitoring and Observability

### CloudWatch Metrics

**Authentication Metrics**:
- `LoginAttempts` - Total login attempts (success + failure)
- `LoginFailures` - Failed login attempts
- `TokenRefreshCount` - Number of token refreshes
- `UnauthorizedAccess` - 401 errors from API Gateway

**Alarms**:
- High rate of login failures (potential brute force attack)
- Unusual number of token refreshes
- Spike in 401 unauthorized errors

### CloudWatch Logs

**Log Groups**:
- `/aws/lambda/portfolio-api` - Lambda function logs
- `/aws/apigateway/portfolio-api` - API Gateway access logs
- `/aws/cognito/userpools/portfolio-user-pool` - Cognito authentication logs

**Logged Events**:
- All authentication attempts (with outcome and timestamp)
- Token validation failures (with reason)
- Owner operations (create, update, delete actions)
- Authorization failures (forbidden access attempts)

## Summary

This authentication and authorization plan implements a secure, scalable owner-only model using Amazon Cognito:

**Key Features**:
- ✅ Amazon Cognito User Pool for user management
- ✅ JWT-based authentication with short-lived tokens
- ✅ API Gateway JWT Authorizer for token validation
- ✅ Owner-only access control with custom:role attribute
- ✅ Secure token refresh flow with long-lived refresh tokens
- ✅ Comprehensive error handling and security measures
- ✅ Clear authorization patterns for different endpoint types
- ✅ Future-ready for multi-user expansion

**No Code Implementation**: This document provides detailed planning for the authentication system. Implementation will follow in subsequent phases.
