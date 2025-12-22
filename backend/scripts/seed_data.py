"""
Seed DynamoDB with sample data from frontend mock databases.

Run this script to populate local DynamoDB with realistic test data:
    python scripts/seed_data.py
"""

import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set environment variables before importing repositories
os.environ['DYNAMODB_ENDPOINT'] = 'http://localhost:8000'
os.environ['AWS_REGION'] = 'us-east-1'
os.environ['AWS_ACCESS_KEY_ID'] = 'dummy'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'dummy'

from src.repositories.blog import BlogRepository
from src.repositories.project import ProjectRepository
from src.repositories.certification import CertificationRepository


def seed_blog_posts():
    """Seed blog posts from frontend mock data."""
    print("\n=== Seeding Blog Posts ===")

    repo = BlogRepository()

    blog_posts = [
        {
            "title": "Building Scalable REST APIs with FastAPI and PostgreSQL",
            "excerpt": "Learn how to design and implement high-performance REST APIs using FastAPI, with async database operations and proper error handling.",
            "content": """# Building Scalable REST APIs with FastAPI and PostgreSQL

FastAPI has become my go-to framework for building modern Python APIs. In this article, I'll share patterns I've learned from building production systems at Sunbird AI and previous roles.

## Why FastAPI?

After years of working with Django REST Framework and Flask, FastAPI stands out for several reasons:

- **Async by default**: Native support for async/await makes handling concurrent requests efficient
- **Type hints everywhere**: Automatic validation and documentation from Python type hints
- **OpenAPI out of the box**: Interactive API documentation with Swagger UI

## Project Structure

```
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
```

## Async Database Operations

Using SQLAlchemy 2.0 with asyncpg for PostgreSQL:

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    return result.scalars().all()
```

## Key Takeaways

1. Use dependency injection for database sessions
2. Implement proper error handling with custom exceptions
3. Add request validation using Pydantic models
4. Cache frequently accessed data with Redis

Building scalable APIs is about making the right architectural decisions early. FastAPI gives you the tools - it's up to you to use them wisely.""",
            "category": "Backend",
            "tags": ["Python", "FastAPI", "PostgreSQL", "REST API"]
        },
        {
            "title": "My Journey to AWS Solutions Architect Certification",
            "excerpt": "A practical guide to preparing for the AWS Solutions Architect Associate exam, with study resources and real-world tips.",
            "content": """# My Journey to AWS Solutions Architect Certification

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

I'm now working toward the AWS Solutions Architect Professional certification. The learning never stops!""",
            "category": "Cloud",
            "tags": ["AWS", "Certification", "Cloud", "Career"]
        },
        {
            "title": "Migrating from Django to FastAPI: Lessons Learned",
            "excerpt": "Real-world insights from migrating a production Django application to FastAPI, including challenges and performance gains.",
            "content": """# Migrating from Django to FastAPI: Lessons Learned

At Audersity, we faced a decision many Python shops encounter: stick with Django or move to something more modern. Here's what we learned.

## Why Consider Migration?

Our Django REST Framework API was solid, but we needed:

- Better async support for I/O-bound operations
- Improved response times for real-time features
- Reduced memory footprint for containerized deployments

## The Migration Strategy

### Phase 1: Parallel Development

We didn't do a big-bang migration. Instead:

```
├── django_app/      # Existing Django API
├── fastapi_app/     # New FastAPI service
└── nginx/           # Route traffic between them
```

### Phase 2: Gradual Traffic Shift

Using feature flags, we routed specific endpoints to FastAPI:

```nginx
location /api/v2/realtime/ {
    proxy_pass http://fastapi_service;
}

location /api/ {
    proxy_pass http://django_service;
}
```

## Challenges We Faced

### 1. ORM Differences

SQLAlchemy async is different from Django ORM:

```python
# Django
users = User.objects.filter(is_active=True)

# SQLAlchemy async
result = await session.execute(
    select(User).where(User.is_active == True)
)
users = result.scalars().all()
```

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
4. Document everything for the team""",
            "category": "Backend",
            "tags": ["Python", "Django", "FastAPI", "Migration"]
        },
        {
            "title": "Docker Best Practices for Python Applications",
            "excerpt": "Optimize your Python Docker images for production with multi-stage builds, proper caching, and security hardening.",
            "content": """# Docker Best Practices for Python Applications

After containerizing dozens of Python applications, I've collected patterns that make a real difference in production.

## The Problem with Naive Dockerfiles

A simple Dockerfile might look like:

```dockerfile
FROM python:3.11
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
CMD ["python", "main.py"]
```

Issues: Large image size, slow builds, running as root.

## Optimized Dockerfile

```dockerfile
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
```

## Key Optimizations

### 1. Multi-stage Builds

Separate build dependencies from runtime. Your final image doesn't need gcc or build tools.

### 2. Layer Caching

Order commands from least to most frequently changed:

```dockerfile
COPY requirements.txt .  # Changes rarely
RUN pip install -r requirements.txt
COPY . .  # Changes often
```

### 3. Security

- Run as non-root user
- Use slim base images
- Scan images with tools like Trivy

## Results

- **Image size**: 1.2GB → 180MB
- **Build time**: 5 min → 45 seconds (with cache)
- **Security**: No root access, minimal attack surface""",
            "category": "DevOps",
            "tags": ["Docker", "Python", "DevOps", "Security"]
        },
        {
            "title": "Building Robust ETL Pipelines with Python",
            "excerpt": "Design patterns and best practices for building maintainable data pipelines using Python, Pandas, and modern orchestration tools.",
            "content": """# Building Robust ETL Pipelines with Python

During my time at Cecure Intelligence, I built numerous ETL pipelines. Here are patterns that stood the test of production.

## Pipeline Architecture

```
┌─────────┐    ┌───────────┐    ┌──────────┐    ┌─────────┐
│ Sources │ -> │  Extract  │ -> │Transform │ -> │  Load   │
└─────────┘    └───────────┘    └──────────┘    └─────────┘
     │              │                │               │
     └──────────────┴────────────────┴───────────────┘
                         │
                   ┌─────────────┐
                   │  Monitoring │
                   └─────────────┘
```

## Extract Layer

```python
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
```

## Transform Layer

Keep transformations pure and testable:

```python
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
```

## Error Handling

```python
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
```

## Key Principles

1. **Idempotency**: Running the pipeline twice should produce the same result
2. **Observability**: Log everything, monitor everything
3. **Modularity**: Each stage should be independently testable
4. **Fault tolerance**: Implement retries with exponential backoff""",
            "category": "Data Engineering",
            "tags": ["Python", "ETL", "Data Engineering", "Pandas"]
        }
    ]

    created_posts = []
    for post_data in blog_posts:
        post = repo.create(post_data)
        created_posts.append(post)
        print(f"✓ Created: {post['title'][:50]}...")

        # Publish the post
        repo.publish(post['id'])
        print(f"  → Published")

    print(f"\n✓ Seeded {len(created_posts)} blog posts")
    return created_posts


