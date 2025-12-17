# DynamoDB Database Design & Access Patterns

**Single-Table Design for Portfolio API**

## Overview

This document outlines the complete DynamoDB database design for the serverless portfolio API backend. The design follows DynamoDB best practices using a single-table design pattern to optimize for performance, cost, and scalability.

**Design Philosophy**:
- Single table for all entities (blog posts, projects, certifications, visitors, analytics)
- Access patterns drive key design
- Generic attribute names (PK, SK, GSI1PK, GSI1SK) for flexibility
- Overloaded keys to support multiple query patterns
- Entity-specific data in `Data` attribute map

## Table Configuration

### Table Settings

**Table Name**: `portfolio-api-table`

**Billing Mode**: On-Demand (PAY_PER_REQUEST)
- Best for unpredictable traffic patterns
- No capacity planning required
- Scales automatically
- Cost-effective for low to medium traffic

**Attribute Definitions**:
```
PK          - String (Partition Key)
SK          - String (Sort Key)
GSI1PK      - String (Global Secondary Index Partition Key)
GSI1SK      - String (Global Secondary Index Sort Key)
EntityType  - String (LSI Sort Key - optional for filtering)
Status      - String (for published/draft filtering)
```

**Primary Key**:
- **Partition Key**: `PK` (String)
- **Sort Key**: `SK` (String)

**Global Secondary Index (GSI1)**:
- **Index Name**: `GSI1`
- **Partition Key**: `GSI1PK` (String)
- **Sort Key**: `GSI1SK` (String)
- **Projection**: ALL (include all attributes)

**Time To Live (TTL)**:
- Attribute: `ExpiresAt` (Number, Unix timestamp)
- Used for automatic cleanup of temporary data (e.g., visitor session tracking)

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    PORTFOLIO TABLE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐                                         │
│  │  BLOG POSTS   │                                         │
│  │  - Published  │                                         │
│  │  - Drafts     │                                         │
│  │  - Categories │                                         │
│  └───────────────┘                                         │
│                                                             │
│  ┌───────────────┐                                         │
│  │   PROJECTS    │                                         │
│  │  - Published  │                                         │
│  │  - Drafts     │                                         │
│  │  - Featured   │                                         │
│  └───────────────┘                                         │
│                                                             │
│  ┌───────────────┐                                         │
│  │ CERTIFICATIONS│                                         │
│  │  - Published  │                                         │
│  │  - Drafts     │                                         │
│  │  - Types      │                                         │
│  └───────────────┘                                         │
│                                                             │
│  ┌───────────────┐      ┌──────────────────┐              │
│  │   VISITORS    │      │    ANALYTICS     │              │
│  │  - Daily      │      │  - Content Views │              │
│  │  - Monthly    │      │  - Per Content   │              │
│  │  - Sessions   │      │  - Per Type      │              │
│  └───────────────┘      └──────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Patterns and Entity Types

### Key Pattern Conventions

| Entity Type | PK Pattern | SK Pattern | GSI1PK Pattern | GSI1SK Pattern |
|-------------|------------|------------|----------------|----------------|
| **Blog Post** | `BLOG#<blogId>` | `METADATA` | `BLOG#STATUS#<status>` | `BLOG#<publishedAt>` |
| **Blog Category** | `BLOG#CATEGORY#<category>` | `COUNT` | - | - |
| **Project** | `PROJECT#<projectId>` | `METADATA` | `PROJECT#STATUS#<status>` | `PROJECT#<createdAt>` |
| **Certification** | `CERT#<certId>` | `METADATA` | `CERT#STATUS#<status>#<type>` | `CERT#<dateEarned>` |
| **Visitor Daily** | `VISITOR#DAILY#<date>` | `COUNT` | - | - |
| **Visitor Monthly** | `VISITOR#MONTHLY#<yearMonth>` | `COUNT` | - | - |
| **Visitor Session** | `VISITOR#SESSION#<sessionId>` | `TRACKED` | - | - |
| **Analytics View** | `ANALYTICS#<contentType>#<contentId>` | `VIEWS` | `ANALYTICS#<contentType>` | `ANALYTICS#VIEWS#<viewCount>` |
| **Analytics Session** | `ANALYTICS#SESSION#<sessionId>` | `<contentType>#<contentId>` | - | - |

## Access Patterns Mapping

### Blog Posts (8 Endpoints)

#### 1. List All Blog Posts (GET /blog/posts)

**Access Pattern**: Get all blog posts filtered by status

**API Query Parameters**:
- `status` - Filter by status (published, draft, all)
- `category` - Filter by category
- `limit` - Pagination limit (default: 20)
- `offset` - Pagination offset (default: 0)

**Authorization**:
- Public users: Only `status=published`
- Owner: All statuses

**DynamoDB Operation**: Query with GSI1

**Query Pattern**:
```
# For published posts
GSI1:
  KeyConditionExpression: GSI1PK = 'BLOG#STATUS#PUBLISHED'
  ScanIndexForward: False  # Newest first (descending publishedAt)
  Limit: <limit>

# For draft posts (owner only)
GSI1:
  KeyConditionExpression: GSI1PK = 'BLOG#STATUS#DRAFT'
  ScanIndexForward: False
  Limit: <limit>

# For all posts (owner only)
GSI1:
  KeyConditionExpression: GSI1PK begins_with 'BLOG#STATUS#'
  ScanIndexForward: False
  Limit: <limit>
```

**Filter Expression** (for category):
```
FilterExpression: Data.category = :category
```

**Pagination**:
- Use `LastEvaluatedKey` and `ExclusiveStartKey` for cursor-based pagination
- Convert offset to approximate scan for offset-based pagination (less efficient)

