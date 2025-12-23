# Backend Build and Deployment Process

This document explains how your FastAPI backend is compiled, packaged, and deployed to AWS Lambda using AWS SAM (Serverless Application Model).

## Overview

Your backend uses:
- **FastAPI**: Python web framework
- **Mangum**: ASGI adapter that makes FastAPI work with AWS Lambda
- **uv**: Fast Python package manager
- **SAM**: AWS deployment framework
- **Lambda**: Serverless compute (no servers to manage)

## Build Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SAM BUILD PROCESS                            │
└─────────────────────────────────────────────────────────────────┘

1. Read SAM Template (aws/backend.yaml)
   ├─ CodeUri: ../backend/          ← Your source code location
   ├─ Handler: src.main.handler     ← Entry point
   └─ Runtime: python3.12            ← Python version

2. Create Build Environment (Docker Container)
   ├─ Uses Amazon Linux 2023 (matches Lambda environment)
   ├─ Installs Python 3.12
   └─ Isolates build from your local machine

3. Install Dependencies
   ├─ Reads: backend/pyproject.toml
   ├─ Extracts: [project.dependencies]
   ├─ Creates: requirements.txt (temporary)
   └─ Installs with pip in container

4. Copy Application Code
   ├─ Copies: backend/src/**/*.py
   ├─ Skips: backend/tests/
   └─ Skips: backend/.venv/

5. Create Deployment Package
   ├─ Location: .aws-sam/build/PortfolioApiFunction/
   ├─ Structure:
   │   ├── src/                    ← Your application code
   │   │   ├── main.py            ← Entry point with handler
   │   │   ├── api/               ← API routes
   │   │   ├── models/            ← Pydantic models
   │   │   ├── repositories/      ← Data access layer
   │   │   └── utils/             ← Utilities
   │   ├── fastapi/               ← FastAPI library
   │   ├── mangum/                ← Lambda adapter
   │   ├── pydantic/              ← Data validation
   │   ├── boto3/                 ← AWS SDK
   │   └── ... (all dependencies)
   └─ Total size: ~50-80 MB (zipped: ~10-15 MB)

6. Generate CloudFormation Template
   └─ Output: .aws-sam/build/template.yaml
```

## Deployment Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAM DEPLOY PROCESS                            │
└─────────────────────────────────────────────────────────────────┘

1. Package Build Artifacts
   ├─ Zip: .aws-sam/build/PortfolioApiFunction/ → function.zip
   └─ Upload to: s3://patrickcmd-dev-sam-deployments/production-portfolio-backend-api/

2. Transform SAM Template to CloudFormation
   ├─ Converts: AWS::Serverless::Function → AWS::Lambda::Function
   ├─ Converts: AWS::Serverless::Api → AWS::ApiGateway::RestApi
   └─ Adds: IAM roles, permissions, event triggers

3. Create/Update CloudFormation Stack
   ├─ Stack Name: production-portfolio-backend-api
   ├─ Creates:
   │   ├── Lambda Function
   │   ├── DynamoDB Table
   │   ├── API Gateway
   │   ├── Custom Domain
   │   ├── IAM Roles
   │   └── CloudWatch Logs
   └─ Updates existing resources if already deployed

4. Deploy Lambda Function
   ├─ Downloads: function.zip from S3
   ├─ Extracts in Lambda environment
   ├─ Sets environment variables
   └─ Ready to handle requests
```

## Key Configuration Files

### 1. SAM Template (aws/backend.yaml)

```yaml
PortfolioApiFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: ../backend/           # Where SAM finds your code
    Handler: src.main.handler      # Python import path to handler
    Runtime: python3.12            # Python version
    MemorySize: 512                # MB of RAM
    Timeout: 30                    # Seconds before timeout
```

**How it works:**
- `CodeUri: ../backend/` tells SAM to look in the backend directory
- SAM automatically detects `pyproject.toml` and installs dependencies
- `Handler: src.main.handler` means:
  - Import the `handler` function from `backend/src/main.py`
  - This is the Mangum-wrapped FastAPI app

### 2. Application Entry Point (backend/src/main.py)

```python
from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

# Your routes...
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Lambda handler - this is what SAM calls
handler = Mangum(app, lifespan="off")
```

**How Mangum works:**
- Converts Lambda events → FastAPI requests
- Converts FastAPI responses → Lambda responses
- Handles API Gateway proxy integration automatically

