# Local Backend Testing Guide

This guide shows you how to run and test the FastAPI backend locally.

## Prerequisites

1. **Python environment**: Set up with `uv` (already done)
2. **Environment variables**: Configure `.env` file
3. **DynamoDB**: Either local DynamoDB or AWS credentials

## Setup Options

### Option A: Test with AWS DynamoDB (Easiest)

Use your existing AWS DynamoDB table:

1. **Configure `.env`**:
   ```bash
   # Make sure DYNAMODB_ENDPOINT is commented out or empty
   ENVIRONMENT=development
   AWS_REGION=us-east-1
   AWS_PROFILE=patrickcmd
   DYNAMODB_TABLE_NAME=portfolio-api-table
   # DYNAMODB_ENDPOINT=  # Leave empty for AWS
   ```

2. **Run the server**:
   ```bash
   cd backend
   uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8080
   ```

3. **Access the API**:
   - API: http://localhost:8080
   - Health check: http://localhost:8080/health
   - Interactive docs: http://localhost:8080/docs
   - ReDoc: http://localhost:8080/redoc

   **Note**: Using port 8080 to avoid conflict with DynamoDB Local (port 8000)

### Option B: Test with Local DynamoDB

For fully local development without AWS connection:

1. **Install and run DynamoDB Local**:
   ```bash
   # Using Docker (recommended)
   docker run -p 8001:8000 amazon/dynamodb-local

   # Or download JAR file from AWS
   ```

2. **Configure `.env`**:
   ```bash
   ENVIRONMENT=development
   AWS_REGION=us-east-1
   DYNAMODB_TABLE_NAME=portfolio-api-table
   DYNAMODB_ENDPOINT=http://localhost:8001  # Point to local DynamoDB
   ```

