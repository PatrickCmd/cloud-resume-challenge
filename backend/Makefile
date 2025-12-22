.PHONY: help lint format check test coverage clean install dev-server

help:
	@echo "Available commands:"
	@echo "  make install       - Install all dependencies"
	@echo "  make lint          - Run all linters (ruff, mypy)"
	@echo "  make format        - Format code with black and isort"
	@echo "  make check         - Run linters without fixing"
	@echo "  make test          - Run all tests"
	@echo "  make coverage      - Run tests with coverage report"
	@echo "  make dev-server    - Start development server"
	@echo "  make clean         - Remove generated files"

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