**Item Structure**:
```json
{
  "PK": "BLOG#blog-post-1",
  "SK": "METADATA",
  "GSI1PK": "BLOG#STATUS#PUBLISHED",
  "GSI1SK": "BLOG#2025-01-15T10:30:00Z",
  "EntityType": "BLOG",
  "Status": "PUBLISHED",
  "Data": {
    "id": "blog-post-1",
    "slug": "my-first-blog-post",
    "title": "My First Blog Post",
    "excerpt": "This is a short excerpt...",
    "content": "Full blog post content...",
    "category": "Technology",
    "tags": ["aws", "serverless", "dynamodb"],
    "readTime": 5,
    "publishedAt": "2025-01-15T10:30:00Z",
    "createdAt": "2025-01-14T08:00:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

#### 2. Get Single Blog Post (GET /blog/posts/{postId})

**Access Pattern**: Get blog post by ID

**Authorization**:
- Public users: Only if `status=PUBLISHED`
- Owner: Any status

**DynamoDB Operation**: GetItem

**Key**:
```
PK = 'BLOG#<postId>'
SK = 'METADATA'
```

**Authorization Check** (in application):
```python
# After retrieving item
if item.Status == 'DRAFT' and current_user.role != 'owner':
    raise 404 Not Found  # Hide draft posts from public
```

#### 3. Create Blog Post (POST /blog/posts)

**Access Pattern**: Create new blog post (owner only)

**DynamoDB Operation**: PutItem

**Generated Fields**:
- `id`: UUID v4
- `slug`: Generated from title (lowercase, hyphenated)
- `readTime`: Calculated from content length
- `createdAt`: Current timestamp
- `updatedAt`: Current timestamp
- `status`: Default to 'DRAFT'

**Item Structure**:
```json
{
  "PK": "BLOG#<generatedId>",
  "SK": "METADATA",
  "GSI1PK": "BLOG#STATUS#DRAFT",
  "GSI1SK": "BLOG#<createdAt>",
  "EntityType": "BLOG",
  "Status": "DRAFT",
  "Data": {
    "id": "<generatedId>",
    "slug": "<generatedSlug>",
    "title": "<title>",
    "excerpt": "<excerpt>",
    "content": "<content>",
    "category": "<category>",
    "tags": ["<tag1>", "<tag2>"],
    "readTime": <calculatedReadTime>,
    "publishedAt": null,
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  }
}
```

**Additional Operation**: Update category count
```
# Increment category counter
PK = 'BLOG#CATEGORY#<category>'
SK = 'COUNT'
UpdateExpression: ADD CategoryCount :increment
ExpressionAttributeValues: {':increment': 1}
```

#### 4. Update Blog Post (PUT /blog/posts/{postId})

**Access Pattern**: Update existing blog post (owner only)

**DynamoDB Operation**: UpdateItem

**Key**:
```
PK = 'BLOG#<postId>'
SK = 'METADATA'
```

**Update Expression**:
```
UpdateExpression:
  SET Data.title = :title,
      Data.excerpt = :excerpt,
      Data.content = :content,
      Data.category = :category,
      Data.tags = :tags,
      Data.readTime = :readTime,
      Data.updatedAt = :updatedAt
```

**Conditional Expression**:
```
ConditionExpression: attribute_exists(PK)  # Ensure post exists
```

**Category Change Handling**:
- If category changed, decrement old category count and increment new category count
- Requires additional operations

#### 5. Delete Blog Post (DELETE /blog/posts/{postId})

**Access Pattern**: Delete blog post (owner only)

**DynamoDB Operation**: DeleteItem

**Key**:
```
PK = 'BLOG#<postId>'
SK = 'METADATA'
```

**Conditional Expression**:
```
ConditionExpression: attribute_exists(PK)  # Ensure post exists
```

**Additional Operation**: Decrement category count
```
PK = 'BLOG#CATEGORY#<category>'
SK = 'COUNT'
UpdateExpression: ADD CategoryCount :decrement
ExpressionAttributeValues: {':decrement': -1}
```

#### 6. Publish Blog Post (POST /blog/posts/{postId}/publish)

**Access Pattern**: Change status from DRAFT to PUBLISHED (owner only)

**DynamoDB Operation**: UpdateItem

**Key**:
```
PK = 'BLOG#<postId>'
SK = 'METADATA'
```

**Update Expression**:
```
UpdateExpression:
  SET #status = :published,
      GSI1PK = :gsi1pk,
      GSI1SK = :gsi1sk,
      Data.#status = :published,
      Data.publishedAt = :publishedAt,
      Data.updatedAt = :updatedAt

ExpressionAttributeNames:
  '#status': 'Status'

ExpressionAttributeValues:
  ':published': 'PUBLISHED'
  ':gsi1pk': 'BLOG#STATUS#PUBLISHED'
  ':gsi1sk': 'BLOG#<publishedAt>'
  ':publishedAt': '<currentTimestamp>'
  ':updatedAt': '<currentTimestamp>'
```

**Conditional Expression**:
```
ConditionExpression: #status = :draft
ExpressionAttributeValues: {':draft': 'DRAFT'}
# Prevent publishing already published posts
```

#### 7. Unpublish Blog Post (POST /blog/posts/{postId}/unpublish)

**Access Pattern**: Change status from PUBLISHED to DRAFT (owner only)

**DynamoDB Operation**: UpdateItem

**Key**:
```
PK = 'BLOG#<postId>'
SK = 'METADATA'
```

**Update Expression**:
```
UpdateExpression:
  SET #status = :draft,
      GSI1PK = :gsi1pk,
      GSI1SK = :gsi1sk,
      Data.#status = :draft,
      Data.publishedAt = :null,
      Data.updatedAt = :updatedAt

ExpressionAttributeValues:
  ':draft': 'DRAFT'
  ':gsi1pk': 'BLOG#STATUS#DRAFT'
  ':gsi1sk': 'BLOG#<createdAt>'  # Revert to createdAt for sorting
  ':null': null
  ':updatedAt': '<currentTimestamp>'
