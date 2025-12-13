# AWS Deployment Scripts

This directory contains executable scripts for deploying and managing AWS infrastructure for the Cloud Resume Challenge.

## Available Scripts

### `stack-manager`

CloudFormation stack management and troubleshooting tool.

#### Features

- ✅ View stack events and failures
- ✅ Check stack status and details
- ✅ Show stack outputs and resources
- ✅ Delete stacks with confirmation
- ✅ Color-coded status indicators
- ✅ Filter events by failure status
- ✅ Configurable via flags or environment variables

#### Usage

```bash
# Show stack events
./bin/stack-manager events

# Show only failed events
./bin/stack-manager failures

# Show stack status
./bin/stack-manager status

# Show stack outputs
./bin/stack-manager outputs

# Show stack resources
./bin/stack-manager resources

# Delete stack (with confirmation)
./bin/stack-manager delete

# Delete stack and wait for completion
./bin/stack-manager wait-delete

# Show help
./bin/stack-manager help
```

#### Options

| Option | Description |
|--------|-------------|
| `--stack NAME` | Override stack name (default: portfolio-frontend-stack) |
| `--profile NAME` | Override AWS profile (default: patrickcmd) |
| `--region NAME` | Override AWS region (default: us-east-1) |
| `--limit N` | Limit number of events shown (default: 20) |
| `--all` | Show all events (no limit) |

#### Commands

| Command | Description |
|---------|-------------|
| `events` | Show all stack events |
| `failures` | Show only failed events |
| `status` | Show current stack status |
| `describe` | Show detailed stack information |
| `outputs` | Show stack outputs |
| `resources` | List all stack resources |
| `delete` | Delete the stack (with confirmation) |
| `wait-delete` | Delete stack and wait for completion |
| `help` | Show help message |

#### Examples

##### View Stack Events
```bash
./bin/stack-manager events
```

##### Show Only Failures
```bash
# Perfect for debugging failed deployments
./bin/stack-manager failures
```

##### Show All Events (No Limit)
```bash
./bin/stack-manager events --all
```

##### Show Last 50 Events
```bash
./bin/stack-manager events --limit 50
```

##### Check Stack Status
```bash
./bin/stack-manager status
```

##### View Stack Outputs
```bash
./bin/stack-manager outputs
```

##### Delete Stack
```bash
./bin/stack-manager delete
# You'll be prompted for confirmation
```

##### Delete and Wait
```bash
./bin/stack-manager wait-delete
```

##### Use Different Stack/Profile
```bash
./bin/stack-manager events --stack my-other-stack --profile myprofile
```

#### Environment Variables

You can set defaults via environment variables:

```bash
export STACK_NAME=my-custom-stack
export AWS_PROFILE=myprofile
export AWS_REGION=us-west-2

./bin/stack-manager status
```

#### Typical Workflow

**After deployment failure**:

1. Check failures:
   ```bash
   ./bin/stack-manager failures
   ```

2. View recent events:
   ```bash
   ./bin/stack-manager events --limit 30
   ```

3. Check stack status:
   ```bash
   ./bin/stack-manager status
   ```

4. Delete failed stack:
   ```bash
   ./bin/stack-manager delete
   ```

---

### `frontend-deploy`

Bash wrapper script for deploying the frontend S3 static website infrastructure using Ansible.

#### Features

- ✅ User-friendly command-line interface
- ✅ Automatic prerequisite checking
- ✅ Color-coded output for better readability
- ✅ Multiple deployment modes (validate, deploy, info)
- ✅ Dry-run mode for testing
- ✅ Variable override support
- ✅ Comprehensive error handling
- ✅ Helpful troubleshooting tips on failure

#### Usage

```bash
# Basic deployment
./bin/frontend-deploy

# Show help
./bin/frontend-deploy --help

# Deploy with verbose output
./bin/frontend-deploy --verbose

# Very verbose (debug mode)
./bin/frontend-deploy -vvv

# Only validate template
./bin/frontend-deploy --validate

# Only deploy stack
./bin/frontend-deploy --deploy

# Only show stack information
./bin/frontend-deploy --info

# Dry run (check mode)
./bin/frontend-deploy --check

# Override bucket name
./bin/frontend-deploy --bucket my-unique-bucket-name

# Override environment
./bin/frontend-deploy --env staging

# Override AWS profile
./bin/frontend-deploy --profile my-aws-profile

# Combine options
./bin/frontend-deploy --env dev --bucket dev-bucket --verbose
```

#### Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-v, --verbose` | Verbose output |
| `-vv` | More verbose output |
| `-vvv` | Debug output |
| `--validate` | Only validate CloudFormation template |
| `--deploy` | Only deploy stack (skip validation) |
| `--info` | Only show stack information |
| `--check` | Dry run mode (show what would be deployed) |
| `--bucket NAME` | Override S3 bucket name |
| `--env ENV` | Override environment (dev/staging/prod) |
| `--profile PROFILE` | Override AWS profile |

#### Prerequisites

The script automatically checks for:

1. **Ansible** - Must be installed
   ```bash
   pip install ansible
   ```

2. **Vault Password File** - Should exist at `~/.vault_pass.txt`
   ```bash
   echo "your-vault-password" > ~/.vault_pass.txt
   chmod 600 ~/.vault_pass.txt
   ```

3. **Playbook** - Located at `playbooks/frontend-deploy.yml`

4. **AWS CLI** (optional but recommended)
   ```bash
   aws configure --profile patrickcmd
   ```

#### Output

**Success Output:**
```
╔════════════════════════════════════════════════════════════╗
║   Cloud Resume Challenge - Frontend Deployment            ║
╚════════════════════════════════════════════════════════════╝

ℹ Checking prerequisites...
✓ Prerequisites check passed

ℹ Starting deployment...

ℹ Running: ansible-playbook frontend-deploy.yml

[Ansible output...]

✓ Deployment completed successfully!

ℹ Stack outputs saved to: aws/outputs/frontend-stack-outputs.env
```

**Failure Output:**
```
✗ Deployment failed!

ℹ Troubleshooting tips:
ℹ 1. Check stack events:
ℹ    aws cloudformation describe-stack-events --stack-name portfolio-frontend-stack

ℹ 2. Review playbook logs above for error details

ℹ 3. See troubleshooting guide:
ℹ    playbooks/README.md#troubleshooting
```

#### Examples

##### Example 1: Standard Deployment

```bash
./bin/frontend-deploy
```

This will:
1. Check prerequisites
2. Run the full playbook (validate, deploy, show outputs)
3. Save outputs to `outputs/frontend-stack-outputs.env`

##### Example 2: Development Environment

```bash
./bin/frontend-deploy \
  --env dev \
  --bucket my-dev-portfolio-bucket \
  --verbose
```

This will:
1. Override environment to `dev`
2. Use custom bucket name
3. Show verbose output during deployment

##### Example 3: Validation Only

```bash
./bin/frontend-deploy --validate
```

This will:
1. Only run validation tasks
2. Check template syntax
3. Not deploy any resources

##### Example 4: Dry Run

```bash
./bin/frontend-deploy --check
```

This will:
1. Show what would be deployed
2. Not make any actual changes
3. Useful for testing configuration

##### Example 5: Debug Failed Deployment

```bash
./bin/frontend-deploy -vvv
```

This will:
1. Show very verbose output
2. Display all Ansible debug information
3. Help identify deployment issues

#### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Failure (deployment failed, prerequisites missing, invalid arguments) |

#### Integration with CI/CD

The script can be used in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Deploy Frontend
  run: |
    echo "${{ secrets.VAULT_PASSWORD }}" > ~/.vault_pass.txt
    chmod 600 ~/.vault_pass.txt
    ./aws/bin/frontend-deploy --verbose
```

```yaml
# GitLab CI example
deploy:
  script:
    - echo "$VAULT_PASSWORD" > ~/.vault_pass.txt
    - chmod 600 ~/.vault_pass.txt
    - ./aws/bin/frontend-deploy --verbose
```

#### Script Structure

```bash
frontend-deploy
├── Argument parsing       # Handle CLI options
├── Prerequisite checking  # Verify Ansible, vault, etc.
├── Command building       # Build ansible-playbook command
├── Deployment execution   # Run ansible-playbook
└── Error handling         # Show helpful error messages
```

#### Error Handling

The script provides helpful error messages for common issues:

1. **Ansible not installed**
   ```
   ✗ Ansible is not installed
   ℹ Install with: pip install ansible
   ```

2. **Playbook not found**
   ```
   ✗ Playbook not found: playbooks/frontend-deploy.yml
   ```

3. **Vault password file missing**
   ```
   ⚠ Vault password file not found at ~/.vault_pass.txt
   ℹ You will be prompted for the vault password
   ```

4. **Deployment failed**
   ```
   ✗ Deployment failed!
   ℹ Troubleshooting tips:
   [Helpful commands and documentation links]
   ```

#### Troubleshooting

If the script fails:

1. **Run with verbose mode**:
   ```bash
   ./bin/frontend-deploy -vvv
   ```

2. **Check prerequisites manually**:
   ```bash
   ansible-playbook --version
   ls -la ~/.vault_pass.txt
   aws sts get-caller-identity
   ```

3. **Test Ansible directly**:
   ```bash
   cd playbooks
   ansible-playbook frontend-deploy.yml --check
   ```

4. **Check CloudFormation stack**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name portfolio-frontend-stack \
     --profile patrickcmd
   ```

