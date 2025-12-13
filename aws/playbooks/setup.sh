#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Ansible Playbooks Setup Script
# ============================================
# This script automates the setup of Ansible and all required dependencies
# for the Cloud Resume Challenge AWS playbooks.

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

# Function to print header
print_header() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   Cloud Resume Challenge - Ansible Setup                   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
}

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

print_header

# ============================================
# Check Prerequisites
# ============================================

print_info "Checking prerequisites..."
echo ""

# Check Python
if ! command_exists python3; then
    print_error "Python 3 is not installed"
    print_info "Install Python from: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
print_success "Python 3 found: ${PYTHON_VERSION}"

# Check pip
if ! command_exists pip3 && ! command_exists pip; then
    print_error "pip is not installed"
    print_info "Install pip: python3 -m ensurepip --upgrade"
    exit 1
fi
print_success "pip found"

# Check AWS CLI (optional but recommended)
if command_exists aws; then
    AWS_VERSION=$(aws --version 2>&1 | awk '{print $1}')
    print_success "AWS CLI found: ${AWS_VERSION}"
else
    print_warning "AWS CLI not found (optional but recommended)"
    print_info "Install from: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
fi

echo ""

# ============================================
# Install Python Dependencies
# ============================================

print_info "Installing Python dependencies from requirements.txt..."
echo ""

if pip3 install -r requirements.txt; then
    print_success "Python dependencies installed"
else
    print_error "Failed to install Python dependencies"
    exit 1
fi

echo ""

# ============================================
# Verify Ansible Installation
# ============================================

print_info "Verifying Ansible installation..."

if command_exists ansible; then
    ANSIBLE_VERSION=$(ansible --version | head -1)
    print_success "Ansible installed: ${ANSIBLE_VERSION}"
else
    print_error "Ansible installation failed"
    exit 1
fi

if command_exists ansible-galaxy; then
    print_success "ansible-galaxy command available"
else
    print_error "ansible-galaxy not found"
    exit 1
fi

echo ""

# ============================================
# Install Ansible Collections
# ============================================

print_info "Installing Ansible collections from requirements.yml..."
echo ""

if ansible-galaxy collection install -r requirements.yml; then
    print_success "Ansible collections installed"
else
    print_error "Failed to install Ansible collections"
    exit 1
fi

echo ""

# ============================================
# Verify Collections
# ============================================

print_info "Verifying installed collections..."
echo ""

# Check for amazon.aws
if ansible-galaxy collection list | grep -q "amazon.aws"; then
    AMAZON_AWS_VERSION=$(ansible-galaxy collection list | grep "amazon.aws" | awk '{print $2}')
    print_success "amazon.aws collection: ${AMAZON_AWS_VERSION}"
else
    print_warning "amazon.aws collection not found"
fi

# Check for community.aws
if ansible-galaxy collection list | grep -q "community.aws"; then
    COMMUNITY_AWS_VERSION=$(ansible-galaxy collection list | grep "community.aws" | awk '{print $2}')
    print_success "community.aws collection: ${COMMUNITY_AWS_VERSION}"
else
    print_warning "community.aws collection not found"
fi

# Check for community.general
if ansible-galaxy collection list | grep -q "community.general"; then
    COMMUNITY_GENERAL_VERSION=$(ansible-galaxy collection list | grep "community.general" | awk '{print $2}')
    print_success "community.general collection: ${COMMUNITY_GENERAL_VERSION}"
else
    print_warning "community.general collection not found"
fi

echo ""

# ============================================
# Check boto3/botocore
# ============================================

print_info "Verifying AWS SDK (boto3/botocore)..."
echo ""

if python3 -c "import boto3" 2>/dev/null; then
    BOTO3_VERSION=$(python3 -c "import boto3; print(boto3.__version__)")
    print_success "boto3: ${BOTO3_VERSION}"
else
    print_warning "boto3 not found"
fi

if python3 -c "import botocore" 2>/dev/null; then
    BOTOCORE_VERSION=$(python3 -c "import botocore; print(botocore.__version__)")
    print_success "botocore: ${BOTOCORE_VERSION}"
else
    print_warning "botocore not found"
fi

echo ""

# ============================================
# Setup Complete
# ============================================

print_success "Setup complete!"
echo ""

print_info "Next steps:"
echo "  1. Configure AWS CLI: aws configure --profile patrickcmd"
echo "  2. Create vault password file: echo 'your-password' > ~/.vault_pass.txt && chmod 600 ~/.vault_pass.txt"
echo "  3. Copy and configure vault: cp vaults/config.example.yml vaults/config.yml"
echo "  4. Encrypt vault: ansible-vault encrypt vaults/config.yml --vault-password-file ~/.vault_pass.txt"
echo "  5. Deploy: ansible-playbook frontend-deploy.yml"
echo ""

print_info "For detailed setup instructions, see:"
echo "  - QUICKSTART.md - 5-minute setup guide"
echo "  - README.md - Full documentation"
echo "  - vaults/README.md - Ansible Vault guide"
echo ""

print_success "Happy deploying! 🚀"
