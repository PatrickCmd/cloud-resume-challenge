# Backend Vault Configuration Guide

This document describes the backend-specific variables that need to be added to the encrypted Ansible vault at `aws/playbooks/vaults/config.yml`.

## Overview

The backend deployment uses AWS SAM (Serverless Application Model) to deploy:
- DynamoDB table (single-table design)
- Lambda function (FastAPI with Mangum)
- API Gateway REST API
- Custom domain configuration
- CloudWatch logging

## Required Vault Variables

Add the following configuration section to your `vaults/config.yml` file:

```yaml
# Backend API Configuration
backend_config:
  # SAM Configuration
  sam_template_path: "../backend.yaml"
  stack_name: "production-portfolio-backend-api"
  sam_s3_bucket: "your-sam-deployment-bucket"  # S3 bucket for SAM deployment artifacts

  # Environment Configuration
  environment: "production"  # Options: development, staging, production

  # Cognito Configuration (from existing Cognito setup)
  cognito_user_pool_id: "us-east-1_XXXXXXXXX"  # Your Cognito User Pool ID
  cognito_client_id: "xxxxxxxxxxxxxxxxxxxxxxxxxx"  # Your Cognito App Client ID

  # Custom Domain Configuration
  custom_domain_name: "api.patrickcmd.dev"
  hosted_zone_id: "ZXXXXXXXXXXXXX"  # Route53 Hosted Zone ID for patrickcmd.dev
  certificate_arn: "arn:aws:acm:us-east-1:XXXXXXXXXXXX:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

  # CORS Configuration
  frontend_origins: "https://patrickcmd.dev,https://www.patrickcmd.dev"
```

## Configuration Details

### SAM S3 Bucket

The `sam_s3_bucket` is used to store SAM deployment artifacts (packaged Lambda code, etc.).

**Create the bucket:**
```bash
aws s3 mb s3://your-sam-deployment-bucket --region us-east-1
```

**Enable versioning (recommended):**
```bash
aws s3api put-bucket-versioning \
  --bucket your-sam-deployment-bucket \
  --versioning-configuration Status=Enabled
```

### Cognito Configuration

If you've already set up Cognito using the `setup-cognito` playbook, you can find these values:

```bash
# Get User Pool ID
aws cognito-idp list-user-pools --max-results 10 --region us-east-1

# Get App Client ID
aws cognito-idp list-user-pool-clients \
  --user-pool-id us-east-1_XXXXXXXXX \
  --region us-east-1
```

Or use the helper script:
```bash
./bin/cognito-show-config
```

### ACM Certificate

The certificate **must be in us-east-1** for use with API Gateway Edge-Optimized endpoints.

**Create certificate:**
```bash
aws acm request-certificate \
  --domain-name api.patrickcmd.dev \
  --validation-method DNS \
  --region us-east-1
```

**Get certificate ARN:**
```bash
aws acm list-certificates --region us-east-1
```

**Note:** You'll need to validate the certificate by adding the DNS validation records to Route 53.

### Hosted Zone ID

Get your Route 53 Hosted Zone ID:

```bash
aws route53 list-hosted-zones --query "HostedZones[?Name=='patrickcmd.dev.'].Id" --output text
```

## Updating the Encrypted Vault

### Step 1: Decrypt the vault

```bash
cd aws/playbooks
ansible-vault decrypt vaults/config.yml
```

Enter your vault password when prompted.

### Step 2: Edit the configuration

Add the `backend_config` section to `vaults/config.yml` with your actual values:

```bash
nano vaults/config.yml
```

### Step 3: Re-encrypt the vault

```bash
ansible-vault encrypt vaults/config.yml
```

Enter your vault password when prompted.

## Verifying Configuration

After updating the vault, verify it can be read:

```bash
ansible-vault view vaults/config.yml
```

## Environment-Specific Configurations

### Development Environment

For a development environment, update these values:

```yaml
backend_config:
  stack_name: "development-portfolio-backend-api"
  environment: "development"
  custom_domain_name: "api-dev.patrickcmd.dev"
  # Different certificate for dev domain
```

### Staging Environment

For a staging environment:

```yaml
backend_config:
  stack_name: "staging-portfolio-backend-api"
  environment: "staging"
  custom_domain_name: "api-staging.patrickcmd.dev"
  # Different certificate for staging domain
```

## Complete Example

Here's a complete example of what the `backend_config` section should look like:

```yaml
backend_config:
  # SAM Configuration
  sam_template_path: "../backend.yaml"
  stack_name: "production-portfolio-backend-api"
  sam_s3_bucket: "patrickcmd-sam-deployments"

  # Environment
  environment: "production"

  # Cognito (from existing setup)
  cognito_user_pool_id: "us-east-1_AbCdEfGhI"
  cognito_client_id: "1a2b3c4d5e6f7g8h9i0j1k2l3m"

  # Custom Domain
  custom_domain_name: "api.patrickcmd.dev"
  hosted_zone_id: "Z1234567890ABC"
  certificate_arn: "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

  # CORS
  frontend_origins: "https://patrickcmd.dev,https://www.patrickcmd.dev"
```

## Next Steps

After updating the vault configuration:

1. Verify the SAM template validates:
   ```bash
   ./bin/backend-sam-deploy --validate
   ```

2. Run a dry-run deployment:
   ```bash
   ./bin/backend-sam-deploy --check
   ```

3. Deploy the backend:
   ```bash
   ./bin/backend-sam-deploy
   ```

## Troubleshooting

### Missing SAM S3 Bucket

If the SAM S3 bucket doesn't exist, create it:
```bash
aws s3 mb s3://your-bucket-name --region us-east-1
```

### Invalid Certificate ARN

Ensure the certificate is in `us-east-1` and is validated:
```bash
aws acm describe-certificate --certificate-arn YOUR_ARN --region us-east-1
```

### Wrong Hosted Zone ID

List all hosted zones to find the correct ID:
```bash
aws route53 list-hosted-zones
```

## Security Notes

- Never commit the decrypted vault file to version control
- Use strong vault passwords
- Rotate Cognito client secrets regularly
- Review IAM permissions created by SAM template
- Enable CloudWatch logging for security monitoring

## Related Documentation

- [SAM Template](../backend.yaml)
- [Backend API Documentation](../../backend/README.md)
- [DynamoDB Design](../../backend/docs/DYNAMODB-DESIGN.md)
- [Deployment Playbook](backend-sam-deploy.yml)
