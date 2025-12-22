# DynamoDB Setup Guide

This guide explains how to set up and use DynamoDB for the Portfolio API, both locally and in AWS.

## Table of Contents

- [Overview](#overview)
- [Local Development Setup](#local-development-setup)
- [AWS Production Setup](#aws-production-setup)
- [Repository Usage](#repository-usage)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

The Portfolio API uses a **single-table design** for DynamoDB, following best practices for performance and cost optimization. All entities (blog posts, projects, certifications, visitors, analytics) are stored in one table with generic key attributes.

### Key Design Features

- **Single Table**: `portfolio-api-table`
- **Primary Key**: PK (partition key) + SK (sort key)
- **Global Secondary Index**: GSI1 (GSI1PK + GSI1SK)
- **Entity Types**: BLOG, PROJECT, CERTIFICATION, VISITOR_DAILY, VISITOR_SESSION, ANALYTICS_VIEW, ANALYTICS_SESSION
- **TTL**: Automatic cleanup of session data via `ExpiresAt` attribute

See [DYNAMODB-DESIGN.md](DYNAMODB-DESIGN.md) for complete design details.

## Local Development Setup

### 1. Start DynamoDB Local with Docker

```bash
# From backend directory
docker-compose up -d
```

This starts DynamoDB Local on `http://localhost:8000`.

### 2. Create the Table

```bash
# Create table in local DynamoDB
python scripts/create_dynamodb_table.py --local

# Verify table creation
python scripts/create_dynamodb_table.py --local --action describe
```

### 3. Configure Environment

Update your `.env` file:

```bash
# DynamoDB Configuration
DYNAMODB_TABLE_NAME=portfolio-api-table
DYNAMODB_ENDPOINT=http://localhost:8000  # Points to local DynamoDB
```

### 4. Verify Setup

```python
# Test connection
from src.repositories.blog import BlogRepository

repo = BlogRepository()

# Create a test blog post
test_post = repo.create({
    'title': 'Test Post',
    'content': 'This is a test',
    'excerpt': 'Test excerpt',
    'category': 'Test'
})

print(f"Created post: {test_post['id']}")

# Retrieve it
post = repo.get_by_id(test_post['id'])
print(f"Retrieved post: {post['title']}")
```

## AWS Production Setup

### 1. Create Table in AWS

```bash
# Create table in AWS
python scripts/create_dynamodb_table.py --aws --region us-east-1

# Verify
python scripts/create_dynamodb_table.py --aws --region us-east-1 --action describe
```

### 2. Configure Environment

For production, remove or leave `DYNAMODB_ENDPOINT` empty:

```bash
# DynamoDB Configuration
DYNAMODB_TABLE_NAME=portfolio-api-table
# DYNAMODB_ENDPOINT=  # Empty or commented out for AWS
```

### 3. IAM Permissions

Ensure your Lambda execution role has these permissions:

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

## Repository Usage

### Blog Repository

```python
from src.repositories.blog import BlogRepository

repo = BlogRepository()

# Create blog post
post = repo.create({
    'title': 'Building Serverless APIs',
    'content': '# Introduction\n\nDynamoDB is great...',
    'excerpt': 'Learn about DynamoDB',
    'category': 'Cloud',
    'tags': ['aws', 'dynamodb']
})

# List published posts
results = repo.list_posts(status='PUBLISHED', limit=20)
for post in results['items']:
    print(post['title'])

# Get by ID
post = repo.get_by_id('blog-id-here')

# Update
updated = repo.update('blog-id-here', {
    'title': 'Updated Title',
    'content': 'Updated content'
})

# Publish
published = repo.publish('blog-id-here')

# Unpublish
unpublished = repo.unpublish('blog-id-here')

# Delete
repo.delete('blog-id-here')

# Get categories
categories = repo.get_categories()
```

### Project Repository

```python
from src.repositories.project import ProjectRepository

repo = ProjectRepository()

# Create project
project = repo.create({
    'name': 'Cloud Resume Challenge',
    'description': 'Serverless portfolio',
    'tech': ['AWS', 'Python', 'React'],
    'featured': True
})

# List published projects
results = repo.list_projects(status='PUBLISHED', featured=True)

# Similar methods: get_by_id, update, delete, publish, unpublish
```

### Certification Repository

```python
from src.repositories.certification import CertificationRepository

repo = CertificationRepository()

# Create certification
cert = repo.create({
    'name': 'AWS Solutions Architect',
    'issuer': 'Amazon Web Services',
    'type': 'certification',
    'dateEarned': '2024-12-01T00:00:00Z',
    'featured': True
})

# List certifications
results = repo.list_certifications(
    status='PUBLISHED',
    cert_type='certification'
)
```

### Visitor Repository

```python
from src.repositories.visitor import VisitorRepository
import uuid

repo = VisitorRepository()

# Track visitor (deduplicated per session per day)
session_id = str(uuid.uuid4())
result = repo.track_visitor(session_id)
print(f"Visitor count today: {result['count']}")

# Get total count
total = repo.get_total_count()

# Get daily trends (last 30 days)
trends = repo.get_daily_trends(days=30)
for day in trends:
    print(f"{day['date']}: {day['visitors']} visitors")

# Get monthly trends
monthly = repo.get_monthly_trends(months=6)
```

### Analytics Repository

```python
from src.repositories.analytics import AnalyticsRepository
import uuid

repo = AnalyticsRepository()

# Track content view (deduplicated per session)
session_id = str(uuid.uuid4())
result = repo.track_view('blog', 'blog-id-here', session_id)
print(f"View count: {result['views']}")

# Get view count
views = repo.get_view_count('blog', 'blog-id-here')

# Get all views for content type
stats = repo.get_all_views_for_type('blog')

# Get top content
top = repo.get_top_content(limit=5)
print(f"Top blogs: {top['blogs']}")

# Get total views
total = repo.get_total_views()
```

## Testing

### Unit Tests

See [tests/unit/test_repositories.py](../tests/unit/test_repositories.py) for comprehensive unit tests.

```bash
# Run repository tests
uv run pytest tests/unit/test_repositories.py -v

# Run with coverage
uv run pytest tests/unit/test_repositories.py --cov=src/repositories
```

### Integration Tests

```bash
# Ensure local DynamoDB is running
docker-compose up -d

# Run integration tests
uv run pytest tests/integration/test_dynamodb_integration.py -v
```

## Troubleshooting

### Issue: "Cannot connect to DynamoDB"

**Solution**: Ensure Docker container is running:

```bash
docker ps | grep dynamodb
```

If not running:

```bash
docker-compose up -d
```

### Issue: "Table does not exist"

**Solution**: Create the table:

```bash
python scripts/create_dynamodb_table.py --local
```

### Issue: "ConditionalCheckFailedException"

**Cause**: Condition in update/delete operation failed (e.g., trying to publish already published post)

**Solution**: Check the current state of the item before the operation.

### Issue: "ValidationException: One or more parameter values were invalid"

**Cause**: Invalid attribute values or missing required attributes

**Solution**: Verify the data structure matches the expected format in [DYNAMODB-DESIGN.md](DYNAMODB-DESIGN.md).

### Reset Local Data

To start fresh:

```bash
# Stop and remove container
docker-compose down

# Remove data volume
rm -rf dynamodb_data

# Restart and recreate table
docker-compose up -d
python scripts/create_dynamodb_table.py --local
```

## Useful Commands

### View Table Contents (AWS CLI)

```bash
# Scan table (use sparingly, expensive for large tables)
aws dynamodb scan \
  --table-name portfolio-api-table \
  --endpoint-url http://localhost:8000 \
  --max-items 10

# Query specific item
aws dynamodb get-item \
  --table-name portfolio-api-table \
  --key '{"PK": {"S": "BLOG#blog-id"}, "SK": {"S": "METADATA"}}' \
  --endpoint-url http://localhost:8000
```

### Delete Table

```bash
# Local
python scripts/create_dynamodb_table.py --local --action delete

# AWS (BE CAREFUL!)
python scripts/create_dynamodb_table.py --aws --region us-east-1 --action delete
```

## Cost Optimization Tips

1. **Use On-Demand Billing**: For unpredictable traffic (already configured)
2. **Enable TTL**: Automatic cleanup of session data (already enabled)
3. **Monitor Read/Write Capacity**: Use CloudWatch metrics
4. **Batch Operations**: Use `batch_write_items` for bulk inserts
5. **Optimize Queries**: Always use Query instead of Scan
6. **GSI Usage**: Only query GSI when necessary

## Additional Resources

- [DynamoDB Design Documentation](DYNAMODB-DESIGN.md) - Complete single-table design
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Single-Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [AWS DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
