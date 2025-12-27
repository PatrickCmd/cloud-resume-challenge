# FastAPI Application-Layer Authentication

## Overview

This backend uses **application-layer authentication** where FastAPI validates JWT tokens, not API Gateway. This architectural decision provides more flexibility and control over authentication logic.

## Why Application-Layer Authentication?

### The Problem with API Gateway Cognito Authorizer

Initially, we tried using API Gateway's Cognito authorizer as the default authorizer for all routes. This created several problems:

1. **Scope Mismatch**: API Gateway expected tokens with scopes `openid`, `email`, `profile`, but Cognito issued tokens with scope `aws.cognito.signin.user.admin`

2. **Mixed Public/Private Endpoints**: Some endpoints are public (e.g., `GET /blogs` returns published posts), while others require authentication (e.g., `POST /blogs` creates a post). API Gateway's default authorizer applies to ALL routes, making it difficult to have mixed access levels.

3. **Lack of Granular Control**: API Gateway authorizer is all-or-nothing per route. We couldn't have endpoints that:
   - Are public for reading but require authentication for writing
   - Return different data based on whether the user is authenticated
   - Require different roles (e.g., owner vs regular user)

### The Solution: FastAPI Dependencies

By disabling the API Gateway default authorizer and using FastAPI's dependency injection system, we gain:

1. **Granular Control**: Each endpoint can specify its own authentication requirements:
   ```python
   # Public endpoint - no auth required
   @router.get("/blogs")
   async def list_blogs():
       return published_blogs

   # Requires authentication
   @router.post("/blogs")
   async def create_blog(current_user: dict = Depends(get_current_user)):
       return create_blog_post()

   # Requires specific role
   @router.delete("/blogs/{id}")
   async def delete_blog(current_user: dict = Depends(require_owner_role)):
       return delete_blog_post()
   ```

2. **Optional Authentication**: Endpoints can access user info if provided but work without it:
   ```python
   @router.get("/blogs")
   async def list_blogs(current_user: dict | None = Depends(get_current_user_optional)):
       # Return all blogs if user is owner, only published if not
       if current_user and current_user.get("role") == "owner":
           return all_blogs
       return published_blogs
   ```

3. **Custom Validation Logic**: We can validate tokens, check claims, enforce business rules:
   ```python
   def require_owner_role(current_user: dict = Depends(get_current_user)):
       if current_user.get("role") != "owner":
           raise ForbiddenException("Owner role required")
       return current_user
   ```

## Architecture

### API Gateway Configuration

**File**: `aws/backend.yaml`

All routes have `Authorizer: NONE`, which means API Gateway does NOT validate tokens:

```yaml
PortfolioApiFunction:
  Type: AWS::Serverless::Function
  Properties:
    Events:
      # Auth endpoints - no API Gateway auth
      AuthLoginApi:
        Type: Api
        Properties:
          Path: /auth/login
          Method: POST
          # No Auth block - FastAPI handles authentication

      # Catch-all - no API Gateway auth
      ApiProxy:
        Type: Api
        Properties:
          Path: /{proxy+}
          Method: ANY
          # No Auth block - FastAPI handles authentication

PortfolioApiGateway:
  Type: AWS::Serverless::Api
  Properties:
    Auth:
      # No DefaultAuthorizer - all routes are open at API Gateway level
      # FastAPI handles ALL authentication via Depends(get_current_user)
      Authorizers:
        CognitoAuthorizer:  # Defined but not used
          UserPoolArn: !Sub arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${CognitoUserPoolId}
```

### FastAPI Dependencies

**File**: `backend/src/dependencies.py`

Three authentication dependencies:

1. **`get_current_user`** - Requires valid JWT token (access or ID token)
   ```python
   async def get_current_user(
       credentials: HTTPAuthorizationCredentials = Depends(security)
   ) -> dict:
       token = credentials.credentials
       user = extract_user_from_token(token)
       if not user:
           raise HTTPException(status_code=401, detail="Invalid or expired token")
       return user
   ```

2. **`get_current_user_optional`** - Returns user if token provided, None otherwise
   ```python
   async def get_current_user_optional(
       credentials: HTTPAuthorizationCredentials | None = Depends(optional_security)
   ) -> dict | None:
       if not credentials:
           return None
       return extract_user_from_token(credentials.credentials)
   ```

3. **`require_owner_role`** - Requires valid token AND owner role
   ```python
   async def require_owner_role(
       current_user: dict = Depends(get_current_user)
   ) -> dict:
       if current_user.get("role") != "owner":
           raise ForbiddenException("Owner role required")
       return current_user
   ```

