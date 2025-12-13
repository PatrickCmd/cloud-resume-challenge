# Ansible Playbooks for AWS Infrastructure Deployment

This directory contains Ansible playbooks for deploying and managing the AWS infrastructure for the Cloud Resume Challenge.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Ansible Installation](#ansible-installation)
- [AWS Configuration](#aws-configuration)
- [Ansible AWS Collection Setup](#ansible-aws-collection-setup)
- [Ansible Vault Setup](#ansible-vault-setup)
- [Playbook Usage](#playbook-usage)
- [Playbook Inventory](#playbook-inventory)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before using these playbooks, ensure you have:

- Python 3.8 or higher installed
- An AWS account with appropriate permissions
- AWS CLI installed and configured
- Basic understanding of Ansible and AWS CloudFormation

## Ansible Installation

### Quick Setup (Recommended)

The fastest way to get started is using the provided requirements files:

```bash
# Navigate to playbooks directory
cd aws/playbooks

# Install Python dependencies (Ansible + AWS SDK)
pip install -r requirements.txt

# Install Ansible collections (AWS modules)
ansible-galaxy collection install -r requirements.yml

# Verify installation
ansible --version
ansible-galaxy collection list
```

**What gets installed**:
- ✅ Ansible (automation platform)
- ✅ boto3 & botocore (AWS SDK for Python)
- ✅ amazon.aws collection (core AWS modules)
- ✅ community.aws collection (extended AWS modules including S3 sync)
- ✅ community.general collection (general-purpose modules)

### Alternative Installation Methods

#### Option 1: Install via pip (Manual)

```bash
# Install Ansible
pip install ansible

# Install AWS SDK
pip install boto3 botocore

# Install collections manually
ansible-galaxy collection install amazon.aws
ansible-galaxy collection install community.aws

# Verify installation
ansible --version
```

#### Option 2: Install via Homebrew (macOS)

```bash
# Install Ansible
brew install ansible

# Verify installation
ansible --version
```

#### Option 3: Install via apt (Ubuntu/Debian)

```bash
# Update package index
sudo apt update

# Install Ansible
sudo apt install ansible -y

# Verify installation
ansible --version
```

#### Option 4: Install via dnf (Fedora/RHEL)

```bash
# Install Ansible
sudo dnf install ansible -y

# Verify installation
ansible --version
```

## AWS Configuration

### Step 1: Install AWS CLI

If you haven't already installed the AWS CLI:

```bash
# macOS/Linux
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Verify installation
aws --version
```

For other platforms, see: [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

### Step 2: Configure AWS Profile

Configure your AWS credentials with a named profile:

```bash
# Configure AWS CLI with your credentials
aws configure --profile default

# You'll be prompted to enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region name: us-east-1
# - Default output format: json
```

Example configuration session:

```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-1
Default output format [None]: json
```

### Step 3: Verify AWS Configuration

```bash
# Test AWS credentials
aws sts get-caller-identity --profile default

# Expected output:
# {
#     "UserId": "AIDACKCEVSQ6C2EXAMPLE",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-username"
# }
```

### Step 4: AWS Credentials File Location

AWS credentials are stored in:
- **Linux/macOS**: `~/.aws/credentials`
- **Windows**: `%USERPROFILE%\.aws\credentials`

Example `~/.aws/credentials` file:

```ini
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Example `~/.aws/config` file:

```ini
[default]
region = us-east-1
output = json
```

## Ansible AWS Collection Setup

### Install Required Python Packages

```bash
# Install boto3 and botocore (AWS SDK for Python)
pip install boto3 botocore

# Verify installation
python -c "import boto3; print(boto3.__version__)"
```

### Install Ansible AWS Collection

```bash
# Install the amazon.aws collection
ansible-galaxy collection install amazon.aws

# Verify installation
ansible-galaxy collection list | grep amazon.aws
```

### Install Community AWS Collection (Optional)

For additional AWS modules:

```bash
# Install the community.aws collection
ansible-galaxy collection install community.aws

# Verify installation
ansible-galaxy collection list | grep community.aws
```

## Ansible Vault Setup

We use Ansible Vault to securely manage configuration variables, including sensitive data. This provides encrypted storage for credentials and configuration that can be safely committed to version control.

### Quick Start with Ansible Vault

#### Step 1: Create Vault Password File

```bash
# Create a secure password file
echo "your-strong-vault-password" > ~/.vault_pass.txt

# Secure the file (only owner can read)
chmod 600 ~/.vault_pass.txt
```

**Important**: Add this to your `~/.gitignore` or project `.gitignore`:

```gitignore
*.vault_pass
*.vault_pass.txt
.vault_pass*
```

#### Step 2: Encrypt the Vault Configuration

```bash
# Navigate to playbooks directory
cd aws/playbooks

# Encrypt the vault file
ansible-vault encrypt vaults/config.yml --vault-password-file ~/.vault_pass.txt

# Or encrypt with password prompt
ansible-vault encrypt vaults/config.yml
```

#### Step 3: Edit Vault Variables

To modify configuration values:

```bash
# Edit encrypted vault file
ansible-vault edit vaults/config.yml --vault-password-file ~/.vault_pass.txt

# Or with password prompt
ansible-vault edit vaults/config.yml
```

#### Step 4: Configure Ansible to Use Vault Password

**Option A**: Add to `ansible.cfg` (in playbooks directory):

```ini
[defaults]
vault_password_file = ~/.vault_pass.txt
```

**Option B**: Set environment variable:

```bash
export ANSIBLE_VAULT_PASSWORD_FILE=~/.vault_pass.txt
```

### Vault File Structure

The vault configuration file (`vaults/config.yml`) contains:

- **AWS Configuration**: Region and profile settings
- **CloudFormation Settings**: Stack names and template paths
- **S3 Configuration**: Bucket names and settings
- **Environment Variables**: Deployment environment
- **Tags**: Resource tagging configuration

### Working with Vault

```bash
# View vault contents
ansible-vault view vaults/config.yml

# Change vault password
ansible-vault rekey vaults/config.yml

# Decrypt temporarily (not recommended for production)
ansible-vault decrypt vaults/config.yml
```

### Comprehensive Vault Documentation

For detailed Ansible Vault documentation, including:
- Complete setup guide
- Security best practices
- Multiple vault management
- CI/CD integration
- Troubleshooting

See: **[vaults/README.md](vaults/README.md)**

## Playbook Usage

### Available Playbooks

- **frontend-deploy.yml** - Deploy S3 static website infrastructure using CloudFormation
- **s3-upload.yml** - Build and upload React + Vite frontend to S3 bucket

### Running the Frontend Deployment Playbook

**Note**: The playbook now uses Ansible Vault for configuration management. See [Ansible Vault Setup](#ansible-vault-setup) section above.

#### Basic Deployment with Vault

```bash
# Navigate to playbooks directory
cd aws/playbooks

# Run with interactive password prompt
ansible-playbook frontend-deploy.yml --ask-vault-pass

# Run with password file (recommended)
ansible-playbook frontend-deploy.yml --vault-password-file ~/.vault_pass.txt

# Run with vault password configured in ansible.cfg or env var
ansible-playbook frontend-deploy.yml
```

#### Deployment with Custom Variables

Override vault variables via command line:

```bash
# Override specific vault variables
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  -e "s3_config.bucket_name=my-custom-bucket-name" \
  -e "deployment.environment=dev"

# Override AWS profile
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  -e "aws_config.profile=my-profile"
```

#### Deployment with Specific Tags

Run only specific tasks using tags (with vault):

```bash
# Only validate the template
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  --tags validate

# Only deploy the stack
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  --tags deploy

# Only show stack information
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  --tags info
```

#### Dry Run (Check Mode)

Test what changes would be made without actually making them:

```bash
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  --check
```

#### Verbose Output

Run with increased verbosity for debugging:

```bash
# Verbose output
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  -v

# More verbose
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  -vv

# Debug level
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  -vvv
```

### Customizing Deployment Variables

Variables are now managed through Ansible Vault for better security. You can customize deployment by:

#### Option 1: Edit Vault File (Recommended)

Edit the encrypted vault configuration:

```bash
# Edit vault file (will prompt for password or use password file)
ansible-vault edit vaults/config.yml --vault-password-file ~/.vault_pass.txt
```

Modify values in the vault:

```yaml
# AWS Configuration
aws_config:
  region: us-east-1
  profile: my-custom-profile

# S3 Configuration
s3_config:
  bucket_name: my-unique-bucket-name
  index_document: index.html
  error_document: index.html

# Environment
deployment:
  environment: prod
```

#### Option 2: Override via Command Line

Override vault variables without editing the vault:

```bash
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  -e "s3_config.bucket_name=my-new-bucket" \
  -e "deployment.environment=staging"
```

#### Option 3: Use Environment-Specific Vaults

Create separate vault files for different environments:

```bash
# Create dev vault
cp vaults/config.yml vaults/dev-config.yml
ansible-vault edit vaults/dev-config.yml

# Create prod vault
cp vaults/config.yml vaults/prod-config.yml
ansible-vault edit vaults/prod-config.yml

# Use specific vault
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  -e @vaults/dev-config.yml
```

---

### Running the S3 Upload Playbook

The `s3-upload.yml` playbook builds your React + Vite frontend and uploads it to your S3 bucket.

#### Basic Usage

```bash
# Navigate to playbooks directory
cd aws/playbooks

# Build and upload (default)
ansible-playbook s3-upload.yml --vault-password-file ~/.vault_pass.txt

# Build and upload with verbose output
ansible-playbook s3-upload.yml --vault-password-file ~/.vault_pass.txt -v
```

#### Using Tags for Selective Operations

```bash
# Only build (don't upload)
ansible-playbook s3-upload.yml \
  --vault-password-file ~/.vault_pass.txt \
  --tags build

# Only upload (requires existing build)
ansible-playbook s3-upload.yml \
  --vault-password-file ~/.vault_pass.txt \
  --tags upload

# Clean build artifacts (removes dist/ and node_modules/)
ansible-playbook s3-upload.yml \
  --vault-password-file ~/.vault_pass.txt \
  --tags clean
```

#### Build Modes

```bash
# Production build (default)
ansible-playbook s3-upload.yml \
  --vault-password-file ~/.vault_pass.txt

# Development build
ansible-playbook s3-upload.yml \
  --vault-password-file ~/.vault_pass.txt \
  -e build_mode=development
```

#### Recommended: Use the Wrapper Script

Instead of running the playbook directly, use the wrapper script for better UX:

```bash
# From project root
./aws/bin/s3-upload --verbose
./aws/bin/s3-upload --build
./aws/bin/s3-upload --upload
./aws/bin/s3-upload --dev
```

See [aws/bin/README.md](../bin/README.md#s3-upload) for full script documentation.

#### What the Playbook Does

1. **Validation**:
   - Checks frontend directory exists
   - Verifies package.json is present
   - Checks build directory for upload-only operations

2. **Build**:
   - Installs npm dependencies if `node_modules/` doesn't exist
   - Runs `npm run build` (production) or `npm run build:dev` (development)
   - Verifies dist/ directory was created

3. **Upload**:
   - Syncs all files from `frontend/dist/` to S3 bucket
   - Sets proper MIME types for all file extensions
   - Configures cache control headers:
     - Assets (JS, CSS, images): `public, max-age=31536000, immutable`
     - HTML files: `no-cache, no-store, must-revalidate`
   - Deletes files in S3 that don't exist locally (clean sync)

4. **Clean** (optional):
   - Removes `frontend/dist/` directory
   - Removes `frontend/node_modules/` directory

#### Cache Control Strategy

The playbook implements an optimal caching strategy for Vite builds:

**Long-term caching for assets**:
- JavaScript, CSS, images, fonts
- Cache-Control: `public, max-age=31536000, immutable`
- Safe because Vite uses content hashes in filenames
- Example: `app-abc123.js` changes when content changes

**No caching for HTML**:
- index.html, 404.html
- Cache-Control: `no-cache, no-store, must-revalidate`
- Ensures users always get the latest HTML
- HTML references the correct hashed assets

#### Troubleshooting

**Build fails**:
```bash
# Check Node.js version (needs 16+ for Vite)
node --version

# Install dependencies manually
cd frontend
npm install

# Try building manually
npm run build
```

**Upload fails**:
```bash
# Verify S3 bucket exists
aws s3 ls s3://patrickcmd.dev --profile patrickcmd

# Check AWS credentials
aws sts get-caller-identity --profile patrickcmd

# Verify vault configuration
ansible-vault view vaults/config.yml
```

**Permission errors**:
```bash
# Check IAM permissions
aws iam get-user --profile patrickcmd

# Test S3 permissions
aws s3 cp test.txt s3://patrickcmd.dev/test.txt --profile patrickcmd
```

## Playbook Inventory

### Frontend Deployment Playbook (`frontend-deploy.yaml`)

**Purpose**: Deploy S3 bucket with static website hosting using CloudFormation

**Key Variables**:

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-east-1` | AWS region for deployment |
| `aws_profile` | `default` | AWS CLI profile to use |
| `stack_name` | `portfolio-frontend-stack` | CloudFormation stack name |
| `bucket_name` | `patrick-portfolio-website` | S3 bucket name (must be globally unique) |
| `index_document` | `index.html` | Website index document |
| `error_document` | `index.html` | Website error document |
| `environment` | `prod` | Environment tag (dev/staging/prod) |

**Tasks Performed**:

1. Display deployment information
2. Validate CloudFormation template
3. Deploy CloudFormation stack
4. Wait for stack creation/update
5. Retrieve stack outputs
6. Display outputs to console
7. Save outputs to file (`../outputs/frontend-stack-outputs.env`)

**CloudFormation Configuration**:

The playbook uses the following CloudFormation settings:

| Setting | Value | Description |
|---------|-------|-------------|
| `capabilities` | `CAPABILITY_NAMED_IAM` | Allows creation of IAM resources with custom names |
| | `CAPABILITY_AUTO_EXPAND` | Enables processing of macros and nested stacks |
| `on_create_failure` | `ROLLBACK` | On stack creation failure, delete all created resources |
| `disable_rollback` | `false` | Allow rollback on update failures |

**Failure Handling**:

- **On Create Failure**: `ROLLBACK` - If stack creation fails, all resources are automatically deleted, providing a clean slate for retry
- **On Update Failure**: Rollback enabled - Updates that fail will automatically revert to the previous working state

**For detailed CloudFormation configuration documentation**, including:
- Detailed explanation of each capability
- Failure handling options and use cases
- Debugging failed deployments
- IAM permissions required
- Best practices

See: **[CLOUDFORMATION_CONFIG.md](CLOUDFORMATION_CONFIG.md)**

**Stack Outputs**:

After successful deployment, the following information is available:

- Bucket Name
- Bucket ARN
- Website URL (S3 static website endpoint)
- Bucket Domain Name

**Output File Location**: `aws/outputs/frontend-stack-outputs.env`

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "boto3 required for this module"

**Error Message**:
```
boto3 required for this module
```

**Solution**:
```bash
pip install boto3 botocore
```

#### Issue 2: "Unable to locate credentials"

**Error Message**:
```
Unable to locate credentials. You can configure credentials by running "aws configure"
```

**Solution**:
```bash
# Configure AWS credentials
aws configure --profile default

# Verify credentials
aws sts get-caller-identity --profile default
```

#### Issue 3: "The security token included in the request is invalid"

**Error Message**:
```
The security token included in the request is invalid
```

**Solution**:
- Check that your AWS credentials are valid and not expired
- Reconfigure your AWS profile
- Ensure you're using the correct profile name

```bash
aws configure --profile default
```

#### Issue 4: "Bucket name already exists"

**Error Message**:
```
Bucket name already in use or owned by another account
```

**Solution**:
- S3 bucket names must be globally unique
- Choose a different bucket name
- Update the `bucket_name` variable in the playbook

```bash
ansible-playbook frontend-deploy.yaml -e "bucket_name=my-unique-bucket-name-12345"
```

#### Issue 5: "Module 'amazon.aws.cloudformation' not found"

**Error Message**:
```
couldn't resolve module/action 'amazon.aws.cloudformation'
```

**Solution**:
```bash
# Install the amazon.aws collection
ansible-galaxy collection install amazon.aws

# Verify installation
ansible-galaxy collection list
```

#### Issue 6: Permission Denied Errors

**Error Message**:
```
User: arn:aws:iam::123456789012:user/username is not authorized to perform: cloudformation:CreateStack
```

**Solution**:
- Ensure your IAM user has the necessary permissions
- Required permissions:
  - `cloudformation:CreateStack`
  - `cloudformation:UpdateStack`
  - `cloudformation:DescribeStacks`
  - `s3:CreateBucket`
  - `s3:PutBucketPolicy`
  - `s3:PutBucketWebsite`
  - `s3:PutBucketVersioning`
  - `s3:PutEncryptionConfiguration`

#### Issue 7: "Requires capabilities: [CAPABILITY_IAM]"

**Error Message**:
```
An error occurred (InsufficientCapabilitiesException) when calling the CreateStack operation:
Requires capabilities : [CAPABILITY_IAM]
```

**Solution**:
This error means the template includes IAM resources. The playbook already includes the required capabilities, so this shouldn't occur. If it does:

```bash
# Verify the playbook includes capabilities
grep -A 3 "capabilities:" frontend-deploy.yml

# Should show:
# capabilities:
#   - CAPABILITY_NAMED_IAM
#   - CAPABILITY_AUTO_EXPAND
```

If the error persists, the template may require additional capabilities.

#### Issue 8: Stack Creation Failed and Rolled Back

**Error Message**:
```
Stack CREATE_FAILED: Rollback in progress
```

**What Happens**:
With `on_create_failure: ROLLBACK`, CloudFormation automatically:
1. Deletes all resources that were created
2. Puts the stack in `ROLLBACK_COMPLETE` state
3. Provides detailed failure reasons in stack events

**How to Debug**:

1. **Check stack events for failure reason**:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name portfolio-frontend-stack \
     --profile patrickcmd \
     --region us-east-1 \
     --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
   ```

2. **Common failure reasons**:
   - Bucket name already exists (must be globally unique)
   - Insufficient permissions
   - Invalid parameter values
   - Resource limit exceeded

3. **Clean up and retry**:
   ```bash
   # Delete the failed stack
   aws cloudformation delete-stack \
     --stack-name portfolio-frontend-stack \
     --profile patrickcmd \
     --region us-east-1

   # Wait for deletion to complete
   aws cloudformation wait stack-delete-complete \
     --stack-name portfolio-frontend-stack \
     --profile patrickcmd \
     --region us-east-1

   # Retry deployment with corrected values
   ansible-playbook frontend-deploy.yml
   ```

### Debugging Tips

1. **Enable Verbose Mode**:
   ```bash
   ansible-playbook frontend-deploy.yaml -vvv
   ```

2. **Check AWS CLI Access**:
   ```bash
   aws s3 ls --profile default
   ```

3. **Validate CloudFormation Template Manually**:
   ```bash
   aws cloudformation validate-template \
     --template-body file://../frontend.yaml \
     --profile default
   ```

4. **Check CloudFormation Stack Events**:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name portfolio-frontend-stack \
     --profile default
   ```

---

### S3 Upload & Website Hosting Issues

#### Issue 9: Ansible Callback Plugin Deprecated

**Error Message**:
```
[ERROR]: The 'community.general.yaml' callback plugin has been removed.
The plugin has been superseded by the option `result_format=yaml` in callback plugin ansible.builtin.default
```

**Cause**:
The Ansible configuration was using the deprecated `community.general.yaml` callback plugin which was removed in newer versions of Ansible.

**Solution**:
Update `ansible.cfg` to use the modern callback configuration:

```ini
# ansible.cfg
[defaults]
# Use default callback with YAML result format (ansible-core 2.13+)
stdout_callback = ansible.builtin.default
bin_ansible_callbacks = True
callback_result_format = yaml
```

**What changed**:
- ❌ Old: `stdout_callback = yaml` (deprecated)
- ✅ New: `stdout_callback = ansible.builtin.default` + `callback_result_format = yaml`

---

#### Issue 10: Ansible Reserved Variable Name Warning

**Warning Message**:
```
[WARNING]: Found variable using reserved name 'environment'.
```

**Cause**:
The playbook was using `environment` as a variable name, which is a reserved name in Ansible.

**Solution**:
Rename the variable to avoid the reserved name:

```yaml
# Before
vars:
  environment: "{{ deployment.environment }}"

# After
vars:
  deploy_environment: "{{ deployment.environment }}"
```

**Impact**: Minor - this is just a warning, but fixing it improves code quality and avoids potential conflicts.

---

#### Issue 11: CloudFormation Parameter Mutual Exclusion

**Error Message**:
```
[ERROR]: Task failed: Module failed: parameters are mutually exclusive: disable_rollback|on_create_failure
```

**Cause**:
The playbook had both `disable_rollback: false` and `on_create_failure: ROLLBACK` parameters, which are mutually exclusive in the Ansible CloudFormation module.

**Solution**:
Remove the `disable_rollback` parameter and keep only `on_create_failure`:

```yaml
# Before
amazon.aws.cloudformation:
  disable_rollback: false
  on_create_failure: ROLLBACK

# After
amazon.aws.cloudformation:
  on_create_failure: ROLLBACK
```

**Why**: `on_create_failure` is more explicit and provides better control over failure handling behavior.

---

#### Issue 12: CloudFormation Template Bucket Name Validation

**Error Message**:
```
Parameter BucketName failed to satisfy constraint: Bucket name must be lowercase,
can contain hyphens, and must start/end with alphanumeric characters
```

**Cause**:
The CloudFormation template's `AllowedPattern` for bucket names didn't allow periods (`.`), which are valid in S3 bucket names but commonly used in domain names like `patrickcmd.dev`.

**AWS S3 Requirements**:
S3 bucket names can contain:
- Lowercase letters (a-z)
- Numbers (0-9)
- Hyphens (-)
- **Periods (.)** ← This was missing!

**Solution**:
Update the CloudFormation template's `AllowedPattern` to include periods:

```yaml
# Before
Parameters:
  BucketName:
    AllowedPattern: ^[a-z0-9][a-z0-9-]*[a-z0-9]$

# After
Parameters:
  BucketName:
    AllowedPattern: ^[a-z0-9][a-z0-9.-]*[a-z0-9]$
```

**Testing**:
```bash
# Validate pattern accepts domain names
echo "patrickcmd.dev" | grep -E '^[a-z0-9][a-z0-9.-]*[a-z0-9]$'  # ✅ Matches
echo "my-bucket-123" | grep -E '^[a-z0-9][a-z0-9.-]*[a-z0-9]$'  # ✅ Matches
```

---

#### Issue 13: S3 Sync Module Not Found

**Error Message**:
```
[ERROR]: couldn't resolve module/action 'amazon.aws.s3_sync'.
This often indicates a misspelling, missing collection, or incorrect module path.
```

**Cause**:
The `s3_sync` module is not in the `amazon.aws` collection; it's in the `community.aws` collection.

**Solution**:
1. Install the `community.aws` collection:
   ```bash
   ansible-galaxy collection install community.aws
   ```

2. Update the playbook to use the correct module:
   ```yaml
   # Before
   - name: Sync build files to S3 bucket
     amazon.aws.s3_sync:  # ❌ Wrong collection

   # After
   - name: Sync build files to S3 bucket
     community.aws.s3_sync:  # ✅ Correct collection
   ```

**Verification**:
```bash
# Verify collection is installed
ansible-galaxy collection list | grep community.aws

# Check module availability
ansible-doc community.aws.s3_sync
```

**Module Collections**:
- `amazon.aws` - Core AWS modules (S3 object, CloudFormation, EC2, etc.)
- `community.aws` - Extended AWS modules (S3 sync, S3 lifecycle, etc.)

---

#### Issue 14: S3 Website Access Denied (HTTP vs HTTPS)

**Error Message**:
```
HTTP/1.1 403 Forbidden
x-amz-error-code: AccessDenied
x-amz-error-message: Access Denied
```

**Cause**:
The S3 bucket has a policy that enforces SSL/TLS (HTTPS only):

```json
{
  "Sid": "DenyInsecureTransport",
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Condition": {
    "Bool": {
      "aws:SecureTransport": "false"
    }
  }
}
```

However, the S3 website endpoint uses HTTP by default:
- ❌ `http://patrickcmd.dev.s3-website-us-east-1.amazonaws.com/` (blocked)
- ✅ `https://s3.us-east-1.amazonaws.com/patrickcmd.dev/index.html` (works)

**Understanding the Issue**:

1. **S3 Website Endpoint** (Static Website Hosting):
   - URL: `http://bucket-name.s3-website-region.amazonaws.com`
   - Protocol: **HTTP only**
   - Features: index.html routing, error document support
   - **Problem**: Blocked by SSL enforcement policy

2. **S3 REST API Endpoint**:
   - URL: `https://s3.region.amazonaws.com/bucket-name/object`
   - Protocol: **HTTPS**
   - Features: Direct object access
   - **Works**: Not blocked, but no website features

**Solutions**:

**Option 1: Access via HTTPS REST API** (Current Workaround):
```bash
# Works but no index.html routing
https://s3.us-east-1.amazonaws.com/patrickcmd.dev/index.html
```

**Option 2: Remove SSL Enforcement** (Not Recommended):
```yaml
# Remove DenyInsecureTransport from bucket policy
# ⚠️ Not recommended - exposes data to HTTP attacks
```

**Option 3: Use CloudFront with HTTPS** (✅ Recommended - Next Step):
```
CloudFront (HTTPS) → S3 Bucket (Internal HTTP)
```

Benefits:
- ✅ Serves content over HTTPS
- ✅ SSL/TLS certificate support
- ✅ CDN caching globally
- ✅ Custom domain support
- ✅ Keeps S3 bucket private (no public access needed)

**Verification Commands**:

```bash
# Test S3 website endpoint (HTTP) - Will fail with SSL enforcement
curl -I http://patrickcmd.dev.s3-website-us-east-1.amazonaws.com/

# Test S3 REST API (HTTPS) - Works
curl -I https://s3.us-east-1.amazonaws.com/patrickcmd.dev/index.html

# Verify bucket policy
aws s3api get-bucket-policy --bucket patrickcmd.dev --profile patrickcmd

# List uploaded files
aws s3 ls s3://patrickcmd.dev/ --profile patrickcmd
```

**Next Steps**:
Add CloudFront distribution in front of S3 bucket (covered in CloudFormation CloudFront template).

---

#### Issue 15: S3 Object Mode Requires Source

**Error Message**:
```
mode is put but any of the following are missing: content, content_base64, src
```

**Cause**:
The playbook was trying to update cache-control headers on existing S3 objects using `mode: put`, but this mode requires providing the object content (which we don't want to re-upload).

**Solution**:
Use `mode: copy` with `copy_src` to copy the object to itself while updating metadata:

```yaml
# Before (doesn't work)
- name: Set cache control for HTML files
  amazon.aws.s3_object:
    mode: put  # ❌ Requires content/src
    cache_control: "no-cache"

# After (works)
- name: Set cache control for HTML files
  amazon.aws.s3_object:
    mode: copy  # ✅ Copy object to itself
    copy_src:
      bucket: "{{ bucket_name }}"
      object: "{{ item }}"
    cache_control: "no-cache, no-store, must-revalidate"
    metadata_directive: "REPLACE"
    content_type: "text/html"
```

**What this does**:
1. Copies the object to itself (same bucket and key)
2. Replaces metadata with new values (`metadata_directive: REPLACE`)
3. Sets new cache-control headers
4. Preserves the object content

**Verification**:
```bash
# Check cache-control headers on HTML file
aws s3api head-object \
  --bucket patrickcmd.dev \
  --key index.html \
  --profile patrickcmd \
  | jq -r '.CacheControl'

# Should output: no-cache, no-store, must-revalidate
```

---

### Debugging Workflow Summary

Here's the complete debugging workflow we used:

1. **Identify the error** from Ansible output
2. **Check module documentation**:
   ```bash
   ansible-doc amazon.aws.cloudformation
   ansible-doc community.aws.s3_sync
   ```
3. **Verify AWS credentials and permissions**:
   ```bash
   aws sts get-caller-identity --profile patrickcmd
   aws s3 ls --profile patrickcmd
   ```
4. **Test AWS resources directly**:
   ```bash
   aws s3 ls s3://patrickcmd.dev/ --profile patrickcmd
   curl -I http://patrickcmd.dev.s3-website-us-east-1.amazonaws.com/
   ```
5. **Check bucket policies and configurations**:
   ```bash
   aws s3api get-bucket-policy --bucket patrickcmd.dev
   aws s3api get-bucket-website --bucket patrickcmd.dev
   ```
6. **Run with verbose mode**:
   ```bash
   ansible-playbook s3-upload.yml -vvv
   ```
7. **Review Ansible logs**:
   ```bash
   cat playbooks/ansible.log
   ```

## Files in This Directory

### Configuration Files

| File | Purpose | Usage |
|------|---------|-------|
| `requirements.txt` | Python dependencies (Ansible, boto3, etc.) | `pip install -r requirements.txt` |
| `requirements.yml` | Ansible Galaxy collections | `ansible-galaxy collection install -r requirements.yml` |
| `ansible.cfg` | Ansible configuration (callbacks, vault, logging) | Automatically loaded |
| `setup.sh` | Automated setup script | `./setup.sh` |

### Playbooks

| File | Purpose | Usage |
|------|---------|-------|
| `frontend-deploy.yml` | Deploy S3 bucket with CloudFormation | `ansible-playbook frontend-deploy.yml` |
| `s3-upload.yml` | Build and upload React frontend to S3 | `ansible-playbook s3-upload.yml` |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Complete playbooks documentation (this file) |
| `QUICKSTART.md` | 5-minute setup guide |
| `CLOUDFORMATION_CONFIG.md` | CloudFormation capabilities and failure handling |
| `vaults/README.md` | Ansible Vault guide (500+ lines) |
| `vaults/config.example.yml` | Example vault configuration |

### Directories

| Directory | Contents |
|-----------|----------|
| `vaults/` | Ansible Vault encrypted configuration files |
| `inventory/` | Ansible inventory files (hosts) |

## Best Practices

1. **Use Version Control**: Keep playbooks in Git for version control
2. **Separate Variables**: Use external variable files for different environments
3. **Use Tags**: Tag your playbook tasks for selective execution
4. **Test in Dev**: Always test in a development environment first
5. **Use Check Mode**: Run with `--check` flag to preview changes
6. **Secure Credentials**: Never commit AWS credentials to version control
7. **Use IAM Roles**: When possible, use IAM roles instead of access keys
8. **Pin Versions**: Use `requirements.txt` and `requirements.yml` for reproducibility
9. **Virtual Environments**: Use Python virtual environments to isolate dependencies
10. **Document Changes**: Update README when adding new playbooks or features

## Automated Setup

For the fastest setup experience, use the provided setup script:

```bash
# Navigate to playbooks directory
cd aws/playbooks

# Run automated setup
./setup.sh
```

This script will:
1. ✅ Check prerequisites (Python, pip)
2. ✅ Install Python dependencies from `requirements.txt`
3. ✅ Install Ansible collections from `requirements.yml`
4. ✅ Verify all installations
5. ✅ Show next steps

**Alternative manual setup**:
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Ansible collections
ansible-galaxy collection install -r requirements.yml
```

## Reproducibility

The `requirements.txt` and `requirements.yml` files ensure:

✅ **Consistent versions** across different machines
✅ **Easy onboarding** for new team members
✅ **CI/CD compatibility** for automated deployments
✅ **Version pinning** to avoid breaking changes
✅ **Documentation** of all dependencies

**Example CI/CD usage** (GitHub Actions):
```yaml
- name: Install dependencies
  run: |
    pip install -r aws/playbooks/requirements.txt
    ansible-galaxy collection install -r aws/playbooks/requirements.yml
```

## Additional Resources

- [Ansible Documentation](https://docs.ansible.com/)
- [Ansible AWS Collection Documentation](https://docs.ansible.com/ansible/latest/collections/amazon/aws/index.html)
- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [Cloud Resume Challenge](https://cloudresumechallenge.dev/)

## Next Steps

After deploying the infrastructure:

1. Build the frontend application
2. Upload files to S3 bucket
3. Test the website URL
4. Set up CloudFront distribution
5. Configure custom domain with Route 53
6. Implement CI/CD pipeline
