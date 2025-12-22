For backend development, use `uv` for dependency management.

## Dependency Management

```bash
# Sync dependencies from lockfile
uv sync

# Add a new package
uv add <PACKAGE-NAME>

# Add a dev dependency
uv add --dev <PACKAGE-NAME>

# Run Python files
uv run python <PYTHON-FILE>
```

## Linting and Code Quality

The backend uses a comprehensive linting setup. See [docs/LINTING.md](docs/LINTING.md) for details.

### Quick Commands (using Makefile)

```bash
# Format all code (black, isort, ruff --fix)
make format

# Check code without fixing (for CI/CD)
make check

# Run all linters
make lint

# Run tests with coverage
make coverage

# Show available commands
make help
```

### Individual Tools

```bash
# Ruff - Fast Python linter
uv run ruff check src tests              # Check for issues
uv run ruff check src tests --fix        # Auto-fix issues

# Black - Code formatter
uv run black src tests                   # Format code

# isort - Import sorter
uv run isort src tests                   # Sort imports

# mypy - Type checker
uv run mypy src                          # Check types
```

## Testing

```bash
# Run all unit tests
uv run pytest tests/unit/ -v

# Run with coverage report
uv run pytest tests/unit/ --cov=src --cov-report=html

# Run specific test file
uv run pytest tests/unit/test_blog_api.py -v
```

## Development Server

```bash
# Start development server with auto-reload (port 8080 to avoid conflict with DynamoDB Local)
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8080

# Or using make
make dev-server

# Access the API at:
# - API: http://localhost:8080
# - Interactive docs: http://localhost:8080/docs
# - ReDoc: http://localhost:8080/redoc
```