### JWT Token Validation

**File**: `backend/src/utils/jwt.py`

Token validation follows AWS Cognito best practices:

1. Fetch Cognito public keys from JWKS endpoint (cached)
2. Extract key ID (kid) from token header
3. Find matching public key
4. Verify token signature
5. Validate expiration (exp claim)
6. Validate issuer (iss claim)
7. Validate audience (aud claim for ID tokens, client_id for access tokens)
8. Extract and return user claims

```python
def decode_token(token: str) -> dict | None:
    jwks = get_cognito_public_keys()
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")

    # Find matching public key
    key = next((jwk for jwk in jwks["keys"] if jwk["kid"] == kid), None)
    if not key:
        return None

    # Verify and decode
    claims = jwt.decode(
        token,
        key,
        algorithms=[settings.jwt_algorithm],
        audience=settings.cognito_client_id,
        issuer=settings.jwt_issuer,
    )
    return claims
```

## Token Types

### Access Token

Used for most API endpoints. Contains:
- `sub` - User ID
- `client_id` - Cognito app client ID
- `scope` - `aws.cognito.signin.user.admin`
- `token_use` - `access`
- `username` - Cognito username

### ID Token

Used for user profile endpoints (e.g., `/auth/me`). Contains:
- `sub` - User ID
- `aud` - Audience (Cognito app client ID)
- `email` - User email
- `name` - User display name
- `custom:role` - User role (owner, user, etc.)
- `email_verified` - Email verification status
- `token_use` - `id`

## Endpoint Examples

### Public Endpoint
```python
@router.get("/blogs", response_model=BlogPostListResponse)
async def list_blog_posts(
    status_filter: str | None = Query(None),
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    \"\"\"
    List all blog posts.
    Public endpoint - returns published posts by default.
    \"\"\"
    if status_filter is None:
        status_filter = "PUBLISHED"
    return blog_repo.list_posts(status=status_filter)
```

### Authenticated Endpoint
```python
@router.post("/blogs", response_model=BlogPostResponse)
async def create_blog_post(
    post: BlogPostCreate,
    current_user: dict = Depends(require_owner_role),
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    \"\"\"
    Create a new blog post.
    Requires owner authentication.
    \"\"\"
    post_data = post.model_dump()
    return blog_repo.create(post_data)
```

### Optional Authentication
```python
@router.get("/blogs/{blog_id}", response_model=BlogPostResponse)
async def get_blog_post(
    blog_id: str,
    current_user: dict | None = Depends(get_current_user_optional),
    blog_repo: BlogRepository = Depends(get_blog_repository),
):
    \"\"\"
    Get a blog post by ID.
    Returns draft posts if user is owner, only published otherwise.
    \"\"\"
    post = blog_repo.get_by_id(blog_id)

    # Show drafts only to owner
    if post.get("status") == "DRAFT":
        if not current_user or current_user.get("role") != "owner":
            raise HTTPException(status_code=404, detail="Blog post not found")

    return post
```

## Benefits

1. **Flexibility**: Mix public and private endpoints in the same router
2. **Granular Control**: Different authentication levels per endpoint
3. **Clear Code**: Authentication requirements are explicit in endpoint signatures
4. **Easier Testing**: Can mock authentication dependencies in tests
5. **Better Error Messages**: FastAPI can return detailed validation errors
6. **No API Gateway Caching Issues**: No need to worry about authorizer caching

## Security Considerations

1. **Token Validation**: Always validate tokens server-side, never trust client
2. **Public Key Caching**: Cognito public keys are cached to reduce latency
3. **Token Expiration**: Tokens expire after 1 hour, must refresh
4. **HTTPS Only**: API Gateway enforces HTTPS, tokens never sent over HTTP
5. **CORS**: Configured to only allow requests from trusted frontend origins

## Related Files

- SAM Template: [aws/backend.yaml](../../aws/backend.yaml)
- FastAPI Dependencies: [src/dependencies.py](../src/dependencies.py)
- JWT Utilities: [src/utils/jwt.py](../src/utils/jwt.py)
- Blog API Example: [src/api/blog.py](../src/api/blog.py)

## Migration Notes

If you need to switch back to API Gateway Cognito authorizer:

1. Remove `Authorizer: NONE` from catch-all route in SAM template
2. Add `DefaultAuthorizer: CognitoAuthorizer` to API Gateway Auth config
3. Update FastAPI endpoints to NOT use authentication dependencies
4. Note: This will require all endpoints to be authenticated at API Gateway level
