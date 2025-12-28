# Cloud Resume Challenge

This repository contains my implementation of the [Cloud Resume Challenge (AWS)](https://cloudresumechallenge.dev/docs/the-challenge/aws/) - a hands-on project that demonstrates cloud engineering skills by building and deploying a personal resume website using AWS services.

## Project Overview

The Cloud Resume Challenge is designed to help aspiring cloud engineers gain practical experience with:
- Frontend development
- Cloud infrastructure (AWS)
- Infrastructure as Code (IaC)
- CI/CD pipelines
- Serverless architecture
- Database integration
- Monitoring and logging

## Architecture

This project follows a serverless architecture on AWS, consisting of:
- **Frontend**: React-based portfolio website
- **Backend**: AWS Lambda functions with API Gateway
- **Database**: DynamoDB for visitor counter
- **Hosting**: S3 + CloudFront for static site hosting
- **DNS**: Route 53 for custom domain management
- **CI/CD**: GitHub Actions for automated deployments

## Frontend Development

### Building with Lovable.dev

For the frontend, I leveraged [Lovable.dev](https://lovable.dev) - an AI-powered web development platform that accelerates the creation of modern, responsive web applications.

**Initial Prompt Used:**

```
I want to create my personal page that looks like a github profile: https://github.com/PatrickCmd

userpic https://avatars.githubusercontent.com/u/6010217?v=4
name: Patrick Walukagga (PatrickCmd)

instead of "Overview, Repositories, Projects, Packages Stars" we can have "Overview, Certifications, Projects, CV"

Attached is my linked profile resume. 

Add toggle for dark/light theme
```

Attached resume [here](./frontend/docs/linkedin-resume.md)

**Design Approach:**

The frontend was designed to mimic the familiar GitHub profile interface while showcasing my professional information. Key features include:

- **GitHub-inspired Layout**: Clean, professional navigation with tabs for different content sections
- **Custom Sections**:
  - **Overview**: Professional summary and highlights
  - **Certifications**: Cloud and technical certifications
  - **Projects**: Portfolio of notable projects
  - **CV**: Downloadable resume/CV
- **Dark/Light Theme**: Toggle for user preference with theme persistence
- **Responsive Design**: Mobile-first approach ensuring compatibility across devices
- **Modern Tech Stack**: Built with React, TypeScript, Tailwind CSS, and shadcn-ui components

**Why Lovable.dev?**

Using Lovable.dev allowed me to:
- Rapidly prototype and iterate on design ideas
- Focus on cloud infrastructure rather than frontend boilerplate
- Generate production-ready, type-safe React code
- Implement modern UI patterns and accessibility standards
- Maintain code quality with TypeScript and component-based architecture

**Live Demo**: [https://patrick-persona-page.lovable.app/](https://patrick-persona-page.lovable.app/)

**Frontend Documentation**: See [frontend/README.md](frontend/README.md) for detailed setup and development instructions.

## Infrastructure as Code

### CloudFormation & Ansible

For the infrastructure deployment, I chose to use **AWS CloudFormation** for infrastructure definition and **Ansible** for deployment automation, providing a robust and production-ready approach.

**Why CloudFormation + Ansible?**

- **CloudFormation**: Native AWS IaC tool with full AWS service support
- **Ansible**: Agentless automation for consistent, repeatable deployments
- **Ansible Vault**: Secure credential management with encryption
- **Production-Ready**: Industry-standard tools used in enterprise environments

### Infrastructure Components

#### 1. CloudFormation Template ([aws/frontend.yaml](aws/frontend.yaml))

Complete infrastructure with S3 + CloudFront CDN configuration:

**S3 Bucket (Private)**:
- **Origin Access Control (OAC)**: Modern secure access from CloudFront only
- **Private Bucket**: No public access, completely locked down
- **Security**: AES256 encryption with bucket key, versioning enabled
- **SSL/TLS Enforcement**: HTTPS-only access via bucket policy

**CloudFront Distribution**:
- **Custom Domain**: Supports both apex (patrickcmd.dev) and www subdomain
- **SSL/TLS**: ACM certificate for HTTPS (certificate must be in us-east-1)
- **WWW Redirect**: CloudFront Function for 301 redirect (www → apex domain)
- **Global CDN**: HTTP/2, HTTP/3, Gzip and Brotli compression enabled
- **SPA Support**: Custom error responses (403/404 → index.html)
- **Caching**: AWS managed cache policy (CachingOptimized)

**CloudFront Function**:
- **Lightweight**: Runs at edge locations for ultra-low latency
- **Cost-Effective**: First 2M invocations/month FREE
- **SEO-Friendly**: 301 permanent redirect for www to apex domain

```yaml
# Key Resources:
- S3 Bucket (Private, OAC-only access)
- CloudFront Origin Access Control (OAC)
- CloudFront Distribution (Custom domain, HTTPS)
- CloudFront Function (WWW redirect)
- S3 Bucket Policy (CloudFront service principal)
```

**References**:
- [CloudFormation S3 Bucket](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-s3-bucket.html)
- [CloudFormation CloudFront Distribution](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cloudfront-distribution.html)
- [CloudFormation CloudFront Function](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cloudfront-function.html)
- [CloudFront Setup Guide](aws/CLOUDFRONT-SETUP.md) - Comprehensive deployment guide

#### 2. Ansible Playbook ([aws/playbooks/frontend-deploy.yml](aws/playbooks/frontend-deploy.yml))

Automated deployment with:
- **Ansible Vault**: Encrypted configuration management
- **Task Organization**: Tagged tasks for flexible execution
- **Error Handling**: Comprehensive failure management
- **Output Capture**: Automatic saving of stack outputs

```yaml
# Deployment Tasks:
1. Display deployment information
2. Validate CloudFormation template
3. Deploy CloudFormation stack
4. Wait for stack creation/update
5. Retrieve and display stack outputs
6. Save outputs to file
```

#### 3. S3 Upload Playbook ([aws/playbooks/s3-upload.yml](aws/playbooks/s3-upload.yml))

Automated frontend build and upload:
- **Build Automation**: Builds React + Vite frontend in production or dev mode
- **S3 Sync**: Syncs built files to S3 with proper MIME types
- **Cache Control**: Optimized headers for performance
- **Clean Sync**: Removes stale files from S3

```yaml
# Upload Tasks:
1. Validate frontend directory and package.json
2. Install npm dependencies if needed
3. Build frontend (production or development)
4. Sync files to S3 with checksum verification
5. Set cache control headers (1 year for assets, no-cache for HTML)
6. Display sync results
```

#### 4. CloudFront Invalidation Playbook ([aws/playbooks/cloudfront-invalidate.yml](aws/playbooks/cloudfront-invalidate.yml))

Automated cache invalidation for CloudFront:
- **Distribution ID Retrieval**: Gets distribution ID from CloudFormation stack
- **Multiple Strategies**: All files, HTML only, or custom paths
- **Cost-Aware**: First 1,000 paths/month FREE, then $0.005/path
- **Progress Tracking**: Real-time invalidation status monitoring

```yaml
# Invalidation Strategies:
1. All Files (/*): Complete cache clear
2. HTML Only: Cost-effective for SPA updates (2 paths)
3. Custom Paths: Surgical invalidation of specific files
```

#### 5. Deployment Scripts

**Frontend Deployment** ([aws/bin/frontend-deploy](aws/bin/frontend-deploy)):
```bash
# Deploy S3 bucket infrastructure
./aws/bin/frontend-deploy --verbose

# Features:
- Automatic prerequisite checking
- Color-coded output
- Multiple deployment modes (validate, deploy, info)
- Variable overrides
- Comprehensive error messages
```

**S3 Upload** ([aws/bin/s3-upload](aws/bin/s3-upload)):
```bash
# Build and upload frontend to S3
./aws/bin/s3-upload --verbose

# Features:
- Automated build process
- Selective operations (build-only, upload-only, clean)
- Development and production modes
- Proper cache control headers
- MIME type detection
```

**CloudFront Invalidation** ([aws/bin/cloudfront-invalidate](aws/bin/cloudfront-invalidate)):
```bash
# Invalidate CloudFront cache after updates
./aws/bin/cloudfront-invalidate --html     # HTML files only (recommended)
./aws/bin/cloudfront-invalidate --all      # All files (costs after 1,000 paths/month)
./aws/bin/cloudfront-invalidate --paths /index.html,/about.html  # Specific files

# Features:
- Cost-optimized strategies
- Real-time invalidation tracking
- Automatic distribution ID retrieval
- Verbose mode for debugging
```

**Stack Management** ([aws/bin/stack-manager](aws/bin/stack-manager)):
```bash
# CloudFormation stack troubleshooting tool
./aws/bin/stack-manager events    # View stack events
./aws/bin/stack-manager failures  # Show only failures
./aws/bin/stack-manager status    # Check stack status
./aws/bin/stack-manager delete    # Clean up stack

# Perfect for debugging failed deployments
```

**Route 53 DNS Setup** ([aws/bin/route53-setup](aws/bin/route53-setup)):
```bash
# Configure DNS to point to CloudFront distribution
STACK_NAME=your-stack-name ./aws/bin/route53-setup

# Features:
- Automatic CloudFront distribution discovery
- Creates A records for apex and www domains
- Waits for DNS propagation
- Verification of DNS records
- Color-coded status output
```

**Website Testing** ([aws/bin/test-website](aws/bin/test-website)):
```bash
# Comprehensive testing suite
./aws/bin/test-website

# 5 Tests Performed:
1. CloudFront distribution direct access
2. DNS resolution (apex and www)
3. HTTPS access to custom domain
4. WWW to apex redirect (301)
5. SSL/TLS certificate validation
```

#### 6. Reproducibility & Setup

**Automated Setup** ([aws/playbooks/setup.sh](aws/playbooks/setup.sh)):
```bash
# One-command setup for all dependencies
cd aws/playbooks
./setup.sh

# Installs:
- Ansible and required Python packages
- AWS SDK (boto3, botocore)
- Ansible collections (amazon.aws, community.aws)
```

**Requirements Files**:
- **[requirements.txt](aws/playbooks/requirements.txt)** - Python dependencies with version pinning
- **[requirements.yml](aws/playbooks/requirements.yml)** - Ansible Galaxy collections

Benefits:
- ✅ Consistent versions across all machines
- ✅ Easy onboarding for new team members
- ✅ CI/CD ready
- ✅ Version control friendly

### Deployment Workflow

#### Initial Setup (One-Time)

1. **Install Dependencies**:
   ```bash
   cd aws/playbooks
   ./setup.sh
   ```

2. **Get ACM Certificate ARN**:
   ```bash
   # Certificate must be in us-east-1 for CloudFront
   aws acm list-certificates --region us-east-1

   # Get specific certificate ARN for your domain
   aws acm list-certificates --region us-east-1 \
     --query 'CertificateSummaryList[?DomainName==`patrickcmd.dev`].CertificateArn' \
     --output text
   ```

3. **Configure Ansible Vault**:
   ```bash
   # Create vault password file
   echo "your-strong-password" > ~/.vault_pass.txt
   chmod 600 ~/.vault_pass.txt

   # Copy and edit configuration
   cp vaults/config.example.yml vaults/config.yml
   nano vaults/config.yml  # Update with your values

   # Important: Add these values to the vault:
   # - domain_config.domain_name: patrickcmd.dev
   # - domain_config.acm_certificate_arn: arn:aws:acm:us-east-1:...

   # Encrypt the vault
   ansible-vault encrypt vaults/config.yml --vault-password-file ~/.vault_pass.txt
   ```

#### Deploying Infrastructure

4. **Deploy S3 + CloudFront**:
   ```bash
   # Deploy infrastructure (S3 bucket + CloudFront distribution)
   ./aws/bin/frontend-deploy --verbose

   # Note: CloudFront deployment takes 15-30 minutes

   # Verify deployment
   ./aws/bin/stack-manager status
   ./aws/bin/stack-manager outputs
   ```

#### Deploying Frontend

5. **Build and Upload Frontend**:
   ```bash
   # Build React app and upload to S3
   ./aws/bin/s3-upload --verbose

   # Or do it in steps:
   ./aws/bin/s3-upload --build    # Build only
   ./aws/bin/s3-upload --upload   # Upload only
   ```

#### Configure DNS (Route 53)

6. **Point DNS to CloudFront**:
   ```bash
   # Automated DNS setup (recommended)
   STACK_NAME=cloud-resume-challenge-portfolio-frontend-stack ./aws/bin/route53-setup

   # This script:
   # - Retrieves CloudFront distribution domain from stack
   # - Creates Route 53 A records (alias) for apex and www
   # - Waits for DNS propagation (1-5 minutes)
   # - Verifies DNS records

   # Manual DNS setup (alternative)
   # Get CloudFront distribution domain from stack outputs
   aws cloudformation describe-stacks \
     --stack-name portfolio-frontend-stack \
     --region us-east-1 \
     --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionDomainName`].OutputValue' \
     --output text

   # Create Route 53 A records (alias) for both apex and www
   # Point both patrickcmd.dev and www.patrickcmd.dev to CloudFront distribution
   # See: aws/CLOUDFRONT-SETUP.md for detailed DNS setup instructions
   ```

#### Testing

7. **Test Your Website**:
   ```bash
   # Comprehensive test suite (recommended)
   ./aws/bin/test-website

   # This runs 5 tests:
   # 1. CloudFront distribution direct access
   # 2. DNS resolution (apex and www)
   # 3. HTTPS access to custom domain
   # 4. WWW to apex redirect (301)
   # 5. SSL/TLS certificate validation

   # Manual testing (alternative)
   # Test CloudFront distribution directly
   curl -I https://d1234567890abc.cloudfront.net

   # Test custom domain (after DNS propagation)
   curl -I https://patrickcmd.dev

   # Test www redirect
   curl -I https://www.patrickcmd.dev
   # Should return: HTTP/2 301 with Location: https://patrickcmd.dev/
   ```

#### Monitoring and Troubleshooting

8. **Monitor Deployment**:
   ```bash
   # Check CloudFormation stack status
   ./aws/bin/stack-manager status

   # View stack outputs (CloudFront distribution, S3 bucket, URLs)
   ./aws/bin/stack-manager outputs

   # Verify files uploaded to S3
   aws s3 ls s3://patrickcmd.dev/ --profile patrickcmd

   # Check CloudFront distribution status
   aws cloudfront list-distributions \
     --query 'DistributionList.Items[?Comment==`CloudFront distribution for patrickcmd.dev`].[Id,Status,DomainName]' \
     --output table
   ```

9. **Troubleshoot if needed**:
   ```bash
   # Show only failures
   ./aws/bin/stack-manager failures

   # View recent events
   ./aws/bin/stack-manager events --limit 30

   # Very verbose deployment for debugging
   ./aws/bin/frontend-deploy -vvv

   # CloudFront troubleshooting
   # See: aws/CLOUDFRONT-SETUP.md for detailed troubleshooting guide
   ./aws/bin/s3-upload -vvv
   ```

#### Quick Update Workflow

After making frontend code changes:
```bash
# 1. Rebuild and upload to S3
./aws/bin/s3-upload --verbose

# 2. Invalidate CloudFront cache (for immediate updates)
#    Recommended: --html flag (only 2 paths, cost-effective for SPAs)
./aws/bin/cloudfront-invalidate --html

# 3. Test at custom domain
curl -I https://patrickcmd.dev

# Alternative: Invalidate all files (costs after 1,000 paths/month)
./aws/bin/cloudfront-invalidate --all

# Alternative: Invalidate specific files only
./aws/bin/cloudfront-invalidate --paths /index.html,/assets/index-abc123.js

# Manual invalidation (if not using the script)
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name portfolio-frontend-stack --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

**Cache Invalidation Notes**:
- **First 1,000 paths/month**: FREE
- **Additional paths**: $0.005 per path
- **HTML strategy**: Only 2 paths (`/index.html`, `/*.html`) - recommended for SPAs
- **Vite assets**: Auto-versioned filenames (no invalidation needed)
- **Wait time**: 2-5 minutes for global propagation

### Security Best Practices

- ✅ **Ansible Vault**: All sensitive configuration encrypted with AES256
- ✅ **SSL/TLS Enforcement**: CloudFront and S3 both deny non-HTTPS requests
- ✅ **Server-Side Encryption**: AES256 with S3 bucket key for data at rest
- ✅ **Origin Access Control (OAC)**: Modern SigV4 signing, S3 bucket fully private
- ✅ **Versioning**: Enabled for rollback capability
- ✅ **Principle of Least Privilege**: CloudFront service principal only
- ✅ **Infrastructure as Code**: All changes tracked in version control
- ✅ **ACM Certificate**: Free managed SSL/TLS certificates from AWS
- ✅ **DDoS Protection**: CloudFront provides automatic DDoS protection

### Documentation

Comprehensive documentation is available for all components:

**Infrastructure & Deployment**:
- **[AWS Infrastructure](aws/README.md)** - CloudFormation templates and deployment overview
- **[CloudFront Setup Guide](aws/CLOUDFRONT-SETUP.md)** - Complete CloudFront deployment guide (500+ lines)
  - Architecture diagrams
  - Prerequisites (ACM certificate, Route 53)
  - Configuration steps
  - DNS setup instructions
  - Testing procedures
  - Troubleshooting (7 common issues including DNS propagation)
  - Cache invalidation strategies
  - Cost estimates and optimization
- **[Ansible Playbooks](aws/playbooks/README.md)** - Complete Ansible guide (1200+ lines)
- **[Quick Start](aws/playbooks/QUICKSTART.md)** - 5-minute setup guide
- **[Setup Script](aws/playbooks/setup.sh)** - Automated dependency installation

**Security & Configuration**:
- **[Ansible Vault](aws/playbooks/vaults/README.md)** - Secure configuration management (500+ lines)
- **[CloudFormation Config](aws/playbooks/CLOUDFORMATION_CONFIG.md)** - Capabilities & failure handling (400+ lines)

**API & Backend**:
- **[API Documentation](API.md)** - Complete OpenAPI 3.0.3 specification and developer guide
  - 34 RESTful endpoints (authentication, blog, projects, certifications, analytics)
  - Data models and schemas
  - Code generation guides (TypeScript, Python, Go clients)
  - Testing and mock server setup
  - Interactive Swagger UI documentation
- **[OpenAPI Specification](openapi.yml)** - Machine-readable API spec (OpenAPI 3.0.3)
- **[Backend Documentation Index](backend/docs/README.md)** - Complete backend documentation guide
  - 13 comprehensive documentation files
  - Setup, testing, deployment guides
  - DynamoDB design and authentication documentation
- **[Backend Deployment Guide](aws/playbooks/BACKEND_DEPLOYMENT.md)** - Deploy backend to AWS with SAM
  - Prerequisites and setup
  - SAM build and deployment process
  - Testing deployed API
  - Troubleshooting guide
- **[SAM Build Process](aws/BUILD_AND_DEPLOY_PROCESS.md)** - How SAM builds and deploys Lambda
  - Build process explained
  - Mangum ASGI adapter
  - Environment variables and configuration
  - Cold/warm start optimization
- **[Backend Local Testing](backend/docs/LOCAL_TESTING.md)** - Local development guide
  - Setup options (AWS DynamoDB vs Local DynamoDB)
  - Multiple testing methods (cURL, HTTPie, Swagger UI, Python)
  - Complete endpoint documentation (public vs protected)
  - Authentication and JWT token usage
  - Development workflow and troubleshooting
- **[Testing Deployed API](backend/docs/TESTING_API.md)** - Test deployed API on AWS
  - Authentication setup with Cognito
  - cURL commands for all 34 endpoints
  - Postman and AWS Console testing
  - Enabling API documentation (/docs, /redoc)
  - Complete endpoint reference

**Scripts & Tools**:
- **[Deployment Scripts](aws/bin/README.md)** - Script usage and examples (2200+ lines)
  - frontend-deploy - Infrastructure deployment (S3 + CloudFront)
  - s3-upload - Build and upload frontend
  - cloudfront-invalidate - Cache invalidation with cost optimization
  - route53-setup - Automated DNS configuration
  - test-website - Comprehensive testing suite (5 tests)
  - stack-manager - Stack troubleshooting
  - budget-setup - AWS Budget monitoring with email alerts
  - billing-alarm-setup - CloudWatch billing alarms (more reliable emails)
  - setup-cognito - Cognito User Pool automated setup
  - cognito-show-config - Display Cognito configuration (env/JSON)
  - cognito-change-password - Change password with validation
  - cognito-manage - Comprehensive user and pool management
  - backend-setup - Backend deployment prerequisites setup
  - backend-sam-deploy - Deploy backend with SAM (production)
  - backend-sam-deploy-dev - Deploy backend with API docs (development)
  - test-api - API testing helper with authentication and endpoint testing

**Troubleshooting**:
- **[Debugging Guide](aws/playbooks/README.md#troubleshooting)** - 15 documented issues with solutions
  - Ansible configuration issues
  - CloudFormation errors
  - S3 sync problems
  - HTTP vs HTTPS access
  - Complete debugging workflow
- **[CloudFront Troubleshooting](aws/CLOUDFRONT-SETUP.md#troubleshooting)** - 7 CloudFront-specific issues
  - Certificate validation errors
  - 403 Forbidden errors
  - DNS resolution problems (comprehensive guide)
  - DNS propagation delays ("This site can't be reached")
  - WWW redirect issues
  - CloudFormation deployment timeouts
  - Cache invalidation

## Project Structure

```
cloud-resume-challenge/
├── frontend/                          # React portfolio website
│   ├── src/                           # React source code
│   ├── public/                        # Static assets
│   ├── dist/                          # Production build output
│   ├── Makefile                       # Build automation
│   ├── package.json                   # Node.js dependencies
│   └── README.md                      # Frontend documentation
│
├── aws/                               # AWS Infrastructure
│   ├── frontend.yaml                  # CloudFormation template (S3 + CloudFront)
│   ├── backend.yaml                   # SAM template (Lambda + API Gateway + DynamoDB)
│   ├── CLOUDFRONT-SETUP.md            # CloudFront deployment guide (500+ lines)
│   ├── BUILD_AND_DEPLOY_PROCESS.md    # SAM build and deployment process
│   │
│   ├── playbooks/                     # Ansible automation
│   │   ├── frontend-deploy.yml        # Infrastructure deployment
│   │   ├── s3-upload.yml              # Build & upload frontend
│   │   ├── cloudfront-invalidate.yml  # Cache invalidation
│   │   ├── setup-cognito.yml          # Cognito User Pool setup
│   │   ├── backend-sam-deploy.yml     # Backend SAM build and deployment
│   │   ├── BACKEND_DEPLOYMENT.md      # Backend deployment guide
│   │   ├── requirements.txt           # Python dependencies
│   │   ├── requirements.yml           # Ansible collections
│   │   ├── setup.sh                   # Automated setup script
│   │   ├── ansible.cfg                # Ansible configuration
│   │   ├── README.md                  # Complete playbooks guide (1200+ lines)
│   │   ├── QUICKSTART.md              # 5-minute setup guide
│   │   ├── CLOUDFORMATION_CONFIG.md   # CFN deep dive (400+ lines)
│   │   └── vaults/                    # Encrypted configuration
│   │       ├── config.yml             # Encrypted vault (includes backend_config)
│   │       ├── config.example.yml     # Example configuration
│   │       └── README.md              # Vault guide (500+ lines)
│   │
│   ├── bin/                           # Deployment scripts
│   │   ├── frontend-deploy            # Deploy S3 + CloudFront infrastructure
│   │   ├── s3-upload                  # Build & upload frontend
│   │   ├── cloudfront-invalidate      # CloudFront cache invalidation
│   │   ├── route53-setup              # DNS configuration automation
│   │   ├── test-website               # Comprehensive testing suite
│   │   ├── stack-manager              # Stack troubleshooting
│   │   ├── budget-setup               # AWS Budget monitoring and management
│   │   ├── billing-alarm-setup        # CloudWatch billing alarms (recommended)
│   │   ├── setup-cognito              # Cognito User Pool setup automation
│   │   ├── cognito-show-config        # Display Cognito configuration
│   │   ├── cognito-change-password    # Change user password (first login)
│   │   ├── cognito-manage             # Comprehensive Cognito management tool
│   │   ├── backend-setup              # Backend deployment prerequisites setup
│   │   ├── backend-sam-deploy         # Deploy backend with SAM (production)
│   │   ├── backend-sam-deploy-dev     # Deploy backend with API docs (development)
│   │   ├── test-api                   # API testing helper script
│   │   └── README.md                  # Scripts documentation (2200+ lines)
│   │
│   ├── outputs/                       # CloudFormation & Cognito outputs
│   │   ├── frontend-stack-outputs.env # Stack outputs (generated)
│   │   ├── cognito-config.env         # Cognito configuration (generated, gitignored)
│   │   └── cognito-config.json        # Cognito JWT config (generated, gitignored)
│   │
│   └── README.md                      # AWS infrastructure overview
│
├── backend/                           # FastAPI Backend Application
│   ├── src/                           # Application source code
│   │   ├── api/                       # API endpoint implementations
│   │   │   ├── auth.py                # Authentication endpoints
│   │   │   ├── blog.py                # Blog CRUD operations
│   │   │   ├── projects.py            # Projects CRUD operations
│   │   │   ├── certifications.py      # Certifications CRUD operations
│   │   │   ├── visitors.py            # Visitor tracking
│   │   │   └── analytics.py           # Analytics and reporting
│   │   ├── models/                    # Pydantic data models
│   │   ├── repositories/              # DynamoDB data access layer
│   │   ├── utils/                     # Utility functions and helpers
│   │   ├── config.py                  # Application configuration
│   │   ├── dependencies.py            # FastAPI dependencies
│   │   └── main.py                    # FastAPI application entry point
│   ├── tests/                         # Comprehensive test suite
│   │   ├── unit/                      # Unit tests (211 tests)
│   │   └── conftest.py                # Pytest configuration and fixtures
│   ├── docs/                          # Backend documentation
│   │   ├── README.md                  # Documentation index (comprehensive)
│   │   ├── QUICKSTART.md              # 5-minute setup guide
│   │   ├── LOCAL_TESTING.md           # Local development and testing guide
│   │   ├── TESTING_API.md             # Testing deployed API on AWS
│   │   ├── DYNAMODB-DESIGN.md         # Single-table design documentation
│   │   ├── AUTHENTICATION.md          # Cognito JWT authentication guide
│   │   └── ... (13 total documentation files)
│   ├── pyproject.toml                 # Python project configuration (uv)
│   ├── docker-compose.yml             # Local DynamoDB setup
│   └── README.md                      # Backend setup instructions
│
├── .github/                           # CI/CD workflows (planned)
│
├── API.md                             # Complete API documentation (developer guide)
├── openapi.yml                        # OpenAPI 3.0.3 specification (machine-readable)
└── README.md                          # This file
```

## Implementation Progress

### ✅ Completed

**Frontend Development**:
- [x] React + TypeScript portfolio website
- [x] GitHub-inspired UI design
- [x] Dark/light theme toggle
- [x] Responsive mobile-first design
- [x] Professional sections (Overview, Certifications, Projects, CV)

**Infrastructure as Code**:
- [x] CloudFormation template for S3 + CloudFront infrastructure
- [x] S3 bucket (private, OAC-only access) with encryption, versioning, SSL/TLS enforcement
- [x] CloudFront distribution with custom domain support
- [x] CloudFront Origin Access Control (OAC) for secure S3 access
- [x] CloudFront Function for www to apex redirect
- [x] Ansible playbook for infrastructure deployment
- [x] Ansible playbook for frontend build & upload
- [x] Ansible Vault for secure configuration management (including ACM certificate ARN)

**Automation & Tooling**:
- [x] Deployment automation scripts (frontend-deploy, s3-upload, stack-manager)
- [x] Stack management and troubleshooting tools
- [x] Automated setup script with dependency management
- [x] Requirements files for reproducibility (requirements.txt, requirements.yml)
- [x] Comprehensive documentation (2500+ lines across 8 files)

**CDN & Domain**:
- [x] CloudFront distribution with HTTPS
- [x] Custom domain support (patrickcmd.dev, www.patrickcmd.dev)
- [x] ACM certificate integration (parameter-based)
- [x] WWW to apex domain redirect (CloudFront Function)
- [x] SPA routing support (403/404 → index.html)
- [x] HTTP/2 and HTTP/3 support
- [x] Gzip and Brotli compression

**Deployment**:
- [x] Upload frontend build to S3
- [x] Proper cache control headers (1 year for assets, no-cache for HTML)
- [x] MIME type configuration
- [x] Clean sync functionality
- [x] CloudFront cache invalidation (Ansible playbook + bash script)
- [x] Multiple invalidation strategies (all, html, custom paths)
- [x] Cost-optimized cache invalidation

**DNS & Testing**:
- [x] Route 53 automated setup script (route53-setup)
- [x] Route 53 A records pointing to CloudFront distribution
- [x] DNS propagation monitoring and verification
- [x] Comprehensive website testing suite (5 tests)
- [x] CloudFront, DNS, HTTPS, redirect, and SSL certificate testing

**Cost Monitoring & Budget Management**:
- [x] AWS Budgets setup script (budget-setup) for monthly budget tracking
- [x] CloudWatch billing alarms (billing-alarm-setup) with reliable SNS email notifications
- [x] Automated threshold alerts at 80% of monthly budget ($16 of $20)
- [x] Email notifications for cost overruns
- [x] Budget status monitoring and management tools
- [x] IAM billing access configuration documentation
- [x] AWS Free Tier usage monitoring and alerts (web console guide)
- [x] CloudWatch billing alarm setup via web console (clickops with screenshots)

**API Specification & Backend Design**:
- [x] Complete OpenAPI 3.0.3 specification (34 RESTful endpoints)
- [x] Comprehensive API documentation with code examples
- [x] Authentication endpoints (JWT-based)
- [x] Blog post CRUD operations (7 endpoints)
- [x] Project portfolio CRUD operations (7 endpoints)
- [x] Certification CRUD operations (7 endpoints)
- [x] Visitor tracking and analytics (10 endpoints)
- [x] Data models and validation schemas (14 schemas)
- [x] Error handling patterns and HTTP status codes
- [x] Code generation guides (TypeScript, Python, Go clients)
- [x] Mock server and testing documentation

**Authentication & User Management**:
- [x] Amazon Cognito User Pool setup with Ansible playbook
- [x] Custom password policy (12+ chars, mixed case, numbers, symbols)
- [x] Custom user attributes (role attribute for authorization)
- [x] Email verification and account recovery configuration
- [x] Owner account creation with secure temporary password
- [x] JWT token configuration (ID: 1h, Access: 1h, Refresh: 30d)
- [x] Multiple authentication flows (USER_PASSWORD_AUTH, USER_SRP_AUTH, ADMIN_USER_PASSWORD_AUTH)
- [x] Token revocation support
- [x] User Pool App Client with security best practices
- [x] Cognito domain for hosted UI (optional)
- [x] Configuration export (env variables and JSON formats)
- [x] Cognito management scripts (show config, change password, user management)
- [x] Password change script with validation
- [x] User Pool management tools (create, delete, update, disable users)
- [x] AWS profile integration for all Cognito scripts

**Backend API Implementation**:
- [x] FastAPI application setup with Python 3.12 and uv package manager
- [x] DynamoDB single-table design with repositories pattern
- [x] Repository implementations for all content types (blog, projects, certifications, visitors, analytics)
- [x] API endpoints integrated with repositories (34 endpoints across 6 modules)
- [x] JWT authentication with Cognito integration
- [x] Role-based authorization (owner vs public access)
- [x] Pydantic data models with validation (HttpUrl serialization fixes)
- [x] Error handling and HTTP status codes
- [x] CORS middleware configuration
- [x] Comprehensive unit tests (211 tests, 100% passing)
- [x] UTC timezone handling for consistent test behavior
- [x] Test fixtures and mocking infrastructure
- [x] Dependency injection for testability
- [x] Local development environment setup
- [x] Local testing documentation (backend/docs/LOCAL_TESTING.md)
- [x] Docker Compose for local DynamoDB
- [x] Environment configuration management
- [x] E2E testing framework (133+ tests against deployed APIs)
- [x] Automatic test data cleanup (development environment)
- [x] Makefile automation for E2E tests
- [x] Environment-specific E2E testing (production/development)
- [x] OpenAPI endpoint security (disabled in production)

**Backend Infrastructure & Deployment**:
- [x] AWS SAM (Serverless Application Model) template creation
- [x] DynamoDB table CloudFormation template with single-table design
- [x] Lambda function packaging and deployment with Python 3.12
- [x] Mangum ASGI adapter for FastAPI on Lambda
- [x] API Gateway REST API with Lambda proxy integration
- [x] API Gateway Cognito JWT Authorizer configuration
- [x] Lambda environment variables configuration (table name, Cognito, CORS)
- [x] Lambda IAM roles and permissions (DynamoDB, CloudWatch, Cognito)
- [x] CloudWatch logs for Lambda functions and API Gateway
- [x] API Gateway account settings for CloudWatch Logs
- [x] API Gateway stage and deployment (production)
- [x] Custom domain for API Gateway (api.patrickcmd.dev)
- [x] Wildcard SSL certificate consolidation (*.patrickcmd.dev)
- [x] Route53 DNS configuration for custom domain
- [x] CORS configuration for frontend origins
- [x] Ansible playbook for SAM build and deployment automation
- [x] Backend setup script for interactive configuration
- [x] Backend deployment scripts (production and development)
- [x] API testing CLI helper script (aws/bin/test-api)
- [x] Comprehensive API testing documentation (backend/docs/TESTING_API.md)
- [x] Backend documentation organization and index (backend/docs/README.md)
- [x] SAM build and deployment process documentation (aws/BUILD_AND_DEPLOY_PROCESS.md)
- [x] Production API deployed and fully tested (api.patrickcmd.dev)
- [x] Development API deployed for testing (api-dev.patrickcmd.dev)

**Recent Improvements & Fixes**:
- [x] Fixed Pydantic HttpUrl serialization issues with boto3 DynamoDB
- [x] Implemented automatic E2E test data cleanup for development environment
- [x] Fixed timezone-dependent unit test failures (UTC standardization)
- [x] Added Makefile targets for simplified E2E test execution
- [x] Disabled OpenAPI documentation endpoints in production for security
- [x] Documented all fixes in backend/docs/PYDANTIC_HTTPURL_FIX.md
- [x] Organized documentation in backend/docs/ folder
- [x] Updated .env.example with comprehensive E2E test configuration

**Frontend-Backend Integration**:
- [x] Frontend authentication integration with AWS Cognito
- [x] Axios API client with JWT token management
  - Automatic token injection in Authorization headers
  - Automatic token refresh on 401 errors
  - Request/response interceptors for error handling
- [x] Auth service layer (real API + mock for development)
- [x] React AuthContext for authentication state management
- [x] Environment configuration for API endpoints
- [x] Frontend integration tests (141 tests, 100% passing)
  - Authentication: 26 tests (authService + AuthContext)
  - Blog Service: 28 tests (blogService API integration)
  - Blog Hooks: 16 tests (React Query hooks with cache management)
  - Project Service: 21 tests (projectService API integration)
  - Project Hooks: 16 tests (React Query hooks with cache management)
  - Certification Service: 23 tests (certificationService API integration)
  - Certification Hooks: 17 tests (React Query hooks with cache management)
  - Total: 141 integration tests
- [x] Blog frontend-backend integration (Phase 2 complete)
  - Type-safe blog service with Axios HTTP client
  - React Query hooks for data fetching, caching, and mutations
  - Separate queries for published and draft posts
  - CRUD operations (create, read, update, delete)
  - Publish/unpublish workflow for draft management
  - Dynamic blog count in tab navigation
  - Status normalization (backend UPPERCASE → frontend lowercase)
  - Owner-only access controls for admin features
- [x] Projects API integration (Phase 3 complete)
  - Type-safe project service matching backend schema (name, company, longDescription)
  - React Query hooks for data fetching, caching, and mutations
  - Separate queries for published and draft projects
  - CRUD operations with full test coverage (37 tests)
  - Publish/unpublish workflow for draft management
  - Featured project filtering support
  - Dynamic project count in tab navigation
  - Status normalization (backend UPPERCASE → frontend lowercase)
- [x] Certifications API integration (Phase 4 complete)
  - Type-safe certification service matching backend schema (name, issuer, type, dateEarned, expiry_date)
  - React Query hooks for data fetching, caching, and mutations
  - Separate queries for published and draft certifications
  - CRUD operations with full test coverage (40 tests)
  - Publish/unpublish workflow for draft management
  - Type filtering support (certification vs course)
  - Dynamic certification count in tab navigation
  - Status normalization (backend UPPERCASE → frontend lowercase)
  - Expiry date field support (no description field per backend schema)
- [x] Vitest + Testing Library test infrastructure
- [x] Test utilities, fixtures, and mock helpers
- [x] Comprehensive testing documentation (docs/TESTING.md)
- [x] Makefile test automation (test, test-run, test-ui, test-coverage)
- [x] Fixed CORS configuration issues (API Gateway wildcard for development)
- [x] Removed API versioning (/v1) from frontend to match backend implementation

### 🚧 In Progress / Planned

**DevOps**:
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Automated testing
- [ ] Application monitoring and logging with CloudWatch
- [ ] Infrastructure testing and validation

**Documentation**:
- [ ] Architecture diagram
- [ ] Cost analysis
- [ ] Performance optimization guide

## Technologies Used

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn-ui** - Re-usable component library
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching

### Backend
- **FastAPI** - Modern Python web framework for APIs
- **Python 3.12** - Programming language
- **uv** - Fast Python package installer and resolver
- **Pydantic** - Data validation using Python type hints
- **boto3** - AWS SDK for Python
- **pytest** - Testing framework with 211 unit tests
- **Mangum** - AWS Lambda adapter for ASGI applications

### Infrastructure as Code
- **AWS SAM (Serverless Application Model)** - Serverless infrastructure framework
- **AWS CloudFormation** - Infrastructure definition
- **Ansible** - Deployment automation
- **Ansible Vault** - Secure credential management
- **Python** - Ansible runtime
- **Bash** - Deployment scripts

### AWS Services (Current)
- **S3** - Private bucket for static content storage with encryption and versioning
- **CloudFront** - Global CDN with HTTPS, HTTP/2, HTTP/3, compression
- **CloudFront Functions** - Lightweight edge functions for www redirect
- **ACM (Certificate Manager)** - Free SSL/TLS certificates
- **CloudFormation** - Infrastructure as Code stack management
- **IAM** - Access control and service principals
- **Origin Access Control (OAC)** - Secure S3-CloudFront integration
- **Route 53** - DNS and domain management (A records to CloudFront)
- **CloudWatch** - Billing alarms and cost monitoring
- **SNS (Simple Notification Service)** - Email notifications for billing alerts
- **AWS Budgets** - Monthly budget tracking and threshold alerts
- **Cognito** - User authentication and authorization with JWT tokens
  - User Pool with custom password policies
  - App Client with multiple auth flows
  - Custom user attributes for role-based access
  - Token management (ID, Access, Refresh tokens)
  - Email verification and account recovery
- **DynamoDB** - NoSQL database for application data (single-table design)
  - Visitor tracking and analytics
  - Blog posts, projects, certifications content
  - View counts and page analytics
  - GSI for efficient querying
- **Lambda** - Serverless FastAPI backend (Python 3.12 with Mangum adapter)
  - Production function: production-portfolio-api
  - Environment variables for configuration
  - IAM execution role with DynamoDB and CloudWatch access
- **API Gateway** - RESTful API with custom domain (api.patrickcmd.dev)
  - Cognito JWT Authorizer integration
  - CORS configuration for frontend origins
  - CloudWatch logging enabled
  - 34 endpoints across 6 modules

### DevOps & Automation
- **Ansible** 9.13.0 - Configuration management
- **boto3** - AWS SDK for Python
- **community.aws** - Extended Ansible AWS modules
- **Git** - Version control
- **GitHub Actions** (planned) - CI/CD pipelines
- **Make** - Build automation
- **npm** - Package management

### Development Tools
- **Lovable.dev** - AI-powered frontend development
- **VS Code** - IDE
- **AWS CLI** - Command-line AWS interface
- **ansible-galaxy** - Ansible collection management

## Getting Started

### Prerequisites

- **Python 3.8+** - For Ansible
- **Node.js 16+** - For React/Vite frontend
- **AWS Account** - With appropriate permissions
- **AWS CLI** - Configured with a profile

### Quick Start Guide

#### 1. Clone the Repository

```bash
git clone https://github.com/PatrickCmd/cloud-resume-challenge.git
cd cloud-resume-challenge
```

#### 2. Frontend Development (Optional)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Visit http://localhost:5173
```

See [frontend/README.md](frontend/README.md) for detailed frontend setup.

#### 3. Backend Development (Optional)

```bash
# Navigate to backend
cd backend

# Install dependencies using uv
uv sync

# Configure environment variables
cp .env.example .env
nano .env  # Update with your AWS credentials and configuration

# Option A: Run with AWS DynamoDB
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8080

# Option B: Run with local DynamoDB (DynamoDB Local uses port 8000)
docker-compose up -d  # Start local DynamoDB on port 8000
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8080

# Visit http://localhost:8080/docs for interactive API documentation

# Run tests
uv run pytest tests/unit/ -v
```

See [backend/docs/LOCAL_TESTING.md](backend/docs/LOCAL_TESTING.md) for detailed backend setup and testing guide.

#### 4. Infrastructure Setup

```bash
# Navigate to playbooks
cd aws/playbooks

# Run automated setup
./setup.sh

# This installs:
# - Ansible and Python dependencies
# - AWS SDK (boto3, botocore)
# - Ansible collections (amazon.aws, community.aws)
```

#### 5. Configure Deployment

```bash
# Create vault password file
echo "your-strong-password" > ~/.vault_pass.txt
chmod 600 ~/.vault_pass.txt

# Copy and edit configuration
cp vaults/config.example.yml vaults/config.yml
nano vaults/config.yml  # Update bucket name and AWS profile

# Encrypt vault
ansible-vault encrypt vaults/config.yml --vault-password-file ~/.vault_pass.txt
```

#### 6. Deploy to AWS

```bash
# Deploy S3 bucket infrastructure
cd ../..  # Back to project root
./aws/bin/frontend-deploy --verbose

# Build and upload frontend
./aws/bin/s3-upload --verbose

# Get website URL
./aws/bin/stack-manager outputs
```

#### 7. Access Your Website

```bash
# The S3 website URL will be displayed in the outputs
# Example: http://patrickcmd.dev.s3-website-us-east-1.amazonaws.com

# Or access via HTTPS (REST API endpoint)
# https://s3.us-east-1.amazonaws.com/patrickcmd.dev/index.html
```

### Making Updates

After making changes to your frontend code:

```bash
# Rebuild and redeploy
./aws/bin/s3-upload --verbose

# Or do it in steps
./aws/bin/s3-upload --build    # Build only
./aws/bin/s3-upload --upload   # Upload only
```

## Deployment

Complete deployment documentation is available in:

- **[Quick Start Guide](aws/playbooks/QUICKSTART.md)** - Get started in 5 minutes
- **[Ansible Playbooks README](aws/playbooks/README.md)** - Comprehensive guide
- **[Deployment Scripts README](aws/bin/README.md)** - Script usage and examples

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Developer Machine                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Run: ./aws/bin/frontend-deploy               │  │
│  │     → Deploys CloudFormation template            │  │
│  │     → Creates S3 bucket with website config      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  2. Run: ./aws/bin/s3-upload                     │  │
│  │     → Builds React app (npm run build)           │  │
│  │     → Uploads to S3 with sync                    │  │
│  │     → Sets cache headers                         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌────────────────────────────────┐
        │  AWS CloudFormation            │
        │  ┌──────────────────────────┐  │
        │  │  S3 Bucket               │  │
        │  │  - Website hosting       │  │
        │  │  - Encryption (AES256)   │  │
        │  │  - Versioning enabled    │  │
        │  │  - SSL/TLS enforcement   │  │
        │  └──────────────────────────┘  │
        └────────────────────────────────┘
                          │
                          ▼
        ┌────────────────────────────────┐
        │  Website URL (S3 REST API)     │
        │  https://s3.us-east-1.         │
        │  amazonaws.com/patrickcmd.dev/ │
        └────────────────────────────────┘
```

**Next Steps** (CloudFront + Route 53):
```
CloudFront (HTTPS) → S3 Bucket → patrickcmd.dev
```

## Testing

Comprehensive test coverage across both frontend and backend with unit, integration, and E2E tests:

### Test Summary

| Component | Test Type | Count | Coverage | Environment |
|-----------|-----------|-------|----------|-------------|
| **Backend** | Unit Tests | 211 | All endpoints, repositories, utilities | Local (mocked AWS) |
| **Backend** | E2E Tests | 133+ | Complete API flows | Deployed (real AWS) |
| **Frontend** | Integration Tests | 141 | Auth + Blog + Project + Certification services & hooks | Local (mocked API) |
| **Total** | | **485+** | **100% passing** | Mixed |

### Running Tests

**Backend Unit Tests** (fast, local, no AWS required):
```bash
cd backend
make test          # Run all unit tests
make coverage      # Run with coverage report
```

**Backend E2E Tests** (against deployed APIs):
```bash
cd backend
make e2e-dev       # Development environment
make e2e-prod      # Production environment (use cautiously)
make e2e-auth      # Authentication tests only
make e2e-blogs     # Blog endpoints only
make e2e-projects  # Project endpoints only
make e2e-certs     # Certification endpoints only
```

**Frontend Integration Tests** (fast, local, mocked API):
```bash
cd frontend
make test          # Run in watch mode
make test-run      # Run once (CI/CD)
make test-ui       # Visual UI
make test-coverage # Generate coverage report
```

### Backend E2E Test Features

- ✅ **Automatic cleanup**: Deletes test data after completion (development only)
- ✅ **Environment isolation**: Separate configs for production/development
- ✅ **Real AWS services**: Tests against actual Lambda, DynamoDB, Cognito
- ✅ **Session tracking**: Tracks created items for selective cleanup
- ✅ **Safety first**: Cleanup only in development to protect production data

See [backend/tests/e2e_deployed/README.md](backend/tests/e2e_deployed/README.md) for detailed E2E testing documentation.

### Frontend Integration Test Features

- ✅ **Vitest**: Fast unit test framework with native ESM support
- ✅ **Testing Library**: React component testing with user-event simulation
- ✅ **Mocked API**: Tests authentication flow without backend dependency
- ✅ **Test utilities**: Custom render, mock JWT creation, auth state helpers
- ✅ **Coverage reporting**: HTML and JSON coverage reports
- ✅ **Visual UI**: Browser-based test interface with Vitest UI

See [frontend/docs/TESTING.md](frontend/docs/TESTING.md) for detailed frontend testing documentation (600+ lines).

---

## API Documentation Quick Start

The complete API specification is available in OpenAPI 3.0.3 format. Here's how to use it:

### View Interactive Documentation

```bash
# Install Redoc CLI
npm install -g @redocly/cli

# Serve interactive API docs
redocly preview-docs openapi.yml

# Access at: http://localhost:8080
```

### Generate API Client

```bash
# Install OpenAPI Generator
npm install @openapitools/openapi-generator-cli -g

# Generate TypeScript client
openapi-generator-cli generate \
  -i openapi.yml \
  -g typescript-fetch \
  -o generated/typescript-client

# Generate Python FastAPI server
openapi-generator-cli generate \
  -i openapi.yml \
  -g python-fastapi \
  -o generated/python-server
```

### Start Mock API Server

```bash
# Install Prism
npm install -g @stoplight/prism-cli

# Start mock server (for frontend development)
prism mock openapi.yml

# Mock server runs at: http://localhost:4010
```

### API Overview

- **34 RESTful endpoints** across 6 categories
- **JWT authentication** for protected routes
- **CRUD operations** for blog posts, projects, certifications
- **Analytics & tracking** for visitors and content views
- **Complete documentation** in [API.md](API.md)

See [API.md](API.md) for complete documentation with examples, error handling, and best practices.

## License

This project is open source and available under the MIT License.

## Contact

Patrick Walukagga
- GitHub: [@PatrickCmd](https://github.com/PatrickCmd)
- Portfolio: https://patrickcmd.dev
- LinkedIn: [Patrick Walukagga](https://www.linkedin.com/in/patrick-walukagga/)

## Acknowledgments

- [Cloud Resume Challenge](https://exampro.co/) by ExamPro
- [Lovable.dev](https://lovable.dev) for frontend development platform