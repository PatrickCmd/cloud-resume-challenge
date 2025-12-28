---
name: "Cloud Resume Challenge - Full-Stack Serverless Portfolio"
slug: "cloud-resume-challenge"
description: "A production-ready serverless portfolio platform built on AWS with comprehensive backend API, authentication, content management, and analytics."
tech_stack: ["AWS Lambda", "FastAPI", "Python 3.12", "React 18", "TypeScript", "DynamoDB", "Amazon Cognito", "API Gateway", "CloudFront", "S3", "AWS SAM", "CloudFormation", "Ansible", "TanStack Query", "Tailwind CSS", "Vite"]
github_url: "https://github.com/PatrickCmd/cloud-resume-challenge"
live_url: "https://patrickcmd.dev"
demo_url: "https://patrickcmd.dev"
featured_image: "https://cloudresumechallenge.dev/images/multicloud-bundle.gif"
featured: true
status: "PUBLISHED"
published_at: "2025-01-15"
---

# Cloud Resume Challenge - Full-Stack Serverless Portfolio

## Project Overview

The Cloud Resume Challenge is a hands-on project designed to demonstrate proficiency in cloud engineering, full-stack development, and DevOps practices. Instead of building just a static resume website, I created a comprehensive production-ready serverless portfolio platform with a complete backend API, authentication system, content management capabilities, and visitor analytics.

