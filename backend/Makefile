.PHONY: help lint format check test coverage clean install dev-server e2e-dev e2e-prod e2e-auth e2e-health e2e-certs e2e-projects e2e-blogs

help:
	@echo "Available commands:"
	@echo "  make install       - Install all dependencies"
	@echo "  make lint          - Run all linters (ruff, mypy)"
	@echo "  make format        - Format code with black and isort"
	@echo "  make check         - Run linters without fixing"
	@echo "  make test          - Run unit tests"
	@echo "  make coverage      - Run tests with coverage report"
	@echo "  make dev-server    - Start development server"
	@echo "  make clean         - Remove generated files"
	@echo ""
	@echo "E2E Tests (Development):"
	@echo "  make e2e-dev       - Run all E2E tests against development environment"
	@echo "  make e2e-auth      - Run authentication E2E tests (development)"
	@echo "  make e2e-health    - Run health check E2E tests (development)"
	@echo "  make e2e-certs     - Run certifications E2E tests (development)"
	@echo "  make e2e-projects  - Run projects E2E tests (development)"
	@echo "  make e2e-blogs     - Run blogs E2E tests (development)"
	@echo ""
	@echo "E2E Tests (Production):"
	@echo "  make e2e-prod      - Run all E2E tests against production environment"

# Install dependencies
install:
	uv sync

# Format code
format:
	@echo "Running isort..."
	uv run isort src tests
	@echo "Running black..."
	uv run black src tests
	@echo "Running ruff fix..."
	uv run ruff check src tests --fix

# Check code without fixing
check:
	@echo "Running ruff check..."
	uv run ruff check src tests
	@echo "Running black check..."
	uv run black src tests --check
	@echo "Running isort check..."
	uv run isort src tests --check-only
	@echo "Running mypy..."
	-uv run mypy src  # Treat mypy as warnings, don't fail on errors

# Run all linters (with fixes)
lint: format
	@echo "Running mypy..."
	-uv run mypy src  # Treat mypy as warnings, don't fail on errors

# Run tests
test:
	uv run pytest tests/unit/ -v

# Run tests with coverage
coverage:
	uv run pytest tests/unit/ -v --cov=src --cov-report=term-missing --cov-report=html
	@echo "\nCoverage report generated in htmlcov/index.html"

# Start development server
dev-server:
	uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8080

# Clean generated files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "Cleaned up generated files"

# E2E Tests - Development Environment
e2e-dev:
	./scripts/run_e2e_tests.sh --env development -v

e2e-auth:
	./scripts/run_e2e_tests.sh --env development --test test_auth_e2e.py -v

e2e-health:
	./scripts/run_e2e_tests.sh --env development --test test_health_e2e.py -v

e2e-certs:
	./scripts/run_e2e_tests.sh --env development --test test_certifications_e2e.py -v

e2e-projects:
	./scripts/run_e2e_tests.sh --env development --test test_projects_e2e.py -v

e2e-blogs:
	./scripts/run_e2e_tests.sh --env development --test test_blogs_e2e.py -v

# E2E Tests - Production Environment
e2e-prod:
	./scripts/run_e2e_tests.sh --env production -v
