# Testing the Backend API

Complete guide for testing your deployed FastAPI backend on AWS.

## Table of Contents

1. [Enabling API Documentation](#enabling-api-documentation)
2. [Authentication Setup](#authentication-setup)
3. [Testing with cURL](#testing-with-curl)
4. [Testing with Postman](#testing-with-postman)
5. [Testing with AWS Console](#testing-with-aws-console)
6. [Testing Endpoints](#testing-endpoints)

---

## Enabling API Documentation

The API docs (`/docs` and `/redoc`) are **only available in development mode** for security.

### Quick Method: Enable Docs Temporarily

1. **Update vault configuration:**
   ```bash
   cd aws/playbooks
   ansible-vault edit vaults/config.yml --vault-password-file ~/.vault_pass.txt
   ```

2. **Change environment to development:**
   ```yaml
   backend_config:
     # Environment Configuration
     environment: "development"  # Change from "production"
   ```

3. **Redeploy:**
   ```bash
   cd ../..
   ./aws/bin/backend-sam-deploy
   ```

4. **Access API docs:**
   - Swagger UI: https://api.patrickcmd.dev/docs
   - ReDoc: https://api.patrickcmd.dev/redoc
   - OpenAPI JSON: https://api.patrickcmd.dev/openapi.json

5. **⚠️ Remember to change back to production when done!**

---

## Authentication Setup

All API endpoints (except health checks if configured) require Cognito JWT authentication.

### Step 1: Create a Test User

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_DESdNfOSv \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS \
  --profile patrickcmd \
  --region us-east-1
```

### Step 2: Set Permanent Password

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_DESdNfOSv \
  --username testuser \
  --password MySecurePass123! \
  --permanent \
  --profile patrickcmd \
  --region us-east-1
```

### Step 3: Get Authentication Token

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 62r2aeiu82mktf5inljmvn2dvb \
  --auth-parameters USERNAME=testuser,PASSWORD=MySecurePass123! \
  --profile patrickcmd \
  --region us-east-1
```

**Response:**
```json
{
    "AuthenticationResult": {
        "AccessToken": "eyJraWQiOiJ...",
        "ExpiresIn": 3600,
        "TokenType": "Bearer",
        "RefreshToken": "eyJjdHkiOiJ...",
        "IdToken": "eyJraWQiOiJZ..."  ← Use this!
    }
}
```

### Step 4: Extract and Save Token

```bash
# Save IdToken to a variable
TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 62r2aeiu82mktf5inljmvn2dvb \
  --auth-parameters USERNAME=testuser,PASSWORD=MySecurePass123! \
  --profile patrickcmd \
  --region us-east-1 \
  --query 'AuthenticationResult.IdToken' \
  --output text)

echo "Token: $TOKEN"
```

---

## Testing with cURL

### 1. Health Check (No Auth Required - if configured)

```bash
curl https://api.patrickcmd.dev/health
```

### 2. Root Endpoint

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.patrickcmd.dev/
```

### 3. List All Blogs

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.patrickcmd.dev/blogs
```

### 4. Create a Blog Post

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Blog Post",
    "content": "This is the content of my blog post",
    "author": "Test User",
    "tags": ["test", "demo"],
    "published": true
  }' \
  https://api.patrickcmd.dev/blogs
```

### 5. Get Blog by ID

```bash
BLOG_ID="blog-123"  # Replace with actual ID from creation
curl -H "Authorization: Bearer $TOKEN" \
  https://api.patrickcmd.dev/blogs/$BLOG_ID
```

### 6. Update Blog

```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Blog Title",
    "content": "Updated content"
  }' \
  https://api.patrickcmd.dev/blogs/$BLOG_ID
```

### 7. Delete Blog

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  https://api.patrickcmd.dev/blogs/$BLOG_ID
```

### 8. List Projects

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.patrickcmd.dev/projects
```

### 9. Create Project

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Portfolio Website",
    "description": "A serverless portfolio built with AWS",
    "technologies": ["FastAPI", "AWS Lambda", "DynamoDB"],
    "github_url": "https://github.com/username/project",
    "live_url": "https://example.com",
    "featured": true
  }' \
  https://api.patrickcmd.dev/projects
```

### 10. List Certifications

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.patrickcmd.dev/certifications
```

### 11. Track Visitor

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "page": "/about",
    "user_agent": "Mozilla/5.0...",
    "ip_address": "1.2.3.4"
  }' \
  https://api.patrickcmd.dev/visitors
```

### 12. Get Analytics

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.patrickcmd.dev/analytics?period=7d
```

---

## Testing with Postman

### 1. Import API

**Option A: Import from OpenAPI Spec**
1. In Postman, click **Import**
2. Enter URL: `https://api.patrickcmd.dev/openapi.json` (if docs enabled)
3. Click **Import**

**Option B: Manual Setup**
1. Create new collection: "Portfolio API"
2. Add base URL: `https://api.patrickcmd.dev`

### 2. Configure Authentication

1. **Get Token** (create this request first):
   - Method: `POST`
   - URL: `https://cognito-idp.us-east-1.amazonaws.com/`
   - Headers:
     - `X-Amz-Target`: `AWSCognitoIdentityProviderService.InitiateAuth`
     - `Content-Type`: `application/x-amz-json-1.1`
   - Body (JSON):
     ```json
     {
       "AuthFlow": "USER_PASSWORD_AUTH",
       "ClientId": "62r2aeiu82mktf5inljmvn2dvb",
       "AuthParameters": {
         "USERNAME": "testuser",
         "PASSWORD": "MySecurePass123!"
       }
     }
     ```
   - Save response `AuthenticationResult.IdToken` to collection variable

2. **Set Collection Authorization:**
   - Collection Settings → Authorization
   - Type: **Bearer Token**
   - Token: `{{idToken}}`

### 3. Create Requests

**GET /blogs**
- Method: `GET`
- URL: `{{baseUrl}}/blogs`
- Authorization: Inherit from collection

**POST /blogs**
- Method: `POST`
- URL: `{{baseUrl}}/blogs`
- Authorization: Inherit from collection
- Body (JSON):
  ```json
  {
    "title": "Test Blog",
    "content": "Test content",
    "author": "Test User",
    "tags": ["test"],
    "published": true
  }
  ```

---

## Testing with AWS Console

### 1. API Gateway Console

1. **Open API Gateway Console:**
   ```
   https://console.aws.amazon.com/apigateway/home?region=us-east-1
   ```

2. **Find Your API:**
   - Look for: `production-portfolio-backend-api`
   - API ID: `dqx5llaj39`

3. **Test Endpoint:**
   - Click on **Resources**
   - Select endpoint (e.g., `/blogs`)
   - Click **TEST**
   - Add Authorization header:
     - Header name: `Authorization`
     - Header value: `Bearer <your-token>`
   - Click **Test**

### 2. Lambda Console

1. **Open Lambda Console:**
   ```
   https://console.aws.amazon.com/lambda/home?region=us-east-1
   ```

2. **Find Function:**
   - Function name: `production-portfolio-api`

3. **Test Function:**
   - Click **Test** tab
   - Create test event with API Gateway proxy format:
     ```json
     {
       "httpMethod": "GET",
       "path": "/blogs",
       "headers": {
         "Authorization": "Bearer <token>"
       },
       "queryStringParameters": null,
       "body": null
     }
     ```
   - Click **Test**

### 3. DynamoDB Console

1. **Open DynamoDB Console:**
   ```
   https://console.aws.amazon.com/dynamodb/home?region=us-east-1
   ```

2. **Explore Items:**
   - Table name: `production-portfolio-api-table`
   - Click **Explore table items**
   - View created blogs, projects, etc.

---

## Testing Endpoints

### Complete Endpoint Reference

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/` | GET | Yes | API info |
| `/health` | GET | Yes* | Health check |
| `/blogs` | GET | Yes | List all blogs |
| `/blogs` | POST | Yes | Create blog |
| `/blogs/{id}` | GET | Yes | Get blog by ID |
| `/blogs/{id}` | PUT | Yes | Update blog |
| `/blogs/{id}` | DELETE | Yes | Delete blog |
| `/projects` | GET | Yes | List all projects |
| `/projects` | POST | Yes | Create project |
| `/projects/{id}` | GET | Yes | Get project by ID |
| `/projects/{id}` | PUT | Yes | Update project |
| `/projects/{id}` | DELETE | Yes | Delete project |
| `/certifications` | GET | Yes | List certifications |
| `/certifications` | POST | Yes | Create certification |
| `/certifications/{id}` | GET | Yes | Get certification |
| `/certifications/{id}` | PUT | Yes | Update certification |
| `/certifications/{id}` | DELETE | Yes | Delete certification |
| `/visitors` | POST | Yes | Track visitor |
| `/analytics` | GET | Yes | Get analytics |
| `/docs` | GET | No** | Swagger UI |
| `/redoc` | GET | No** | ReDoc |
| `/openapi.json` | GET | No** | OpenAPI spec |

\* Currently requires auth due to `DefaultAuthorizer`
\*\* Only available in development mode

---

## Troubleshooting

### 401 Unauthorized

**Cause:** Missing or invalid token

**Solution:**
```bash
# Verify token is set
echo $TOKEN

# Get fresh token
TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 62r2aeiu82mktf5inljmvn2dvb \
  --auth-parameters USERNAME=testuser,PASSWORD=MySecurePass123! \
  --profile patrickcmd \
  --region us-east-1 \
  --query 'AuthenticationResult.IdToken' \
  --output text)
```

### 403 Forbidden

**Cause:** Token expired or invalid scopes

**Solution:** Get new token (tokens expire after 1 hour)

### 404 Not Found

**Cause:** Wrong endpoint URL or API not deployed

**Solution:**
```bash
# Verify API is deployed
aws apigateway get-rest-apis \
  --profile patrickcmd \
  --region us-east-1 \
  --query 'items[?name==`production-portfolio-backend-api`]'
```

### CORS Errors

**Cause:** Request from unauthorized origin

**Solution:** Verify origin is in `FrontendOrigins` configuration

### View Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/production-portfolio-api --follow \
  --profile patrickcmd --region us-east-1

# API Gateway logs
aws logs tail /aws/apigateway/production-portfolio-api --follow \
  --profile patrickcmd --region us-east-1
```

---

## Example: Complete Blog Workflow

```bash
# 1. Get authentication token
TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 62r2aeiu82mktf5inljmvn2dvb \
  --auth-parameters USERNAME=testuser,PASSWORD=MySecurePass123! \
  --profile patrickcmd \
  --region us-east-1 \
  --query 'AuthenticationResult.IdToken' \
  --output text)

# 2. Create a blog post
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with AWS Lambda",
    "content": "Lambda is a serverless compute service...",
    "author": "Patrick",
    "tags": ["aws", "serverless", "lambda"],
    "published": true
  }' \
  https://api.patrickcmd.dev/blogs)

echo $RESPONSE

# 3. Extract blog ID
BLOG_ID=$(echo $RESPONSE | jq -r '.id')
echo "Created blog with ID: $BLOG_ID"

# 4. Get the blog
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.patrickcmd.dev/blogs/$BLOG_ID | jq .

# 5. Update the blog
curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with AWS Lambda - Updated",
    "content": "Updated content with more details..."
  }' \
  https://api.patrickcmd.dev/blogs/$BLOG_ID | jq .

# 6. List all blogs
curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.patrickcmd.dev/blogs | jq .

# 7. Delete the blog
curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  https://api.patrickcmd.dev/blogs/$BLOG_ID
```

---

## Next Steps

1. **Enable API docs** for interactive testing
2. **Create test users** in Cognito
3. **Populate test data** (blogs, projects, certifications)
4. **Test frontend integration** with your React/Vue app
5. **Monitor logs** in CloudWatch
6. **Set up CI/CD** for automated testing

For more information, see:
- [Backend API Documentation](../../backend/README.md)
- [DynamoDB Design](../../backend/docs/DYNAMODB-DESIGN.md)
- [Local Testing Guide](../../backend/docs/LOCAL_TESTING.md)
