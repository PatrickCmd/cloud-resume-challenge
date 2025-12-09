export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  publishedAt: string;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "building-scalable-apis-with-fastapi",
    title: "Building Scalable REST APIs with FastAPI and PostgreSQL",
    excerpt: "Learn how to design and implement high-performance REST APIs using FastAPI, with async database operations and proper error handling.",
    content: `
# Building Scalable REST APIs with FastAPI and PostgreSQL

FastAPI has become my go-to framework for building modern Python APIs. In this article, I'll share patterns I've learned from building production systems at Sunbird AI and previous roles.

## Why FastAPI?

After years of working with Django REST Framework and Flask, FastAPI stands out for several reasons:

- **Async by default**: Native support for async/await makes handling concurrent requests efficient
- **Type hints everywhere**: Automatic validation and documentation from Python type hints
- **OpenAPI out of the box**: Interactive API documentation with Swagger UI

## Project Structure

\`\`\`
app/
├── api/
│   ├── v1/
│   │   ├── endpoints/
│   │   └── router.py
├── core/
│   ├── config.py
│   └── security.py
├── db/
│   ├── base.py
│   └── session.py
├── models/
├── schemas/
└── main.py
\`\`\`

## Async Database Operations

Using SQLAlchemy 2.0 with asyncpg for PostgreSQL:

\`\`\`python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    return result.scalars().all()
\`\`\`

## Key Takeaways

1. Use dependency injection for database sessions
2. Implement proper error handling with custom exceptions
3. Add request validation using Pydantic models
4. Cache frequently accessed data with Redis

Building scalable APIs is about making the right architectural decisions early. FastAPI gives you the tools - it's up to you to use them wisely.
    `,
    category: "Backend",
    readTime: "8 min read",
    publishedAt: "2024-11-15",
    tags: ["Python", "FastAPI", "PostgreSQL", "REST API"],
  },
  {
    id: "2",
    slug: "aws-solutions-architect-journey",
    title: "My Journey to AWS Solutions Architect Certification",
    excerpt: "A practical guide to preparing for the AWS Solutions Architect Associate exam, with study resources and real-world tips.",
    content: `
# My Journey to AWS Solutions Architect Certification

Earning my AWS Solutions Architect Associate certification was a milestone in my cloud engineering journey. Here's what worked for me.

## Why Get Certified?

As a backend engineer, understanding cloud infrastructure is essential. The certification:

- Validates your AWS knowledge to employers
- Forces you to learn services you might not use daily
- Opens doors to cloud-focused roles

## Study Strategy

### 1. Hands-on Practice (Most Important!)

Theory alone won't cut it. I spent hours in the AWS console:

- Setting up VPCs with public/private subnets
- Configuring Auto Scaling groups with ALBs
- Building serverless applications with Lambda and API Gateway

### 2. Key Services to Master

- **Compute**: EC2, Lambda, ECS, EKS
- **Storage**: S3, EBS, EFS, Glacier
- **Database**: RDS, DynamoDB, ElastiCache
- **Networking**: VPC, Route 53, CloudFront

### 3. Practice Exams

I used practice tests extensively. The real exam is scenario-based, so understanding *when* to use each service is crucial.

## Tips for Success

1. **Read the Well-Architected Framework** - Many questions reference its pillars
2. **Understand pricing** - Cost optimization questions are common
3. **Know the limits** - Service quotas come up frequently
4. **Think like an architect** - Focus on scalability, reliability, and security

## What's Next?

I'm now working toward the AWS Solutions Architect Professional certification. The learning never stops!
    `,
    category: "Cloud",
    readTime: "6 min read",
    publishedAt: "2024-10-28",
    tags: ["AWS", "Certification", "Cloud", "Career"],
  },
  {
    id: "3",
    slug: "django-to-fastapi-migration",
    title: "Migrating from Django to FastAPI: Lessons Learned",
    excerpt: "Real-world insights from migrating a production Django application to FastAPI, including challenges and performance gains.",
    content: `
# Migrating from Django to FastAPI: Lessons Learned

At Audersity, we faced a decision many Python shops encounter: stick with Django or move to something more modern. Here's what we learned.

## Why Consider Migration?

Our Django REST Framework API was solid, but we needed:

- Better async support for I/O-bound operations
- Improved response times for real-time features
- Reduced memory footprint for containerized deployments

## The Migration Strategy

### Phase 1: Parallel Development

We didn't do a big-bang migration. Instead:

\`\`\`
├── django_app/      # Existing Django API
├── fastapi_app/     # New FastAPI service
└── nginx/           # Route traffic between them
\`\`\`

### Phase 2: Gradual Traffic Shift

Using feature flags, we routed specific endpoints to FastAPI:

\`\`\`nginx
location /api/v2/realtime/ {
    proxy_pass http://fastapi_service;
}

location /api/ {
    proxy_pass http://django_service;
}
\`\`\`

## Challenges We Faced

### 1. ORM Differences

SQLAlchemy async is different from Django ORM:

\`\`\`python
# Django
users = User.objects.filter(is_active=True)

# SQLAlchemy async
result = await session.execute(
    select(User).where(User.is_active == True)
)
users = result.scalars().all()
\`\`\`

### 2. Authentication

We had to rebuild our JWT auth layer, but it gave us a chance to improve it.

## Results

After migration:

- **40% reduction** in average response time
- **50% less memory** per container
- **Better developer experience** with type hints

## Key Takeaways

1. Migrate incrementally, not all at once
2. Keep Django for admin interfaces - it's still great for that
3. Invest in comprehensive testing before switching traffic
4. Document everything for the team
    `,
    category: "Backend",
    readTime: "10 min read",
    publishedAt: "2024-09-12",
    tags: ["Python", "Django", "FastAPI", "Migration"],
  },
  {
    id: "4",
    slug: "docker-best-practices-python",
    title: "Docker Best Practices for Python Applications",
    excerpt: "Optimize your Python Docker images for production with multi-stage builds, proper caching, and security hardening.",
    content: `
# Docker Best Practices for Python Applications

After containerizing dozens of Python applications, I've collected patterns that make a real difference in production.

## The Problem with Naive Dockerfiles

A simple Dockerfile might look like:

\`\`\`dockerfile
FROM python:3.11
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["python", "main.py"]
\`\`\`

Issues: Large image size, slow builds, running as root.

## Optimized Dockerfile

\`\`\`dockerfile
# Build stage
FROM python:3.11-slim as builder

WORKDIR /app
RUN pip install --no-cache-dir poetry

COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt > requirements.txt

RUN pip wheel --no-cache-dir --no-deps \\
    --wheel-dir /app/wheels -r requirements.txt

# Production stage
FROM python:3.11-slim

# Create non-root user
RUN useradd --create-home appuser
WORKDIR /home/appuser

# Copy wheels and install
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache /wheels/*

# Copy application
COPY --chown=appuser:appuser . .

USER appuser
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "main:app"]
\`\`\`

## Key Optimizations

### 1. Multi-stage Builds

Separate build dependencies from runtime. Your final image doesn't need gcc or build tools.

### 2. Layer Caching

Order commands from least to most frequently changed:

\`\`\`dockerfile
COPY requirements.txt .  # Changes rarely
RUN pip install -r requirements.txt
COPY . .  # Changes often
\`\`\`

### 3. Security

- Run as non-root user
- Use slim base images
- Scan images with tools like Trivy

## Results

- **Image size**: 1.2GB → 180MB
- **Build time**: 5 min → 45 seconds (with cache)
- **Security**: No root access, minimal attack surface
    `,
    category: "DevOps",
    readTime: "7 min read",
    publishedAt: "2024-08-05",
    tags: ["Docker", "Python", "DevOps", "Security"],
  },
  {
    id: "5",
    slug: "building-etl-pipelines-python",
    title: "Building Robust ETL Pipelines with Python",
    excerpt: "Design patterns and best practices for building maintainable data pipelines using Python, Pandas, and modern orchestration tools.",
    content: `
# Building Robust ETL Pipelines with Python

During my time at Cecure Intelligence, I built numerous ETL pipelines. Here are patterns that stood the test of production.

## Pipeline Architecture

\`\`\`
┌─────────┐    ┌───────────┐    ┌──────────┐    ┌─────────┐
│ Sources │ -> │  Extract  │ -> │Transform │ -> │  Load   │
└─────────┘    └───────────┘    └──────────┘    └─────────┘
     │              │                │               │
     └──────────────┴────────────────┴───────────────┘
                         │
                   ┌─────────────┐
                   │  Monitoring │
                   └─────────────┘
\`\`\`

## Extract Layer

\`\`\`python
from abc import ABC, abstractmethod
import pandas as pd

class DataExtractor(ABC):
    @abstractmethod
    def extract(self) -> pd.DataFrame:
        pass

class APIExtractor(DataExtractor):
    def __init__(self, endpoint: str, auth_token: str):
        self.endpoint = endpoint
        self.auth_token = auth_token
    
    def extract(self) -> pd.DataFrame:
        response = requests.get(
            self.endpoint,
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        return pd.DataFrame(response.json())
\`\`\`

## Transform Layer

Keep transformations pure and testable:

\`\`\`python
def clean_user_data(df: pd.DataFrame) -> pd.DataFrame:
    return (
        df
        .dropna(subset=['email'])
        .assign(
            email=lambda x: x['email'].str.lower(),
            created_at=lambda x: pd.to_datetime(x['created_at'])
        )
        .drop_duplicates(subset=['email'])
    )
\`\`\`

## Error Handling

\`\`\`python
class PipelineError(Exception):
    def __init__(self, stage: str, message: str):
        self.stage = stage
        self.message = message
        super().__init__(f"[{stage}] {message}")

def run_pipeline():
    try:
        data = extract()
    except Exception as e:
        raise PipelineError("EXTRACT", str(e))
    
    try:
        transformed = transform(data)
    except Exception as e:
        raise PipelineError("TRANSFORM", str(e))
\`\`\`

## Key Principles

1. **Idempotency**: Running the pipeline twice should produce the same result
2. **Observability**: Log everything, monitor everything
3. **Modularity**: Each stage should be independently testable
4. **Fault tolerance**: Implement retries with exponential backoff
    `,
    category: "Data Engineering",
    readTime: "9 min read",
    publishedAt: "2024-07-20",
    tags: ["Python", "ETL", "Data Engineering", "Pandas"],
  },
];

export const getPostBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find((post) => post.slug === slug);
};

export const getPostsByCategory = (category: string): BlogPost[] => {
  return blogPosts.filter((post) => post.category === category);
};

export const getPostsByTag = (tag: string): BlogPost[] => {
  return blogPosts.filter((post) => post.tags.includes(tag));
};

export const categories = [...new Set(blogPosts.map((post) => post.category))];
export const allTags = [...new Set(blogPosts.flatMap((post) => post.tags))];