## Adding New Scripts

When adding new deployment scripts to this directory:

1. **Make them executable**:
   ```bash
   chmod +x bin/new-script
   ```

2. **Include shebang**:
   ```bash
   #!/usr/bin/env bash
   ```

3. **Use set options**:
   ```bash
   set -euo pipefail
   ```

4. **Add help function**:
   ```bash
   show_help() {
       cat << EOF
   Usage information here...
   EOF
   }
   ```

5. **Check prerequisites**:
   ```bash
   check_prerequisites() {
       # Verify required tools
   }
   ```

6. **Update this README**

---

### `s3-upload`

Build and upload React + Vite frontend to S3 bucket.

#### Features

- ✅ Automated frontend build (production or development mode)
- ✅ Direct S3 upload with sync
- ✅ Proper cache control headers
- ✅ MIME type detection
- ✅ Dependency installation if needed
- ✅ Build verification
- ✅ Selective operations (build-only, upload-only)
- ✅ Clean build artifacts

#### Usage

```bash
# Build and upload (default)
./bin/s3-upload

# Build and upload with verbose output
./bin/s3-upload --verbose

# Only build (don't upload)
./bin/s3-upload --build

# Only upload (requires existing build)
./bin/s3-upload --upload

# Build in development mode
./bin/s3-upload --dev

# Clean build artifacts
./bin/s3-upload --clean

# Very verbose output
./bin/s3-upload -vvv

# Show help
./bin/s3-upload --help
```

#### Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-v, --verbose` | Verbose output (-v, -vv, -vvv) |
| `--build` | Only build the frontend |
| `--upload` | Only upload to S3 |
| `--clean` | Clean build artifacts |
| `--dev` | Build in development mode |
| `--prod` | Build in production mode (default) |
| `--vault-password-file` | Path to vault password file |

#### What It Does

1. **Checks Prerequisites**:
   - Node.js and npm installed
   - Ansible installed
   - Vault password file exists
   - Frontend directory exists

2. **Builds Frontend**:
   - Installs npm dependencies if needed
   - Runs `npm run build` (production) or `npm run build:dev`
   - Verifies build directory created

3. **Uploads to S3**:
   - Syncs files from `frontend/dist/` to S3 bucket
   - Sets proper MIME types (.html, .css, .js, etc.)
   - Configures cache control headers
   - Removes files from S3 not in local build (clean sync)

#### Cache Control Strategy

The script sets optimized cache headers:

- **Assets (JS, CSS, images)**: `public, max-age=31536000, immutable`
  - Cached for 1 year
  - Perfect for content-hashed files from Vite

- **HTML files**: `no-cache, no-store, must-revalidate`
  - Never cached
  - Ensures users always get latest version

#### Examples

##### Example 1: Full Build and Upload

```bash
./bin/s3-upload
```

This will:
1. Check prerequisites
2. Install npm dependencies if needed
3. Build frontend in production mode
4. Upload all files to S3
5. Set proper cache headers

##### Example 2: Build Only

```bash
./bin/s3-upload --build
```

Useful when:
- You want to test the build locally first
- You're iterating on build configuration
- You want to review dist/ before uploading

##### Example 3: Upload Existing Build

```bash
./bin/s3-upload --upload
```

Useful when:
- Build already exists in dist/
- You've manually modified dist/ contents
- You want to re-upload without rebuilding

##### Example 4: Development Build

```bash
./bin/s3-upload --dev
```

This will:
1. Build using `npm run build:dev`
2. Upload to S3
3. Useful for staging environments

##### Example 5: Clean Artifacts

```bash
./bin/s3-upload --clean
```

This will:
- Remove `frontend/dist/` directory
- Remove `frontend/node_modules/` directory
- Useful for freeing disk space

##### Example 6: Verbose Deployment