```

#### 8. Get Blog Categories (GET /blog/categories)

**Access Pattern**: Get all blog categories with post counts

**DynamoDB Operation**: Query

**Query Pattern**:
```
KeyConditionExpression: PK begins_with 'BLOG#CATEGORY#' AND SK = 'COUNT'
```

**Item Structure**:
```json
{
  "PK": "BLOG#CATEGORY#Technology",
  "SK": "COUNT",
  "EntityType": "BLOG_CATEGORY",
  "Data": {
    "category": "Technology",
    "count": 15
  }
}
```

**Response**:
```json
{
  "categories": [
    {"name": "Technology", "count": 15},
    {"name": "Cloud", "count": 8},
    {"name": "DevOps", "count": 5}
  ]
}
```

### Projects (7 Endpoints)

#### 9. List All Projects (GET /projects)

**Access Pattern**: Get all projects filtered by status

**API Query Parameters**:
- `status` - Filter by status (published, draft, all)
- `featured` - Filter by featured flag (true, false)
- `limit` - Pagination limit (default: 20)
- `offset` - Pagination offset (default: 0)

**Authorization**:
- Public users: Only `status=published`
- Owner: All statuses

**DynamoDB Operation**: Query with GSI1

**Query Pattern**:
```
# For published projects
GSI1:
  KeyConditionExpression: GSI1PK = 'PROJECT#STATUS#PUBLISHED'
  ScanIndexForward: False  # Newest first
  Limit: <limit>

# For draft projects (owner only)
GSI1:
  KeyConditionExpression: GSI1PK = 'PROJECT#STATUS#DRAFT'
  ScanIndexForward: False
```

**Filter Expression** (for featured):
```
FilterExpression: Data.featured = :featured
ExpressionAttributeValues: {':featured': true}
```

**Item Structure**:
```json
{
  "PK": "PROJECT#project-1",
  "SK": "METADATA",
  "GSI1PK": "PROJECT#STATUS#PUBLISHED",
  "GSI1SK": "PROJECT#2025-01-10T14:00:00Z",
  "EntityType": "PROJECT",
  "Status": "PUBLISHED",
  "Data": {
    "id": "project-1",
    "name": "Cloud Resume Challenge",
    "description": "Serverless resume website",
    "longDescription": "Full description...",
    "tech": ["AWS", "Python", "React"],
    "company": "Personal",
    "featured": true,
    "githubUrl": "https://github.com/user/repo",
    "liveUrl": "https://patrickcmd.dev",
    "imageUrl": "https://images.patrickcmd.dev/project-1.png",
    "createdAt": "2025-01-10T14:00:00Z",
    "updatedAt": "2025-01-10T14:00:00Z"
  }
}
```

#### 10. Get Single Project (GET /projects/{projectId})

**DynamoDB Operation**: GetItem

**Key**:
```
PK = 'PROJECT#<projectId>'
SK = 'METADATA'
```

**Authorization**: Same as blog posts (check status)

#### 11. Create Project (POST /projects)

**DynamoDB Operation**: PutItem

**Generated Fields**:
- `id`: UUID v4
- `createdAt`: Current timestamp
- `updatedAt`: Current timestamp
- `status`: Default to 'DRAFT'

**Item Structure**: Similar to blog post creation

#### 12. Update Project (PUT /projects/{projectId})

**DynamoDB Operation**: UpdateItem

**Key**:
```
PK = 'PROJECT#<projectId>'
SK = 'METADATA'
```

#### 13. Delete Project (DELETE /projects/{projectId})

**DynamoDB Operation**: DeleteItem

**Key**:
```
PK = 'PROJECT#<projectId>'
SK = 'METADATA'
```

#### 14. Publish Project (POST /projects/{projectId}/publish)

**DynamoDB Operation**: UpdateItem (same pattern as blog publish)

#### 15. Unpublish Project (POST /projects/{projectId}/unpublish)

**DynamoDB Operation**: UpdateItem (same pattern as blog unpublish)

### Certifications (7 Endpoints)

#### 16. List All Certifications (GET /certifications)

**Access Pattern**: Get all certifications filtered by status and type

**API Query Parameters**:
- `status` - Filter by status (published, draft, all)
- `type` - Filter by type (certification, course)
- `featured` - Filter by featured flag
- `limit` - Pagination limit
- `offset` - Pagination offset

**DynamoDB Operation**: Query with GSI1

**Query Pattern**:
```
# For published certifications
GSI1:
  KeyConditionExpression: GSI1PK = 'CERT#STATUS#PUBLISHED#ALL'
  ScanIndexForward: False  # Newest first (by dateEarned)

# For published certifications of specific type
GSI1:
  KeyConditionExpression: GSI1PK = 'CERT#STATUS#PUBLISHED#certification'
```

**Item Structure**:
```json
{
  "PK": "CERT#cert-1",
  "SK": "METADATA",
  "GSI1PK": "CERT#STATUS#PUBLISHED#certification",
  "GSI1SK": "CERT#2024-12-01T00:00:00Z",
  "EntityType": "CERTIFICATION",
  "Status": "PUBLISHED",
  "Data": {
    "id": "cert-1",
    "name": "AWS Solutions Architect Associate",
    "issuer": "Amazon Web Services",
    "icon": "aws-saa",
    "type": "certification",
    "featured": true,
    "description": "Cloud architecture certification",
    "credentialUrl": "https://credly.com/badges/...",
    "dateEarned": "2024-12-01T00:00:00Z",
    "createdAt": "2024-12-05T10:00:00Z",
    "updatedAt": "2024-12-05T10:00:00Z"
  }
}
```

#### 17-22. Certification CRUD and Publish Operations

Similar patterns to blog posts and projects:
- Get Single: GetItem
- Create: PutItem
- Update: UpdateItem
- Delete: DeleteItem
- Publish: UpdateItem (change GSI1PK pattern)
- Unpublish: UpdateItem (change GSI1PK pattern)

### Visitor Tracking (4 Endpoints)

#### 23. Track Visitor (POST /visitors/track)

**Access Pattern**: Increment visitor count for current day (deduplicated per session)

**Deduplication Strategy**:
- Use session ID (stored in frontend localStorage or generated on first visit)
- Check if session already tracked today
- Only increment if new session for the day

**DynamoDB Operations**:
1. Check session tracking
2. Increment daily count (conditional)
3. Record session

**Step 1: Check if session tracked today**
```
GetItem:
  PK = 'VISITOR#SESSION#<sessionId>'
  SK = 'TRACKED'