### 3. Dependencies (backend/pyproject.toml)

```toml
[project]
dependencies = [
    "boto3>=1.42.12",          # AWS SDK
    "fastapi>=0.125.0",        # Web framework
    "mangum>=0.19.0",          # Lambda adapter
    "pydantic[email]>=2.12.5", # Data validation
    "pydantic-settings>=2.12.0", # Config management
    "python-jose[cryptography]>=3.5.0", # JWT handling
    "requests>=2.32.5",        # HTTP client
]
```

**Build process:**
1. SAM reads `pyproject.toml`
2. Extracts dependencies
3. Creates temporary `requirements.txt`
4. Runs `pip install -r requirements.txt` in Docker container
5. Packages everything together

## Runtime Execution Flow

When a request hits your API:

```
┌─────────────────────────────────────────────────────────────────┐
│                     REQUEST FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

1. Client Request
   └─ HTTPS: api.patrickcmd.dev/health

2. API Gateway
   ├─ Receives request
   ├─ Checks Cognito JWT (if required)
   ├─ CORS preflight handling
   └─ Creates Lambda event

3. Lambda Invocation
   ├─ Calls: src.main.handler(event, context)
   ├─ Handler is: Mangum(app)
   └─ Mangum converts event → ASGI request

4. FastAPI Application
   ├─ Routes request to: @app.get("/health")
   ├─ Executes: health_check()
   ├─ Returns: {"status": "healthy"}
   └─ FastAPI creates HTTP response

5. Mangum Conversion
   ├─ Converts: FastAPI response → Lambda response
   └─ Returns to API Gateway

6. API Gateway Response
   ├─ Adds CORS headers
   ├─ Formats response
   └─ Returns to client

7. CloudWatch Logging
   └─ All print()/logs → CloudWatch Logs
```

## What Gets Deployed

### Lambda Function Package Contents

```
lambda-deployment-package.zip (10-15 MB)
├── src/
│   ├── main.py                    # Your entry point with handler
│   ├── api/
│   │   ├── auth.py
│   │   ├── blog.py
│   │   ├── projects.py
│   │   ├── certifications.py
│   │   ├── visitors.py
│   │   └── analytics.py
│   ├── models/
│   │   ├── blog.py
│   │   ├── project.py
│   │   ├── certification.py
│   │   ├── visitor.py
│   │   └── analytics.py
│   ├── repositories/
│   │   ├── base.py
│   │   ├── blog.py
│   │   ├── project.py
│   │   ├── certification.py
│   │   ├── visitor.py
│   │   └── analytics.py
│   ├── utils/
│   │   ├── auth.py
│   │   └── errors.py
│   ├── config.py
│   └── dependencies.py
├── fastapi/                       # FastAPI framework (~3 MB)
├── pydantic/                      # Data validation (~2 MB)
├── boto3/                         # AWS SDK (~5 MB)
├── mangum/                        # Lambda adapter (~100 KB)
├── python-jose/                   # JWT library (~500 KB)
└── ... (all other dependencies)
```

**What's NOT included:**
- ❌ `tests/` directory (excluded)
- ❌ `.venv/` directory (excluded)
- ❌ `__pycache__/` directories (excluded)
- ❌ Development dependencies (pytest, black, etc.)
- ❌ Local DynamoDB files

## Environment Variables at Runtime

Your Lambda function receives these environment variables:

```bash
# From SAM template (Globals.Function.Environment.Variables)
ENVIRONMENT=production
DYNAMODB_TABLE_NAME=production-portfolio-api-table
COGNITO_USER_POOL_ID=us-east-1_DESdNfOSv
COGNITO_CLIENT_ID=62r2aeiu82mktf5inljmvn2dvb
CORS_ORIGINS=https://patrickcmd.dev,https://www.patrickcmd.dev

# Automatically set by Lambda runtime
AWS_REGION=us-east-1
AWS_LAMBDA_FUNCTION_NAME=production-portfolio-api
AWS_LAMBDA_FUNCTION_MEMORY_SIZE=512
AWS_LAMBDA_FUNCTION_VERSION=$LATEST
AWS_EXECUTION_ENV=AWS_Lambda_python3.12
LAMBDA_TASK_ROOT=/var/task
_HANDLER=src.main.handler

# From Lambda Function Environment.Variables
LOG_LEVEL=INFO
```

Your `backend/src/config.py` reads these:

