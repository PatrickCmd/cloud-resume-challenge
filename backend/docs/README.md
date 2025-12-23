# Backend Documentation Index

Complete documentation for the Portfolio Backend API.

## 📚 Quick Links

- **[Main README](../README.md)** - Project overview, setup, and quick start
- **[API Specification](../../API.md)** - OpenAPI 3.0.3 specification
- **[AWS Deployment Guide](../../aws/playbooks/BACKEND_DEPLOYMENT.md)** - Deploy to AWS with SAM

---

## 🚀 Getting Started

### For Local Development

1. **[QUICKSTART.md](QUICKSTART.md)** - Quick setup guide (5 minutes)
2. **[LOCAL_TESTING.md](LOCAL_TESTING.md)** - Run locally with DynamoDB Local
3. **[LINTING.md](LINTING.md)** - Code quality setup with Ruff

### For Deployment & Testing

1. **[AWS Deployment Guide](../../aws/playbooks/BACKEND_DEPLOYMENT.md)** - Deploy to AWS
2. **[TESTING_API.md](TESTING_API.md)** - Test deployed API with cURL, Postman, AWS Console
3. **[Build Process](../../aws/BUILD_AND_DEPLOY_PROCESS.md)** - How SAM builds and deploys

---

## 🗃️ Database (DynamoDB)

### Core Documentation

- **[DYNAMODB-DESIGN.md](DYNAMODB-DESIGN.md)** ⭐ (49KB)
  - Complete single-table design
  - Access patterns and GSI design
  - Entity schemas and relationships
  - Query examples and best practices

### Implementation Guides

- **[DYNAMODB_SETUP.md](DYNAMODB_SETUP.md)** (9KB)
  - Setting up DynamoDB Local
  - Table creation and seeding
  - Development workflow

- **[DYNAMODB-SCAN-VS-QUERY.md](DYNAMODB-SCAN-VS-QUERY.md)** (14KB)
  - When to use Query vs Scan
  - Performance considerations
  - Code examples

- **[DYNAMODB_IMPLEMENTATION_SUMMARY.md](DYNAMODB_IMPLEMENTATION_SUMMARY.md)** (12KB)
  - Implementation checklist
  - Repository pattern
  - Testing strategy

---

## 🔐 Authentication (Cognito)

### Core Documentation

- **[AUTHENTICATION.md](AUTHENTICATION.md)** ⭐ (26KB)
  - Complete Cognito integration guide
  - JWT validation and middleware
  - Security best practices
  - API endpoint protection

### Implementation & Testing

- **[AUTH_IMPLEMENTATION_SUMMARY.md](AUTH_IMPLEMENTATION_SUMMARY.md)** (14KB)
  - Step-by-step implementation guide
  - Code structure and patterns
  - Troubleshooting

- **[AUTH_TESTING.md](AUTH_TESTING.md)** (14KB)
  - Comprehensive test suite (58 tests)
  - Unit, integration, and E2E tests
  - Testing with mocked Cognito

---

## 🧪 Testing

### Local Testing

- **[LOCAL_TESTING.md](LOCAL_TESTING.md)** (8KB)
  - Run tests locally
  - DynamoDB Local setup
  - Mock AWS services

- **[AUTH_TESTING.md](AUTH_TESTING.md)** (14KB)
  - Authentication test suite
  - JWT validation tests
  - Cognito integration tests

### Production Testing

- **[TESTING_API.md](TESTING_API.md)** ⭐ (12KB)
  - Test deployed API on AWS
  - cURL commands for all endpoints
  - Postman/AWS Console testing
  - Get Cognito authentication tokens
  - Enable API docs (/docs, /redoc)

---

## 🛠️ Code Quality

- **[LINTING.md](LINTING.md)** (7KB)
  - Ruff configuration
  - Pre-commit hooks
  - VS Code integration

- **[LINTING_SETUP_SUMMARY.md](LINTING_SETUP_SUMMARY.md)** (5KB)
  - Quick setup checklist
  - Common issues and fixes

---

## 📖 Documentation by Topic

### Architecture & Design