**Live Demo:** [https://patrickcmd.dev](https://patrickcmd.dev)
**API Documentation:** [OpenAPI Specification](https://github.com/PatrickCmd/cloud-resume-challenge/blob/main/openapi.yml)
**Source Code:** [GitHub Repository](https://github.com/PatrickCmd/cloud-resume-challenge)

## Architecture

### Frontend Stack
- **React 18** with TypeScript for type-safe component development
- **Vite** for lightning-fast development and optimized production builds
- **Tailwind CSS + shadcn-ui** for modern, accessible UI components
- **TanStack Query (React Query)** for intelligent server state management
- **Hosted on AWS S3** with CloudFront CDN for global content delivery
- **198 integration tests** with Vitest and Testing Library

### Backend Stack
- **FastAPI (Python 3.12)** running on AWS Lambda with Mangum adapter
- **DynamoDB** with single-table design for scalable data storage
- **Amazon Cognito** for secure JWT-based authentication
- **API Gateway** with custom domain (api.patrickcmd.dev) and JWT authorizer
- **34 RESTful endpoints** across 6 modules:
  - Authentication (login, register, token refresh)
  - Blog posts (CRUD, publish/unpublish workflow)
  - Projects (CRUD, featured projects)
  - Certifications (CRUD, expiry tracking)
  - Visitor tracking (session-based deduplication)
  - Analytics (content views, trends, top content)
- **344 tests** (211 unit tests + 133+ E2E tests)

### Infrastructure as Code
- **AWS SAM** for backend infrastructure (Lambda, API Gateway, DynamoDB, Cognito)
- **CloudFormation** for frontend infrastructure (S3, CloudFront, Route 53)
- **Ansible** for deployment automation and orchestration
- **Ansible Vault** for secure credential management
- **15+ automation scripts** for common deployment and management tasks

## Key Features

### 1. Content Management System
- Full CRUD operations for blogs, projects, and certifications
- Draft/published workflow with owner-only access
- Rich markdown support with syntax highlighting
- Tag-based categorization and filtering
- Real-time search across all content types

### 2. Authentication & Authorization
- Amazon Cognito user pool integration
- JWT token-based authentication with automatic refresh
- Protected routes for owner-only operations
- API Gateway JWT authorizer for serverless security
- Email verification and account recovery

### 3. Visitor Analytics
- Cookie-based visitor tracking with session deduplication
- Content view tracking with sessionStorage deduplication
- Daily and monthly visitor trends
- Top content statistics across all types
- Real-time analytics dashboard

### 4. Performance Optimization
- CloudFront CDN with HTTP/2 and HTTP/3 support
- Automatic Gzip and Brotli compression
- React Query intelligent caching and background refetching
- DynamoDB single-table design for minimal network calls
- Origin Access Control (OAC) for private S3 bucket access

### 5. Developer Experience
- Comprehensive TypeScript types matching backend schemas
- Axios interceptors for automatic JWT injection and refresh
- Custom React Query hooks for all API operations
- Automatic cache invalidation after mutations
- Color-coded automation scripts with verbose debugging

## Technical Highlights

### Single-Table DynamoDB Design
Implemented a sophisticated single-table design with:
- Composite partition key (PK) and sort key (SK) for flexible access patterns
- Global Secondary Index (GSI) for additional query patterns
- Overloaded attributes supporting multiple entity types
- Atomic transactions across different content types

**Benefits:**
- Reduced operational costs (one table vs. multiple tables)
- Better performance with fewer network round-trips
- Atomic multi-item transactions

### React Query State Management
Replaced traditional Redux patterns with TanStack Query:
- Automatic background refetching and cache synchronization
- Built-in loading, error, and success states
- Optimistic updates for instant UI feedback
- Query key factories for organized cache management
- 70% reduction in state management code

### Dual-Query Pattern for Owner Access
Implemented separate queries for published and draft content:
```typescript
const { data: publishedPosts = [] } = useBlogPosts({ status: 'published' });
const { data: draftPosts = [] } = useBlogPosts({ status: 'draft' }, isOwner);
const posts = isOwner ? [...publishedPosts, ...draftPosts] : publishedPosts;
```

This pattern provides:
- Public users see only published content
- Owners see both published and draft content
- Efficient parallel queries with automatic caching
- Independent cache invalidation per status

### Comprehensive Testing Strategy
Built a robust testing infrastructure:

**Backend (344 tests):**
- Unit tests with mocked AWS services using `moto`
- E2E tests against real deployed APIs
- Automatic test data cleanup in development
- FastAPI TestClient for route testing

**Frontend (198 tests):**
- Service layer integration tests
- React Query hook tests with mock providers
- Authentication flow tests
- CRUD operation coverage across all content types

### Automation and DevOps
Created 15+ automation scripts for:
- Infrastructure deployment (frontend-deploy, backend-sam-deploy)
- Content deployment (s3-upload with build optimization)
- Cache invalidation (cloudfront-invalidate with cost optimization)
- Cognito setup (setup-cognito for user pool configuration)
- API testing (test-api with authentication)
- Database management (dynamodb operations)

Each script includes:
- Color-coded output for better readability
- Comprehensive error handling and messages
- Verbose mode for debugging
- Prerequisite checking (AWS CLI, environment variables)

## Project Statistics

### Infrastructure
- **3 CloudFormation stacks** (frontend, backend dev, backend prod)
- **8 AWS services** (Lambda, API Gateway, DynamoDB, Cognito, S3, CloudFront, Route 53, ACM)
- **3 custom domains** (patrickcmd.dev, api.patrickcmd.dev, api-dev.patrickcmd.dev)
- **2 environments** (development and production)

### Codebase
- **542+ tests** total (344 backend + 198 frontend)
- **34 API endpoints** across 6 modules
- **15+ automation scripts** for deployment and management
- **~10,000 lines** of application code
- **~6,000 lines** of test code

### Documentation
- **13 backend documentation files** (2,500+ lines)
- **8 AWS deployment guides** (3,000+ lines)
- **Complete OpenAPI 3.0.3 specification** with examples
- **Comprehensive README files** for frontend and backend
- **Testing documentation** with best practices

### Cost Efficiency
- **~$7/month** for backend (Lambda + API Gateway + DynamoDB + Cognito)
- **~$1/month** for frontend (S3 + CloudFront)
- **Total: ~$8/month** for production-grade serverless infrastructure
- **Free Tier coverage** for first year on many services

## Challenges Overcome

### 1. Pydantic HttpUrl Serialization
DynamoDB couldn't serialize Pydantic's `HttpUrl` type directly. Created custom serialization helper to convert HttpUrl objects to strings before storage operations.

### 2. CORS Configuration
Managing CORS across local development, dev API, and production required environment-specific configuration with flexible allowed origins.

### 3. API Gateway JWT Authorizer
Required precise configuration:
- ACM certificate in us-east-1 (CloudFront requirement)
- Correct identity source (`$request.header.Authorization`)
- Cognito User Pool ID and App Client ID validation

### 4. Type Mismatches Between Backend and Frontend
Backend returns camelCase for some fields (`totalViews`) but snake_case for others (`total_visitors`). Required careful type mapping and transformation.

### 5. Session Deduplication
Implemented two-layer deduplication:
- Backend: Cookie-based for visitor tracking
- Frontend: SessionStorage for content view tracking

## Key Learnings

1. **Infrastructure as Code is Essential** - Being able to recreate entire infrastructure in minutes is invaluable
2. **Single-Table DynamoDB Requires Upfront Planning** - Access pattern design is critical before implementation
3. **Cognito Saves Weeks of Development** - Don't build custom auth when AWS provides production-ready solutions
4. **Testing is Non-Negotiable** - Serverless architectures make manual testing harder; automation is crucial
5. **React Query Simplifies State Management** - Most apps don't need Redux; React Query handles 90% of needs
6. **CloudFront + OAC is Secure and Fast** - Never make S3 buckets public; always use CDN with proper access control
7. **Automation Scripts Pay Dividends** - Initial time investment saves hours on every deployment
8. **Simple Analytics Work Well** - Cookie + sessionStorage deduplication sufficient for portfolio analytics

## What I Would Do Differently

1. **Start with E2E Tests Earlier** - Write integration tests first to catch issues at system boundaries
2. **Use TypeScript for Backend** - Shared types between frontend and backend would reduce duplication
3. **Add Monitoring from Day One** - CloudWatch alarms, cost anomaly detection, and performance metrics

## Future Enhancements

- **CI/CD Pipeline** with GitHub Actions for automated deployments
- **Performance Monitoring** with CloudWatch dashboards and custom metrics
- **Content Tagging System** for better organization and discoverability
- **RSS Feed Generation** for blog subscribers
- **Email Notifications** for new content using SNS/SES
- **Advanced Analytics** with custom reports and visualizations

## Technologies Used

**Cloud Infrastructure:**
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Amazon Cognito
- Amazon S3
- Amazon CloudFront
- AWS Route 53
- AWS Certificate Manager
- AWS SAM
- AWS CloudFormation

**Backend:**
- Python 3.12
- FastAPI
- Pydantic
- Mangum (AWS Lambda adapter)
- Boto3
- pytest
- moto (AWS mocking)

**Frontend:**
- React 18
- TypeScript
- Vite
- TanStack Query
- Axios
- Tailwind CSS
- shadcn-ui
- Radix UI
- Vitest
- Testing Library

**DevOps:**
- Ansible
- Ansible Vault
- Bash scripting
- Git

## Recognition and Impact

This project demonstrates:
- **Cloud Architecture Design** - Serverless-first approach with proper service selection
- **Full-Stack Development** - Modern frontend and backend with type safety
- **DevOps Practices** - Infrastructure as Code, automation, and testing
- **Security Best Practices** - Authentication, authorization, and secure credential management
- **Cost Optimization** - Serverless architecture with minimal monthly costs
- **Production Readiness** - Comprehensive testing, monitoring, and documentation

The Cloud Resume Challenge forced me to learn AWS services in depth, build production-ready infrastructure, implement comprehensive testing strategies, and think about security, cost optimization, and monitoring - skills directly applicable to real-world cloud engineering roles.

## Links

- **Live Application:** [https://patrickcmd.dev](https://patrickcmd.dev)
- **API Endpoint:** [https://api.patrickcmd.dev](https://api.patrickcmd.dev)
- **GitHub Repository:** [https://github.com/PatrickCmd/cloud-resume-challenge](https://github.com/PatrickCmd/cloud-resume-challenge)
- **API Documentation:** [OpenAPI Specification](https://github.com/PatrickCmd/cloud-resume-challenge/blob/main/openapi.yml)
- **Blog Post:** [My Cloud Resume Challenge Journey](https://patrickcmd.dev/blog/my-cloud-resume-challenge-journey)

---

**Project Duration:** ~3 months (part-time)
**Completion Date:** January 2025
**Challenge:** [Cloud Resume Challenge](https://cloudresumechallenge.dev/) by Forrest Brazeal
