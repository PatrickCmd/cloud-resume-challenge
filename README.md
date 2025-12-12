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

#### 3. Deployment Scripts

**Frontend Deployment** ([aws/bin/frontend-deploy](aws/bin/frontend-deploy)):
```bash
# User-friendly wrapper for Ansible deployment
./aws/bin/frontend-deploy --verbose

# Features:
- Automatic prerequisite checking
- Color-coded output
- Multiple deployment modes
- Variable overrides
- Comprehensive error messages
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

### Deployment Workflow

1. **Configure Ansible Vault**:
   ```bash
   # Create encrypted configuration
   cd aws/playbooks
   cp vaults/config.example.yml vaults/config.yml
   # Edit with your values
   ansible-vault encrypt vaults/config.yml
   ```

2. **Deploy Infrastructure**:
   ```bash
   # Simple deployment
   ./aws/bin/frontend-deploy

   # With custom parameters
   ./aws/bin/frontend-deploy --env prod --verbose
   ```

3. **Monitor Deployment**:
   ```bash
   # Check status
   ./aws/bin/stack-manager status

   # View outputs
   ./aws/bin/stack-manager outputs
   ```

4. **Troubleshoot if needed**:
   ```bash
   # Show failures
   ./aws/bin/stack-manager failures

   # View events
   ./aws/bin/stack-manager events --limit 30
   ```

### Security Best Practices

- ✅ **Ansible Vault**: All sensitive configuration encrypted
- ✅ **SSL/TLS Enforcement**: Denies non-HTTPS requests
- ✅ **Server-Side Encryption**: AES256 for data at rest
- ✅ **Versioning**: Enabled for rollback capability
- ✅ **Least Privilege**: Public policy only allows read access
- ✅ **Infrastructure as Code**: All changes tracked in version control

### Documentation

Comprehensive documentation is available for:

- **[AWS Infrastructure](aws/README.md)** - CloudFormation templates and deployment
- **[Ansible Playbooks](aws/playbooks/README.md)** - Complete Ansible guide
- **[Ansible Vault](aws/playbooks/vaults/README.md)** - Secure configuration management
- **[CloudFormation Config](aws/playbooks/CLOUDFORMATION_CONFIG.md)** - Deep dive on capabilities
- **[Deployment Scripts](aws/bin/README.md)** - Script usage and examples
- **[Quick Start](aws/playbooks/QUICKSTART.md)** - 5-minute setup guide

## Project Structure

```
cloud-resume-challenge/
├── frontend/                      # React portfolio website
│   ├── src/
│   ├── public/
│   ├── Makefile                   # Build automation
│   └── README.md
├── aws/                           # AWS Infrastructure
│   ├── frontend.yaml              # CloudFormation template
│   ├── playbooks/                 # Ansible playbooks
│   │   ├── frontend-deploy.yml    # Deployment playbook
│   │   ├── vaults/                # Encrypted configuration
│   │   │   ├── config.yml         # Vault (encrypted)
│   │   │   └── README.md          # Vault documentation
│   │   ├── ansible.cfg            # Ansible configuration
│   │   ├── README.md              # Playbook documentation
│   │   ├── QUICKSTART.md          # Quick setup guide
│   │   └── CLOUDFORMATION_CONFIG.md
│   ├── bin/                       # Deployment scripts
│   │   ├── frontend-deploy        # Deployment wrapper
│   │   ├── stack-manager          # Stack management tool
│   │   └── README.md
│   ├── outputs/                   # Stack outputs
│   └── README.md                  # AWS infrastructure docs
├── backend/                       # AWS Lambda functions (coming soon)
└── .github/                       # CI/CD workflows (coming soon)
```

## Implementation Progress

- [x] Frontend development (React, TypeScript, Tailwind CSS)
- [x] CloudFormation template for S3 static website hosting
- [x] Ansible playbook for automated deployment
- [x] Ansible Vault for secure configuration management
- [x] Deployment automation scripts
- [x] Stack management and troubleshooting tools
- [ ] Upload frontend build to S3
- [ ] CloudFront distribution setup
- [ ] Custom domain with Route 53
- [ ] SSL/TLS certificate with ACM
- [ ] DynamoDB visitor counter
- [ ] Lambda function for visitor count API
- [ ] API Gateway integration
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Monitoring and logging with CloudWatch
- [ ] Testing and validation

## Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn-ui
- React Router
- TanStack Query

### Backend (Planned)
- AWS Lambda (Python/Node.js)
- API Gateway
- DynamoDB
- CloudWatch

### Infrastructure (Planned)
- AWS S3
- CloudFront
- Route 53
- ACM (Certificate Manager)
- Terraform or CloudFormation

### DevOps (Planned)
- GitHub Actions
- AWS CLI
- Infrastructure as Code

## Getting Started

### Frontend Setup

See the detailed instructions in [frontend/README.md](frontend/README.md).

Quick start:
```bash
cd frontend
npm install
npm run dev
```

## Deployment

Deployment instructions will be added as infrastructure components are implemented.

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