```python
class Settings(BaseSettings):
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    cognito_user_pool_id: str = os.getenv("COGNITO_USER_POOL_ID", "")
    dynamodb_table_name: str = os.getenv("DYNAMODB_TABLE_NAME", "portfolio-api-table")
    # ... etc
```

## Build Commands Explained

### 1. Validate Template

```bash
sam validate --template aws/backend.yaml
```

**What it does:**
- Checks YAML syntax
- Validates SAM/CloudFormation schema
- Verifies resource references
- **Does NOT** build or deploy anything

### 2. Build Application

```bash
sam build --template aws/backend.yaml --use-container
```

**What it does:**
- Creates `.aws-sam/build/` directory
- Runs Docker container with Amazon Linux 2023
- Reads `backend/pyproject.toml`
- Installs dependencies with pip
- Copies your source code
- Creates deployment package

**Why `--use-container`?**
- Ensures build environment matches Lambda (Amazon Linux)
- Compiles native dependencies correctly (e.g., cryptography)
- Prevents "works on my machine" issues

### 3. Deploy Application

```bash
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name production-portfolio-backend-api \
  --s3-bucket patrickcmd-dev-sam-deployments \
  --capabilities CAPABILITY_IAM
```

**What it does:**
1. Zips `.aws-sam/build/PortfolioApiFunction/`
2. Uploads zip to S3
3. Transforms SAM → CloudFormation
4. Creates/updates CloudFormation stack
5. Deploys Lambda function
6. Creates API Gateway
7. Sets up custom domain
8. Configures IAM roles

## Python Compilation Notes

### No Compilation Required! 🎉

Python is an interpreted language, so:
- ✅ No compilation step needed
- ✅ Source code is deployed as-is
- ✅ `.py` files are loaded at runtime
- ✅ Faster builds than compiled languages

### What About `.pyc` Files?

Python automatically creates `.pyc` (bytecode) files:
- Created on first import in Lambda
- Cached in `/tmp/` for reuse
- Small performance boost on warm starts
- Automatically handled by Python runtime

### Lambda Cold Starts

**Cold Start** (first request or after ~15 min idle):
1. Download deployment package from S3
2. Extract to `/var/task/`
3. Initialize Python runtime
4. Import your code (`src.main`)
5. Create Mangum handler
6. Import FastAPI and dependencies
7. Execute request
- **Duration**: 1-3 seconds for first request

**Warm Start** (subsequent requests):
1. Lambda container already running
2. Handler already loaded
3. Just execute request
- **Duration**: 50-200ms

## Optimizations Built In

### 1. Layer Caching
SAM caches Docker layers between builds:
- Dependencies only rebuild if `pyproject.toml` changes
- Your code changes don't trigger full rebuild

### 2. Incremental Builds
Only changed files are re-copied:
```bash
# First build: ~2-3 minutes
sam build --use-container

# Subsequent builds (code changes only): ~30 seconds
sam build --use-container
```

### 3. Deployment Package Optimization
SAM automatically:
- Excludes `.pyc` and `__pycache__`
- Excludes tests and development files
- Compresses with maximum compression
- Results in smaller package → faster cold starts

## Troubleshooting

### Check Build Output

```bash
# Build and see what's included
sam build --use-container

# List files in deployment package
ls -lah .aws-sam/build/PortfolioApiFunction/

# Check size
du -sh .aws-sam/build/PortfolioApiFunction/
```

### View Dependencies

```bash
# See what was installed
cat .aws-sam/build/PortfolioApiFunction/*/RECORD
```

### Test Locally

```bash
# Start local API Gateway
sam local start-api

# Test endpoint
curl http://localhost:3000/health
```

### View Lambda Logs

```bash
# After deployment
aws logs tail /aws/lambda/production-portfolio-api --follow
```

## Summary

1. **Your code** (`backend/src/`) is Python source files - no compilation needed
2. **SAM builds** by:
   - Reading `pyproject.toml`
   - Installing dependencies in Docker
   - Copying your source code
   - Creating deployment package
3. **Lambda runs** by:
   - Loading your code at runtime
   - Using Mangum to adapt FastAPI → Lambda
   - Executing Python interpreter
4. **No servers** to manage - fully serverless!

Your entire FastAPI application runs as a single Lambda function, triggered by API Gateway, with all requests routed through Mangum to FastAPI's routing system.