def seed_projects():
    """Seed projects from frontend mock data."""
    print("\n=== Seeding Projects ===")

    repo = ProjectRepository()

    projects = [
        {
            "name": "MTN Rwanda Agriculture Platform",
            "description": "Django REST API powering cooperative and farmer onboarding workflows with USSD integration for collection and loan management.",
            "longDescription": """A comprehensive agriculture platform built for MTN Rwanda in partnership with HAMWE EA.

## Features
- Cooperative and farmer onboarding workflows
- USSD integration for mobile-first access
- Collection management system
- Loan management and tracking
- Real-time reporting and analytics

## Technical Implementation
Built with Django REST Framework, featuring:
- RESTful API architecture
- PostgreSQL for data persistence
- Docker containerization for deployment
- Integration with USSD gateway services""",
            "tech": ["Python", "Django", "PostgreSQL", "Docker"],
            "company": "HAMWE EA",
            "featured": True,
            "githubUrl": "",
            "liveUrl": "",
            "imageUrl": ""
        },
        {
            "name": "Blockbrite Payment Gateway",
            "description": "Backend modules for a payment gateway with banking transaction API integrations.",
            "longDescription": """Payment gateway backend system developed for BoldGains.

## Features
- Secure payment processing
- Multi-bank API integrations
- Transaction monitoring and reporting
- Fraud detection mechanisms

## Technical Stack
- Django REST Framework for API development
- Secure banking API integrations
- Real-time transaction processing""",
            "tech": ["Python", "Django", "REST APIs"],
            "company": "BoldGains",
            "featured": True
        },
        {
            "name": "IT Certification Extranet",
            "description": "RESTful APIs for the IT certification system with SMS notifications and invoice generation.",
            "longDescription": """IT Certification management system for NITA-U.

## Features
- Certification application workflow
- SMS notification system
- Automated invoice generation
- Certificate verification portal

## Implementation Details
- Django-based REST API
- PostgreSQL database
- Integration with SMS gateways
- PDF generation for certificates and invoices""",
            "tech": ["Python", "Django", "PostgreSQL"],
            "company": "NITA-U IT",
            "featured": False
        },
        {
            "name": "Hardware Inventory System",
            "description": "Internal inventory system for hardware reservations, quality checks, and automated testing processes.",
            "longDescription": """Internal inventory management system for Tarana Wireless.

## Features
- Hardware reservation system
- Quality check workflows
- Automated testing integration
- Asset tracking and reporting

## Technical Details
- Flask-based REST API
- PostgreSQL for data storage
- Integration with testing frameworks""",
            "tech": ["Python", "Flask", "PostgreSQL"],
            "company": "Tarana Wireless",
            "featured": False
        },
        {
            "name": "Music Analytics Pipeline",
            "description": "Data scraping and PostgreSQL pipelines for music analytics with SQL-based data exports.",
            "longDescription": """Music industry analytics platform for Chartmetric.

## Features
- Data scraping from multiple sources
- ETL pipelines for data processing
- Analytics and reporting dashboards
- SQL-based data export functionality

## Implementation
- Python-based data pipelines
- PostgreSQL for data warehousing
- API integrations with music platforms""",
            "tech": ["Python", "PostgreSQL", "APIs"],
            "company": "Chartmetric",
            "featured": False
        },
        {
            "name": "Sunbird AI Platform",
            "description": "Backend systems, infrastructure automation, and ML-enabled services for production AI systems.",
            "longDescription": """Production AI platform for Sunbird AI.

## Features
- Machine learning model serving
- Infrastructure automation
- API gateway for AI services
- Scalable backend architecture

## Technical Stack
- FastAPI for high-performance APIs
- AWS infrastructure
- Docker and Kubernetes
- ML model deployment pipelines""",
            "tech": ["Python", "FastAPI", "AWS", "Docker"],
            "company": "Sunbird AI",
            "featured": True
        }
    ]

    created_projects = []
    for project_data in projects:
        project = repo.create(project_data)
        created_projects.append(project)
        print(f"✓ Created: {project['name'][:50]}...")

        # Publish the project
        repo.publish(project['id'])
        print(f"  → Published")

    print(f"\n✓ Seeded {len(created_projects)} projects")
    return created_projects


