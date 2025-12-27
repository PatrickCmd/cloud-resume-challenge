#!/usr/bin/env bash
#
# Create Test User in Cognito
#
# Creates a test user in AWS Cognito for E2E testing
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

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
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
Create Test User in AWS Cognito

Usage: $(basename "$0") [OPTIONS]

Options:
    -e, --email EMAIL      Email for test user (required)
    -p, --password PASS    Password for test user (required)
    --env ENV              Environment (production|development) [default: development]
    --profile PROFILE      AWS profile to use [default: patrickcmd]
    -h, --help             Show this help message

Examples:
    # Create test user for development
    $(basename "$0") --email testuser@example.com --password SecurePass123!

    # Create test user for production
    $(basename "$0") --email produser@example.com --password ProdPass123! --env production

Environment-specific User Pool IDs:
    Development: us-east-1_DESdNfOSv
    Production: us-east-1_DESdNfOSv

Password Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character

EOF
}

# Default values
EMAIL=""
PASSWORD=""
ENV="development"
AWS_PROFILE="patrickcmd"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -p|--password)
            PASSWORD="$2"
            shift 2
            ;;
        --env)
            ENV="$2"
            shift 2
            ;;
        --profile)
            AWS_PROFILE="$2"
            shift 2
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

# Validate required arguments
if [[ -z "$EMAIL" ]]; then
    print_error "Email is required"
    echo ""
    show_help
    exit 1
fi

if [[ -z "$PASSWORD" ]]; then
    print_error "Password is required"
    echo ""
    show_help
    exit 1
fi

# Validate environment
if [[ "$ENV" != "production" && "$ENV" != "development" ]]; then
    print_error "Invalid environment: $ENV"
    echo "Must be 'production' or 'development'"
    exit 1
fi

print_header "Creating Test User - ${ENV^^} Environment"

# Get User Pool ID based on environment
if [[ "$ENV" == "production" ]]; then
    USER_POOL_ID="${PROD_COGNITO_USER_POOL_ID:-us-east-1_DESdNfOSv}"
else
    USER_POOL_ID="${DEV_COGNITO_USER_POOL_ID:-us-east-1_DESdNfOSv}"
fi

print_info "User Pool ID: $USER_POOL_ID"
print_info "Email: $EMAIL"
print_info "AWS Profile: $AWS_PROFILE"

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found"
    print_info "Install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Verify AWS credentials
print_info "Verifying AWS credentials..."
if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
    print_error "AWS credentials verification failed"
    print_info "Configure AWS credentials: aws configure --profile $AWS_PROFILE"
    exit 1
fi
print_success "AWS credentials verified"

# Check if user already exists
print_info "Checking if user already exists..."
if aws cognito-idp admin-get-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$EMAIL" \
    --profile "$AWS_PROFILE" &> /dev/null; then

    print_warning "User $EMAIL already exists"
    read -p "Do you want to update the password? (yes/no): " UPDATE_PASSWORD

    if [[ "$UPDATE_PASSWORD" == "yes" ]]; then
        print_info "Updating password for existing user..."

        if aws cognito-idp admin-set-user-password \
            --user-pool-id "$USER_POOL_ID" \
            --username "$EMAIL" \
            --password "$PASSWORD" \
            --permanent \
            --profile "$AWS_PROFILE"; then

            print_success "Password updated successfully"

            # Verify user attributes
            USER_STATUS=$(aws cognito-idp admin-get-user \
                --user-pool-id "$USER_POOL_ID" \
                --username "$EMAIL" \
                --profile "$AWS_PROFILE" \
                --query 'UserStatus' \
                --output text)

            print_info "User Status: $USER_STATUS"

            if [[ "$USER_STATUS" != "CONFIRMED" ]]; then
                print_warning "User status is not CONFIRMED. Confirming user..."
                aws cognito-idp admin-confirm-sign-up \
                    --user-pool-id "$USER_POOL_ID" \
                    --username "$EMAIL" \
                    --profile "$AWS_PROFILE"
                print_success "User confirmed"
            fi
        else
            print_error "Failed to update password"
            exit 1
        fi
    else
        print_info "Skipping password update"
        exit 0
    fi
else
    # Create new user
    print_info "Creating new user..."

    if aws cognito-idp admin-create-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$EMAIL" \
        --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true \
        --temporary-password "TempPass123!" \
        --message-action SUPPRESS \
        --profile "$AWS_PROFILE" &> /dev/null; then

        print_success "User created successfully"

        # Set permanent password
        print_info "Setting permanent password..."

        if aws cognito-idp admin-set-user-password \
            --user-pool-id "$USER_POOL_ID" \
            --username "$EMAIL" \
            --password "$PASSWORD" \
            --permanent \
            --profile "$AWS_PROFILE"; then

            print_success "Password set successfully"
        else
            print_error "Failed to set password"
            exit 1
        fi
    else
        print_error "Failed to create user"
        exit 1
    fi
fi

print_header "Test User Setup Complete!"

echo ""
print_success "Test user created/updated successfully"
echo ""
print_info "Add these to your environment variables:"
echo ""

if [[ "$ENV" == "production" ]]; then
    echo "export PROD_TEST_USER_EMAIL=\"$EMAIL\""
    echo "export PROD_TEST_USER_PASSWORD=\"$PASSWORD\""
else
    echo "export DEV_TEST_USER_EMAIL=\"$EMAIL\""
    echo "export DEV_TEST_USER_PASSWORD=\"$PASSWORD\""
fi

echo ""
print_info "You can now run E2E tests with:"
echo "./backend/scripts/run_e2e_tests.sh --env $ENV"
echo ""
