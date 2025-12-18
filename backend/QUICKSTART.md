# Backend Quick Start Guide

## Prerequisites

- Python 3.12+
- `uv` package manager installed
- AWS credentials configured (for Cognito and DynamoDB)

## Initial Setup

1. **Install dependencies**:
   ```bash
   cd backend
   uv sync
   ```

2. **Configure environment**:
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env with your AWS credentials and Cognito configuration
   # Get these values from: ../aws/outputs/cognito-config.env
   ```

3. **Verify setup**:
   ```bash
   # Run tests
   uv run pytest tests/ -v

   # Run hello world app
   uv run python hello.py
   # or
   uv run uvicorn hello:app --reload
   ```

## Development Commands

### Running the API Locally

```bash
# Run with uvicorn (with auto-reload)
uv run uvicorn src.main:app --reload --port 8000

# Run directly
uv run python -m src.main
```

### Testing

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src tests/

# Run specific test file
uv run pytest tests/unit/test_hello.py -v

# Run tests matching a pattern
uv run pytest -k "test_blog"
```

### Code Quality

```bash
# Format code with black
uv run black src/ tests/

# Type check with mypy
uv run mypy src/

# Run all quality checks
uv run black src/ tests/ && uv run mypy src/ && uv run pytest
```

## Project Structure

```
backend/
├── src/                    # Application source code
│   ├── api/               # API endpoint definitions (routers)
│   ├── models/            # Data models (Pydantic + DynamoDB)
│   ├── services/          # Business logic layer
│   ├── repositories/      # Data access layer (DynamoDB)
│   ├── utils/             # Utility functions (JWT, DynamoDB helpers)
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Configuration management
│   └── dependencies.py   # Dependency injection
├── tests/                 # Test suite
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── pyproject.toml        # Project configuration & dependencies
└── .env                  # Environment variables (not in git)
```

## API Endpoints (Planned)

### Public Endpoints
- `GET /health` - Health check
- `GET /blog` - List blog posts
- `GET /blog/{slug}` - Get blog post by slug
- `GET /projects` - List projects
- `GET /certifications` - List certifications
- `GET /visitors/count` - Get visitor count
- `POST /visitors/track` - Track page view

### Protected Endpoints (Owner Only)
- `POST /auth/login` - Authenticate user
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user
- `POST /blog` - Create blog post
- `PUT /blog/{id}` - Update blog post
- `DELETE /blog/{id}` - Delete blog post
- `POST /projects` - Create project
- `PUT /projects/{id}` - Update project
- `DELETE /projects/{id}` - Delete project
- `GET /analytics/*` - View analytics

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Application
ENVIRONMENT=development
APP_NAME=Portfolio API

# AWS
AWS_REGION=us-east-1
AWS_PROFILE=patrickcmd

# Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
OWNER_EMAIL=your-email@example.com

# DynamoDB
DYNAMODB_TABLE_NAME=portfolio-data
```

## Next Steps

1. **Implement Authentication**:
   - JWT validation in `src/utils/jwt.py`
   - Update `src/dependencies.py` with actual auth logic
   - Test with Cognito tokens

2. **Set up DynamoDB**:
   - Create DynamoDB table following `DYNAMODB-DESIGN.md`
   - Implement repository layer
   - Test CRUD operations

3. **Implement Service Layer**:
   - Business logic for blog, projects, certifications
   - Validation and error handling
   - Integration with repositories

4. **Deploy to AWS Lambda**:
   - Create SAM template
   - Configure API Gateway
   - Set up environment variables
   - Deploy and test

## Troubleshooting

### Virtual Environment Warning

If you see:
```
warning: `VIRTUAL_ENV=/path/to/env` does not match the project environment path `.venv`
```

This is just a warning. The project will use the local `.venv` automatically.

### Import Errors

Make sure you're running commands with `uv run`:
```bash
# Wrong
python src/main.py

# Correct
uv run python src/main.py
```

### AWS Credentials

If you get AWS credential errors:
```bash
# Check AWS credentials
aws sts get-caller-identity --profile patrickcmd

# Ensure .env has correct values
cat .env
```

## Documentation

- [README.md](./README.md) - Project overview and architecture
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Authentication strategy
- [DYNAMODB-DESIGN.md](./DYNAMODB-DESIGN.md) - Database design
- [AGENTS.md](./AGENTS.md) - Development guidelines
- [OpenAPI Spec](../openapi.yml) - API specification

## Support

For issues or questions:
1. Check the documentation files listed above
2. Review error logs
3. Check AWS CloudWatch (for deployed Lambda)
4. Review Cognito configuration
