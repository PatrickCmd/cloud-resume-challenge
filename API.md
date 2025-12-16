# Portfolio API Documentation

**Cloud Resume Challenge - RESTful API Specification**

## Table of Contents

- [Overview](#overview)
- [API Specification](#api-specification)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Blog Post Endpoints](#blog-post-endpoints)
  - [Project Endpoints](#project-endpoints)
  - [Certification Endpoints](#certification-endpoints)
  - [Visitor Tracking Endpoints](#visitor-tracking-endpoints)
  - [Analytics Endpoints](#analytics-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Best Practices](#best-practices)
- [Code Generation](#code-generation)
- [Testing](#testing)

---

## Overview

The Cloud Resume Challenge Portfolio API is a RESTful API that provides backend services for the portfolio website. It supports content management (blog posts, projects, certifications), user authentication, visitor tracking, and analytics.

### Key Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 📝 **Content Management** - Full CRUD operations for blog posts, projects, and certifications
- 📊 **Analytics** - Visitor tracking and content view analytics
- 🔒 **Role-Based Access Control** - Public and owner-only endpoints
- 📄 **OpenAPI 3.0.3** - Industry-standard API specification
- ✅ **Validation** - Request/response validation with detailed schemas

### Technology Stack

- **API Specification**: OpenAPI 3.0.3
- **Authentication**: JWT Bearer Tokens
- **Data Format**: JSON
- **Protocol**: HTTPS

---

## API Specification

The complete OpenAPI specification is available in [openapi.yml](openapi.yml).

### Base URLs

| Environment | URL | Description |
|-------------|-----|-------------|
| Production | `https://api.patrickcmd.dev/v1` | Production environment |
| Staging | `https://staging-api.patrickcmd.dev/v1` | Staging environment |
| Local | `http://localhost:8000/v1` | Local development |

### API Information

```yaml
Title: Cloud Resume Challenge Portfolio API
Version: 1.0.0
License: MIT
Contact: p.walukagga@gmail.com
```

---

## Authentication

### Authentication Method

The API uses **JWT (JSON Web Token)** bearer authentication for protected endpoints.

### Obtaining a Token

**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "p.walukagga@gmail.com",
  "password": "admin123"
}
```

**Response**:
```json
{
  "user": {
    "id": "owner-1",
    "email": "p.walukagga@gmail.com",
    "name": "Patrick Walukagga",
    "role": "owner"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Using the Token

Include the token in the `Authorization` header for all protected endpoints:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `public` | Anonymous users | Read published content only |
| `owner` | Authenticated owner | Full CRUD access, view drafts, analytics |

---

## Endpoints

### Endpoint Summary

| Category | Public | Owner Only | Total |
|----------|--------|------------|-------|
| Authentication | 1 | 2 | 3 |
| Blog Posts | 3 | 4 | 7 |
| Projects | 2 | 5 | 7 |
| Certifications | 2 | 5 | 7 |
| Visitor Tracking | 2 | 2 | 4 |
| Analytics | 2 | 4 | 6 |
| **Total** | **12** | **22** | **34** |

---

### Authentication Endpoints

#### 1. Login

Authenticate user with email and password.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "p.walukagga@gmail.com",
  "password": "admin123"
}
```

**Response**: `200 OK`
```json
{
  "user": {
    "id": "owner-1",
    "email": "p.walukagga@gmail.com",
    "name": "Patrick Walukagga",
    "role": "owner"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error**: `401 Unauthorized`
```json
{
  "error": "Unauthorized",
  "message": "Invalid email or password",
  "statusCode": 401
}
```

#### 2. Logout

Invalidate current user session.

```http
POST /auth/logout
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "message": "Successfully logged out"
}
```

#### 3. Get Current User

Retrieve authenticated user information.

```http
GET /auth/me
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "id": "owner-1",
  "email": "p.walukagga@gmail.com",
  "name": "Patrick Walukagga",
  "role": "owner"
}
```

---

### Blog Post Endpoints

#### 1. List Blog Posts

Retrieve blog posts with optional filtering.

```http
GET /blog/posts?status=published&category=Backend&limit=20&offset=0
```

**Query Parameters**:
- `status` (string): Filter by status - `published`, `draft`, `all` (owner only)
- `category` (string): Filter by category
- `tag` (string): Filter by tag
- `limit` (integer): Max posts to return (1-100, default: 20)
- `offset` (integer): Number of posts to skip (default: 0)

**Response**: `200 OK`
```json
{
  "posts": [
    {
      "id": "1",
      "slug": "building-scalable-apis-with-fastapi",
      "title": "Building Scalable APIs with FastAPI",
      "excerpt": "Learn how to build high-performance APIs...",
      "content": "# Introduction\n\nFastAPI is a modern...",
      "category": "Backend",
      "readTime": "5 min read",
      "publishedAt": "2024-03-15",
      "tags": ["python", "fastapi", "api", "backend"],
      "status": "published",
      "createdAt": "2024-03-15T10:30:00Z",
      "updatedAt": "2024-03-15T10:30:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

#### 2. Create Blog Post

Create a new blog post (owner only). Post is created as draft.

```http
POST /blog/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Building Scalable APIs with FastAPI",
  "excerpt": "Learn how to build high-performance APIs using FastAPI",
  "content": "# Introduction\n\nFastAPI is a modern...",
  "category": "Backend",
  "tags": ["python", "fastapi", "api", "backend"]
}
```

**Response**: `201 Created`
```json
{
  "id": "1",
  "slug": "building-scalable-apis-with-fastapi",
  "title": "Building Scalable APIs with FastAPI",
  "excerpt": "Learn how to build high-performance APIs...",
  "content": "# Introduction\n\nFastAPI is a modern...",
  "category": "Backend",
  "readTime": "5 min read",
  "publishedAt": "",
  "tags": ["python", "fastapi", "api", "backend"],
  "status": "draft",
  "createdAt": "2024-03-15T10:30:00Z",
  "updatedAt": "2024-03-15T10:30:00Z"
}
```

#### 3. Get Blog Post by ID

Retrieve a specific blog post. Drafts only visible to owner.

```http
GET /blog/posts/{postId}
```

**Response**: `200 OK`
```json
{
  "id": "1",
  "slug": "building-scalable-apis-with-fastapi",
  "title": "Building Scalable APIs with FastAPI",
  "excerpt": "Learn how to build high-performance APIs...",
  "content": "# Introduction\n\nFastAPI is a modern...",
  "category": "Backend",
  "readTime": "5 min read",
  "publishedAt": "2024-03-15",
  "tags": ["python", "fastapi", "api", "backend"],
  "status": "published",
  "createdAt": "2024-03-15T10:30:00Z",
  "updatedAt": "2024-03-15T10:30:00Z"
}
```

#### 4. Update Blog Post

Update an existing blog post (owner only).

```http
PUT /blog/posts/{postId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "excerpt": "Updated excerpt",
  "content": "Updated content...",
  "category": "Backend",
  "tags": ["python", "fastapi"]
}
```

**Response**: `200 OK`

#### 5. Delete Blog Post

Delete a blog post (owner only).

```http
DELETE /blog/posts/{postId}
Authorization: Bearer {token}
```

**Response**: `204 No Content`

#### 6. Publish Blog Post

Change post status from draft to published (owner only).

```http
POST /blog/posts/{postId}/publish
Authorization: Bearer {token}
```

**Response**: `200 OK`

#### 7. Unpublish Blog Post

Change post status from published to draft (owner only).

```http
POST /blog/posts/{postId}/unpublish
Authorization: Bearer {token}
```

**Response**: `200 OK`

#### 8. List Blog Categories

Get all unique blog post categories.

```http
GET /blog/categories
```

**Response**: `200 OK`
```json
{
  "categories": ["Backend", "Cloud", "DevOps", "Data Engineering"]
}
```

---

### Project Endpoints

#### 1. List Projects

Retrieve projects with optional filtering.

```http
GET /projects?status=published&featured=true&limit=20&offset=0
```

**Query Parameters**:
- `status` (string): Filter by status - `published`, `draft`, `all` (owner only)
- `featured` (boolean): Filter by featured status
- `limit` (integer): Max projects to return (1-100, default: 20)
- `offset` (integer): Number of projects to skip (default: 0)

**Response**: `200 OK`
```json
{
  "projects": [
    {
      "id": "proj-1",
      "name": "MTN Rwanda Agriculture Platform",
      "description": "Django REST API powering cooperative...",
      "longDescription": "A comprehensive agriculture platform...",
      "tech": ["Python", "Django", "PostgreSQL", "Docker"],
      "company": "HAMWE EA",
      "featured": true,
      "githubUrl": "https://github.com/username/project",
      "liveUrl": "https://project.example.com",
      "imageUrl": "https://images.example.com/project.png",
      "status": "published",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

#### 2. Create Project

Create a new project (owner only). Project is created as draft.

```http
POST /projects
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "MTN Rwanda Agriculture Platform",
  "description": "Django REST API powering cooperative...",
  "longDescription": "A comprehensive agriculture platform...",
  "tech": ["Python", "Django", "PostgreSQL", "Docker"],
  "company": "HAMWE EA",
  "featured": true,
  "githubUrl": "https://github.com/username/project",
  "liveUrl": "https://project.example.com",
  "imageUrl": "https://images.example.com/project.png"
}
```

**Response**: `201 Created`

#### 3. Get Project by ID

```http
GET /projects/{projectId}
```

**Response**: `200 OK`

#### 4. Update Project

```http
PUT /projects/{projectId}
Authorization: Bearer {token}
```

**Response**: `200 OK`

#### 5. Delete Project

```http
DELETE /projects/{projectId}
Authorization: Bearer {token}
```

**Response**: `204 No Content`

#### 6. Publish Project

```http
POST /projects/{projectId}/publish
Authorization: Bearer {token}
```

**Response**: `200 OK`

#### 7. Unpublish Project

```http
POST /projects/{projectId}/unpublish
Authorization: Bearer {token}
```

**Response**: `200 OK`

---

### Certification Endpoints

#### 1. List Certifications

Retrieve certifications and courses with optional filtering.

```http
GET /certifications?status=published&type=certification&featured=true
```

**Query Parameters**:
- `status` (string): Filter by status - `published`, `draft`, `all` (owner only)
- `type` (string): Filter by type - `certification`, `course`
- `featured` (boolean): Filter by featured status
- `limit` (integer): Max items to return (1-100, default: 20)
- `offset` (integer): Number of items to skip (default: 0)

**Response**: `200 OK`
```json
{
  "certifications": [
    {
      "id": "cert-1",
      "name": "AWS Certified Solutions Architect – Associate",
      "issuer": "Amazon Web Services (AWS)",
      "icon": "☁️",
      "type": "certification",
      "featured": true,
      "description": "Validates expertise in designing distributed systems on AWS",
      "credentialUrl": "https://aws.amazon.com/verification",
      "dateEarned": "2023-06-15",
      "status": "published",
      "createdAt": "2023-06-15T00:00:00Z",
      "updatedAt": "2023-06-15T00:00:00Z"
    }
  ],
  "total": 25,
  "limit": 20,
  "offset": 0
}
```

#### 2. Create Certification

Create a new certification or course (owner only). Created as draft.

```http
POST /certifications
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "AWS Certified Solutions Architect – Associate",
  "issuer": "Amazon Web Services (AWS)",
  "icon": "☁️",
  "type": "certification",
  "featured": true,
  "description": "Validates expertise in designing distributed systems on AWS",
  "credentialUrl": "https://aws.amazon.com/verification",
  "dateEarned": "2023-06-15"
}
```

**Response**: `201 Created`

#### 3-7. Get, Update, Delete, Publish, Unpublish

Similar to Blog Posts and Projects endpoints.

---

### Visitor Tracking Endpoints

#### 1. Track Visitor

Increment visitor counter (once per unique session).

```http
POST /visitors/track
```

**Response**: `200 OK`
```json
{
  "count": 1248,
  "tracked": true
}
```

**Notes**:
- Uses IP-based or session-based deduplication
- `tracked: false` if already counted in this session

#### 2. Get Visitor Count

Retrieve current total visitor count.

```http
GET /visitors/count
```

**Response**: `200 OK`
```json
{
  "count": 1247
}
```

#### 3. Get Daily Visitor Trends

Retrieve visitor counts for the last 30 days (owner only).

```http
GET /visitors/trends/daily?days=30
Authorization: Bearer {token}
```

**Query Parameters**:
- `days` (integer): Number of days to retrieve (1-90, default: 30)

**Response**: `200 OK`
```json
{
  "trends": [
    {
      "date": "Dec 16",
      "visitors": 45
    },
    {
      "date": "Dec 15",
      "visitors": 52
    }
  ]
}
```

#### 4. Get Monthly Visitor Trends

Retrieve visitor counts for the last 6 months (owner only).

```http
GET /visitors/trends/monthly?months=6
Authorization: Bearer {token}
```

**Query Parameters**:
- `months` (integer): Number of months to retrieve (1-12, default: 6)

**Response**: `200 OK`
```json
{
  "trends": [
    {
      "month": "Dec",
      "visitors": 850
    },
    {
      "month": "Nov",
      "visitors": 780
    }
  ]
}
```

---

### Analytics Endpoints

#### 1. Track Content View

Track a view for a specific content item (blog, project, certification).

```http
POST /analytics/track
Content-Type: application/json

{
  "contentId": "1",
  "contentType": "blog"
}
```

**Response**: `200 OK`
```json
{
  "views": 42,
  "tracked": true
}
```

**Notes**:
- Uses session-based deduplication
- `tracked: false` if already viewed in this session

#### 2. Get View Count for Content

Retrieve view count for a specific content item.

```http
GET /analytics/views/{contentType}/{contentId}
```

**Example**:
```http
GET /analytics/views/blog/1
```

**Response**: `200 OK`
```json
{
  "contentId": "1",
  "contentType": "blog",
  "views": 42
}
```

#### 3. Get All View Stats for Content Type

Retrieve view counts for all items of a specific content type (owner only).

```http
GET /analytics/views/{contentType}
Authorization: Bearer {token}
```

**Example**:
```http
GET /analytics/views/blog
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "contentType": "blog",
  "stats": {
    "1": 150,
    "2": 85,
    "3": 120
  }
}
```

#### 4. Get Top Viewed Content

Retrieve top viewed content across all types (owner only).

```http
GET /analytics/top-content?limit=5
Authorization: Bearer {token}
```

**Query Parameters**:
- `limit` (integer): Number of items per type (1-20, default: 5)

**Response**: `200 OK`
```json
{
  "blogs": [
    {
      "contentId": "1",
      "views": 150
    },
    {
      "contentId": "3",
      "views": 120
    }
  ],
  "projects": [
    {
      "contentId": "proj-1",
      "views": 95
    }
  ],
  "certifications": [
    {
      "contentId": "cert-1",
      "views": 75
    }
  ]
}
```

#### 5. Get Total Views

Retrieve total view count across all content (owner only).

```http
GET /analytics/total-views
Authorization: Bearer {token}
```

**Response**: `200 OK`
```json
{
  "totalViews": 5234
}
```

---

## Data Models

### User

```typescript
interface User {
  id: string;              // Unique user ID
  email: string;           // Email address (format: email)
  name: string;            // Full name
  role: "owner" | "public"; // User role
}
```

### Blog Post

```typescript
interface BlogPost {
  id: string;              // Unique post ID
  slug: string;            // URL-friendly slug (auto-generated from title)
  title: string;           // Post title (1-200 chars)
  excerpt: string;         // Short summary (1-500 chars)
  content: string;         // Full content (Markdown)
  category: string;        // Post category
  readTime: string;        // Estimated reading time (auto-calculated)
  publishedAt: string;     // Publication date (format: date, empty for drafts)
  tags: string[];          // Post tags (min 1 tag)
  status: "draft" | "published"; // Publication status
  createdAt: string;       // Creation timestamp (format: date-time)
  updatedAt: string;       // Last update timestamp (format: date-time)
}
```

### Project

```typescript
interface Project {
  id: string;              // Unique project ID
  name: string;            // Project name (1-200 chars)
  description: string;     // Short description (1-500 chars)
  longDescription: string; // Detailed description (Markdown)
  tech: string[];          // Technologies used (min 1)
  company: string;         // Company name
  featured: boolean;       // Whether featured on homepage
  githubUrl?: string;      // GitHub repository URL (optional, format: uri)
  liveUrl?: string;        // Live project URL (optional, format: uri)
  imageUrl?: string;       // Project image URL (optional, format: uri)
  status: "draft" | "published"; // Publication status
  createdAt: string;       // Creation timestamp (format: date-time)
  updatedAt: string;       // Last update timestamp (format: date-time)
}
```

### Certification

```typescript
interface Certification {
  id: string;              // Unique certification ID
  name: string;            // Certification name (1-200 chars)
  issuer: string;          // Issuing organization
  icon: string;            // Emoji or icon identifier (1-10 chars)
  type: "certification" | "course"; // Type
  featured: boolean;       // Whether featured
  description: string;     // Description
  credentialUrl?: string;  // Credential verification URL (optional, format: uri)
  dateEarned: string;      // Date earned (format: date)
  status: "draft" | "published"; // Publication status
  createdAt: string;       // Creation timestamp (format: date-time)
  updatedAt: string;       // Last update timestamp (format: date-time)
}
```

### Visitor Analytics

```typescript
interface DailyVisitors {
  date: string;            // Date in format "MMM DD" (e.g., "Dec 16")
  visitors: number;        // Number of visitors (min: 0)
}

interface MonthlyVisitors {
  month: string;           // Month abbreviation (e.g., "Dec")
  visitors: number;        // Number of visitors (min: 0)
}
```

### Content Analytics

```typescript
type ContentType = "blog" | "project" | "certification";

interface ContentViewStat {
  contentId: string;       // Content item ID
  views: number;           // Number of views (min: 0)
}
```

### Error Response

```typescript
interface Error {
  error: string;           // Short error identifier
  message: string;         // Human-readable error message
  statusCode: number;      // HTTP status code
  details?: object;        // Additional error details (optional)
}
```

---

## Error Handling

### Standard Error Response

All errors follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error description",
  "statusCode": 400,
  "details": {
    "field": "title",
    "issue": "Title is required"
  }
}
```

### HTTP Status Codes

| Code | Name | Description | When Used |
|------|------|-------------|-----------|
| 200 | OK | Success | Successful GET, PUT, POST |
| 201 | Created | Resource created | Successful POST (create) |
| 204 | No Content | Success with no response body | Successful DELETE |
| 400 | Bad Request | Invalid request | Validation errors, malformed JSON |
| 401 | Unauthorized | Authentication required | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions | Non-owner accessing owner endpoint |
| 404 | Not Found | Resource not found | Invalid ID, deleted resource |
| 500 | Internal Server Error | Server error | Unexpected server errors |

### Common Error Examples

#### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid request parameters",
  "statusCode": 400,
  "details": {
    "field": "title",
    "issue": "Title is required"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication token is missing or invalid",
  "statusCode": 401
}
```

#### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to perform this action",
  "statusCode": 403
}
```

#### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "The requested resource was not found",
  "statusCode": 404
}
```

---

## Rate Limiting

### Rate Limit Policy

| Endpoint Type | Rate Limit | Window |
|---------------|------------|--------|
| Authentication | 10 requests | 1 minute |
| Public Read | 100 requests | 1 minute |
| Owner CRUD | 60 requests | 1 minute |
| Analytics Tracking | 30 requests | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1639392000
```

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "statusCode": 429
}
```

---

## Best Practices

### API Client Implementation

#### 1. Authentication

```javascript
// Store token securely
const token = await login(email, password);
localStorage.setItem('auth_token', token);

// Include in all requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

#### 2. Error Handling

```javascript
try {
  const response = await fetch('/blog/posts', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error appropriately
}
```

#### 3. Pagination

```javascript
async function fetchAllPosts() {
  const allPosts = [];
  let offset = 0;
  const limit = 20;

  while (true) {
    const response = await fetch(
      `/blog/posts?limit=${limit}&offset=${offset}`
    );
    const data = await response.json();

    allPosts.push(...data.posts);

    if (allPosts.length >= data.total) {
      break;
    }

    offset += limit;
  }

  return allPosts;
}
```

#### 4. Content Deduplication

```javascript
// Track visitor only once per session
const hasTracked = sessionStorage.getItem('visitor_tracked');
if (!hasTracked) {
  await fetch('/visitors/track', { method: 'POST' });
  sessionStorage.setItem('visitor_tracked', 'true');
}

// Track content view only once per session
const viewKey = `viewed_${contentType}_${contentId}`;
const hasViewed = sessionStorage.getItem(viewKey);
if (!hasViewed) {
  await fetch('/analytics/track', {
    method: 'POST',
    body: JSON.stringify({ contentId, contentType })
  });
  sessionStorage.setItem(viewKey, 'true');
}
```

---

## Code Generation

### Using OpenAPI Generator

Generate client SDKs and server stubs from the OpenAPI specification.

#### 1. Install OpenAPI Generator

```bash
npm install @openapitools/openapi-generator-cli -g
```

#### 2. Generate TypeScript Client

```bash
openapi-generator-cli generate \
  -i openapi.yml \
  -g typescript-fetch \
  -o generated/typescript-client \
  --additional-properties=supportsES6=true,npmName=portfolio-api-client
```

#### 3. Generate Python FastAPI Server

```bash
openapi-generator-cli generate \
  -i openapi.yml \
  -g python-fastapi \
  -o generated/python-server \
  --additional-properties=packageName=portfolio_api
```

#### 4. Generate Go Client

```bash
openapi-generator-cli generate \
  -i openapi.yml \
  -g go \
  -o generated/go-client \
  --additional-properties=packageName=portfolioapi
```

### Available Generators

- **TypeScript**: `typescript-fetch`, `typescript-axios`, `typescript-node`
- **Python**: `python`, `python-fastapi`, `python-flask`
- **JavaScript**: `javascript`, `javascript-fetch`
- **Go**: `go`, `go-server`
- **Java**: `java`, `spring`
- **C#**: `csharp`, `csharp-netcore`

### Using Generated Client

```typescript
import { DefaultApi, Configuration } from 'portfolio-api-client';

const config = new Configuration({
  basePath: 'https://api.patrickcmd.dev/v1',
  accessToken: 'your-jwt-token'
});

const api = new DefaultApi(config);

// List blog posts
const posts = await api.listBlogPosts({
  status: 'published',
  limit: 20
});

// Create blog post
const newPost = await api.createBlogPost({
  blogPostCreate: {
    title: 'My New Post',
    excerpt: 'Post excerpt',
    content: '# Content',
    category: 'Backend',
    tags: ['python', 'api']
  }
});
```

---

## Testing

### 1. Interactive Documentation

View and test the API interactively using Swagger UI:

```bash
# Serve OpenAPI spec with Swagger UI
npx @redocly/cli preview-docs openapi.yml
```

Access at: `http://localhost:8080`

### 2. Mock Server

Create a mock API server for frontend development:

```bash
# Install Prism
npm install -g @stoplight/prism-cli

# Start mock server
prism mock openapi.yml
```

Mock server runs at: `http://localhost:4010`

### 3. Contract Testing

Validate API responses against the OpenAPI spec:

```javascript
import { validate } from 'openapi-validator-middleware';
import spec from './openapi.yml';

// Validate response
const result = validate(response, spec, '/blog/posts', 'get');
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### 4. Integration Testing

```javascript
import { test, expect } from '@jest/globals';

test('should list published blog posts', async () => {
  const response = await fetch('http://localhost:8000/v1/blog/posts');
  expect(response.status).toBe(200);

  const data = await response.json();
  expect(data).toHaveProperty('posts');
  expect(Array.isArray(data.posts)).toBe(true);
  expect(data).toHaveProperty('total');
  expect(data).toHaveProperty('limit');
  expect(data).toHaveProperty('offset');
});

test('should require authentication for creating posts', async () => {
  const response = await fetch('http://localhost:8000/v1/blog/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Post',
      excerpt: 'Test excerpt',
      content: 'Test content',
      category: 'Backend',
      tags: ['test']
    })
  });

  expect(response.status).toBe(401);
});
```

### 5. Load Testing

```bash
# Install k6
brew install k6

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:8000/v1/blog/posts');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
EOF

# Run load test
k6 run load-test.js
```

---

## Additional Resources

### Documentation Tools

- **Swagger UI**: Interactive API documentation
  - URL: https://swagger.io/tools/swagger-ui/

- **ReDoc**: Beautiful API documentation
  - URL: https://github.com/Redocly/redoc

- **Stoplight Studio**: Visual OpenAPI editor
  - URL: https://stoplight.io/studio

### OpenAPI Tools

- **OpenAPI Generator**: Generate clients and servers
  - URL: https://openapi-generator.tech/

- **Prism**: Mock API server
  - URL: https://stoplight.io/open-source/prism

- **Spectral**: OpenAPI linter
  - URL: https://stoplight.io/open-source/spectral

### Related Documentation

- [Frontend Implementation](frontend/README.md)
- [Backend Implementation](backend/README.md) _(coming soon)_
- [AWS Infrastructure](aws/README.md)
- [Main README](README.md)

---

## Contact & Support

**Author**: Patrick Walukagga
**Email**: p.walukagga@gmail.com
**Portfolio**: https://patrickcmd.dev
**GitHub**: [@PatrickCmd](https://github.com/PatrickCmd)

---

## License

This API specification is licensed under the [MIT License](LICENSE).
