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

S3 bucket configuration for static website hosting with:
- **Static Website Hosting**: Configured for SPA routing
- **Public Access**: Bucket policy for website content
- **Security**: AES256 encryption, versioning enabled, SSL/TLS enforcement
- **CloudFormation Capabilities**: CAPABILITY_NAMED_IAM, CAPABILITY_AUTO_EXPAND
- **Failure Handling**: Automatic rollback on creation failure

```yaml
# Key Features:
- WebsiteConfiguration with index.html and error.html
- BucketEncryption with AES256
- VersioningConfiguration enabled
- PublicAccessBlockConfiguration for website hosting
- Bucket policy with SSL/TLS enforcement
```

**Reference**: [AWS S3 Bucket CloudFormation Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-s3-bucket.html)

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

#### 4. Deployment Scripts

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

**Stack Management** ([aws/bin/stack-manager](aws/bin/stack-manager)):
```bash
# CloudFormation stack troubleshooting tool
./aws/bin/stack-manager events    # View stack events
./aws/bin/stack-manager failures  # Show only failures
./aws/bin/stack-manager status    # Check stack status
./aws/bin/stack-manager delete    # Clean up stack

# Perfect for debugging failed deployments
```

#### 5. Reproducibility & Setup

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

2. **Configure Ansible Vault**:
   ```bash
   # Create vault password file
   echo "your-strong-password" > ~/.vault_pass.txt
   chmod 600 ~/.vault_pass.txt

   # Copy and edit configuration
   cp vaults/config.example.yml vaults/config.yml
   nano vaults/config.yml  # Update with your values

   # Encrypt the vault
   ansible-vault encrypt vaults/config.yml --vault-password-file ~/.vault_pass.txt
   ```

#### Deploying Infrastructure

3. **Deploy S3 Bucket**:
   ```bash
   # Deploy infrastructure (creates S3 bucket)
   ./aws/bin/frontend-deploy --verbose

   # Verify deployment
   ./aws/bin/stack-manager status
   ./aws/bin/stack-manager outputs
   ```

#### Deploying Frontend

4. **Build and Upload Frontend**:
   ```bash
   # Build React app and upload to S3
   ./aws/bin/s3-upload --verbose

   # Or do it in steps:
   ./aws/bin/s3-upload --build    # Build only
   ./aws/bin/s3-upload --upload   # Upload only
   ```

#### Monitoring and Troubleshooting

5. **Monitor Deployment**:
   ```bash
   # Check CloudFormation stack status
   ./aws/bin/stack-manager status

   # View stack outputs (S3 website URL)
   ./aws/bin/stack-manager outputs

   # Verify files uploaded to S3
   aws s3 ls s3://patrickcmd.dev/ --profile patrickcmd
   ```

6. **Troubleshoot if needed**:
   ```bash
   # Show only failures
   ./aws/bin/stack-manager failures

   # View recent events
   ./aws/bin/stack-manager events --limit 30

   # Very verbose deployment for debugging
   ./aws/bin/frontend-deploy -vvv
   ./aws/bin/s3-upload -vvv
   ```

#### Quick Update Workflow

After making frontend code changes:
```bash
# Rebuild and redeploy
./aws/bin/s3-upload --verbose

# Test at S3 website URL
# (Get URL from: ./aws/bin/stack-manager outputs)
```

### Security Best Practices

- ✅ **Ansible Vault**: All sensitive configuration encrypted
- ✅ **SSL/TLS Enforcement**: Denies non-HTTPS requests
- ✅ **Server-Side Encryption**: AES256 for data at rest
- ✅ **Versioning**: Enabled for rollback capability
- ✅ **Least Privilege**: Public policy only allows read access
- ✅ **Infrastructure as Code**: All changes tracked in version control

### Documentation

Comprehensive documentation is available for all components:

**Infrastructure & Deployment**:
- **[AWS Infrastructure](aws/README.md)** - CloudFormation templates and deployment overview
- **[Ansible Playbooks](aws/playbooks/README.md)** - Complete Ansible guide (1200+ lines)
- **[Quick Start](aws/playbooks/QUICKSTART.md)** - 5-minute setup guide
- **[Setup Script](aws/playbooks/setup.sh)** - Automated dependency installation

**Security & Configuration**:
- **[Ansible Vault](aws/playbooks/vaults/README.md)** - Secure configuration management (500+ lines)
- **[CloudFormation Config](aws/playbooks/CLOUDFORMATION_CONFIG.md)** - Capabilities & failure handling (400+ lines)

**Scripts & Tools**:
- **[Deployment Scripts](aws/bin/README.md)** - Script usage and examples
  - frontend-deploy - Infrastructure deployment
  - s3-upload - Build and upload frontend
  - stack-manager - Stack troubleshooting