3. **Create local table** (you'll need to run your table creation script):
   ```bash
   # Use your existing table creation script with local endpoint
   python scripts/create_table.py --local
   ```

4. **Run the server**:
   ```bash
   cd backend
   uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8080
   ```

## Testing the API

### 1. Using cURL

```bash
# Health check
curl http://localhost:8080/health

# Get all published blogs
curl http://localhost:8080/blogs

# Get a specific blog
curl http://localhost:8080/blogs/{blog_id}

# Track a visitor (public endpoint)
curl -X POST http://localhost:8080/visitors/track \
  -H "Content-Type: application/json" \
  -d '{"page_path": "/", "referrer": "https://google.com"}'

# Get visitor count
curl http://localhost:8080/visitors/count

# Track analytics (public endpoint)
curl -X POST http://localhost:8080/analytics/track/blog/my-blog-post

# Get total views
curl http://localhost:8080/analytics/views/total
```

### 2. Using HTTPie (prettier output)

```bash
# Install httpie
brew install httpie  # or: pip install httpie

# Make requests
http GET localhost:8080/health
http GET localhost:8080/blogs
http POST localhost:8080/visitors/track page_path="/" referrer="https://google.com"
```

### 3. Using Interactive API Docs

The easiest way to test! Open in your browser:
- **Swagger UI**: http://localhost:8080/docs
- **ReDoc**: http://localhost:8080/redoc

The Swagger UI lets you:
- See all available endpoints
- Try out requests directly in the browser
- See request/response schemas
- Test authentication

### 4. Using Python Requests

```python
import requests

# Health check
response = requests.get("http://localhost:8080/health")
print(response.json())

# Get blogs
response = requests.get("http://localhost:8080/blogs")
print(response.json())

# Track visitor
response = requests.post(
    "http://localhost:8080/visitors/track",
    json={"page_path": "/blog/test", "referrer": ""}
)
print(response.json())
```

### 5. Using Thunder Client (VS Code Extension)

If you use VS Code:
1. Install "Thunder Client" extension
2. Create a new collection
3. Add requests with URL `http://localhost:8080/...`

## Testing Protected Endpoints

Some endpoints require authentication (owner role):

1. **Get an auth token** (you need to authenticate via Cognito):
   ```bash
   # Login endpoint
   curl -X POST http://localhost:8080/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "your-email@example.com", "password": "your-password"}'
   ```

2. **Use the token**:
   ```bash
   curl -X POST http://localhost:8080/blogs \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -d '{
       "title": "Test Blog Post",
       "content": "Content here",
       "excerpt": "Excerpt here",
       "category": "Technology",
       "tags": ["test"]
     }'
   ```

## Available Endpoints

### Public Endpoints (No Auth Required)

**Blog**:
- `GET /blogs` - List published blogs
- `GET /blogs/{blog_id}` - Get a blog post
- `GET /blogs/categories/list` - List categories

**Projects**:
- `GET /projects` - List published projects
- `GET /projects/{project_id}` - Get a project

**Certifications**:
- `GET /certifications` - List published certifications
- `GET /certifications/{cert_id}` - Get a certification

**Visitors**:
- `POST /visitors/track` - Track a visitor
- `GET /visitors/count` - Get total visitor count

**Analytics**:
- `POST /analytics/track/{content_type}/{content_id}` - Track content view
- `GET /analytics/views/{content_type}/{content_id}` - Get view count
- `GET /analytics/views/total` - Get total views

**Auth**:
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout

### Protected Endpoints (Owner Auth Required)

**Blog**:
- `POST /blogs` - Create blog post
- `PUT /blogs/{blog_id}` - Update blog post
- `DELETE /blogs/{blog_id}` - Delete blog post
- `POST /blogs/{blog_id}/publish` - Publish blog post
- `POST /blogs/{blog_id}/unpublish` - Unpublish blog post

**Projects** (similar CRUD operations)
**Certifications** (similar CRUD operations)

**Visitors**:
- `GET /visitors/trends/daily` - Get daily trends
- `GET /visitors/trends/monthly` - Get monthly trends

**Analytics**:
- `GET /analytics/top-content` - Get top content
- `GET /analytics/overview` - Get analytics overview
- `GET /analytics/pages` - Get page analytics
- `GET /analytics/blog/{post_id}/stats` - Get blog post stats

## Development Workflow

1. **Start the server**:
   ```bash
   cd backend
   uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```
   The `--reload` flag auto-restarts on code changes.

2. **Make code changes**: Edit files in `src/`

3. **Test immediately**: The server auto-reloads, test at http://localhost:8080

4. **Run unit tests**:
   ```bash
   uv run pytest tests/unit/ -v
   ```

5. **Check logs**: Watch the terminal for request logs and errors

## Troubleshooting

### Server won't start
- Check if port 8000 is already in use: `lsof -i :8000`
- Kill existing process: `kill -9 $(lsof -t -i :8000)`

### Can't connect to DynamoDB
- **AWS**: Make sure AWS credentials are configured (`aws configure`)
- **Local**: Make sure DynamoDB Local is running on port 8001

### CORS errors (from frontend)
- Add your frontend URL to `CORS_ORIGINS` in `.env`:
  ```
  CORS_ORIGINS=http://localhost:3000,http://localhost:5173
  ```

### Authentication not working
- Verify Cognito configuration in `.env`
- Check user exists in Cognito User Pool
- Ensure user has `custom:role` attribute set to `owner`

## Quick Test Script

Save this as `test_api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8080"

echo "Testing Health Check..."
curl -s "$BASE_URL/health" | jq .

echo -e "\n\nTesting Blog Listing..."
curl -s "$BASE_URL/blogs" | jq .

echo -e "\n\nTesting Visitor Tracking..."
curl -s -X POST "$BASE_URL/visitors/track" \
  -H "Content-Type: application/json" \
  -d '{"page_path": "/test", "referrer": "https://google.com"}' | jq .

echo -e "\n\nTesting Analytics..."
curl -s "$BASE_URL/analytics/views/total" | jq .

echo -e "\n\nDone!"
```

Run with: `bash test_api.sh`

## Next Steps

1. Start the server with Option A (AWS DynamoDB) or Option B (Local)
2. Open http://localhost:8080/docs in your browser
3. Try the endpoints interactively
4. Test your frontend integration

Happy testing! 🚀
