# Backend API Deployment Guide

Complete guide for deploying the FastAPI backend to AWS using AWS SAM (Serverless Application Model).

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Initial Setup](#initial-setup)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment](#post-deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Updating the Backend](#updating-the-backend)
10. [Rollback](#rollback)

## Overview

The backend deployment creates a fully serverless API infrastructure on AWS:

- **DynamoDB Table**: Single-table design for all content types
- **Lambda Function**: FastAPI application with Mangum adapter
- **API Gateway**: RESTful API with custom domain
- **Cognito Authorizer**: JWT-based authentication
- **CloudWatch Logs**: Centralized logging for Lambda and API Gateway

**Custom Domain**: `api.patrickcmd.dev`

## Architecture

```
┌─────────────────┐
│  Client/Browser │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ api.patrickcmd.dev      │
│ (Route53 + ACM Cert)    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   API Gateway           │
│   - REST API            │
│   - Cognito Authorizer  │
│   - CORS enabled        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Lambda Function       │
│   - FastAPI + Mangum    │
│   - Python 3.12         │
│   - 512MB Memory        │
│   - 30s Timeout         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   DynamoDB Table        │
│   - Single-table design │
│   - On-Demand billing   │
│   - GSI1 index          │
│   - TTL enabled         │
└─────────────────────────┘
```

## Prerequisites

### Required Tools

1. **AWS SAM CLI** (>= 1.100.0)
   ```bash
   # macOS
   brew install aws-sam-cli

   # Linux
   # See: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

   # Verify
   sam --version
   ```

2. **AWS CLI** (configured with credentials)
   ```bash
   aws configure
   # Verify
   aws sts get-caller-identity
   ```

3. **Ansible** (>= 2.15)
   ```bash
   pip install ansible
   # Verify
   ansible --version
   ```

4. **Python 3.12+** and **uv**
   ```bash
   # Install uv
   curl -LsSf https://astral.sh/uv/install.sh | sh
   # Verify
   uv --version
   python3 --version
   ```

5. **Docker** (for SAM build)
   ```bash
   # SAM uses Docker to build Lambda functions
   docker --version
   ```

### AWS Resources

Before deployment, ensure you have:

1. **Cognito User Pool** and **App Client** (created via `setup-cognito` playbook)
2. **ACM Certificate** for `api.patrickcmd.dev` in **us-east-1** (validated)
3. **Route53 Hosted Zone** for `patrickcmd.dev`
4. **S3 Bucket** for SAM deployment artifacts

## Initial Setup

### 1. Create SAM Deployment Bucket

```bash
# Create bucket for SAM artifacts
aws s3 mb s3://patrickcmd-sam-deployments --region us-east-1

# Enable versioning (recommended)
aws s3api put-bucket-versioning \
  --bucket patrickcmd-sam-deployments \
  --versioning-configuration Status=Enabled

# Add lifecycle policy (optional - delete old versions after 30 days)
cat > /tmp/lifecycle.json << 'EOF'
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket patrickcmd-sam-deployments \
  --lifecycle-configuration file:///tmp/lifecycle.json
```

### 2. Request ACM Certificate

The certificate **must be in us-east-1** for API Gateway:

```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.patrickcmd.dev \
  --validation-method DNS \
  --region us-east-1

# Note the CertificateArn from the output
```

**Validate the certificate:**

1. Get validation CNAME record:
   ```bash
   aws acm describe-certificate \
     --certificate-arn arn:aws:acm:us-east-1:XXXX:certificate/XXXX \
     --region us-east-1 \
     --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
   ```

2. Add the CNAME record to Route53:
   ```bash
   # Use Route53 console or CLI to add the validation record
   ```

3. Wait for validation:
   ```bash
   aws acm wait certificate-validated \
     --certificate-arn arn:aws:acm:us-east-1:XXXX:certificate/XXXX \
     --region us-east-1
   ```

### 3. Configure Vault

Update the encrypted vault with backend configuration:

```bash
cd aws/playbooks

# Decrypt vault
ansible-vault decrypt vaults/config.yml

# Add backend_config section (see BACKEND_VAULT_CONFIG.md)
nano vaults/config.yml

# Re-encrypt vault
ansible-vault encrypt vaults/config.yml
```

**Required variables:**
```yaml
backend_config:
  sam_template_path: "../backend.yaml"
  stack_name: "production-portfolio-backend-api"
  sam_s3_bucket: "patrickcmd-sam-deployments"
  environment: "production"
  cognito_user_pool_id: "us-east-1_XXXXXXXXX"
  cognito_client_id: "xxxxxxxxxxxxxxxxxxxxxxxxxx"
  custom_domain_name: "api.patrickcmd.dev"
  hosted_zone_id: "ZXXXXXXXXXXXXX"
  certificate_arn: "arn:aws:acm:us-east-1:XXXXXXXXXXXX:certificate/XXXX"
  frontend_origins: "https://patrickcmd.dev,https://www.patrickcmd.dev"
```

See [BACKEND_VAULT_CONFIG.md](BACKEND_VAULT_CONFIG.md) for detailed configuration instructions.

## Deployment Steps

### Option 1: Full Deployment (Recommended)

Deploy everything in one command:

```bash
cd /path/to/cloud-resume-challenge

# Deploy with default settings
./aws/bin/backend-sam-deploy
```

This will:
1. Validate SAM template
2. Install Python dependencies with uv
3. Build Lambda function with SAM
4. Deploy CloudFormation stack
5. Create/update all resources
6. Configure custom domain
7. Save outputs to file

### Option 2: Step-by-Step Deployment

For more control, deploy in stages:

#### Step 1: Validate Template

```bash
./aws/bin/backend-sam-deploy --validate
```

This checks the SAM template syntax and validates parameters.

#### Step 2: Build Application

```bash
./aws/bin/backend-sam-deploy --build
```

This:
- Installs Python dependencies
- Builds Lambda deployment package
- Validates application code

#### Step 3: Deploy Stack

```bash
./aws/bin/backend-sam-deploy --deploy
```

This:
- Uploads build artifacts to S3
- Creates/updates CloudFormation stack
- Waits for stack completion
- Displays stack outputs

### Option 3: Dry Run

Preview what will be deployed without making changes:

```bash
./aws/bin/backend-sam-deploy --check
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name production-portfolio-backend-api \
  --query 'Stacks[0].StackStatus'

# Should show: CREATE_COMPLETE or UPDATE_COMPLETE
```

### 2. Test API Endpoints

```bash
# Test health endpoint
curl https://api.patrickcmd.dev/health

# Expected response:
# {"status":"healthy","environment":"production","version":"0.1.0"}

# Test root endpoint
curl https://api.patrickcmd.dev/

# Test authentication (should get 401)
curl https://api.patrickcmd.dev/blogs
```

### 3. View API Documentation

If environment is set to `development`, view interactive docs:

```
https://api.patrickcmd.dev/docs       # Swagger UI
https://api.patrickcmd.dev/redoc      # ReDoc
```

**Note**: In production, these endpoints are disabled for security.

### 4. Review Stack Outputs

Deployment outputs are saved to:
```
aws/outputs/backend-stack-outputs.env
```

View the outputs:
```bash
cat aws/outputs/backend-stack-outputs.env
```

## Monitoring

### CloudWatch Logs

View Lambda function logs:
```bash
# Tail logs in real-time
aws logs tail /aws/lambda/production-portfolio-api --follow

# View recent logs
aws logs tail /aws/lambda/production-portfolio-api --since 1h

# Filter for errors
aws logs tail /aws/lambda/production-portfolio-api \
  --filter-pattern "ERROR" --since 1h
```

View API Gateway logs:
```bash
# Tail API Gateway logs
aws logs tail /aws/apigateway/production-portfolio-api --follow
```

### CloudWatch Metrics

View metrics in AWS Console:
1. Go to CloudWatch → Metrics
2. Select Lambda metrics for function: `production-portfolio-api`
3. Key metrics to monitor:
   - Invocations
   - Duration
   - Errors
   - Throttles
   - ConcurrentExecutions

### DynamoDB Metrics

Monitor DynamoDB table:
```bash
# Get table description
aws dynamodb describe-table \
  --table-name production-portfolio-api-table

# View consumed capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=production-portfolio-api-table \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### X-Ray Tracing

View distributed traces in AWS X-Ray console:
```bash
# Open X-Ray console
https://console.aws.amazon.com/xray/home
```

## Troubleshooting

### Common Issues

#### 1. SAM Build Fails

**Error**: "Unable to find image"

**Solution**: Ensure Docker is running
```bash
docker ps
# If Docker isn't running, start it
```

#### 2. Certificate Not Validated

**Error**: "Certificate ARN is not validated"

**Solution**: Complete DNS validation
```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn YOUR_CERT_ARN \
  --region us-east-1 \
  --query 'Certificate.Status'

# Should be: ISSUED
```

#### 3. Custom Domain Already Exists

**Error**: "DomainName already exists"

**Solution**: Delete existing domain or use different domain
```bash
# List existing API domains
aws apigateway get-domain-names

# Delete if needed
aws apigateway delete-domain-name --domain-name api.patrickcmd.dev
```

#### 4. Lambda Function Times Out

**Error**: Task timed out after 30.00 seconds

**Solution**: Increase timeout in SAM template:
```yaml
Globals:
  Function:
    Timeout: 60  # Increase from 30 to 60 seconds
```

#### 5. DynamoDB Access Denied

**Error**: "AccessDeniedException" in Lambda logs

**Solution**: Check IAM permissions in SAM template
```yaml
Policies:
  - DynamoDBCrudPolicy:
      TableName: !Ref PortfolioTable
```

### Debug Commands

```bash
# View CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name production-portfolio-backend-api \
  --max-items 20

# View Lambda function configuration
aws lambda get-function --function-name production-portfolio-api

# Test Lambda function locally
cd aws
sam local invoke PortfolioApiFunction \
  --event ../backend/tests/events/health-check.json

# View API Gateway configuration
aws apigateway get-rest-apis
```

## Updating the Backend

### Update Application Code

```bash
# Make changes to backend code
cd backend
# ... make changes ...

# Run tests
make test

# Deploy updated code
cd ..
./aws/bin/backend-sam-deploy
```

SAM will:
1. Detect code changes
2. Build new deployment package
3. Update Lambda function
4. Preserve DynamoDB data

### Update Infrastructure

To change infrastructure (DynamoDB, API Gateway, etc.):

1. Edit `aws/backend.yaml`
2. Validate changes:
   ```bash
   ./aws/bin/backend-sam-deploy --validate
   ```
3. Deploy:
   ```bash
   ./aws/bin/backend-sam-deploy
   ```

### Zero-Downtime Deployments

SAM uses CloudFormation change sets for updates:
- Lambda aliases can be used for gradual deployments
- API Gateway stages provide environment isolation
- DynamoDB tables are updated with minimal downtime

## Rollback

### Automatic Rollback

CloudFormation automatically rolls back on deployment failure.

### Manual Rollback

Roll back to previous version:

```bash
# View stack history
aws cloudformation list-stack-resources \
  --stack-name production-portfolio-backend-api

# Rollback to previous version
aws cloudformation continue-update-rollback \
  --stack-name production-portfolio-backend-api
```

### Delete Stack

To completely remove the backend:

```bash
# Using SAM
sam delete --stack-name production-portfolio-backend-api --region us-east-1

# Or using CloudFormation
aws cloudformation delete-stack \
  --stack-name production-portfolio-backend-api
```

**Warning**: This will delete:
- Lambda function
- API Gateway
- **DynamoDB table and ALL data**
- CloudWatch logs (after retention period)

## Cost Estimation

Monthly costs for typical portfolio traffic (~1000 requests/day):

| Service | Estimated Cost |
|---------|---------------|
| Lambda (30,000 requests, 512MB, 1s avg) | ~$0.20 |
| API Gateway (30,000 requests) | ~$0.10 |
| DynamoDB (On-Demand, minimal reads/writes) | ~$4.00 |
| CloudWatch Logs (1GB) | ~$0.50 |
| **Total** | **~$4.80/month** |

Free tier (first 12 months):
- Lambda: 1M requests/month free
- API Gateway: 1M requests/month free
- DynamoDB: 25GB storage, 25 WCU, 25 RCU free

## Security Best Practices

1. **Use secrets manager** for sensitive data:
   ```bash
   aws secretsmanager create-secret \
     --name portfolio/backend/config \
     --secret-string '{"key":"value"}'
   ```

2. **Enable CloudTrail** for API auditing:
   ```bash
   aws cloudtrail lookup-events \
     --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::Lambda::Function
   ```

3. **Rotate Cognito client secrets** regularly

4. **Enable WAF** for API Gateway (optional):
   ```bash
   # Create WAF Web ACL and associate with API Gateway
   ```

5. **Review IAM policies** created by SAM template

## Related Documentation

- [SAM Template](../backend.yaml) - Infrastructure as Code
- [Vault Configuration](BACKEND_VAULT_CONFIG.md) - Configuration guide
- [Backend API](../../backend/README.md) - Application documentation
- [DynamoDB Design](../../backend/docs/DYNAMODB-DESIGN.md) - Data model
- [API Specification](../../API.md) - OpenAPI 3.0.3 spec
- [Local Testing](../../backend/docs/LOCAL_TESTING.md) - Development guide

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review CloudWatch logs
3. Check AWS CloudFormation events
4. Review SAM CLI documentation: https://docs.aws.amazon.com/serverless-application-model/