```

**Step 2: Increment daily count (if new session)**
```
UpdateItem:
  PK = 'VISITOR#DAILY#<YYYY-MM-DD>'
  SK = 'COUNT'
  UpdateExpression: ADD VisitorCount :increment
  ExpressionAttributeValues: {':increment': 1}
```

**Step 3: Record session for today**
```
PutItem:
  PK = 'VISITOR#SESSION#<sessionId>'
  SK = 'TRACKED'
  Data = {
    lastTrackedDate: '<YYYY-MM-DD>',
    lastTrackedTime: '<ISO-8601-timestamp>'
  }
  ExpiresAt = <tomorrow-midnight-unix-timestamp>  # Auto-cleanup via TTL
```

**Daily Visitor Item Structure**:
```json
{
  "PK": "VISITOR#DAILY#2025-01-15",
  "SK": "COUNT",
  "EntityType": "VISITOR_DAILY",
  "Data": {
    "date": "2025-01-15",
    "count": 127
  }
}
```

**Session Tracking Item**:
```json
{
  "PK": "VISITOR#SESSION#abc-123-def",
  "SK": "TRACKED",
  "EntityType": "VISITOR_SESSION",
  "Data": {
    "lastTrackedDate": "2025-01-15",
    "lastTrackedTime": "2025-01-15T14:30:00Z"
  },
  "ExpiresAt": 1736985600  # Midnight tomorrow (auto-delete via TTL)
}
```

**Response**:
```json
{
  "count": 127,
  "sessionId": "abc-123-def"
}
```

#### 24. Get Visitor Count (GET /visitors/count)

**Access Pattern**: Get total visitor count (sum of all daily counts)

**DynamoDB Operation**: Query + Aggregation

**Query Pattern**:
```
KeyConditionExpression: PK begins_with 'VISITOR#DAILY#' AND SK = 'COUNT'
```

**Application Logic**: Sum all `VisitorCount` values

**Alternative (Performance Optimization)**:
- Maintain a separate total count item
- Update on each daily increment (additional write)

**Total Count Item** (optional):
```json
{
  "PK": "VISITOR#TOTAL",
  "SK": "COUNT",
  "EntityType": "VISITOR_TOTAL",
  "Data": {
    "totalCount": 5432,
    "lastUpdated": "2025-01-15T14:30:00Z"
  }
}
```

#### 25. Get Daily Visitor Trends (GET /visitors/trends/daily)

**Access Pattern**: Get daily visitor counts for last N days (default: 30)

**DynamoDB Operation**: Query

**Query Pattern**:
```
KeyConditionExpression:
  PK begins_with 'VISITOR#DAILY#' AND
  SK = 'COUNT'

# Use FilterExpression for date range (or construct PK with date range)
FilterExpression: Data.#date BETWEEN :startDate AND :endDate

# Or query with specific keys
BatchGetItem:
  Keys = [
    {PK: 'VISITOR#DAILY#2025-01-15', SK: 'COUNT'},
    {PK: 'VISITOR#DAILY#2025-01-14', SK: 'COUNT'},
    ...
  ]
```

**Response**:
```json
{
  "trends": [
    {"date": "2025-01-15", "visitors": 127},
    {"date": "2025-01-14", "visitors": 143},
    {"date": "2025-01-13", "visitors": 98}
  ]
}
```

#### 26. Get Monthly Visitor Trends (GET /visitors/trends/monthly)

**Access Pattern**: Get monthly visitor counts for last N months (default: 6)

**DynamoDB Operations**:
1. Query daily counts for month range
2. Aggregate by month in application

**Alternative**: Pre-aggregate monthly counts

**Query Pattern**:
```
KeyConditionExpression:
  PK begins_with 'VISITOR#DAILY#<YYYY-MM>' AND
  SK = 'COUNT'
```

**Application Aggregation**: Group by month and sum counts

**Monthly Item Structure** (if pre-aggregated):
```json
{
  "PK": "VISITOR#MONTHLY#2025-01",
  "SK": "COUNT",
  "EntityType": "VISITOR_MONTHLY",
  "Data": {
    "month": "2025-01",
    "count": 3421
  }
}
```

**Response**:
```json
{
  "trends": [
    {"month": "2025-01", "visitors": 3421},
    {"month": "2024-12", "visitors": 2987},
    {"month": "2024-11", "visitors": 3102}
  ]
}
```

### Analytics (6 Endpoints)

#### 27. Track Content View (POST /analytics/track)

**Access Pattern**: Increment view count for content item (deduplicated per session)

**Request Body**:
```json
{
  "contentId": "blog-post-1",
  "contentType": "blog"
}
```

**Deduplication Strategy**:
- Use session ID + content combination
- Only count one view per content per session

**DynamoDB Operations**:
1. Check if session viewed this content
2. Increment view count (conditional)
3. Record session view

**Step 1: Check session view**
```
GetItem:
  PK = 'ANALYTICS#SESSION#<sessionId>'
  SK = '<contentType>#<contentId>'
```

**Step 2: Increment view count**
```
UpdateItem:
  PK = 'ANALYTICS#<contentType>#<contentId>'
  SK = 'VIEWS'
  UpdateExpression: ADD ViewCount :increment
  ExpressionAttributeValues: {':increment': 1}
