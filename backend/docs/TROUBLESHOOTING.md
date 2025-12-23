# Backend API Troubleshooting Guide

Complete guide for troubleshooting SAM/Lambda deployments, API Gateway, CloudFront, and debugging common issues.

**Table of Contents**
- [1. SAM Deployments](#1-sam-deployments)
- [2. API Gateway Management](#2-api-gateway-management)
- [3. Lambda Function Debugging](#3-lambda-function-debugging)
- [4. Route 53 DNS Records](#4-route-53-dns-records)
- [5. jq Tutorial](#5-jq-tutorial)
- [6. Understanding API Gateway CloudFront Distribution](#6-understanding-api-gateway-cloudfront-distribution)
- [7. Common Issues and Solutions](#7-common-issues-and-solutions)

---

## 1. SAM Deployments

### 1.1 Check SAM CLI Version

```bash
sam --version
# Output: SAM CLI, version 1.144.0
```

### 1.2 Validate SAM Template

```bash
# Validate template syntax
sam validate --template aws/backend.yaml --region us-east-1 --profile patrickcmd

# Output if valid:
# aws/backend.yaml is a valid SAM Template
```

### 1.3 Build SAM Application

```bash
# Build from project root
cd /path/to/cloud-resume-challenge
sam build --template aws/backend.yaml --build-dir aws/.aws-sam/build

# Build with specific Python version
sam build --template aws/backend.yaml --use-container --build-image public.ecr.aws/sam/build-python3.12
```

**What SAM Build Does:**
1. Reads `requirements.txt` in the `CodeUri` directory (`backend/`)
2. Installs dependencies using pip
3. Copies source code to `.aws-sam/build/`
4. Creates deployment package

**Troubleshooting Build Issues:**

```bash
# Check if requirements.txt exists
ls -la backend/requirements.txt

# Generate requirements.txt from pyproject.toml
cd backend
uv pip compile pyproject.toml -o requirements.txt

# Check what was built
ls -la aws/.aws-sam/build/PortfolioApiFunction/
```

### 1.4 Deploy SAM Application

```bash
# Deploy with parameters
sam deploy \
  --template-file aws/.aws-sam/build/template.yaml \
  --stack-name production-portfolio-backend-api \
  --s3-bucket patrickcmd-dev-sam-deployments \
  --region us-east-1 \
  --profile patrickcmd \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    Environment=production \
    CognitoUserPoolId=us-east-1_DESdNfOSv \
    CognitoClientId=62r2aeiu82mktf5inljmvn2dvb \
    CustomDomainName=api.patrickcmd.dev \
    HostedZoneId=Z062129419D3W5L72N4G6 \
    CertificateArn=arn:aws:acm:us-east-1:368339042141:certificate/ae61f134-6678-4035-900c-202d9126ae1a \
    FrontendOrigins="https://patrickcmd.dev,https://www.patrickcmd.dev" \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
```

### 1.5 Check Stack Status

```bash
# Get current stack status
aws cloudformation describe-stacks \
  --stack-name production-portfolio-backend-api \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Stacks[0].StackStatus' \
  --output text

# Possible statuses:
# - CREATE_COMPLETE: Stack created successfully
# - UPDATE_COMPLETE: Stack updated successfully
# - UPDATE_ROLLBACK_COMPLETE: Update failed, rolled back to previous state
# - CREATE_IN_PROGRESS: Stack is being created
# - UPDATE_IN_PROGRESS: Stack is being updated
```

### 1.6 View Stack Events

```bash
# View recent CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name production-portfolio-backend-api \
  --region us-east-1 \
  --profile patrickcmd \
  --max-items 20 \
  --query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]' \
  --output table

# Watch events in real-time (requires polling)
watch -n 5 'aws cloudformation describe-stack-events \
  --stack-name production-portfolio-backend-api \
  --region us-east-1 \
  --profile patrickcmd \
  --max-items 10 \
  --query "StackEvents[*].[Timestamp,ResourceStatus,LogicalResourceId]" \
  --output table'
```

### 1.7 Get Stack Outputs

```bash
# Get all stack outputs
aws cloudformation describe-stacks \
  --stack-name production-portfolio-backend-api \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Stacks[0].Outputs' \
  --output table

# Get specific output (e.g., API URL)
aws cloudformation describe-stacks \
  --stack-name production-portfolio-backend-api \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

### 1.8 Delete Stack

```bash
# Delete stack (use with caution!)
aws cloudformation delete-stack \
  --stack-name production-portfolio-backend-api \
  --region us-east-1 \
  --profile patrickcmd

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name production-portfolio-backend-api \
  --region us-east-1 \
  --profile patrickcmd
```

---

## 2. API Gateway Management

### 2.1 List API Gateways

```bash
# List all REST APIs
aws apigateway get-rest-apis \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'items[*].[id,name,createdDate]' \
  --output table
```

### 2.2 Get API Gateway Details

```bash
# Get REST API details
aws apigateway get-rest-api \
  --rest-api-id dqx5llaj39 \
  --region us-east-1 \
  --profile patrickcmd

# Get API Gateway ID from stack
API_ID=$(aws cloudformation describe-stacks \
  --stack-name production-portfolio-backend-api \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayId`].OutputValue' \
  --output text)

echo "API Gateway ID: $API_ID"
```

### 2.3 List API Resources and Methods

```bash
# List all resources (paths)
aws apigateway get-resources \
  --rest-api-id dqx5llaj39 \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'items[*].[path,resourceMethods]' \
  --output json | jq -r '.[] | "\(.[0]) -> \(.[1] | keys | join(", "))"'

# Example output:
# / -> GET, OPTIONS
# /health -> GET, OPTIONS
# /docs -> GET, OPTIONS
# /{proxy+} -> ANY, OPTIONS
```

### 2.4 Check Method Authorization

```bash
# Get specific method details
RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id dqx5llaj39 \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'items[?path==`/health`].id' \
  --output text)

aws apigateway get-method \
  --rest-api-id dqx5llaj39 \
  --resource-id "$RESOURCE_ID" \
  --http-method GET \
  --region us-east-1 \
  --profile patrickcmd \
  --query '{authorizationType: authorizationType, authorizerId: authorizerId}' \
  --output json | jq .

# Output:
# {
#   "authorizationType": "NONE",
#   "authorizerId": null
# }
```

### 2.5 List API Gateway Stages

```bash
# List all stages
aws apigateway get-stages \
  --rest-api-id dqx5llaj39 \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'item[*].[stageName,deploymentId,lastUpdatedDate]' \
  --output table
```

### 2.6 Get Stage Details

```bash
# Get stage configuration
aws apigateway get-stage \
  --rest-api-id dqx5llaj39 \
  --stage-name production \
  --region us-east-1 \
  --profile patrickcmd \
  --output json | jq .
```

### 2.7 Test API Gateway Endpoint

```bash
# Test with curl (no auth)
curl -s https://dqx5llaj39.execute-api.us-east-1.amazonaws.com/production/health | jq .

# Test with verbose output
curl -v https://dqx5llaj39.execute-api.us-east-1.amazonaws.com/production/health

# Test with authentication
TOKEN="your-jwt-token"
curl -H "Authorization: Bearer $TOKEN" \
  https://dqx5llaj39.execute-api.us-east-1.amazonaws.com/production/blogs | jq .
```

### 2.8 Check API Gateway Custom Domain

```bash
# Get custom domain details
aws apigateway get-domain-name \
  --domain-name api.patrickcmd.dev \
  --region us-east-1 \
  --profile patrickcmd \
  --output json | jq .

# Check domain mapping
aws apigateway get-base-path-mappings \
  --domain-name api.patrickcmd.dev \
  --region us-east-1 \
  --profile patrickcmd \
  --output json | jq .
```

---

## 3. Lambda Function Debugging

### 3.1 List Lambda Functions

```bash
# List all Lambda functions
aws lambda list-functions \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Functions[*].[FunctionName,Runtime,LastModified]' \
  --output table
```

### 3.2 Get Lambda Function Details

```bash
# Get function configuration
aws lambda get-function \
  --function-name production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Configuration' \
  --output json | jq .

# Get function code location
aws lambda get-function \
  --function-name production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Code.Location' \
  --output text
```

### 3.3 View Lambda Environment Variables

```bash
# Get environment variables
aws lambda get-function-configuration \
  --function-name production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Environment.Variables' \
  --output json | jq .
```

### 3.4 Invoke Lambda Function Directly

```bash
# Invoke function with test event
aws lambda invoke \
  --function-name production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --payload '{"httpMethod":"GET","path":"/health","headers":{}}' \
  --cli-binary-format raw-in-base64-out \
  response.json

# View response
cat response.json | jq .
```

### 3.5 View Lambda Logs (CloudWatch Logs)

```bash
# Tail logs in real-time
aws logs tail /aws/lambda/production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --follow

# View logs from last N minutes
aws logs tail /aws/lambda/production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --since 5m

# View logs with specific format
aws logs tail /aws/lambda/production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --since 10m \
  --format short

# Filter logs for errors
aws logs tail /aws/lambda/production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --since 30m \
  --filter-pattern "ERROR"

# Get last 50 lines
aws logs tail /aws/lambda/production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --since 5m | tail -50
```

### 3.6 Search Lambda Logs

```bash
# Search for specific error
aws logs tail /aws/lambda/production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --since 1h | grep -A5 "ERROR\|Traceback"

# Search for import errors
aws logs tail /aws/lambda/production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --since 30m | grep "ImportModuleError\|No module named"

# Search for initialization errors
aws logs tail /aws/lambda/production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --since 15m | grep "INIT_REPORT\|Status: error"
```

### 3.7 Check Lambda Metrics

```bash
# Get invocation count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=production-portfolio-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1 \
  --profile patrickcmd

# Get error count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=production-portfolio-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1 \
  --profile patrickcmd
```

---

## 4. Route 53 DNS Records

### 4.1 List Hosted Zones

```bash
# List all hosted zones
aws route53 list-hosted-zones \
  --profile patrickcmd \
  --query 'HostedZones[*].[Id,Name,ResourceRecordSetCount]' \
  --output table
```

### 4.2 Get Hosted Zone ID

```bash
# Get hosted zone ID by domain name
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --profile patrickcmd \
  --query 'HostedZones[?Name==`patrickcmd.dev.`].Id' \
  --output text | cut -d'/' -f3)

echo "Hosted Zone ID: $HOSTED_ZONE_ID"
```

### 4.3 List DNS Records

```bash
# List all records in hosted zone
aws route53 list-resource-record-sets \
  --hosted-zone-id Z062129419D3W5L72N4G6 \
  --profile patrickcmd \
  --output table

# List specific record
aws route53 list-resource-record-sets \
  --hosted-zone-id Z062129419D3W5L72N4G6 \
  --profile patrickcmd \
  --query "ResourceRecordSets[?Name=='api.patrickcmd.dev.']" \
  --output json | jq .

# List all A records
aws route53 list-resource-record-sets \
  --hosted-zone-id Z062129419D3W5L72N4G6 \
  --profile patrickcmd \
  --query "ResourceRecordSets[?Type=='A']" \
  --output json | jq -r '.[] | "\(.Name) -> \(.AliasTarget.DNSName // .ResourceRecords[0].Value)"'
```

### 4.4 Verify DNS Record for API Domain

```bash
# Check if DNS record exists
aws route53 list-resource-record-sets \
  --hosted-zone-id Z062129419D3W5L72N4G6 \
  --profile patrickcmd \
  --query "ResourceRecordSets[?Name=='api-dev.patrickcmd.dev.']" \
  --output json | jq .

# Expected output for API Gateway custom domain:
# {
#   "Name": "api-dev.patrickcmd.dev.",
#   "Type": "A",
#   "AliasTarget": {
#     "HostedZoneId": "Z2FDTNDATAQYW2",
#     "DNSName": "d1m58b9wmvgkyl.cloudfront.net.",
#     "EvaluateTargetHealth": false
#   }
# }
```

### 4.5 Test DNS Resolution

```bash
# Test DNS resolution with dig
dig api.patrickcmd.dev

# Test DNS resolution with nslookup
nslookup api.patrickcmd.dev

# Test DNS resolution with host
host api.patrickcmd.dev

# Check DNS propagation
curl -s "https://dns.google/resolve?name=api.patrickcmd.dev&type=A" | jq .
```

### 4.6 Create DNS Record (if needed)

```bash
# Create A record (alias to CloudFront)
cat > /tmp/change-batch.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api-dev.patrickcmd.dev",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d1m58b9wmvgkyl.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z062129419D3W5L72N4G6 \
  --change-batch file:///tmp/change-batch.json \
  --profile patrickcmd
```

---

## 5. jq Tutorial

`jq` is a lightweight command-line JSON processor. It's essential for working with AWS CLI JSON output.

### 5.1 Basic jq Usage

```bash
# Pretty-print JSON
echo '{"name":"John","age":30}' | jq .

# Access specific field
echo '{"name":"John","age":30}' | jq '.name'
# Output: "John"

# Access nested field
echo '{"user":{"name":"John","age":30}}' | jq '.user.name'
# Output: "John"

# Remove quotes from output
echo '{"name":"John"}' | jq -r '.name'
# Output: John
```

### 5.2 Working with Arrays

```bash
# Access array element
echo '[1,2,3,4,5]' | jq '.[0]'
# Output: 1

# Get array length
echo '[1,2,3,4,5]' | jq 'length'
# Output: 5

# Iterate over array
echo '[{"name":"John"},{"name":"Jane"}]' | jq '.[]'

# Map array elements
echo '[{"name":"John","age":30},{"name":"Jane","age":25}]' | jq '.[].name'
# Output:
# "John"
# "Jane"

# Filter array
echo '[{"name":"John","age":30},{"name":"Jane","age":25}]' | jq '.[] | select(.age > 26)'
```

### 5.3 AWS CLI with jq Examples

```bash
# Get Lambda function names
aws lambda list-functions \
  --region us-east-1 \
  --profile patrickcmd \
  --output json | jq -r '.Functions[].FunctionName'

# Get API Gateway ID and name
aws apigateway get-rest-apis \
  --region us-east-1 \
  --profile patrickcmd | jq -r '.items[] | "\(.id) - \(.name)"'

# Get stack outputs as key-value pairs
aws cloudformation describe-stacks \
  --stack-name production-portfolio-backend-api \
  --region us-east-1 \
  --profile patrickcmd | jq -r '.Stacks[0].Outputs[] | "\(.OutputKey): \(.OutputValue)"'

# Get environment variables as shell exports
aws lambda get-function-configuration \
  --function-name production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd | jq -r '.Environment.Variables | to_entries[] | "export \(.key)=\(.value)"'
```

### 5.4 Advanced jq Filters

```bash
# Select records matching condition
aws route53 list-resource-record-sets \
  --hosted-zone-id Z062129419D3W5L72N4G6 \
  --profile patrickcmd | jq '.ResourceRecordSets[] | select(.Type=="A")'

# Create custom JSON object
aws lambda list-functions \
  --region us-east-1 \
  --profile patrickcmd | jq '.Functions[] | {name: .FunctionName, runtime: .Runtime, memory: .MemorySize}'

# Count items
aws lambda list-functions \
  --region us-east-1 \
  --profile patrickcmd | jq '.Functions | length'

# Sort by field
aws lambda list-functions \
  --region us-east-1 \
  --profile patrickcmd | jq '.Functions | sort_by(.LastModified) | reverse'
```

### 5.5 jq Cheat Sheet

| Command | Description |
|---------|-------------|
| `jq .` | Pretty-print JSON |
| `jq -r` | Raw output (no quotes) |
| `jq '.field'` | Access field |
| `jq '.[]'` | Iterate array |
| `jq '.[0]'` | First array element |
| `jq 'length'` | Get length |
| `jq 'keys'` | Get object keys |
| `jq 'select(.x > 5)'` | Filter by condition |
| `jq 'map(.x)'` | Transform array |
| `jq 'sort_by(.x)'` | Sort array |
| `jq '{name, age}'` | Create new object |
| `jq '. + {new: "value"}'` | Add field |

---

## 6. Understanding API Gateway CloudFront Distribution

### 6.1 Why API Gateway Uses CloudFront

When you create a **custom domain** for API Gateway, AWS automatically creates and manages a CloudFront distribution for you. Here's why:

**Key Reasons:**

1. **Custom Domain Support**: API Gateway's default endpoint is `{api-id}.execute-api.{region}.amazonaws.com`. To use a custom domain like `api.patrickcmd.dev`, API Gateway needs CloudFront.

2. **SSL/TLS Termination**: CloudFront handles SSL/TLS certificate from ACM and terminates HTTPS connections before forwarding to API Gateway.

3. **Global Edge Locations**: CloudFront caches responses at 400+ edge locations worldwide, reducing latency for users far from your API Gateway region.

4. **DDoS Protection**: CloudFront provides built-in DDoS protection via AWS Shield Standard.

5. **Caching**: CloudFront can cache API responses at the edge, reducing load on your Lambda functions.

### 6.2 Architecture Flow

```
User Request
    ↓
DNS (Route 53): api.patrickcmd.dev
    ↓
CloudFront Distribution (d7cmeigt09gtj.cloudfront.net)
    ↓ (SSL termination, caching, DDoS protection)
API Gateway (dqx5llaj39.execute-api.us-east-1.amazonaws.com)
    ↓ (Authorization, request validation)
Lambda Function (production-portfolio-api)
    ↓ (FastAPI + Mangum)
DynamoDB
```

### 6.3 How to View the CloudFront Distribution

```bash
# Get CloudFront distribution domain from stack
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name production-portfolio-backend-api \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Stacks[0].Outputs[?OutputKey==`CustomDomainDistribution`].OutputValue' \
  --output text)

echo "CloudFront Domain: $CLOUDFRONT_DOMAIN"
# Output: d7cmeigt09gtj.cloudfront.net

# Get custom domain details (includes CloudFront info)
aws apigateway get-domain-name \
  --domain-name api.patrickcmd.dev \
  --region us-east-1 \
  --profile patrickcmd | jq '{
    domainName: .domainName,
    regionalDomainName: .regionalDomainName,
    distributionDomainName: .distributionDomainName,
    distributionHostedZoneId: .distributionHostedZoneId
  }'
```

### 6.4 Key Properties

| Property | Description | Example |
|----------|-------------|---------|
| **Custom Domain** | Your friendly domain name | `api.patrickcmd.dev` |
| **CloudFront Distribution** | AWS-managed CloudFront for custom domain | `d7cmeigt09gtj.cloudfront.net` |
| **Regional Domain** | Direct API Gateway endpoint | `d-abc123.execute-api.us-east-1.amazonaws.com` |
| **CloudFront Hosted Zone ID** | For Route 53 alias records | `Z2FDTNDATAQYW2` (global) |

### 6.5 Important Notes

1. **You cannot directly manage this CloudFront distribution** - It's fully managed by API Gateway
2. **Cannot invalidate cache via CloudFront API** - Must use API Gateway cache settings
3. **CloudFront Hosted Zone ID is always `Z2FDTNDATAQYW2`** for API Gateway custom domains (global constant)
4. **Caching is disabled by default** - Unless you configure cache settings in API Gateway stage

### 6.6 Caching Behavior

```bash
# Check stage cache settings
aws apigateway get-stage \
  --rest-api-id dqx5llaj39 \
  --stage-name production \
  --region us-east-1 \
  --profile patrickcmd | jq '{
    cachingEnabled: .cacheClusterEnabled,
    cacheClusterSize: .cacheClusterSize,
    methodSettings: .methodSettings
  }'
```

### 6.7 Direct vs Custom Domain Testing

```bash
# Test direct API Gateway endpoint (no CloudFront)
curl -s https://dqx5llaj39.execute-api.us-east-1.amazonaws.com/production/health | jq .

# Test custom domain (through CloudFront)
curl -s https://api.patrickcmd.dev/health | jq .

# Compare response headers
curl -I https://dqx5llaj39.execute-api.us-east-1.amazonaws.com/production/health
# vs
curl -I https://api.patrickcmd.dev/health
# CloudFront adds headers: x-cache, x-amz-cf-pop, via
```

---

## 7. Common Issues and Solutions

### Issue 1: Lambda Import Errors

**Symptom:**
```
[ERROR] Runtime.ImportModuleError: Unable to import module 'src.main': No module named 'fastapi'
```

**Cause:** Dependencies not installed during SAM build.

**Solution:**
```bash
# Ensure requirements.txt exists in CodeUri directory
ls backend/requirements.txt

# Generate if missing
cd backend
uv pip compile pyproject.toml -o requirements.txt

# Rebuild
sam build --template aws/backend.yaml
```

---

### Issue 2: CORS Configuration Error

**Symptom:**
```
[ERROR] SettingsError: error parsing value for field "cors_origins" from source "EnvSettingsSource"
```

**Cause:** Pydantic Settings cannot parse comma-separated string from environment variable.

**Solution:** Use `@field_validator` in `config.py`:

```python
from pydantic import field_validator

class Settings(BaseSettings):
    cors_origins: str | list[str] = "http://localhost:3000,..."

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
```

---

### Issue 3: API Gateway 401 Unauthorized

**Symptom:** All endpoints return 401 even public ones.

**Cause:** Default authorizer applied to all routes.

**Solution:** Add `Auth: Authorizer: NONE` to public endpoints in SAM template:

```yaml
Events:
  HealthApi:
    Type: Api
    Properties:
      RestApiId: !Ref PortfolioApiGateway
      Path: /health
      Method: GET
      Auth:
        Authorizer: NONE  # Disable auth for public endpoint
```

---

### Issue 4: CloudFormation UPDATE_ROLLBACK_COMPLETE

**Symptom:** Stack is stuck in `UPDATE_ROLLBACK_COMPLETE` state.

**Cause:** Previous deployment failed and rolled back.

**Check what failed:**
```bash
aws cloudformation describe-stack-events \
  --stack-name production-portfolio-backend-api \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'StackEvents[?ResourceStatus==`UPDATE_FAILED`]' \
  --output json | jq -r '.[] | "\(.ResourceStatusReason)"'
```

**Solution:** Fix the issue, then redeploy:
```bash
./aws/bin/backend-sam-deploy
```

---

### Issue 5: Custom Domain 403/404 Errors

**Symptom:** Custom domain returns 403 or 404 but direct API Gateway URL works.

**Cause:** CloudFront caching old responses.

**Solution:**
```bash
# Wait a few minutes for cache to expire

# Or test with cache bypass
curl -H "Cache-Control: no-cache" https://api.patrickcmd.dev/health

# Check if DNS is correct
dig api.patrickcmd.dev
```

---

### Issue 6: Base Path Mapping Error

**Symptom:**
```
Invalid stage identifier specified (Service: ApiGateway, Status Code: 400)
```

**Cause:** Base path mapping trying to update before stage is created.

**Solution:** Add stage dependency in SAM template:

```yaml
ApiBasePathMapping:
  Type: AWS::ApiGateway::BasePathMapping
  DependsOn:
    - PortfolioApiGateway
    - PortfolioApiGatewayStage  # Add this dependency
    - ApiCustomDomain
  Properties:
    DomainName: !Ref ApiCustomDomain
    RestApiId: !Ref PortfolioApiGateway
    Stage: !Ref Environment
```

---

### Issue 7: SAM Build Cache Issues

**Symptom:** Code changes not reflected in deployed Lambda.

**Solution:**
```bash
# Clean build artifacts
rm -rf aws/.aws-sam/

# Force rebuild
sam build --template aws/backend.yaml --cached false

# Deploy
sam deploy ...
```

---

### Issue 8: CloudWatch Logs Not Appearing

**Symptom:** No logs in CloudWatch after Lambda invocation.

**Check:**
```bash
# Verify log group exists
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd

# Check Lambda execution role has logs permissions
aws lambda get-function \
  --function-name production-portfolio-api \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Configuration.Role'
```

---

## Quick Reference Commands

```bash
# Deploy backend
./aws/bin/backend-sam-deploy

# Deploy development backend
./aws/bin/backend-sam-deploy-dev

# Test health endpoint
curl https://api.patrickcmd.dev/health | jq .

# View Lambda logs
aws logs tail /aws/lambda/production-portfolio-api --region us-east-1 --profile patrickcmd --follow

# Check stack status
aws cloudformation describe-stacks --stack-name production-portfolio-backend-api --region us-east-1 --profile patrickcmd --query 'Stacks[0].StackStatus' --output text

# List API resources
aws apigateway get-resources --rest-api-id dqx5llaj39 --region us-east-1 --profile patrickcmd | jq -r '.items[] | "\(.path) -> \(.resourceMethods | keys | join(\", \"))"'

# Check DNS record
aws route53 list-resource-record-sets --hosted-zone-id Z062129419D3W5L72N4G6 --profile patrickcmd --query "ResourceRecordSets[?Name=='api.patrickcmd.dev.']" | jq .
```

---

## Additional Resources

- [AWS SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-command-reference.html)
- [API Gateway Custom Domains](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains.html)
- [CloudWatch Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html)
- [jq Manual](https://stedolan.github.io/jq/manual/)
- [AWS CLI Command Reference](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/index.html)
