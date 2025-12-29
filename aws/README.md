# AWS Infrastructure

This directory contains the AWS infrastructure as code (IaC) for the Cloud Resume Challenge, built using AWS CloudFormation.

## Overview

The infrastructure is organized into modular CloudFormation templates for different components:

- **frontend.yaml** - S3 bucket with static website hosting for the portfolio frontend

## Frontend Infrastructure (S3 Static Website Hosting)

### Architecture

The frontend is hosted on AWS S3 with static website hosting enabled. This provides a simple, cost-effective, and scalable solution for serving static web content.

### CloudFormation Template: `frontend.yaml`

**Reference Documentation**: [AWS::S3::Bucket - CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-s3-bucket.html)

#### Description

Creates an S3 bucket configured for static website hosting with the following features:

- **Static Website Hosting** - Configured with index and error documents
- **Public Read Access** - Allows public access to website content via bucket policy
- **Server-Side Encryption** - AES256 encryption for data at rest
- **Versioning** - Enabled for content rollback and version control
- **SSL/TLS Enforcement** - Denies insecure (non-HTTPS) requests
- **Resource Tagging** - Organized with environment and project tags

#### Parameters

The template accepts the following parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `BucketName` | String | `patrick-portfolio-website` | Globally unique S3 bucket name (lowercase, alphanumeric with hyphens) |
| `IndexDocument` | String | `index.html` | The index document for the website |
| `ErrorDocument` | String | `index.html` | The error document for the website (set to index.html for SPA routing) |
| `Environment` | String | `prod` | Environment name (dev, staging, prod) |

#### Resources Created

1. **WebsiteBucket** (`AWS::S3::Bucket`)
   - S3 bucket with static website hosting configuration
   - Public access enabled (required for website hosting)
   - Versioning enabled for content management
   - AES256 server-side encryption
   - Tagged with environment and project metadata

2. **WebsiteBucketPolicy** (`AWS::S3::BucketPolicy`)
   - Allows public read access (`s3:GetObject`) to bucket contents
   - Enforces SSL/TLS by denying non-secure transport

#### Outputs

The stack exports the following values:

| Output | Description | Export Name |
|--------|-------------|-------------|
| `BucketName` | Name of the S3 bucket | `${StackName}-BucketName` |
| `BucketArn` | ARN of the S3 bucket | `${StackName}-BucketArn` |
| `WebsiteURL` | S3 website endpoint URL | `${StackName}-WebsiteURL` |
| `BucketDomainName` | S3 bucket domain name | `${StackName}-BucketDomainName` |

### Deployment Instructions

We use Ansible for infrastructure deployment automation. Ansible provides a simple, agentless way to deploy CloudFormation templates with better workflow management and reusability.

#### Prerequisites

- Python 3.8 or higher
- Ansible installed
- AWS CLI installed and configured with a profile
- AWS account with appropriate permissions to create S3 buckets
- Unique bucket name (S3 bucket names are globally unique)
- Boto3 and botocore Python packages

**For detailed setup instructions**, see [playbooks/README.md](playbooks/README.md) which covers:
- Ansible installation (pip, brew, apt, dnf)
- AWS CLI configuration with profiles
- Ansible AWS collection setup
- AWS credentials configuration

#### Recommended Deployment with Ansible

**Option 1: Using Deployment Script (Easiest)**

We provide a convenient bash script wrapper that handles all the complexity:

```bash
# Basic deployment
./bin/frontend-deploy

# Deploy with verbose output
./bin/frontend-deploy --verbose

# Only validate template
./bin/frontend-deploy --validate

# Deploy to different environment
./bin/frontend-deploy --env staging --bucket my-staging-bucket
```

The script provides:
- ✅ Automatic prerequisite checking
- ✅ Color-coded output
- ✅ Helpful error messages
- ✅ Multiple deployment modes

**For script documentation**, see [bin/README.md](bin/README.md)

**Option 2: Direct Ansible Commands**

**Quick Setup**:

1. **Install Ansible and dependencies**:
   ```bash
   # Install Ansible
   pip install ansible

   # Install AWS Python SDK
   pip install boto3 botocore

   # Install Ansible AWS collection
   ansible-galaxy collection install amazon.aws
   ```

2. **Configure AWS profile**:
   ```bash
   # Configure AWS credentials with default profile
   aws configure --profile default
   # Enter: Access Key, Secret Key, Region (us-east-1), Output format (json)

   # Verify configuration
   aws sts get-caller-identity --profile default
   ```

3. **Deploy the stack**:
   ```bash
   # Navigate to playbooks directory
   cd playbooks

   # Run the Ansible playbook
   ansible-playbook frontend-deploy.yaml
   ```

4. **Deploy with custom parameters**:
   ```bash
   # Override default values
   ansible-playbook frontend-deploy.yaml \
     -e "bucket_name=my-unique-bucket-name" \
     -e "environment=prod" \
     -e "aws_profile=default"
   ```

5. **Deploy with tags** (run specific tasks):
   ```bash
   # Only validate
   ansible-playbook frontend-deploy.yaml --tags validate

   # Only deploy
   ansible-playbook frontend-deploy.yaml --tags deploy

   # Only show outputs
   ansible-playbook frontend-deploy.yaml --tags info
   ```