```

**Step 3: Update GSI for top content queries**
```
UpdateItem:
  # Also update GSI1SK with new view count (for sorting)
  GSI1SK = 'ANALYTICS#VIEWS#<paddedViewCount>'
  # Pad to 10 digits for proper string sorting: 0000000127
```

**Step 4: Record session view**
```
PutItem:
  PK = 'ANALYTICS#SESSION#<sessionId>'
  SK = '<contentType>#<contentId>'
  Data = {
    viewedAt: '<ISO-8601-timestamp>'
  }
  ExpiresAt = <24-hours-from-now>  # Session views expire after 24h
```

**Content View Item**:
```json
{
  "PK": "ANALYTICS#blog#blog-post-1",
  "SK": "VIEWS",
  "GSI1PK": "ANALYTICS#blog",
  "GSI1SK": "ANALYTICS#VIEWS#0000000127",
  "EntityType": "ANALYTICS_VIEW",
  "Data": {
    "contentId": "blog-post-1",
    "contentType": "blog",
    "viewCount": 127,
    "lastViewed": "2025-01-15T14:30:00Z"
  }
}
```

**Session View Item**:
```json
{
  "PK": "ANALYTICS#SESSION#abc-123-def",
  "SK": "blog#blog-post-1",
  "EntityType": "ANALYTICS_SESSION",
  "Data": {
    "viewedAt": "2025-01-15T14:30:00Z"
  },
  "ExpiresAt": 1736985600  # 24 hours from now
}
```

**Response**:
```json
{
  "views": 127
}
```

#### 28. Get View Count (GET /analytics/views/{contentType}/{contentId})

**Access Pattern**: Get view count for specific content

**DynamoDB Operation**: GetItem

**Key**:
```
PK = 'ANALYTICS#<contentType>#<contentId>'
SK = 'VIEWS'
```

**Response**:
```json
{
  "contentId": "blog-post-1",
  "contentType": "blog",
  "views": 127
}
```

#### 29. Get All View Stats for Content Type (GET /analytics/views/{contentType})

**Access Pattern**: Get view counts for all content of a type

**DynamoDB Operation**: Query

**Query Pattern**:
```
KeyConditionExpression:
  PK begins_with 'ANALYTICS#<contentType>#' AND
  SK = 'VIEWS'
```

**Response**:
```json
{
  "contentType": "blog",
  "stats": {
    "blog-post-1": 127,
    "blog-post-2": 98,
    "blog-post-3": 156
  }
}
```

#### 30. Get Top Content (GET /analytics/top-content)

**Access Pattern**: Get top viewed content across all types (owner only)

**API Query Parameters**:
- `limit` - Number of items per type (default: 5)

**DynamoDB Operation**: Query with GSI1 (per content type)

**Query Pattern**:
```
# Top blogs
GSI1:
  KeyConditionExpression: GSI1PK = 'ANALYTICS#blog'
  ScanIndexForward: False  # Descending by view count
  Limit: <limit>

# Top projects
GSI1:
  KeyConditionExpression: GSI1PK = 'ANALYTICS#project'
  ScanIndexForward: False
  Limit: <limit>

# Top certifications
GSI1:
  KeyConditionExpression: GSI1PK = 'ANALYTICS#certification'
  ScanIndexForward: False
  Limit: <limit>
```

**Note on GSI1SK sorting**:
- Store view count as zero-padded string (e.g., "ANALYTICS#VIEWS#0000000127")
- Allows proper descending sort by string comparison
- Update GSI1SK on every view count increment

**Response**:
```json
{
  "blogs": [
    {"contentId": "blog-post-3", "views": 156},
    {"contentId": "blog-post-1", "views": 127},
    {"contentId": "blog-post-2", "views": 98}
  ],
  "projects": [
    {"contentId": "project-2", "views": 89},
    {"contentId": "project-1", "views": 67}
  ],
  "certifications": [
    {"contentId": "cert-1", "views": 145},
    {"contentId": "cert-3", "views": 92}
  ]
}
```

#### 31. Get Total Views (GET /analytics/total-views)

**Access Pattern**: Get sum of all content views

**DynamoDB Operation**: Query + Aggregation

**Query Pattern**:
```
KeyConditionExpression:
  PK begins_with 'ANALYTICS#' AND
  SK = 'VIEWS'