| Document | Size | Description |
|----------|------|-------------|
| [DYNAMODB-DESIGN.md](DYNAMODB-DESIGN.md) | 49KB | Single-table design, access patterns, GSI |
| [AUTHENTICATION.md](AUTHENTICATION.md) | 26KB | Cognito integration, JWT, security |
| [DYNAMODB-SCAN-VS-QUERY.md](DYNAMODB-SCAN-VS-QUERY.md) | 14KB | Query optimization guide |

### Setup & Configuration

| Document | Size | Description |
|----------|------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | 5KB | 5-minute setup guide |
| [DYNAMODB_SETUP.md](DYNAMODB_SETUP.md) | 9KB | DynamoDB Local setup |
| [LINTING.md](LINTING.md) | 7KB | Code quality setup |

### Implementation Guides

| Document | Size | Description |
|----------|------|-------------|
| [DYNAMODB_IMPLEMENTATION_SUMMARY.md](DYNAMODB_IMPLEMENTATION_SUMMARY.md) | 12KB | DynamoDB implementation |
| [AUTH_IMPLEMENTATION_SUMMARY.md](AUTH_IMPLEMENTATION_SUMMARY.md) | 14KB | Auth implementation |
| [LINTING_SETUP_SUMMARY.md](LINTING_SETUP_SUMMARY.md) | 5KB | Linting setup |

### Testing & Deployment

| Document | Size | Description |
|----------|------|-------------|
| [TESTING_API.md](TESTING_API.md) | 12KB | Test deployed API |
| [LOCAL_TESTING.md](LOCAL_TESTING.md) | 8KB | Local testing guide |
| [AUTH_TESTING.md](AUTH_TESTING.md) | 14KB | Auth test suite |

---

## 🎯 Common Tasks

### I want to...

**...get started quickly**
→ [QUICKSTART.md](QUICKSTART.md)

**...set up local development**
→ [LOCAL_TESTING.md](LOCAL_TESTING.md)

**...understand the database design**
→ [DYNAMODB-DESIGN.md](DYNAMODB-DESIGN.md)

**...understand authentication**
→ [AUTHENTICATION.md](AUTHENTICATION.md)

**...deploy to AWS**
→ [../../aws/playbooks/BACKEND_DEPLOYMENT.md](../../aws/playbooks/BACKEND_DEPLOYMENT.md)

**...test the deployed API**
→ [TESTING_API.md](TESTING_API.md)

**...optimize DynamoDB queries**
→ [DYNAMODB-SCAN-VS-QUERY.md](DYNAMODB-SCAN-VS-QUERY.md)

**...set up code quality tools**
→ [LINTING.md](LINTING.md)

**...run the test suite**
→ [AUTH_TESTING.md](AUTH_TESTING.md) or [LOCAL_TESTING.md](LOCAL_TESTING.md)

---

## 📁 File Organization

```
backend/
├── README.md                          # Main project documentation
├── pyproject.toml                     # Dependencies and configuration
├── src/                               # Application source code
│   ├── main.py                       # FastAPI app entry point
│   ├── api/                          # API route handlers
│   ├── models/                       # Pydantic models
│   ├── repositories/                 # DynamoDB repositories
│   └── utils/                        # Utilities (auth, errors)
├── tests/                             # Test suite
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   └── e2e/                          # End-to-end tests
└── docs/                              # Documentation (you are here)
    ├── README.md                     # This file
    ├── QUICKSTART.md                 # Quick setup
    ├── DYNAMODB-DESIGN.md            # Database design
    ├── AUTHENTICATION.md             # Auth guide
    ├── TESTING_API.md                # API testing guide
    └── ... (see above for full list)
```

---

## 🔗 External Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **AWS DynamoDB Best Practices**: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html
- **AWS Cognito Documentation**: https://docs.aws.amazon.com/cognito/
- **AWS SAM Documentation**: https://docs.aws.amazon.com/serverless-application-model/
- **Pydantic Documentation**: https://docs.pydantic.dev/

---

## 📝 Contributing

When adding new documentation:

1. Use clear, descriptive filenames in SCREAMING_SNAKE_CASE
2. Include file size in this index
3. Add cross-references to related docs
4. Keep this README.md index updated
5. Follow the existing documentation structure

---

## 📄 License

This documentation is part of the Cloud Resume Challenge Portfolio project.