```bash
./bin/s3-upload -vvv
```

Shows:
- All Ansible task details
- S3 sync progress
- File-by-file upload information

#### Workflow Integration

**Typical Development Workflow**:

```bash
# 1. Make changes to frontend code
# (edit files in frontend/src/)

# 2. Build and upload to S3
./bin/s3-upload --verbose

# 3. Test the website
# Visit the S3 website URL from stack outputs

# 4. If issues found, iterate
./bin/s3-upload --build  # Build only to test locally
./bin/s3-upload --upload # Upload when ready
```

**Production Deployment**:

```bash
# Full deployment flow
./bin/frontend-deploy     # Deploy infrastructure
./bin/s3-upload           # Build and upload frontend
./bin/stack-manager outputs  # Get website URL
```

#### Prerequisites

1. **Node.js and npm**:
   ```bash
   node --version  # Should be v16+ for Vite
   npm --version
   ```

2. **Ansible with AWS collection**:
   ```bash
   pip install ansible boto3 botocore
   ansible-galaxy collection install amazon.aws
   ```

3. **Vault Password File**:
   ```bash
   echo "your-vault-password" > ~/.vault_pass.txt
   chmod 600 ~/.vault_pass.txt
   ```

4. **S3 Bucket**: Must be created first
   ```bash
   ./bin/frontend-deploy  # Creates S3 bucket
   ```

#### Troubleshooting

**Build Fails**:
```bash
# Install dependencies manually
cd frontend
npm install

# Try building manually
npm run build

# Check for errors in package.json
```

**Upload Fails**:
```bash
# Verify AWS credentials
aws s3 ls --profile patrickcmd

# Check bucket exists
./bin/stack-manager status

# Verify bucket name in vault config
ansible-vault view playbooks/vaults/config.yml

# Run with verbose mode
./bin/s3-upload --upload -vvv
```

**Permission Errors**:
```bash
# Check AWS IAM permissions for S3
aws iam get-user --profile patrickcmd

# Verify bucket policy allows PutObject
aws s3api get-bucket-policy --bucket patrickcmd.dev
```

#### Advanced Usage

**Custom Vault Location**:
```bash
./bin/s3-upload --vault-password-file /path/to/vault_pass.txt
```

**Environment Variable**:
```bash
export VAULT_PASSWORD_FILE=/custom/path/vault_pass.txt
./bin/s3-upload
```

**Build-only in CI/CD**:
```yaml
# GitHub Actions
- name: Build Frontend
  run: ./aws/bin/s3-upload --build

- name: Upload to S3
  run: ./aws/bin/s3-upload --upload
```

## Directory Structure

```
bin/
├── README.md              # This file
├── stack-manager          # CloudFormation stack management tool
├── frontend-deploy        # Frontend deployment script
├── s3-upload              # Build and upload frontend to S3
└── [future scripts]       # Backend, CDN, etc.
```

## Quick Reference

### Common Workflows

**Deploy Infrastructure**:
```bash
./bin/frontend-deploy --verbose
```

**Build and Upload Frontend**:
```bash
./bin/s3-upload --verbose
```

**Check Deployment Status**:
```bash
./bin/stack-manager status
```

**Debug Failed Deployment**:
```bash
./bin/stack-manager failures
./bin/stack-manager events --limit 50
```

**Clean Up Failed Stack**:
```bash
./bin/stack-manager delete
```

**Full Deployment Cycle**:
```bash
# 1. Deploy infrastructure (S3 bucket)
./bin/frontend-deploy

# 2. Build and upload frontend
./bin/s3-upload

# 3. Check status
./bin/stack-manager status

# 4. View outputs (website URL)
./bin/stack-manager outputs
```

**Quick Frontend Update**:
```bash
# After making code changes, rebuild and upload
./bin/s3-upload --verbose
```

## Related Documentation

- [Playbooks README](../playbooks/README.md) - Ansible playbook documentation
- [Quick Start Guide](../playbooks/QUICKSTART.md) - 5-minute setup
- [CloudFormation Config](../playbooks/CLOUDFORMATION_CONFIG.md) - CFN settings explained
- [Ansible Vault Guide](../playbooks/vaults/README.md) - Vault documentation

## Support

For issues or questions:
1. Check the troubleshooting section in [playbooks/README.md](../playbooks/README.md#troubleshooting)
2. Review Ansible logs with `-vvv` flag
3. Check AWS CloudFormation console for stack events