```

**Application Logic**: Sum all `ViewCount` values

**Alternative (Performance Optimization)**:
- Maintain separate total views counter
- Increment on each view

**Total Views Item** (optional):
```json
{
  "PK": "ANALYTICS#TOTAL",
  "SK": "VIEWS",
  "EntityType": "ANALYTICS_TOTAL",
  "Data": {
    "totalViews": 8432,
    "lastUpdated": "2025-01-15T14:30:00Z"
  }
}
```

**Response**:
```json
{
  "totalViews": 8432
}
```

## Complete Access Patterns Summary

| # | Endpoint | Method | DynamoDB Operation | Keys Used | GSI Used |
|---|----------|--------|-------------------|-----------|----------|
| 1 | /blog/posts | GET | Query | GSI1PK, GSI1SK | GSI1 |
| 2 | /blog/posts/{id} | GET | GetItem | PK, SK | No |
| 3 | /blog/posts | POST | PutItem | PK, SK | No |
| 4 | /blog/posts/{id} | PUT | UpdateItem | PK, SK | No |
| 5 | /blog/posts/{id} | DELETE | DeleteItem | PK, SK | No |
| 6 | /blog/posts/{id}/publish | POST | UpdateItem | PK, SK | No |
| 7 | /blog/posts/{id}/unpublish | POST | UpdateItem | PK, SK | No |
| 8 | /blog/categories | GET | Query | PK, SK | No |
| 9 | /projects | GET | Query | GSI1PK, GSI1SK | GSI1 |
| 10 | /projects/{id} | GET | GetItem | PK, SK | No |
| 11 | /projects | POST | PutItem | PK, SK | No |
| 12 | /projects/{id} | PUT | UpdateItem | PK, SK | No |
| 13 | /projects/{id} | DELETE | DeleteItem | PK, SK | No |
| 14 | /projects/{id}/publish | POST | UpdateItem | PK, SK | No |
| 15 | /projects/{id}/unpublish | POST | UpdateItem | PK, SK | No |
| 16 | /certifications | GET | Query | GSI1PK, GSI1SK | GSI1 |
| 17 | /certifications/{id} | GET | GetItem | PK, SK | No |
| 18 | /certifications | POST | PutItem | PK, SK | No |
| 19 | /certifications/{id} | PUT | UpdateItem | PK, SK | No |
| 20 | /certifications/{id} | DELETE | DeleteItem | PK, SK | No |
| 21 | /certifications/{id}/publish | POST | UpdateItem | PK, SK | No |
| 22 | /certifications/{id}/unpublish | POST | UpdateItem | PK, SK | No |
| 23 | /visitors/track | POST | UpdateItem + PutItem | PK, SK | No |
| 24 | /visitors/count | GET | Query | PK, SK | No |
| 25 | /visitors/trends/daily | GET | Query / BatchGet | PK, SK | No |
| 26 | /visitors/trends/monthly | GET | Query + Aggregate | PK, SK | No |
| 27 | /analytics/track | POST | UpdateItem + PutItem | PK, SK | No |
| 28 | /analytics/views/{type}/{id} | GET | GetItem | PK, SK | No |
| 29 | /analytics/views/{type} | GET | Query | PK, SK | No |
| 30 | /analytics/top-content | GET | Query (3x) | GSI1PK, GSI1SK | GSI1 |
| 31 | /analytics/total-views | GET | Query + Aggregate | PK, SK | No |

## Sample Items

### Blog Post (Published)
```json
{
  "PK": "BLOG#3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "SK": "METADATA",
  "GSI1PK": "BLOG#STATUS#PUBLISHED",
  "GSI1SK": "BLOG#2025-01-15T10:30:00Z",
  "EntityType": "BLOG",
  "Status": "PUBLISHED",
  "Data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "slug": "building-serverless-api-with-dynamodb",
    "title": "Building a Serverless API with DynamoDB",
    "excerpt": "Learn how to design efficient DynamoDB access patterns",
    "content": "# Introduction\n\nDynamoDB is a powerful NoSQL database...",
    "category": "Cloud",
    "tags": ["aws", "dynamodb", "serverless"],
    "readTime": 8,
    "publishedAt": "2025-01-15T10:30:00Z",
    "createdAt": "2025-01-14T08:00:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

### Project (Draft)
```json
{
  "PK": "PROJECT#7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "SK": "METADATA",
  "GSI1PK": "PROJECT#STATUS#DRAFT",
  "GSI1SK": "PROJECT#2025-01-10T14:00:00Z",
  "EntityType": "PROJECT",
  "Status": "DRAFT",
  "Data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "name": "E-Commerce Platform",
    "description": "Full-stack e-commerce solution",
    "longDescription": "Built with React, Node.js, and MongoDB...",
    "tech": ["React", "Node.js", "MongoDB", "Stripe"],
    "company": "Freelance",
    "featured": false,
    "githubUrl": "https://github.com/patrickcmd/ecommerce",
    "liveUrl": null,
    "imageUrl": null,
    "createdAt": "2025-01-10T14:00:00Z",
    "updatedAt": "2025-01-12T09:15:00Z"
  }
}
```

### Certification (Published)
```json
{
  "PK": "CERT#c7f40e4e-8a3f-4d5b-9c1e-2f8d6a9b3e1c",
  "SK": "METADATA",
  "GSI1PK": "CERT#STATUS#PUBLISHED#certification",
  "GSI1SK": "CERT#2024-12-01T00:00:00Z",
  "EntityType": "CERTIFICATION",
  "Status": "PUBLISHED",
  "Data": {
    "id": "c7f40e4e-8a3f-4d5b-9c1e-2f8d6a9b3e1c",
    "name": "AWS Solutions Architect Associate",
    "issuer": "Amazon Web Services",
    "icon": "aws-saa",
    "type": "certification",
    "featured": true,
    "description": "Validates technical expertise in designing distributed systems",
    "credentialUrl": "https://www.credly.com/badges/...",
    "dateEarned": "2024-12-01T00:00:00Z",
    "createdAt": "2024-12-05T10:00:00Z",
    "updatedAt": "2024-12-05T10:00:00Z"
  }
}
```

### Daily Visitor Count
```json
{
  "PK": "VISITOR#DAILY#2025-01-15",
  "SK": "COUNT",
  "EntityType": "VISITOR_DAILY",
  "Data": {
    "date": "2025-01-15",
    "count": 127
  }
}
```

### Visitor Session (TTL)
```json
{
  "PK": "VISITOR#SESSION#abc-123-def-456",
  "SK": "TRACKED",
  "EntityType": "VISITOR_SESSION",
  "Data": {
    "lastTrackedDate": "2025-01-15",
    "lastTrackedTime": "2025-01-15T14:30:00Z"
  },
  "ExpiresAt": 1736985600
}
```

### Content View Analytics
```json
{
  "PK": "ANALYTICS#blog#3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "SK": "VIEWS",
  "GSI1PK": "ANALYTICS#blog",
  "GSI1SK": "ANALYTICS#VIEWS#0000000127",
  "EntityType": "ANALYTICS_VIEW",
  "Data": {
    "contentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "contentType": "blog",
    "viewCount": 127,
    "lastViewed": "2025-01-15T14:30:00Z"
  }
}
```

### Analytics Session View (TTL)
```json
{
  "PK": "ANALYTICS#SESSION#abc-123-def-456",
  "SK": "blog#3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "EntityType": "ANALYTICS_SESSION",
  "Data": {
    "viewedAt": "2025-01-15T14:30:00Z"
  },
  "ExpiresAt": 1736985600
}
```

### Blog Category Count
```json
{
  "PK": "BLOG#CATEGORY#Cloud",
  "SK": "COUNT",
  "EntityType": "BLOG_CATEGORY",
  "Data": {
    "category": "Cloud",
    "count": 8
  }
}
```

## Query Performance Optimization

### Best Practices

1. **Use Query instead of Scan**:
   - All access patterns use Query or GetItem (no Scans)
   - Scans are expensive and slow for large tables

2. **Minimize Item Size**:
   - Store only necessary data in items
   - Use shorter attribute names in Data map if needed
   - Consider compression for large content fields

3. **Leverage GSI for Filtering**:
   - GSI1 supports status-based filtering (published/draft)
   - GSI1SK enables sorting (by date, by view count)
   - Avoids costly FilterExpression on large datasets

4. **Pagination**:
   - Use DynamoDB native pagination (LastEvaluatedKey)
   - Limit query results to reduce costs
   - Cursor-based pagination preferred over offset

5. **Batch Operations**:
   - Use BatchGetItem for fetching multiple items
   - Use BatchWriteItem for bulk inserts (e.g., initial data load)
   - Maximum 25 items per batch

6. **Conditional Writes**:
   - Prevent overwrites with ConditionExpression
   - Ensure idempotency for critical operations
   - Handle ConditionalCheckFailedException

### Index Design Decisions

**Why Single GSI?**
- Reduces storage costs (each GSI duplicates data)
- Sufficient for our access patterns
- Can overload GSI keys with composite patterns

**GSI1 Use Cases**:
- Listing content by status (PUBLISHED vs DRAFT)
- Sorting by date (publishedAt, createdAt, dateEarned)
- Sorting by view count (top content analytics)

**When to Add LSI (Local Secondary Index)**:
- Not needed for current patterns
- Would enable alternate sort on same partition
- Cannot be added after table creation

**When to Add More GSIs**:
- Future feature: Search by tags
- Future feature: Full-text search integration (OpenSearch)
- Future feature: Complex filtering requirements

## Data Consistency and Transactions

### Deduplication Strategy

**Visitor Tracking**:
- Use session-based deduplication
- Session items with TTL (auto-cleanup)
- Check session before incrementing count

**Analytics Tracking**:
- Use session + content combination
- Only count one view per content per session
- 24-hour session window

**Trade-off**: Slight under-counting acceptable for performance
- Alternative: DynamoDB Transactions (higher cost, lower throughput)

### Atomic Operations

**Increment Operations**:
```
UpdateExpression: ADD ViewCount :increment
```
- Atomic increment (no race conditions)
- Safe for concurrent requests
- No need for read-modify-write pattern

**Conditional Updates**:
```
ConditionExpression: #status = :draft
```
- Prevents invalid state transitions
- Ensures data integrity
- Handles concurrent modifications

### Transactions (Optional)

**When to Use**:
- Multi-item operations that must succeed or fail together
- Example: Transfer view count between items
- Example: Delete content and all related analytics

**Transaction Limitations**:
- Max 100 items per transaction
- Higher cost (2x write units)
- Lower throughput (not recommended for high-traffic endpoints)

**Current Design**: No transactions needed
- Operations are independent
- Eventual consistency acceptable for analytics

## Cost Estimation

### On-Demand Pricing (us-east-1)

**Assumptions**:
- 1M read requests/month (mostly content listings and views)
- 100K write requests/month (mostly visitor tracking and analytics)
- 10 GB total data storage
- GSI storage: ~5 GB additional

**Costs**:
| Component | Usage | Rate | Monthly Cost |
|-----------|-------|------|--------------|
| Read Requests | 1M requests | $0.25 per 1M | $0.25 |
| Write Requests | 100K requests | $1.25 per 1M | $0.125 |
| Data Storage | 10 GB | $0.25 per GB | $2.50 |
| GSI Storage | 5 GB | $0.25 per GB | $1.25 |
| **Total** | | | **$4.125/month** |

**Note**: Very low cost for portfolio use case. On-Demand is cost-effective for unpredictable traffic.

### Provisioned Capacity (Alternative)

For predictable traffic, provisioned capacity can be cheaper:
- Read Capacity: 10 RCU = $0.47/month
- Write Capacity: 5 WCU = $0.24/month
- Auto-scaling recommended

## Migration and Seeding

### Initial Data Load

**Approach**: Use BatchWriteItem for bulk loading

**Categories to Pre-populate**:
- Blog categories (if known upfront)
- Initial visitor count (if migrating from existing site)

**Sample Seed Script Pattern** (pseudo-code):
```python
# Planning only - structure for seeding
items_to_write = []

# Seed blog posts
for blog_post in existing_blog_posts:
    items_to_write.append({
        'PK': f'BLOG#{blog_post.id}',
        'SK': 'METADATA',
        'GSI1PK': f'BLOG#STATUS#{blog_post.status}',
        'GSI1SK': f'BLOG#{blog_post.publishedAt}',
        # ... other attributes
    })

# Batch write (max 25 items per request)
for chunk in chunks(items_to_write, 25):
    dynamodb.batch_write_item(RequestItems={
        'portfolio-api-table': [
            {'PutRequest': {'Item': item}}
            for item in chunk
        ]
    })
```

### Data Export and Backup

**Point-in-Time Recovery (PITR)**:
- Enable PITR for production table
- Allows restore to any point in last 35 days
- Minimal performance impact

**On-Demand Backup**:
- Create manual backups before major changes
- Stored in S3 (separate from table)
- Can restore to new table

**Export to S3**:
- Use DynamoDB Export to S3 feature
- Full table export in JSON or DynamoDB JSON format
- Useful for analytics or migration

## Security Considerations

### IAM Permissions

**Lambda Execution Role**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/portfolio-api-table",
        "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/portfolio-api-table/index/GSI1"
      ]
    }
  ]
}
```

**Fine-Grained Access Control** (optional):
- Use Condition keys to restrict access
- Example: Limit operations to specific PK patterns
- Not needed for single Lambda function

### Encryption

**Encryption at Rest**:
- Enable DynamoDB encryption using AWS managed keys (default)
- Or use customer managed KMS keys (additional cost)
- Recommended: AWS managed keys for simplicity

**Encryption in Transit**:
- All DynamoDB API calls use HTTPS/TLS
- No additional configuration needed

### Data Validation

**Application-Level Validation**:
- Validate all inputs before writing to DynamoDB
- Use Pydantic models for request validation
- Prevent malformed data in database

**DynamoDB Validation**:
- Use ConditionExpression to enforce data integrity
- Example: Ensure item exists before update
- Example: Prevent duplicate IDs on create

## Testing Strategy

### Unit Tests

**Test Repository Layer**:
- Mock boto3 DynamoDB client
- Test key construction logic
- Test query patterns
- Test update expressions

**Example Test Cases**:
```python
# Planning only - test structure
def test_get_blog_post_by_id():
    # Mock DynamoDB GetItem response
    # Verify PK and SK construction
    # Verify response mapping