**Troubleshooting**:
- **[Debugging Guide](aws/playbooks/README.md#troubleshooting)** - 15 documented issues with solutions
  - Ansible configuration issues
  - CloudFormation errors
  - S3 sync problems
  - HTTP vs HTTPS access
  - Complete debugging workflow

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
│   ├── frontend.yaml                  # CloudFormation S3 template
│   │
│   ├── playbooks/                     # Ansible automation
│   │   ├── frontend-deploy.yml        # Infrastructure deployment
│   │   ├── s3-upload.yml              # Build & upload frontend
│   │   ├── requirements.txt           # Python dependencies
│   │   ├── requirements.yml           # Ansible collections
│   │   ├── setup.sh                   # Automated setup script
│   │   ├── ansible.cfg                # Ansible configuration
│   │   ├── README.md                  # Complete playbooks guide (1200+ lines)
│   │   ├── QUICKSTART.md              # 5-minute setup guide
│   │   ├── CLOUDFORMATION_CONFIG.md   # CFN deep dive (400+ lines)
│   │   └── vaults/                    # Encrypted configuration
│   │       ├── config.yml             # Encrypted vault
│   │       ├── config.example.yml     # Example configuration
│   │       └── README.md              # Vault guide (500+ lines)
│   │
│   ├── bin/                           # Deployment scripts
│   │   ├── frontend-deploy            # Deploy S3 infrastructure
│   │   ├── s3-upload                  # Build & upload frontend
│   │   ├── stack-manager              # Stack troubleshooting
│   │   └── README.md                  # Scripts documentation
│   │
│   ├── outputs/                       # CloudFormation outputs
│   │   └── frontend-stack-outputs.env # Stack outputs (generated)
│   │
│   └── README.md                      # AWS infrastructure overview
│
├── backend/                           # AWS Lambda functions (planned)
├── .github/                           # CI/CD workflows (planned)
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
- [x] CloudFormation template for S3 static website hosting
- [x] S3 bucket with encryption, versioning, SSL/TLS enforcement
- [x] Ansible playbook for infrastructure deployment
- [x] Ansible playbook for frontend build & upload
- [x] Ansible Vault for secure configuration management

**Automation & Tooling**:
- [x] Deployment automation scripts (frontend-deploy, s3-upload, stack-manager)
- [x] Stack management and troubleshooting tools
- [x] Automated setup script with dependency management
- [x] Requirements files for reproducibility (requirements.txt, requirements.yml)
- [x] Comprehensive documentation (2000+ lines across 7 files)

**Deployment**:
- [x] Upload frontend build to S3
- [x] Proper cache control headers (1 year for assets, no-cache for HTML)
- [x] MIME type configuration
- [x] Clean sync functionality

### 🚧 In Progress / Planned

**CDN & Domain**:
- [ ] CloudFront distribution setup
- [ ] Custom domain with Route 53 (patrickcmd.dev)
- [ ] SSL/TLS certificate with ACM

**Backend & Database**:
- [ ] DynamoDB visitor counter table
- [ ] Lambda function for visitor count API
- [ ] API Gateway integration
- [ ] CORS configuration

**DevOps**:
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Automated testing
- [ ] Monitoring and logging with CloudWatch
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

### Infrastructure as Code
- **AWS CloudFormation** - Infrastructure definition
- **Ansible** - Deployment automation
- **Ansible Vault** - Secure credential management
- **Python** - Ansible runtime
- **Bash** - Deployment scripts

### AWS Services (Current)
- **S3** - Static website hosting with encryption and versioning
- **CloudFormation** - Stack management
- **IAM** - Access control

### AWS Services (Planned)
- **CloudFront** - CDN and HTTPS
- **Route 53** - DNS and domain management
- **ACM** - SSL/TLS certificates
- **Lambda** - Serverless functions
- **API Gateway** - API management
- **DynamoDB** - NoSQL database
- **CloudWatch** - Monitoring and logging

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

#### 3. Infrastructure Setup

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

#### 4. Configure Deployment

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

#### 5. Deploy to AWS

```bash
# Deploy S3 bucket infrastructure
cd ../..  # Back to project root
./aws/bin/frontend-deploy --verbose

# Build and upload frontend
./aws/bin/s3-upload --verbose

# Get website URL
./aws/bin/stack-manager outputs
```

#### 6. Access Your Website

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

## License

This project is open source and available under the MIT License.

## Contact

Patrick Walukagga
- GitHub: [@PatrickCmd](https://github.com/PatrickCmd)
- Portfolio: https://patrick-persona-page.lovable.app/
- LinkedIn: [Patrick Walukagga](https://www.linkedin.com/in/patrick-walukagga/)

## Acknowledgments

- [Cloud Resume Challenge](https://exampro.co/) by ExamPro
- [Lovable.dev](https://lovable.dev) for frontend development platform