def seed_certifications():
    """Seed certifications from frontend mock data."""
    print("\n=== Seeding Certifications ===")

    repo = CertificationRepository()

    certifications = [
        {
            "name": "AWS Certified Solutions Architect – Associate",
            "issuer": "Amazon Web Services (AWS)",
            "icon": "☁️",
            "type": "certification",
            "featured": True,
            "description": "Validates expertise in designing distributed systems on AWS.",
            "credentialUrl": "",
            "dateEarned": "2023-06-15"
        },
        {
            "name": "AWS Cloud Practitioner",
            "issuer": "Amazon Web Services (AWS)",
            "icon": "☁️",
            "type": "certification",
            "featured": True,
            "description": "Foundational understanding of AWS Cloud concepts, services, and terminology.",
            "dateEarned": "2023-01-20"
        },
        {
            "name": "AWS Cloud Project Bootcamp (Teal Squad)",
            "issuer": "AWS",
            "icon": "🏆",
            "type": "certification",
            "featured": False,
            "description": "Hands-on bootcamp for building real-world AWS projects.",
            "dateEarned": "2023-03-10"
        },
        {
            "name": "Applied Data Science Lab",
            "issuer": "WorldQuant University",
            "icon": "📊",
            "type": "course",
            "featured": False,
            "description": "Practical data science skills using Python and machine learning.",
            "dateEarned": "2022-12-01"
        },
        {
            "name": "GitHub Copilot Fundamentals",
            "issuer": "GitHub",
            "icon": "🤖",
            "type": "course",
            "featured": False,
            "description": "Understanding AI-powered code completion with GitHub Copilot.",
            "dateEarned": "2024-02-15"
        },
        {
            "name": "[PCEP-30-01] PCEP – Certified Entry-Level Python Programmer",
            "issuer": "Python Institute",
            "icon": "🐍",
            "type": "certification",
            "featured": False,
            "description": "Entry-level certification for Python programming fundamentals.",
            "dateEarned": "2022-08-20"
        },
        {
            "name": "Python Data Structures",
            "issuer": "Coursera",
            "icon": "📚",
            "type": "course",
            "featured": False,
            "description": "Deep dive into Python data structures and algorithms.",
            "dateEarned": "2022-05-10"
        },
        {
            "name": "Programming for Everybody",
            "issuer": "Coursera",
            "icon": "💻",
            "type": "course",
            "featured": False,
            "description": "Introduction to programming concepts using Python.",
            "dateEarned": "2022-03-15"
        },
        {
            "name": "Front-End Web UI Frameworks and Tools",
            "issuer": "Coursera",
            "icon": "🎨",
            "type": "course",
            "featured": False,
            "description": "Building responsive web interfaces with modern frameworks.",
            "dateEarned": "2022-07-20"
        }
    ]

    created_certs = []
    for cert_data in certifications:
        cert = repo.create(cert_data)
        created_certs.append(cert)
        print(f"✓ Created: {cert['name'][:50]}...")

        # Publish the certification
        repo.publish(cert['id'])
        print(f"  → Published")

    print(f"\n✓ Seeded {len(created_certs)} certifications")
    return created_certs


if __name__ == '__main__':
    print("Starting DynamoDB Data Seeding...")
    print("Ensure Docker DynamoDB is running: docker-compose up -d\n")

    try:
        # Seed all data
        blog_posts = seed_blog_posts()
        projects = seed_projects()
        certifications = seed_certifications()

        print("\n" + "="*50)
        print("✓ ALL DATA SEEDED SUCCESSFULLY!")
        print("="*50)
        print(f"\nSummary:")
        print(f"  Blog Posts: {len(blog_posts)}")
        print(f"  Projects: {len(projects)}")
        print(f"  Certifications: {len(certifications)}")
        print(f"\nYou can now test the API with realistic data!")

    except Exception as e:
        print(f"\n✗ Seeding failed: {e}")
        import traceback
        traceback.print_exc()