def test_list_published_blogs():
    # Mock DynamoDB Query with GSI1
    # Verify GSI1PK and GSI1SK construction
    # Verify sorting and pagination

def test_increment_visitor_count():
    # Mock session check
    # Mock UpdateItem for count increment
    # Verify atomic increment expression
```

### Integration Tests

**Test with Local DynamoDB**:
- Use DynamoDB Local (Docker image)
- Create test table with same schema
- Run full integration tests against local instance

**Setup**:
```bash
# Run DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Create test table
aws dynamodb create-table --table-name test-portfolio-api-table \
  --endpoint-url http://localhost:8000 \
  --cli-input-json file://table-schema.json
```

**Test Scenarios**:
- Create, read, update, delete operations
- Publish/unpublish workflows
- Visitor deduplication logic
- Analytics tracking and aggregation

### Load Testing

**Simulate Production Traffic**:
- Use tools like Locust or Artillery
- Test concurrent requests
- Monitor DynamoDB throttling
- Verify on-demand scaling

**Key Metrics**:
- Request latency (p50, p95, p99)
- Error rate
- Throttled requests
- Read/Write capacity units consumed

## Monitoring and Observability

### CloudWatch Metrics

**DynamoDB Metrics**:
- `ConsumedReadCapacityUnits` - Track read usage
- `ConsumedWriteCapacityUnits` - Track write usage
- `UserErrors` - 400 errors (validation failures)
- `SystemErrors` - 500 errors (throttling, service errors)
- `SuccessfulRequestLatency` - Operation latency

**Alarms**:
- High error rate (>1% of requests)
- Unusual spike in requests
- High latency (p99 > 100ms)

### X-Ray Tracing

**Enable X-Ray**:
- Trace DynamoDB calls from Lambda
- Visualize query performance
- Identify slow operations
- Debug issues in production

### Application Logging

**Log Important Events**:
- All write operations (create, update, delete)
- Failed deduplication checks
- Data validation failures
- Query performance (slow queries >100ms)

**Log Format**:
```json
{
  "timestamp": "2025-01-15T14:30:00Z",
  "level": "INFO",
  "operation": "CreateBlogPost",
  "user": "p.walukagga@gmail.com",
  "blogId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "duration_ms": 45
}
```

## Future Enhancements

### Search Functionality

**Current Limitation**: No full-text search

**Solutions**:
1. **DynamoDB Scan with FilterExpression**:
   - Expensive for large datasets
   - High latency
   - Not recommended

2. **Amazon OpenSearch Service**:
   - Index content in OpenSearch
   - Full-text search capabilities
   - Sync with DynamoDB using DynamoDB Streams
   - Additional cost (~$15/month for t3.small instance)

3. **Algolia (Third-Party)**:
   - Managed search service
   - Easy integration
   - Free tier: 10K searches/month
   - Cost-effective for portfolio

### Tagging and Filtering

**Future Access Pattern**: Search by tags

**Approach 1**: FilterExpression (current design)
```
FilterExpression: contains(Data.tags, :tag)
```
- Simple to implement
- Inefficient for large datasets

**Approach 2**: Tag Items with GSI
- Create separate items for each tag
- PK: `TAG#<tag>`, SK: `<contentType>#<contentId>`
- Query all content with specific tag via GSI
- Higher storage cost, better query performance

