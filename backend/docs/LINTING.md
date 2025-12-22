# Backend Linting and Code Quality

This document describes the linting and code quality tools configured for the backend.

## Tools Overview

The backend uses a comprehensive suite of linting and formatting tools:

- **[Ruff](https://docs.astral.sh/ruff/)** - Fast Python linter (replaces Flake8, isort checks, and more)
- **[Black](https://black.readthedocs.io/)** - Uncompromising Python code formatter
- **[isort](https://pycqa.github.io/isort/)** - Import statement organizer
- **[mypy](https://mypy.readthedocs.io/)** - Static type checker
- **[pre-commit](https://pre-commit.com/)** - Git hook framework for automated checks

## Quick Start

### Using Make Commands (Recommended)

```bash
# Format all code (black, isort, ruff --fix)
make format

# Check code without fixing (for CI/CD)
make check

# Run all linters
make lint

# Run tests with coverage
make coverage

# Clean generated files
make clean
```

### Using Individual Tools

```bash
# Ruff - Fast linting
uv run ruff check src tests              # Check for issues
uv run ruff check src tests --fix        # Auto-fix issues
uv run ruff format src tests             # Format with ruff

# Black - Code formatting
uv run black src tests                   # Format code
uv run black src tests --check           # Check without modifying

# isort - Import sorting
uv run isort src tests                   # Sort imports
uv run isort src tests --check-only      # Check without modifying

# mypy - Type checking
uv run mypy src                          # Check types
```

## Configuration

All linting tools are configured in [pyproject.toml](../pyproject.toml).

### Ruff Configuration

```toml
[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
    "ARG", # flake8-unused-arguments
    "SIM", # flake8-simplify
]
```

**Per-file ignores:**
- `src/api/*.py`: Allows unused `current_user` parameters (FastAPI dependency injection)
- `src/utils/errors.py`: Allows unused parameters in error handlers (FastAPI convention)
- `src/repositories/base.py`: Allows `Generic[T]` pattern in base repository

### Black Configuration

```toml
[tool.black]
line-length = 100
target-version = ['py312']
```

Black enforces consistent code style with minimal configuration.

### isort Configuration

```toml
[tool.isort]
profile = "black"
line_length = 100
src_paths = ["src", "tests"]
```

isort organizes imports into three groups:
1. Standard library imports
2. Third-party imports
3. Local application imports

### mypy Configuration

```toml
[tool.mypy]
python_version = "3.12"
check_untyped_defs = true
ignore_missing_imports = true
```

Type checking helps catch bugs early but doesn't require full type annotations.

## Pre-commit Hooks

Pre-commit runs linting checks automatically before each commit.

### Setup

```bash
# Install pre-commit hooks (one-time setup)
uv run pre-commit install

# Run hooks manually on all files
uv run pre-commit run --all-files

# Skip hooks for a specific commit (not recommended)
git commit --no-verify -m "message"
```

### Configured Hooks

The `.pre-commit-config.yaml` includes:

1. **Basic checks**: Trailing whitespace, end-of-file fixes, YAML/JSON validation
2. **Ruff**: Linting and formatting
3. **isort**: Import sorting
4. **Black**: Code formatting
5. **mypy**: Type checking

## CI/CD Integration

For continuous integration, use the `make check` command which runs all linters without modifying files:

```yaml
# Example GitHub Actions workflow
- name: Run linters
  run: make check
```

## Common Issues and Solutions

### Issue: "line too long" errors

**Solution**: Black handles line length automatically. If you get this error from ruff, make sure you've run black first:

```bash
make format
```

### Issue: Import order errors

**Solution**: Run isort to automatically organize imports:

```bash
uv run isort src tests
```

### Issue: Type checking errors

**Solution**: mypy errors indicate potential type issues. Add type hints or use `# type: ignore` for known false positives:

```python
result = some_function()  # type: ignore[no-untyped-call]
```

### Issue: Unused argument warnings in FastAPI endpoints

**Solution**: Already configured to ignore in API endpoints. If you encounter this elsewhere, it's intentional - FastAPI uses dependency injection where parameters may not be directly accessed.

## Editor Integration

### VS Code

Install these extensions:
- [Ruff](https://marketplace.visualstudio.com/items?itemName=charliermarsh.ruff)
- [Black Formatter](https://marketplace.visualstudio.com/items?itemName=ms-python.black-formatter)
- [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance) (for mypy)

Add to `.vscode/settings.json`:
```json
{
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  },
  "ruff.lint.args": ["--config=pyproject.toml"],
  "python.linting.enabled": true
}
```

### PyCharm

1. **Black**: Settings → Tools → Black → Enable "On code reformat"
2. **Ruff**: Settings → Tools → External Tools → Add ruff
3. **isort**: Settings → Tools → isort → Enable
4. **mypy**: Settings → Tools → mypy → Enable

## Best Practices

1. **Run linters before committing**: Use `make lint` or enable pre-commit hooks
2. **Format code consistently**: Let Black handle formatting - don't fight it
3. **Organize imports**: Use isort to keep imports clean and organized
4. **Fix issues incrementally**: Don't disable all warnings - fix them or add specific ignores
5. **Type hints are helpful**: Add type hints for function signatures, especially public APIs
6. **Review linter output**: Linters catch real bugs - don't ignore them

## Makefile Commands Reference

```bash
make help       # Show all available commands
make install    # Install all dependencies
make format     # Format code (black + isort + ruff --fix)
make check      # Check without fixing (for CI/CD)
make lint       # Run all linters with fixes
make test       # Run unit tests
make coverage   # Run tests with coverage report
make clean      # Remove generated files
```

## Resources

- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [Black Documentation](https://black.readthedocs.io/)
- [isort Documentation](https://pycqa.github.io/isort/)
- [mypy Documentation](https://mypy.readthedocs.io/)
- [pre-commit Documentation](https://pre-commit.com/)

## Coverage Reports

After running tests with coverage, view the HTML report:

```bash
make coverage
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

Current coverage: **86%** (211 tests passing)
