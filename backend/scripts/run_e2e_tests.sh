#!/usr/bin/env bash
#
# E2E Test Runner Script
#
# Runs E2E tests against deployed APIs with proper environment configuration
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

show_help() {
    cat << EOF
E2E Test Runner for Deployed Backend APIs

Usage: $(basename "$0") [OPTIONS]

Options:
    -e, --env ENV          Environment to test (production|development) [default: development]
    -t, --test TEST        Specific test file or pattern to run
    -v, --verbose          Verbose output
    -x, --exitfirst        Exit on first test failure
    -p, --parallel         Run tests in parallel
    -c, --coverage         Generate coverage report
    -h, --help             Show this help message

Examples:
    # Run all E2E tests against development
    ./backend/scripts/run_e2e_tests.sh --env development

    # Run all E2E tests against production
    ./backend/scripts/run_e2e_tests.sh --env production

    # Run specific test file
    ./backend/scripts/run_e2e_tests.sh --env development --test test_auth_e2e.py

    # Run with verbose output
    ./backend/scripts/run_e2e_tests.sh --env development --verbose

    # Run in parallel for faster execution
    ./backend/scripts/run_e2e_tests.sh --env development --parallel

Prerequisites:
    - uv package manager installed
    - Dependencies installed: uv sync --group dev (from backend/ directory)
    - Environment variables configured (see below)

Environment Variables Required:
    Development:
        DEV_API_URL (default: https://api-dev.patrickcmd.dev)
        DEV_TEST_USER_EMAIL
        DEV_TEST_USER_PASSWORD

    Production:
        PROD_API_URL (default: https://api.patrickcmd.dev)
        PROD_TEST_USER_EMAIL
        PROD_TEST_USER_PASSWORD

EOF
}

# Default values
ENV="development"
TEST_PATTERN=""
VERBOSE=""
EXIT_FIRST=""
PARALLEL=""
COVERAGE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -t|--test)
            TEST_PATTERN="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE="-vv"
            shift
            ;;
        -x|--exitfirst)
            EXIT_FIRST="-x"
            shift
            ;;
        -p|--parallel)
            PARALLEL="-n auto"
            shift
            ;;
        -c|--coverage)
            COVERAGE="--cov=src --cov-report=html --cov-report=term"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENV" != "production" && "$ENV" != "development" ]]; then
    print_error "Invalid environment: $ENV"
    echo "Must be 'production' or 'development'"
    exit 1
fi

print_header "E2E Tests - ${ENV^^} Environment"

# Check for required environment variables
if [[ "$ENV" == "production" ]]; then
    if [[ -z "${PROD_TEST_USER_EMAIL:-}" || -z "${PROD_TEST_USER_PASSWORD:-}" ]]; then
        print_error "Missing required environment variables for production:"
        echo "  PROD_TEST_USER_EMAIL"
        echo "  PROD_TEST_USER_PASSWORD"
        exit 1
    fi
    API_URL="${PROD_API_URL:-https://api.patrickcmd.dev}"
else
    if [[ -z "${DEV_TEST_USER_EMAIL:-}" || -z "${DEV_TEST_USER_PASSWORD:-}" ]]; then
        print_error "Missing required environment variables for development:"
        echo "  DEV_TEST_USER_EMAIL"
        echo "  DEV_TEST_USER_PASSWORD"
        exit 1
    fi
    API_URL="${DEV_API_URL:-https://api-dev.patrickcmd.dev}"
fi

print_info "Target API: $API_URL"

# Check API health
print_info "Checking API health..."
if curl -sf "$API_URL/health" > /dev/null; then
    print_success "API is healthy"
else
    print_error "API health check failed"
    print_info "Make sure the API is deployed and accessible"
    exit 1
fi

# Navigate to backend directory
BACKEND_DIR="$(dirname "$0")/.."
cd "$BACKEND_DIR"

# Check for uv
if ! command -v uv &> /dev/null; then
    print_error "uv not found"
    print_info "Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Check if dependencies are installed
if ! uv run --quiet python -c "import pytest" 2>/dev/null; then
    print_error "pytest not found in virtual environment"
    print_info "Install dependencies: uv sync --group dev"
    exit 1
fi

# Build pytest command
# Use --rootdir to prevent pytest from loading parent conftest.py
PYTEST_ARGS="tests/e2e_deployed/"

if [[ -n "$TEST_PATTERN" ]]; then
    PYTEST_ARGS="tests/e2e_deployed/$TEST_PATTERN"
fi

PYTEST_CMD="uv run pytest $PYTEST_ARGS --rootdir=tests/e2e_deployed --env=$ENV $VERBOSE $EXIT_FIRST $PARALLEL $COVERAGE"

# Run tests
print_header "Running Tests"
print_info "Command: $PYTEST_CMD"
echo ""

if eval "$PYTEST_CMD"; then
    print_header "Test Results"
    print_success "All tests passed!"

    if [[ -n "$COVERAGE" ]]; then
        print_info "Coverage report generated: htmlcov/index.html"
    fi

    exit 0
else
    print_header "Test Results"
    print_error "Some tests failed"
    exit 1
fi