### Comments and Reactions

**Future Feature**: User comments on blog posts

**Access Pattern**: Get all comments for a post

**Item Structure**:
```json
{
  "PK": "BLOG#<blogId>",
  "SK": "COMMENT#<timestamp>#<commentId>",
  "EntityType": "COMMENT",
  "Data": {
    "commentId": "<uuid>",
    "author": "John Doe",
    "email": "john@example.com",
    "content": "Great post!",
    "createdAt": "2025-01-15T14:30:00Z"
  }
}
```

**Query**:
```
PK = 'BLOG#<blogId>' AND SK begins_with 'COMMENT#'
```

## Summary

This DynamoDB design provides:

✅ **Efficient Access Patterns**: All 34 API endpoints mapped to optimized DynamoDB operations
✅ **Single-Table Design**: Cost-effective storage and simplified management
✅ **Scalability**: On-demand billing with automatic scaling
✅ **Performance**: Query-based access (no expensive scans)
✅ **Deduplication**: Session-based tracking for visitors and analytics
✅ **Cost-Effective**: Estimated $4/month for typical portfolio traffic
✅ **Security**: IAM-based access control and encryption at rest
✅ **Extensibility**: Designed for future features (search, comments, tags)

**No Code Implementation**: This document provides comprehensive planning for the DynamoDB database design. Implementation will follow in subsequent phases.