**Stack Outputs**: After deployment, outputs are saved to `outputs/frontend-stack-outputs.env`

**For comprehensive Ansible documentation**, see [playbooks/README.md](playbooks/README.md)

#### Alternative: Manual Deployment with AWS CLI

1. **Validate the template**:
   ```bash
   aws cloudformation validate-template \
     --template-body file://frontend.yaml
   ```

2. **Create the stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name portfolio-frontend-stack \
     --template-body file://frontend.yaml \
     --parameters \
       ParameterKey=BucketName,ParameterValue=your-unique-bucket-name \
       ParameterKey=Environment,ParameterValue=prod
   ```

3. **Monitor stack creation**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name portfolio-frontend-stack \
     --query 'Stacks[0].StackStatus'
   ```

4. **Get stack outputs**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name portfolio-frontend-stack \
     --query 'Stacks[0].Outputs'
   ```

#### Update Stack

To update an existing stack:

```bash
aws cloudformation update-stack \
  --stack-name portfolio-frontend-stack \
  --template-body file://frontend.yaml \
  --parameters \
    ParameterKey=BucketName,UsePreviousValue=true \
    ParameterKey=Environment,ParameterValue=prod
```

#### Delete Stack

To delete the stack and all resources:

```bash
# First, empty the S3 bucket (required before deletion)
aws s3 rm s3://your-bucket-name --recursive

# Then delete the stack
aws cloudformation delete-stack \
  --stack-name portfolio-frontend-stack
```

### Security Considerations

#### Public Access Configuration

The bucket is intentionally configured for public read access to serve as a static website. The following security measures are in place:

- **PublicAccessBlockConfiguration**: Set to `false` for website hosting (required)
- **Bucket Policy**: Grants read-only access to objects, not write access
- **SSL/TLS Enforcement**: Denies all non-HTTPS requests
- **Encryption**: AES256 encryption enabled for data at rest

#### Best Practices Implemented

1. **Encryption at Rest** - All objects are encrypted using AES256
2. **Versioning** - Enabled for rollback and audit trail
3. **Secure Transport** - HTTPS required for all operations
4. **Least Privilege** - Public policy only allows `s3:GetObject` (read), not write or delete
5. **Tagging** - Resources tagged for cost allocation and management

### Deployment Status

The following components have been successfully deployed:

✅ **Frontend Infrastructure**
- S3 bucket with static website hosting
- CloudFront distribution with Origin Access Control (OAC)
- Custom domain (patrickcmd.dev) with ACM SSL certificate
- CloudFront Function for www → apex redirect
- Automated deployment via Ansible playbooks

✅ **Backend Infrastructure**
- AWS Lambda functions running FastAPI (Python 3.12)
- API Gateway with custom domains (api.patrickcmd.dev, api-dev.patrickcmd.dev)
- DynamoDB single-table design for all data storage
- Amazon Cognito User Pool with JWT authentication
- API Gateway JWT Authorizer for secure endpoints
- 34 RESTful endpoints across 6 modules
- Development and production environments

✅ **Content Delivery & Performance**
- Global CDN with HTTP/2 and HTTP/3 support
- Automatic Gzip and Brotli compression
- Private S3 bucket with OAC (no public bucket access)
- Edge-optimized API Gateway endpoints

✅ **Authentication & Security**
- Amazon Cognito user management
- JWT token-based authentication
- Email verification and account recovery
- MFA support enabled
- HTTPS enforcement across all services

✅ **Automation & DevOps**
- Infrastructure as Code (CloudFormation + AWS SAM + Ansible)
- 15+ automation scripts for deployment and management
- Ansible Vault for secure credential management
- Automated S3 upload with cache control optimization
- CloudFront cache invalidation with cost optimization

### Completed Infrastructure Components

**Frontend Stack (CloudFormation + Ansible):**
- ✅ S3 bucket configuration
- ✅ CloudFront distribution with OAC
- ✅ Route 53 DNS records
- ✅ ACM SSL certificates (us-east-1 for CloudFront)
- ✅ CloudFront Functions for redirects
- ✅ Automated build and upload scripts

**Backend Stack (AWS SAM):**
- ✅ Lambda functions with FastAPI + Mangum
- ✅ API Gateway with JWT authorizer
- ✅ DynamoDB tables with GSI
- ✅ Cognito User Pool and App Client
- ✅ Custom domain integration
- ✅ CORS configuration
- ✅ Environment-specific deployments (dev/prod)

**Testing & Quality:**
- ✅ 211 backend unit tests
- ✅ 133+ backend E2E tests
- ✅ 198 frontend integration tests
- ✅ Automated test data cleanup

### Upcoming Enhancements

- **CI/CD Pipeline** - GitHub Actions for automated deployments
- **Monitoring & Alarms** - CloudWatch dashboards and alerts
- **Cost Optimization** - AWS Cost Explorer and Budget alerts
- **Performance Metrics** - Enhanced Lambda and API Gateway monitoring

## References

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS S3 Bucket Resource Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-s3-bucket.html)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [Cloud Resume Challenge](https://cloudresumechallenge.dev/docs/the-challenge/aws/)
