---
title: "My Cloud Resume Challenge Journey: Building a Full-Stack Serverless Portfolio on AWS"
slug: "my-cloud-resume-challenge-journey"
category: "Cloud Engineering"
tags: ["AWS", "Serverless", "FastAPI", "React", "DynamoDB", "CloudFormation", "Cognito", "Lambda"]
excerpt: "A deep dive into my experience building a production-ready serverless portfolio website using AWS services, Infrastructure as Code, and modern full-stack development practices. From CloudFront to DynamoDB, here's everything I learned."
featured_image: "https://cloudresumechallenge.dev/images/multicloud-bundle.gif"
published_at: "2025-01-15"
status: "PUBLISHED"
---

# My Cloud Resume Challenge Journey: Building a Full-Stack Serverless Portfolio on AWS

## Introduction

When I first heard about the [Cloud Resume Challenge](https://cloudresumechallenge.dev/), I knew it was the perfect project to level up my cloud engineering skills. What started as a simple resume website evolved into a comprehensive full-stack serverless application with authentication, content management, analytics, and a complete CI/CD workflow.

In this post, I'll share my journey, the technical decisions I made, the challenges I faced, and the valuable lessons I learned along the way.

## The Architecture: A Modern Serverless Stack

Instead of just building a static resume site, I decided to go all-in and create a production-ready portfolio platform with a complete backend API. Here's what I built:

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for blazing-fast development and optimized builds
- **Tailwind CSS + shadcn-ui** for a modern, accessible UI
- **TanStack Query** for intelligent data fetching and caching
- Hosted on **S3** with **CloudFront** CDN for global delivery

### Backend
- **FastAPI** (Python 3.12) running on **AWS Lambda**
- **DynamoDB** with single-table design for all data storage
- **Amazon Cognito** for JWT-based authentication
- **API Gateway** with custom domain and JWT authorizer
- **34 RESTful endpoints** across 6 modules (auth, blogs, projects, certifications, visitors, analytics)

### Infrastructure
- **AWS SAM** for backend infrastructure as code
- **CloudFormation** for frontend infrastructure
- **Ansible** for deployment automation
- **Ansible Vault** for secure credential management

## What I Learned: Key Takeaways

### 1. Infrastructure as Code is Non-Negotiable

One of the most valuable lessons was the importance of treating infrastructure as code. I used:

- **CloudFormation** templates for S3 + CloudFront infrastructure
- **AWS SAM** for Lambda + API Gateway + DynamoDB
- **Ansible** playbooks for deployment automation

This approach meant I could:
- Recreate my entire infrastructure in minutes
- Track all changes in version control
- Deploy consistently across environments (dev/prod)
- Avoid "works on my machine" issues

**Lesson learned:** Never click around in the AWS console to create resources. Always define infrastructure as code from day one.

### 2. DynamoDB Single-Table Design is Powerful (But Challenging)

Instead of creating separate tables for blogs, projects, certifications, and analytics, I used a single-table design with:

- Partition key (PK) and Sort key (SK) for flexible access patterns
- Global Secondary Index (GSI) for additional query patterns
- Overloaded attributes for different entity types

**Benefits:**
- Reduced costs (one table instead of many)
- Atomic transactions across entity types
- Better performance with fewer network calls

**Challenges:**
- Required careful access pattern planning upfront
- More complex queries compared to relational databases
- Harder to visualize data structure

**Lesson learned:** Single-table design is worth it for serverless applications, but invest time in designing access patterns before writing code.

### 3. Authentication with Cognito Simplifies Everything

I initially considered building custom authentication, but chose Amazon Cognito instead. This saved me weeks of development:

- Built-in user management and password policies
- Automatic JWT token generation and validation
- Email verification and account recovery
- MFA support out of the box
- No security vulnerabilities to worry about

I integrated Cognito with API Gateway's JWT Authorizer, so tokens are validated *before* Lambda invocation, reducing costs and improving security.

**Lesson learned:** Don't build what AWS already provides. Cognito is production-ready and more secure than custom auth.

### 4. Testing is Critical for Serverless Applications

I wrote **542+ tests** across backend and frontend:

**Backend:**
- **211 unit tests** with mocked AWS services (using moto)
- **133+ E2E tests** against real deployed APIs
- Automatic test data cleanup in development environment

**Frontend:**
- **198 integration tests** for services and React Query hooks
- Mocked API responses for fast, isolated testing
- Test coverage for authentication, CRUD operations, and analytics

**Lesson learned:** Serverless architectures make manual testing harder. Invest heavily in automated tests from the start.

### 5. React Query Makes State Management Simple

Instead of Redux or complex state management, I used **TanStack Query** (React Query) for all server state:

```typescript
// Automatic caching, refetching, and background updates
export function useBlogPosts(params?: BlogListParams, enabled = true) {
  return useQuery({
    queryKey: blogKeys.list(params),
    queryFn: () => blogService.getAllBlogs(params),
    enabled,
  });
}

// Automatic cache invalidation after mutations
export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BlogPostCreate) => blogService.createBlogPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() });
    },
  });
}
```

**Benefits:**
- Automatic caching and background refetching
- Built-in loading and error states
- Optimistic updates and cache invalidation
- Reduced code complexity by 70%

**Lesson learned:** For most applications, you don't need Redux. React Query handles 90% of state management needs.

### 6. CloudFront + S3 Origin Access Control (OAC) is Secure and Fast

For hosting the React frontend, I used:

- **Private S3 bucket** (no public access)
- **CloudFront** with Origin Access Control (OAC)
- **Custom domain** with free ACM SSL certificates
- **CloudFront Function** for www → apex redirect

This setup provides:
- Global CDN with HTTP/2 and HTTP/3
- DDoS protection
- Automatic compression (Gzip + Brotli)
- Complete S3 bucket privacy

**Lesson learned:** Never make S3 buckets public. Always use CloudFront with OAC for secure, performant delivery.

### 7. Automation Scripts Save Hours of Manual Work

I created 15+ automation scripts for common tasks:

- `frontend-deploy` - Deploy S3 + CloudFront infrastructure
- `s3-upload` - Build and upload frontend
- `cloudfront-invalidate` - Cache invalidation with cost optimization
- `setup-cognito` - Automated Cognito User Pool setup
- `backend-sam-deploy` - Deploy backend with SAM
- `test-api` - API testing with authentication

Each script includes:
- Color-coded output
- Comprehensive error messages
- Verbose mode for debugging
- Automatic prerequisite checking

**Lesson learned:** Invest time in automation scripts. They pay dividends every time you deploy or troubleshoot.

### 8. Visitor Tracking Needs Session Deduplication

For visitor analytics, I implemented two-layer deduplication:

**Backend (visitors):**
- Cookie-based session tracking
- Prevents same visitor counting twice

**Frontend (content views):**
- SessionStorage deduplication
- Prevents duplicate view tracking during same session

This ensures accurate analytics without complex fingerprinting or third-party services.

**Lesson learned:** Simple cookie + sessionStorage deduplication works well for basic analytics. No need for Google Analytics for personal projects.

## The Challenges I Faced

### Challenge 1: Pydantic HttpUrl Serialization with DynamoDB

I hit a brick wall when Pydantic's `HttpUrl` type couldn't serialize to DynamoDB:

```python
# This failed
blog_post = BlogPost(url=HttpUrl("https://example.com"))
table.put_item(Item=blog_post.dict())  # TypeError!
```

**Solution:** Convert HttpUrl to string before DynamoDB operations:

```python
def serialize_for_dynamodb(obj: dict) -> dict:
    """Convert Pydantic types to DynamoDB-compatible types."""
    if isinstance(obj.get('url'), HttpUrl):
        obj['url'] = str(obj['url'])
    return obj
```

### Challenge 2: CORS Configuration Across Environments

Getting CORS right for local development, dev API, and production was tricky. I eventually settled on:

```python
# Flexible CORS for development, strict for production
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Challenge 3: API Gateway JWT Authorizer Configuration

Setting up the Cognito JWT Authorizer took several attempts. The key was:

1. Certificate must be in **us-east-1** (for CloudFront)
2. Authorizer must use **identity source** `$request.header.Authorization`
3. Token validation uses Cognito **User Pool ID** and **App Client ID**

**Lesson learned:** Read AWS documentation carefully. Small configuration mistakes cause hours of debugging.

### Challenge 4: DNS Propagation Delays

After deploying to CloudFront, my custom domain didn't work immediately. I learned:

- DNS propagation takes **1-5 minutes** (sometimes up to 48 hours globally)
- Test CloudFront distribution URL first before testing custom domain
- Use `dig` or `nslookup` to verify DNS records

I even built a test script that waits for DNS propagation before running tests.

## The Numbers: What I Built

Here's the final tally of what I accomplished:

**Infrastructure:**
- **3 CloudFormation stacks** (frontend, backend dev, backend prod)
- **8 AWS services** actively used
- **3 custom domains** (api.patrickcmd.dev, api-dev.patrickcmd.dev, patrickcmd.dev)

**Code:**
- **542+ tests** (211 backend unit + 133+ backend E2E + 198 frontend integration)
- **34 API endpoints** across 6 modules
- **15+ automation scripts** for deployment and management

**Documentation:**
- **13 backend documentation files** (2,500+ lines)
- **8 AWS deployment guides** (3,000+ lines)
- **Complete OpenAPI 3.0.3 specification**

**Cost:**
- **~$7/month** for backend API (Lambda + API Gateway + DynamoDB + Cognito)
- **~$1/month** for frontend (S3 + CloudFront)
- **Total: ~$8/month** for production-grade serverless infrastructure

## What I Would Do Differently

### 1. Start with E2E Tests Earlier

I wrote unit tests first, then E2E tests later. Next time, I'd start with E2E tests to:
- Catch integration issues earlier
- Have confidence in the whole system
- Avoid rework from interface changes

### 2. Use TypeScript for Backend Too

FastAPI with Python was great, but TypeScript would have given me:
- Shared types between frontend and backend
- Better IDE support
- Compile-time error catching

### 3. Add Monitoring and Alarms from Day One

I focused on building features first, monitoring later. I should have set up:
- CloudWatch alarms for errors and latency
- Cost anomaly detection
- API Gateway request monitoring
- Lambda performance metrics

## Resources That Helped Me

**AWS Documentation:**
- [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/)
- [DynamoDB Single-Table Design](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/)
- [API Gateway JWT Authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)

**Community Resources:**
- [Cloud Resume Challenge](https://cloudresumechallenge.dev/) by Forrest Brazeal
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

**Tools:**
- [Lovable.dev](https://lovable.dev) - AI-powered frontend development
- [uv](https://github.com/astral-sh/uv) - Fast Python package manager
- [Vitest](https://vitest.dev/) - Vite-native testing framework

## Conclusion: Was It Worth It?

Absolutely. The Cloud Resume Challenge forced me to:

✅ Learn AWS services in depth (not just tutorials)
✅ Build production-ready infrastructure as code
✅ Implement comprehensive testing strategies
✅ Think about security, cost optimization, and monitoring
✅ Create reusable automation and documentation

**Most importantly:** I now have a real-world project to discuss in interviews, showing I can:
- Design serverless architectures
- Write production-quality code
- Deploy and manage cloud infrastructure
- Build full-stack applications from scratch

If you're considering the Cloud Resume Challenge, my advice:

1. **Start simple**, then iterate
2. **Write tests** as you go
3. **Document everything** (your future self will thank you)
4. **Automate repeatedly** (scripts save hours)
5. **Don't skip security** (use Cognito, enable HTTPS, lock down S3)

The challenge took me about **3 months of part-time work**, but the skills I gained are worth years of tutorial-watching.

## What's Next?

I'm now working on:
- **CI/CD pipeline** with GitHub Actions for automated deployments
- **Performance monitoring** with CloudWatch dashboards
- **Content tagging system** for better blog organization
- **RSS feed generation** for blog subscribers

Want to see the full implementation? Check out:
- **Live Demo:** [https://patrickcmd.dev](https://patrickcmd.dev)
- **Source Code:** [https://github.com/PatrickCmd/cloud-resume-challenge](https://github.com/PatrickCmd/cloud-resume-challenge)
- **API Documentation:** [Complete OpenAPI Spec](https://github.com/PatrickCmd/cloud-resume-challenge/blob/main/openapi.yml)

Have questions about the Cloud Resume Challenge or my implementation? Feel free to reach out on [LinkedIn](https://www.linkedin.com/in/patrick-walukagga/) or [GitHub](https://github.com/PatrickCmd)!

---

*This blog post is part of my Cloud Resume Challenge submission. The entire project is open source and available on GitHub.*
