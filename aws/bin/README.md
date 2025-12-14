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

---

### `route53-setup`

Automate Route 53 DNS configuration for CloudFront distribution.

#### Features

- ✅ Retrieves CloudFront distribution domain from stack
- ✅ Creates A records for both apex and www domains
- ✅ Uses Route 53 alias records (free, no queries charged)
- ✅ Waits for DNS propagation (monitors change status)
- ✅ Verifies DNS records after creation
- ✅ Color-coded output with progress indicators

#### Usage

```bash
# Default usage (uses default stack name)
./bin/route53-setup

# With custom stack name
STACK_NAME=your-stack-name ./bin/route53-setup

# With environment variables
AWS_PROFILE=yourprofile DOMAIN_NAME=yourdomain.com ./bin/route53-setup
```

#### What It Does

1. **Retrieves CloudFront Information**:
   - Gets CloudFront distribution domain from CloudFormation stack
   - Example: `d3jnyva6fvgm7y.cloudfront.net`

2. **Gets Route 53 Hosted Zone**:
   - Finds hosted zone ID for your domain
   - Verifies hosted zone exists

3. **Creates DNS Records**:
   - Creates A record for apex domain (patrickcmd.dev)
   - Creates A record for www subdomain (www.patrickcmd.dev)
   - Both point to CloudFront distribution (alias records)
   - Uses UPSERT action (creates or updates)

4. **Waits for Propagation**:
   - Monitors Route 53 change status
   - Typically completes in 1-5 minutes

5. **Verifies Setup**:
   - Lists created A records
   - Tests DNS resolution
   - Shows next steps

#### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STACK_NAME` | `portfolio-frontend-stack` | CloudFormation stack name |
| `AWS_REGION` | `us-east-1` | AWS region |
| `AWS_PROFILE` | `patrickcmd` | AWS CLI profile |
| `DOMAIN_NAME` | `patrickcmd.dev` | Primary domain |

#### Example

```bash
$ STACK_NAME=cloud-resume-challenge-portfolio-frontend-stack ./bin/route53-setup

╔════════════════════════════════════════════════════════════╗
║   Route 53 DNS Setup for CloudFront Distribution          ║
╚════════════════════════════════════════════════════════════╝

ℹ Configuration:
  Stack Name: cloud-resume-challenge-portfolio-frontend-stack
  AWS Region: us-east-1
  AWS Profile: patrickcmd
  Domain: patrickcmd.dev

ℹ Getting CloudFront distribution domain from stack...
✓ CloudFront Domain: d3jnyva6fvgm7y.cloudfront.net

ℹ Getting Route 53 hosted zone ID...
✓ Hosted Zone ID: Z062129419D3W5L72N4G6

ℹ Checking for existing A records...
ℹ No existing A record for patrickcmd.dev
ℹ No existing A record for www.patrickcmd.dev

ℹ Creating DNS change batch...
✓ DNS change batch created

ℹ Applying DNS changes to Route 53...
✓ DNS changes submitted successfully!

ℹ Waiting for DNS changes to propagate...
..✓ DNS changes have propagated!

✓ Route 53 DNS setup complete!

ℹ Verifying DNS records...
----------------------------------------------------------------
|                    ListResourceRecordSets                    |
+----------------------+----+----------------------------------+
|  patrickcmd.dev.     |  A |  d3jnyva6fvgm7y.cloudfront.net.  |
|  www.patrickcmd.dev. |  A |  d3jnyva6fvgm7y.cloudfront.net.  |
+----------------------+----+----------------------------------+

✓ Your website should now be accessible at:
  • https://patrickcmd.dev
  • https://www.patrickcmd.dev (redirects to apex)

✓ Setup complete! 🚀
```

#### Troubleshooting

**Hosted Zone Not Found**:
```bash
# List all hosted zones
aws route53 list-hosted-zones --profile patrickcmd

# Create hosted zone if needed
aws route53 create-hosted-zone \
  --name patrickcmd.dev \
  --caller-reference $(date +%s) \
  --profile patrickcmd
```

**Stack Not Found**:
```bash
# List all stacks
aws cloudformation list-stacks \
  --profile patrickcmd \
  --region us-east-1 \
  | grep StackName

# Use correct stack name
STACK_NAME=actual-stack-name ./bin/route53-setup
```

---

### `test-website`

Comprehensive website testing tool for CloudFront and DNS.

#### Features

- ✅ Tests CloudFront distribution directly
- ✅ Monitors DNS propagation status
- ✅ Verifies HTTPS access to custom domain
- ✅ Tests www to apex redirect (301)
- ✅ Validates SSL/TLS certificate
- ✅ Shows cache status (Hit/Miss)
- ✅ Color-coded test results

#### Usage

```bash
# Default usage
./bin/test-website

# With custom domains/CloudFront
CLOUDFRONT_DOMAIN=your-cf-domain.cloudfront.net \
APEX_DOMAIN=yourdomain.com \
./bin/test-website

# Monitor continuously (run every 60 seconds)
watch -n 60 ./bin/test-website
```

#### What It Tests

1. **CloudFront Distribution**:
   - HTTPS accessibility
   - Cache status (Hit/Miss from cloudfront)
   - Content type headers

2. **DNS Resolution**:
   - Apex domain (patrickcmd.dev)
   - WWW subdomain (www.patrickcmd.dev)
   - Shows if DNS has propagated

3. **HTTPS Access**:
   - Tests custom domain HTTPS
   - Shows response status
   - Displays cache headers

4. **WWW Redirect**:
   - Verifies 301 redirect
   - Checks redirect location
   - Confirms target is apex domain

5. **SSL/TLS Certificate**:
   - Validates certificate
   - Shows certificate subject
   - Displays expiration date

#### Example Output

```bash
$ ./bin/test-website

╔════════════════════════════════════════════════════════════╗
║           Website Testing - CloudFront + DNS              ║
╚════════════════════════════════════════════════════════════╝

ℹ Test 1: CloudFront Distribution Direct Access
  Testing: https://d3jnyva6fvgm7y.cloudfront.net

✓ CloudFront distribution is accessible
ℹ Cache Status: Hit from cloudfront
ℹ Content Type: text/html

ℹ Test 2: DNS Resolution

ℹ Checking DNS for patrickcmd.dev...
✓ DNS resolved: patrickcmd.dev → 13.224.123.45

ℹ Checking DNS for www.patrickcmd.dev...
✓ DNS resolved: www.patrickcmd.dev → 13.224.123.45

ℹ Test 3: HTTPS Access to Apex Domain
  Testing: https://patrickcmd.dev

✓ Apex domain is accessible via HTTPS
ℹ Cache Status: Hit from cloudfront

ℹ Test 4: WWW to Apex Redirect
  Testing: https://www.patrickcmd.dev → https://patrickcmd.dev

✓ WWW redirect is working (301 Moved Permanently)
ℹ Redirects to: https://patrickcmd.dev/
✓ Redirect target is correct

ℹ Test 5: SSL/TLS Certificate

✓ SSL certificate is valid
ℹ Subject: CN=*.patrickcmd.dev
ℹ Expires: Jan 15 12:00:00 2026 GMT

╔════════════════════════════════════════════════════════════╗
║                      Test Summary                          ║
╚════════════════════════════════════════════════════════════╝

✓ All DNS records propagated
ℹ Your website should be fully accessible at:
  • https://patrickcmd.dev
  • https://www.patrickcmd.dev (redirects to apex)

ℹ Open in browser:
  https://patrickcmd.dev

ℹ CloudFront direct access (always works):
  https://d3jnyva6fvgm7y.cloudfront.net
```

#### Use Cases

**Monitor DNS Propagation**:
```bash
# Run continuously until DNS propagates
watch -n 60 ./bin/test-website
```

**Pre-Deployment Verification**:
```bash
# Test CloudFront before configuring DNS
./bin/test-website
# CloudFront test will pass, DNS tests will warn (expected)
```

**Post-Deployment Validation**:
```bash
# Verify everything works after DNS setup
./bin/test-website
# All 5 tests should pass
```

**Troubleshooting**:
```bash
# Identify which component is failing
./bin/test-website
# Check test output to isolate the issue
```

---

### `cloudfront-invalidate`

Invalidate CloudFront cache to serve fresh content immediately.

#### Features

- ✅ Invalidates CloudFront distribution cache
- ✅ Multiple invalidation strategies (all, HTML-only, custom paths)
- ✅ Cost-aware (first 1,000 paths/month free)
- ✅ Retrieves distribution ID from CloudFormation stack
- ✅ Progress tracking and status checking
- ✅ Verbose mode for debugging

#### Usage

```bash
# Invalidate everything (default)
./bin/cloudfront-invalidate

# Invalidate only HTML files (recommended for SPAs)
./bin/cloudfront-invalidate --html

# Invalidate specific paths
./bin/cloudfront-invalidate --paths "/index.html,/assets/main.js"

# Verbose mode
./bin/cloudfront-invalidate --verbose

# Show help
./bin/cloudfront-invalidate --help
```

#### Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-v, --verbose` | Verbose output (-v, -vv, -vvv) |
| `--all` | Invalidate all paths (/* - default) |
| `--html` | Invalidate only HTML files |
| `--paths PATHS` | Invalidate specific paths (comma-separated) |
| `--vault-password-file` | Path to vault password file |

#### What It Does

1. **Checks Prerequisites**:
   - Ansible installed
   - Vault password file exists
   - Playbook exists

2. **Gets Distribution ID**:
   - Retrieves from CloudFormation stack outputs
   - Uses stack name from vault configuration

3. **Creates Invalidation**:
   - Submits invalidation request to CloudFront
   - Returns invalidation ID and status

4. **Provides Guidance**:
   - Timeline expectations (1-5 minutes)
   - How to verify cache is cleared
   - How to check invalidation status

#### Invalidation Strategies

**`--all` (Default)**:
- Invalidates everything (`/*`)
- Use after major updates or full deployments
- Cost: 1 path

**`--html` (Recommended for SPAs)**:
- Invalidates only HTML files (`/index.html`, `/*.html`)
- Use for content updates in React/Vue/Angular apps
- Assets (JS, CSS, images) remain cached (good!)
- Cost: 2 paths

**`--paths` (Custom)**:
- Invalidate specific files or patterns
- Use when you know exactly what changed
- Cost: 1 path per file (wildcards count as 1)

#### Examples

##### Example 1: After Frontend Update (Recommended)

```bash
# Upload new content
./bin/s3-upload

# Invalidate only HTML (assets are content-hashed by Vite)
./bin/cloudfront-invalidate --html

# This is the most cost-effective approach for SPAs
```

##### Example 2: Full Cache Clear

```bash
# After major deployment changes
./bin/cloudfront-invalidate --all

# Or explicitly
./bin/cloudfront-invalidate
```

##### Example 3: Specific Files

```bash
# Changed only index.html and about page
./bin/cloudfront-invalidate --paths "/index.html,/about.html"

# Changed images
./bin/cloudfront-invalidate --paths "/images/*"

# Changed specific assets
./bin/cloudfront-invalidate --paths "/assets/logo.png,/assets/main.css"
```

##### Example 4: Verbose Output

```bash
# See detailed Ansible output
./bin/cloudfront-invalidate --html -vv

# Maximum verbosity
./bin/cloudfront-invalidate --all -vvv
```

#### Cost Information

CloudFront invalidation pricing:

| Volume | Cost |
|--------|------|
| First 1,000 paths/month | **FREE** |
| After 1,000 paths | $0.005 per path |

**Path counting:**
- Wildcard `/*` = 1 path
- `/index.html` = 1 path
- `/file1,/file2,/file3` = 3 paths

**Cost optimization:**
- Use `--html` instead of `--all` for SPAs
- Use Vite's content hashing (automatic)
- Invalidate only when necessary

#### Why HTML-Only Invalidation Works for SPAs

**Understanding Vite's Content Hashing:**

When you build with Vite (`npm run build`), it automatically generates unique filenames for all assets:

```
dist/
├── index.html
└── assets/
    ├── index-a1b2c3d4.js      # Hash changes when JS changes
    ├── index-e5f6g7h8.css     # Hash changes when CSS changes
    └── logo-i9j0k1l2.png      # Hash changes when image changes
```

**Why you only need to invalidate HTML files:**

1. **Assets have unique filenames** - When you change JS/CSS, Vite creates a new file with a different hash
   - Before: `index-a1b2c3d4.js`
   - After: `index-x9y8z7w6.js`
   - CloudFront sees this as a new file (cache miss) and fetches it from S3

2. **HTML references new assets** - When you invalidate `index.html`, CloudFront serves fresh HTML that points to the new asset filenames

3. **Cache headers optimize performance**:
   - Assets: `max-age=31536000,immutable` (1 year cache - safe because filenames change)
   - HTML: `no-cache,must-revalidate` (always fetch fresh)

**Example workflow:**
```bash
# 1. You change some React code
# 2. Build creates: assets/index-NEW123.js (different hash)
# 3. Upload to S3
./bin/s3-upload

# 4. Invalidate HTML only
./bin/cloudfront-invalidate --html

# Result:
# - Fresh index.html is served (references NEW123.js)
# - CloudFront fetches NEW123.js from S3 (cache miss)
# - Old assets (OLD123.js) stay in cache but are never requested
```

**This is why `--html` is recommended for SPAs!**

#### When to Invalidate

**✅ Invalidate when:**
- HTML content changed (use `--html`)
- Critical bug fixes need immediate deployment
- SEO-critical meta tags updated
- Branding/design overhaul deployed
- You updated JS/CSS/images (use `--html` - see above)

**❌ Don't invalidate when:**
- Assets have content hashes and you're using `--html` (they'll be fetched automatically)
- You can wait 24 hours for natural cache expiration
- Testing changes locally before deployment
- You modified an asset in-place without changing the filename (don't do this!)

**❌ Don't invalidate assets separately when:**
- Using Vite or any build tool with content hashing
- Your assets are in the `assets/` folder with hash-based filenames
- You're already invalidating HTML files (the new asset references will be fetched automatically)

#### Workflow Integration

**Recommended SPA Update Workflow:**

```bash
# 1. Make changes to frontend
cd frontend
# ... edit files ...

# 2. Build and upload
cd ../aws
./bin/s3-upload

# 3. Invalidate HTML only (assets are versioned)
./bin/cloudfront-invalidate --html

# 4. Verify
./bin/test-website
```

**Full Deployment Workflow:**

```bash
# Major changes: infrastructure, all content, etc.
./bin/frontend-deploy
./bin/s3-upload
./bin/cloudfront-invalidate --all
./bin/test-website
```

#### Verify Invalidation

**Check invalidation status:**

```bash
# Get distribution ID
DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name cloud-resume-challenge-portfolio-frontend-stack \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

# List invalidations
aws cloudfront list-invalidations \
  --distribution-id $DIST_ID \
  --profile patrickcmd

# Check specific invalidation
aws cloudfront get-invalidation \
  --distribution-id $DIST_ID \
  --id INVALIDATION_ID \
  --profile patrickcmd
```

**Verify cache is cleared:**

```bash
# Test your website
curl -I https://patrickcmd.dev

# Check x-cache header:
# - "Miss from cloudfront" = cache was invalidated (good!)
# - "Hit from cloudfront" = serving cached content
```

#### Troubleshooting

**Invalidation Fails**:
```bash
# Check AWS credentials
aws sts get-caller-identity --profile patrickcmd

# Verify distribution exists
aws cloudfront list-distributions --profile patrickcmd

# Run with verbose mode
./bin/cloudfront-invalidate --html -vvv
```

**Cache Still Showing Old Content**:
```bash
# Wait 1-5 minutes for invalidation to complete
sleep 300

# Check invalidation status (should be "Completed")
aws cloudfront list-invalidations --distribution-id $DIST_ID --profile patrickcmd

# Clear local browser cache
# Chrome: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)
```

**Cost Concerns**:
```bash
# Always use --html for SPA updates
./bin/cloudfront-invalidate --html  # Only 2 paths

# Instead of --all which invalidates everything
./bin/cloudfront-invalidate --all   # 1 path, but clears ALL cached content
```

---

### `budget-setup`

Monitor and manage AWS monthly budgets with email notifications.

#### Features

- ✅ Create recurring monthly budgets
- ✅ Configure spending thresholds with email alerts
- ✅ Update existing budgets
- ✅ Check budget status and current spend
- ✅ List all budgets
- ✅ Delete budgets with confirmation
- ✅ Automatic AWS account ID detection
- ✅ Color-coded output for readability

#### Prerequisites

**IMPORTANT: IAM Billing Access Required**

By default, IAM users and roles in an AWS account cannot access the Billing and Cost Management console, even if they have the AdministratorAccess policy attached. Both `budget-setup` and `billing-alarm-setup` require billing access to be enabled.

See the [billing-alarm-setup Prerequisites](#prerequisites) section for detailed steps to enable IAM billing access.

**Note on Email Notifications:**
AWS Budgets notification emails are often unreliable. If you don't receive confirmation emails, consider using [billing-alarm-setup](#billing-alarm-setup) instead, which provides more reliable email notifications via direct SNS control.

#### Usage

```bash
# Create budget with defaults ($20, 80% threshold)
./bin/budget-setup --create

# Create budget with custom values
./bin/budget-setup --create --amount 50 --threshold 90 --email your@email.com

# Update existing budget
./bin/budget-setup --update --amount 30

# Check budget status
./bin/budget-setup --status

# List all budgets
./bin/budget-setup --list

# Delete budget (with confirmation)
./bin/budget-setup --delete

# Show help
./bin/budget-setup --help
```

#### Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `-c, --create` | Create a new budget |
| `-u, --update` | Update existing budget |
| `-d, --delete` | Delete budget (requires confirmation) |
| `-s, --status` | Show budget status (default) |
| `-l, --list` | List all budgets |
| `--amount AMOUNT` | Budget amount in USD (default: 20) |
| `--threshold PERCENT` | Alert threshold percentage (default: 80) |
| `--email EMAIL` | Email for notifications (default: pwalukagga@gmail.com) |
| `--name NAME` | Budget name (default: cloud-resume-challenge-budget) |
| `--profile PROFILE` | AWS profile to use (default: patrickcmd) |

#### What It Does

1. **Checks Prerequisites**:
   - AWS CLI installed
   - AWS profile configured
   - Valid AWS credentials

2. **Gets Account ID**:
   - Automatically retrieves your AWS account ID
   - Validates credentials are working

3. **Creates/Updates Budget**:
   - Sets up monthly cost budget
   - Configures notification thresholds
   - Sets up email alerts via SNS

4. **Shows Status**:
   - Current spend vs budget limit
   - Forecasted spend (if available)
   - Budget percentage used
   - Notification configuration

#### Budget Configuration

**Default Configuration:**
- Budget Name: `cloud-resume-challenge-budget`
- Amount: `$20/month`
- Threshold: `80%` (alert when spending reaches $16)
- Email: `pwalukagga@gmail.com`
- AWS Profile: `patrickcmd`

**Environment Variables:**
You can set defaults via environment variables:

```bash
export BUDGET_NAME=my-custom-budget
export BUDGET_AMOUNT=50
export THRESHOLD_PERCENT=90
export EMAIL_ADDRESS=your@email.com
export AWS_PROFILE=myprofile

./bin/budget-setup --create
```

#### Examples

##### Example 1: Create Budget with Defaults

```bash
./bin/budget-setup --create
```

This will:
1. Create a monthly budget of $20
2. Set alert threshold at 80% ($16)
3. Send email notifications to pwalukagga@gmail.com
4. You'll receive a confirmation email from AWS

##### Example 2: Create Custom Budget

```bash
./bin/budget-setup --create \
  --amount 100 \
  --threshold 75 \
  --email team@company.com \
  --name production-budget
```

This creates:
- Monthly budget: $100
- Alert at: $75 (75%)
- Email: team@company.com
- Budget name: production-budget

##### Example 3: Update Existing Budget

```bash
# Increase budget limit
./bin/budget-setup --update --amount 30

# Change threshold
./bin/budget-setup --update --threshold 90

# Update both
./bin/budget-setup --update --amount 40 --threshold 85
```

##### Example 4: Check Budget Status

```bash
./bin/budget-setup --status
```

Output shows:
```
Budget Details:
  Name: cloud-resume-challenge-budget
  Amount: $20.0 USD
  Time Period: MONTHLY
  Type: COST
  Current Spend: $4.25 (21.3%)
  Forecasted Spend: $8.50 (42.5%)

Notifications:
  GREATER_THAN | 80.0 | PERCENTAGE | ACTUAL
```

##### Example 5: List All Budgets

```bash
./bin/budget-setup --list
```

Shows table of all budgets in your account:
```
BudgetName                      | Amount | Unit | TimeUnit
--------------------------------|--------|------|----------
cloud-resume-challenge-budget   | 20.0   | USD  | MONTHLY
production-budget               | 100.0  | USD  | MONTHLY
```

##### Example 6: Delete Budget

```bash
./bin/budget-setup --delete
# Prompts: Are you sure you want to delete this budget? (yes/no):
```

#### Email Notifications

**What You'll Receive:**

When your spending reaches the threshold (e.g., 80% of $20 = $16):

1. **Initial Setup**: AWS sends a subscription confirmation email
   - You MUST click the confirmation link
   - Check spam folder if not received

2. **Alert Email**: When threshold is reached
   - Subject: "AWS Budgets: cloud-resume-challenge-budget has exceeded your alert threshold"
   - Body: Current spend, budget limit, percentage used
   - Sent immediately when threshold is crossed

**Email Setup Steps:**

1. Run `./bin/budget-setup --create`
2. Check your email for "AWS Notification - Subscription Confirmation"
3. Click "Confirm subscription" link
4. You'll receive a confirmation page
5. Future alerts will be delivered to this email

#### Cost Tracking

**What's Included in Budget:**

The budget tracks these AWS costs:
- ✅ Tax
- ✅ Subscriptions (e.g., Support plans)
- ✅ Upfront costs (e.g., Reserved Instances)
- ✅ Recurring costs
- ✅ Support charges
- ✅ Discounts (shown as negative)
- ❌ Refunds (excluded)
- ❌ Credits (excluded)

**Typical Cloud Resume Challenge Costs:**

| Service | Monthly Cost |
|---------|-------------|
| S3 Storage (1GB) | $0.02 |
| S3 Requests (10k) | $0.01 |
| CloudFront (1GB transfer) | $0.09 |
| Route 53 (hosted zone) | $0.50 |
| ACM Certificate | **FREE** |
| Lambda (within free tier) | **FREE** |
| **Estimated Total** | **$0.62/month** |

A $20 budget provides comfortable headroom for:
- Development/testing cycles
- Traffic spikes
- Learning experiments

#### Monitoring and Alerts

**Budget Status:**
```bash
# Check current spend
./bin/budget-setup --status

# Monitor regularly
watch -n 3600 ./bin/budget-setup --status  # Check hourly
```

**AWS Console:**
- View budgets: [AWS Budgets Console](https://console.aws.amazon.com/billing/home#/budgets)
- See cost breakdown by service
- View spend patterns over time

**Cost Explorer:**
```bash
# Enable Cost Explorer (one-time, free)
aws ce get-cost-and-usage \
  --time-period Start=2025-12-01,End=2025-12-14 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --profile patrickcmd
```

#### Workflow Integration

**Initial Setup:**
```bash
# After deploying infrastructure
./bin/frontend-deploy
./bin/s3-upload

# Set up budget monitoring
./bin/budget-setup --create

# Confirm subscription email
# Check inbox for AWS confirmation
```

**Regular Monitoring:**
```bash
# Weekly check
./bin/budget-setup --status

# Monthly review before billing cycle
./bin/budget-setup --status
aws ce get-cost-and-usage \
  --time-period Start=$(date -v-1m +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --profile patrickcmd
```

**Adjust Budget:**
```bash
# After adding new services
./bin/budget-setup --update --amount 30

# Before major traffic event
./bin/budget-setup --update --threshold 95
```

#### Troubleshooting

**Budget Creation Fails:**
```bash
# Check AWS credentials
aws sts get-caller-identity --profile patrickcmd

# Verify IAM permissions (budgets:CreateBudget required)
aws iam get-user --profile patrickcmd

# Check if budget name already exists
./bin/budget-setup --list
```

**Not Receiving Email Notifications:**
```bash
# 1. Check subscription status
aws sns list-subscriptions --profile patrickcmd

# 2. Re-create notification
./bin/budget-setup --delete
./bin/budget-setup --create

# 3. Check spam folder for confirmation email

# 4. Verify email address is correct
./bin/budget-setup --status
```

**Budget Not Updating:**
```bash
# Budget must exist to update
./bin/budget-setup --list

# If doesn't exist, create first
./bin/budget-setup --create

# Then update
./bin/budget-setup --update --amount 30
```

**AWS CLI Not Found:**
```bash
# Install AWS CLI
pip install awscli

# Or on macOS
brew install awscli

# Configure profile
aws configure --profile patrickcmd
```

#### Best Practices

1. **Set Realistic Budgets:**
   - Start conservative ($20 for learning projects)
   - Increase as you understand costs
   - Review actual spend monthly

2. **Use Multiple Thresholds:**
   - 50% threshold: Early warning
   - 80% threshold: Action required
   - 100% threshold: Budget exceeded

   ```bash
   # Create multiple budgets with different thresholds
   ./bin/budget-setup --create --name early-warning --threshold 50
   ./bin/budget-setup --create --name action-required --threshold 80
   ```

3. **Monitor Regularly:**
   - Weekly status checks
   - Monthly cost analysis
   - Quarterly budget reviews

4. **Clean Up Unused Resources:**
   ```bash
   # Delete unused stacks
   ./bin/stack-manager delete

   # Empty S3 buckets
   aws s3 rm s3://your-bucket --recursive --profile patrickcmd

   # Delete Route 53 hosted zones
   ./bin/route53-setup --delete
   ```

5. **Use AWS Free Tier:**
   - Stay within free tier limits when learning
   - Enable free tier alerts in AWS Console
   - Monitor free tier usage: [Free Tier Dashboard](https://console.aws.amazon.com/billing/home#/freetier)

#### Related AWS Services

- **AWS Cost Explorer**: Detailed cost analysis and forecasting
- **AWS Cost Anomaly Detection**: ML-based unusual spend detection
- **AWS Trusted Advisor**: Cost optimization recommendations
- **AWS Billing Alarms**: CloudWatch-based billing alerts (older method)

---

### billing-alarm-setup

**Alternative Budget Monitoring via CloudWatch Billing Alarms**

A more reliable alternative to AWS Budgets that uses CloudWatch billing alarms with direct SNS control for email notifications.

#### Prerequisites

**IMPORTANT: IAM Billing Access Required**

By default, IAM users and roles in an AWS account cannot access the Billing and Cost Management console, even if they have the AdministratorAccess policy attached. To enable this access, you must configure the Activate IAM Access setting and assign the necessary permissions.

**Steps to Enable Billing Access:**

1. **Sign in with the Root Account:**
   - Use the Root account credentials to sign in to the AWS Management Console.

2. **Activate IAM Access:**
   - Navigate to **My Account**.
   - Scroll down to **IAM User and Role Access to Billing Information**.
   - Click **Edit**, select the checkbox for **Activate IAM Access**, and choose **Update**.

3. **Assign Billing Permissions:**
   - In the AWS Management Console, search for **IAM** in the dashboard.
   - Go to the **Users** section and select the IAM user you want to grant billing access.
   - Click **Add Permissions**:
     - Choose **Add Permission** > **Create Group** (if needed).
     - Add the policy **AWSBillingReadOnlyAccess** (or other relevant policies).
     - Save changes.

4. **Test Access:**
   - Log out of the root account and log in using the IAM user account to confirm billing console access.

**Note:**
If using the new AWS console UI, adding billing permissions via IAM may be required even after activating IAM access. For full administrative access, ensure the AdministratorAccess policy is also attached.

#### Features

- **CloudWatch Billing Alarms**: Uses CloudWatch EstimatedCharges metric instead of AWS Budgets
- **Direct SNS Control**: Creates and manages SNS topic directly for reliable email delivery
- **Immediate Test Email**: Sends test alarm to verify email notifications work
- **Simple Configuration**: Single command to set up complete monitoring
- **Cost Effective**: CloudWatch alarms are free for billing metrics, SNS notifications are $0.50 per million emails

#### Why Use This Instead of budget-setup?

**Advantages over AWS Budgets:**
- ✅ More reliable email notifications (AWS Budgets confirmation emails often don't arrive)
- ✅ Direct control over SNS topic and subscriptions
- ✅ Immediate test capability to verify emails work
- ✅ Simpler setup - one command does everything
- ✅ Can trigger test alarms anytime

**Trade-offs:**
- ❌ No native "monthly budget" concept (uses continuous monitoring)
- ❌ Threshold is absolute dollar amount, not percentage
- ❌ No cost forecasting features

#### Usage

**Create Billing Alarm (Default: $16 threshold)**:
```bash
./bin/billing-alarm-setup
```

**Create with Custom Threshold**:
```bash
THRESHOLD=25 EMAIL_ADDRESS=your@email.com ./bin/billing-alarm-setup
```

**Environment Variables**:
```bash
ALARM_NAME="cloud-resume-challenge-billing-alarm"  # CloudWatch alarm name
THRESHOLD="16"                                     # Alert at $16 USD (80% of $20)
EMAIL_ADDRESS="pwalukagga@gmail.com"              # Email for notifications
AWS_PROFILE="patrickcmd"                          # AWS CLI profile
SNS_TOPIC_NAME="billing-alarm-notifications"     # SNS topic name
AWS_REGION="us-east-1"                            # Must be us-east-1 for billing metrics
```

#### What It Does

1. **Checks Prerequisites**:
   - Verifies AWS CLI is installed
   - Confirms AWS profile exists
   - Gets AWS Account ID

2. **Creates SNS Topic**:
   - Creates topic: `billing-alarm-notifications`
   - Or reuses existing topic if already created

3. **Subscribes Email**:
   - Subscribes your email to SNS topic
   - Sends confirmation email (you must click the link!)
   - Or confirms subscription already exists

4. **Creates CloudWatch Alarm**:
   - Monitors `AWS/Billing` EstimatedCharges metric
   - Triggers when total charges ≥ threshold
   - Evaluates every 6 hours (21600 seconds)
   - Sends email via SNS when alarm state changes

5. **Sends Test Email**:
   - Optionally triggers test alarm to verify notifications work immediately

#### Important Notes

**Email Confirmation Required:**
After running the script, you MUST:
1. Check your email inbox (and spam folder)
2. Look for email from: `AWS Notifications <no-reply@sns.amazonaws.com>`
3. Subject: `AWS Notification - Subscription Confirmation`
4. Click the confirmation link
5. You won't receive alerts until confirmed!

**Billing Metric Delays:**
- AWS billing metrics update every 4-6 hours
- Total charges are estimated, not real-time
- Alarm evaluation period: 6 hours
- You may receive alert after already exceeding threshold

**Cost:**
- CloudWatch alarms for billing metrics: **FREE**
- SNS email notifications: **$0.50 per 1 million emails** (effectively free)
- First 1,000 SNS emails/month: **FREE**

#### Testing the Alarm

**Send Test Email Immediately:**
```bash
aws cloudwatch set-alarm-state \
  --alarm-name cloud-resume-challenge-billing-alarm \
  --state-value ALARM \
  --state-reason 'Testing billing alarm notification - this is a test' \
  --region us-east-1 \
  --profile patrickcmd
```

This triggers the alarm manually, sending an immediate email to verify notifications work.

#### Checking Alarm Status

**View Alarm Details:**
```bash
aws cloudwatch describe-alarms \
  --alarm-names cloud-resume-challenge-billing-alarm \
  --region us-east-1 \
  --profile patrickcmd
```

**Check SNS Subscriptions:**
```bash
# Get SNS topic ARN
SNS_TOPIC_ARN=$(aws sns list-topics \
  --region us-east-1 \
  --profile patrickcmd \
  --query "Topics[?contains(TopicArn, 'billing-alarm-notifications')].TopicArn" \
  --output text)

# List subscriptions
aws sns list-subscriptions-by-topic \
  --topic-arn $SNS_TOPIC_ARN \
  --region us-east-1 \
  --profile patrickcmd
```

**View Current Billing:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Billing \
  --metric-name EstimatedCharges \
  --dimensions Name=Currency,Value=USD \
  --start-time $(date -u -v-1d +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Maximum \
  --region us-east-1 \
  --profile patrickcmd
```

#### Email Notification Example

When the alarm triggers, you'll receive an email like:

```
Subject: ALARM: "cloud-resume-challenge-billing-alarm" in US East (N. Virginia)

You are receiving this email because your Amazon CloudWatch Alarm
"cloud-resume-challenge-billing-alarm" in the US East (N. Virginia)
region has entered the ALARM state, because "Threshold Crossed: 1 datapoint
[16.23 (14/12/24 12:00:00)] was greater than or equal to the threshold (16.0)."

View this alarm in the AWS Management Console:
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarm:...

Alarm Details:
- Name: cloud-resume-challenge-billing-alarm
- Description: Billing alarm for cloud-resume-challenge - triggers at $16
- State Change: OK -> ALARM
- Reason: Threshold Crossed
- Timestamp: Sunday 14 December, 2024 12:00:00 UTC
```

#### Troubleshooting

**Not Receiving Emails:**
1. Check email confirmation:
   ```bash
   aws sns list-subscriptions-by-topic \
     --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:billing-alarm-notifications \
     --region us-east-1 \
     --profile patrickcmd
   ```
   - If `SubscriptionArn` shows `PendingConfirmation`, check your email and click the link

2. Check spam/junk folder for AWS notification emails

3. Send test alarm to verify delivery:
   ```bash
   aws cloudwatch set-alarm-state \
     --alarm-name cloud-resume-challenge-billing-alarm \
     --state-value ALARM \
     --state-reason 'Testing' \
     --region us-east-1 \
     --profile patrickcmd
   ```

**Alarm Not Triggering:**
1. Verify alarm exists:
   ```bash
   aws cloudwatch describe-alarms \
     --alarm-names cloud-resume-challenge-billing-alarm \
     --region us-east-1 \
     --profile patrickcmd
   ```

2. Check current charges haven't exceeded threshold yet

3. Remember: billing metrics update every 4-6 hours (not real-time)

**IAM Permissions Issues:**
If you get access denied errors:
1. Verify billing access is enabled (see Prerequisites above)
2. Ensure IAM user has these policies:
   - `CloudWatchFullAccess` (for creating alarms)
   - `AmazonSNSFullAccess` (for SNS topics)
   - `AWSBillingReadOnlyAccess` (for billing metrics)

#### Comparison: billing-alarm-setup vs budget-setup

| Feature | billing-alarm-setup | budget-setup |
|---------|-------------------|--------------|
| **Email Reliability** | ✅ Excellent (direct SNS) | ⚠️ Poor (AWS internal SNS) |
| **Test Capability** | ✅ Immediate test emails | ❌ No test feature |
| **Setup Complexity** | ✅ Simple (one command) | ⚠️ Complex (confirmation issues) |
| **Monthly Budget** | ❌ No (continuous monitoring) | ✅ Yes (native monthly budgets) |
| **Threshold Type** | Dollar amount ($16) | Percentage (80%) |
| **Cost Forecasting** | ❌ No | ✅ Yes |
| **Multiple Thresholds** | ❌ One alarm per threshold | ✅ Multiple alerts per budget |
| **Budget Updates** | ❌ Must recreate alarm | ✅ Easy updates |
| **Historical Tracking** | ⚠️ Via CloudWatch | ✅ Native budget tracking |

**Recommendation**: Use `billing-alarm-setup` for reliable email notifications. Use `budget-setup` if you need detailed budget tracking and forecasting (but accept unreliable emails).

#### Example Workflow

**Complete Billing Monitoring Setup:**
```bash
# 1. Ensure IAM billing access is enabled (see Prerequisites)
#    - Login as root
#    - Activate IAM access in My Account
#    - Add billing permissions to IAM user

# 2. Create billing alarm
./bin/billing-alarm-setup

# 3. Check email for confirmation
#    - Subject: "AWS Notification - Subscription Confirmation"
#    - From: no-reply@sns.amazonaws.com
#    - Click "Confirm subscription" link

# 4. Send test email to verify it works
aws cloudwatch set-alarm-state \
  --alarm-name cloud-resume-challenge-billing-alarm \
  --state-value ALARM \
  --state-reason 'Testing billing alarm - ignore this test' \
  --region us-east-1 \
  --profile patrickcmd

# 5. You should receive test email within 1-2 minutes

# 6. Check alarm status
aws cloudwatch describe-alarms \
  --alarm-names cloud-resume-challenge-billing-alarm \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'MetricAlarms[0].[AlarmName,StateValue,StateReason]' \
  --output table
```

**Monthly Review:**
```bash
# Check current month's charges
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --profile patrickcmd \
  --region us-east-1
```

---

## AWS Free Tier Usage Monitoring

### Understanding AWS Free Tier

The AWS Free Tier allows new AWS account holders to access certain services for free for the first 12 months. This provides an opportunity to experiment with cloud services without incurring costs.

**Official Documentation**: [AWS Free Tier](https://aws.amazon.com/free/)

#### Key Free Tier Offerings

**12-Month Free Tier** (starts when you create your AWS account):
- **EC2**: 750 hours/month of t2.micro or t3.micro instances (Linux, RHEL, or Windows)
- **S3**: 5GB of standard storage
- **RDS**: 750 hours/month of db.t2.micro, db.t3.micro, or db.t4g.micro database instances
- **Lambda**: 1 million free requests/month
- **CloudFront**: 1TB of data transfer out
- **DynamoDB**: 25GB of storage

**Always Free** (doesn't expire):
- **Lambda**: 1 million requests/month
- **DynamoDB**: 25GB storage, 200 million requests/month
- **CloudWatch**: 10 custom metrics, 10 alarms
- **SNS**: 1,000 email notifications/month

**Free Trials** (varies by service):
- **RDS**: Free for first 2 months only
- **Other services**: Check AWS Free Tier page for details

**IMPORTANT**: Read the fine print for each service as stipulations vary!

### Setting Up Free Tier Usage Alerts (AWS Console)

#### Step 1: Enable Free Tier Usage Alerts

1. **Log into AWS Management Console**
   - Verify you're in the correct account (check top-right corner)
   - Switch to **N. Virginia (us-east-1)** region (billing metrics only available here)

2. **Navigate to Billing Dashboard**
   - Type "Billing" in the AWS Console search bar
   - Click on "Billing and Cost Management"

3. **Access Billing Preferences**
   - In the left-hand navigation pane, click **Preferences** (formerly "Billing preferences")

4. **Enable Free Tier Alerts**
   - Under the **Alert preferences** section, click **Edit**
   - Check ✅ **Receive AWS Free Tier usage alerts**
     - You'll be notified by email when you reach approximately **85% of Free Tier usage**
   - Optionally add alternate email addresses to receive alerts
   - Click **Update**

**What You'll Receive**:
- Email notifications when approaching Free Tier limits (typically at 85% usage)
- Alerts for services like EC2, S3, RDS, Lambda, etc.
- Example: "Your Free Tier usage limit is here and you have exceeded it"

#### Step 2: Enable CloudWatch Billing Alerts

1. **Still in Alert Preferences Section**
   - Click **Edit** again
   - Check ✅ **Receive CloudWatch billing alerts**
     - This enables billing metrics collection in CloudWatch
   - Click **Update**

2. **Create CloudWatch Billing Alarm** (after enabling)
   - Go to **CloudWatch** (search in AWS Console)
   - Ensure you're in **N. Virginia (us-east-1)** region
   - Navigate to **Alarms** → **Billing** → **Create alarm**
   - Select metric: **Billing** → **Total Estimated Charge**
   - Set threshold (e.g., $16 for 80% of $20 budget)
   - Configure SNS topic for email notifications
   - Create alarm

**Note**: This is the same as running `./bin/billing-alarm-setup` but done through the web console.

**Detailed Web Console Steps:**

1. **Navigate to CloudWatch Console**
   - Go to [CloudWatch Management Console](https://console.aws.amazon.com/cloudwatch)
   - **IMPORTANT**: Switch to **N. Virginia (us-east-1)** region (top-right corner)
   - Billing metrics are ONLY available in us-east-1

2. **Create Billing Alarm**
   - In left-hand pane, click **Billing**
   - Click **Create Alarm** button

   ![CloudWatch Billing](https://exampro-support.s3.amazonaws.com/AWS/CCP/Getting+Started/Billing+Alarm/2022-08-23+11_31_49-CloudWatch+Management+Console+-+Brave.png)

3. **Specify Metric and Conditions**
   - Click **Select metric** button

   ![Specify Metric](https://exampro-support.s3.amazonaws.com/AWS/CCP/Getting+Started/Billing+Alarm/2022-08-23+11_33_29-CloudWatch+Management+Console+-+Brave.png)

4. **Select Billing Metric**
   - In Browse tab, click **Billing**

   ![Select Billing](https://exampro-support.s3.amazonaws.com/AWS/CCP/Getting+Started/Billing+Alarm/2022-08-23+11_37_39-CloudWatch+Management+Console+-+Brave.png)

   - Select **Total Estimated Charge**

   ![Total Estimated Charge](https://exampro-support.s3.amazonaws.com/AWS/CCP/Getting+Started/Billing+Alarm/2022-08-23+11_38_51-CloudWatch+Management+Console+-+Brave.png)

   - In Currency dropdown, ensure **USD** is selected
   - Click **Select metric**

   ![Select USD](https://exampro-support.s3.amazonaws.com/AWS/CCP/Getting+Started/Billing+Alarm/2022-08-23+11_40_11-CloudWatch+Management+Console+-+Brave.png)

5. **Configure Alarm Conditions**
   - Set **Statistic** to **Maximum**
   - Set **Period** to **6 hours** (recommended) or any preferred interval
   - Under **Threshold type**, select **Static**
   - Under **Define the threshold value**, select **Greater than**
   - Enter threshold value (e.g., **16** for $16 USD, which is 80% of $20)
   - Click **Next**

   ![Set Threshold](https://exampro-support.s3.amazonaws.com/AWS/CCP/Getting+Started/Billing+Alarm/2022-08-23+11_45_26-CloudWatch+Management+Console+-+Brave.png)

6. **Configure Notifications (SNS Topic)**
   - Under **Notification**, select **Create new SNS topic**
   - **Topic name**: Enter `billing-alarm-notifications` (or any descriptive name)
   - **Email endpoints**: Enter your email address (e.g., `pwalukagga@gmail.com`)
   - Click **Create topic**
   - Click **Next**

   ![Configure SNS](https://exampro-support.s3.amazonaws.com/AWS/CCP/Getting+Started/Billing+Alarm/2022-08-23+11_47_40-CloudWatch+Management+Console+-+Brave.png)

   **IMPORTANT**: You will receive a **subscription confirmation email** from AWS SNS:
   - Check your email inbox (and spam folder)
   - Look for: "AWS Notification - Subscription Confirmation"
   - From: `no-reply@sns.amazonaws.com`
   - Click **Confirm subscription** link
   - Status should change from "Pending confirmation" to "Confirmed"

7. **Configure Actions (Optional)**
   - You can add actions to stop/scale resources when alarm triggers
   - For billing monitoring, typically not needed
   - Click **Next**

8. **Add Name and Description**
   - **Alarm name**: Enter `cloud-resume-challenge-billing-alarm` (or descriptive name)
   - **Description**: Enter `Billing alarm for Cloud Resume Challenge - triggers at $16`
   - Click **Next**

   ![Add Name](https://exampro-support.s3.amazonaws.com/AWS/CCP/Getting+Started/Billing+Alarm/2022-08-23+11_55_16-CloudWatch+Management+Console+-+Brave.png)

9. **Review and Create**
   - Review all settings:
     - Metric: Billing > Total Estimated Charge (USD)
     - Threshold: Greater than $16
     - Period: 6 hours
     - SNS Topic: billing-alarm-notifications
   - Click **Create alarm**

10. **Confirm Email Subscription**
    - Open your email inbox
    - Find email from AWS SNS
    - Click **Confirm subscription** link
    - Go back to SNS Console to verify status shows "Confirmed"

11. **Monitor Alarm Status**
    - Go to **CloudWatch** > **Alarms**
    - Find your newly created billing alarm
    - Status should show **OK** (green) until threshold is exceeded
    - When charges reach $16, status changes to **In alarm** (red)
    - You'll receive email notification

**Testing the Alarm (via Console)**:
1. Go to **CloudWatch** > **Alarms**
2. Select your billing alarm
3. Click **Actions** > **Set alarm state**
4. Select **In alarm**
5. Click **Update state**
6. You should receive a test email within 1-2 minutes

**Troubleshooting Web Console Setup:**

**Billing Metrics Not Showing?**
- Ensure you're in **N. Virginia (us-east-1)** region
- Verify billing alerts are enabled (Billing Preferences)
- Billing metrics may take a few hours for new AWS accounts
- Wait 4-6 hours and try again

**No Email Notifications?**
- Check spam/junk folder
- Verify SNS subscription is **Confirmed** (not Pending)
- Go to SNS Console > Subscriptions > Check status
- Re-send confirmation: Select subscription > Request confirmation
- Ensure alarm threshold is set correctly

**Alarm Shows "Insufficient Data"?**
- Normal for new alarms
- Billing data updates every 4-6 hours
- Wait up to 24 hours for first data point
- Alarm will show "OK" once data is available

**Can't Find CloudWatch Billing Option?**
- Ensure you enabled "Receive CloudWatch billing alerts" in Billing Preferences
- This must be enabled BEFORE billing metrics appear in CloudWatch
- After enabling, wait 15-30 minutes for metrics to populate

#### Step 3: Monitor Free Tier Usage

**Option 1: Billing Dashboard**
1. Go to **Billing Dashboard**
2. Click **Free Tier** in the left navigation
3. View current usage for all Free Tier services
4. See remaining hours/GB/requests for each service
5. Track usage trends over time

**Option 2: Cost Explorer**
1. Navigate to **Cost Explorer** (may need to enable first)
2. Filter by service to see detailed usage
3. Create custom reports for Free Tier services
4. Set up anomaly detection

**Option 3: AWS Budgets** (More Advanced)
1. Go to **AWS Budgets** in Billing Dashboard
2. Click **Create budget**
3. Choose **Zero spend budget** template for Free Tier accounts
4. Set alerts for when you exceed $0.01
5. Add email recipients

### Free Tier Usage Alerts vs Billing Alarms

| Feature | Free Tier Alerts | Billing Alarms (billing-alarm-setup) |
|---------|-----------------|-------------------------------------|
| **Setup** | Web console only | Script + CloudWatch + SNS |
| **Triggers** | 85% of Free Tier limits | Custom dollar threshold ($16) |
| **Granularity** | Per-service (EC2, S3, etc.) | Total account spending |
| **Email Delivery** | AWS managed (less reliable) | Direct SNS (more reliable) |
| **Free Tier Specific** | ✅ Yes | ❌ No (monitors all spending) |
| **Test Capability** | ❌ No | ✅ Yes (can trigger test) |
| **Best For** | Staying within Free Tier | Overall budget control |

**Recommendation**: Use **both** for comprehensive monitoring:
- Enable Free Tier alerts to track individual service limits
- Use `billing-alarm-setup` script for overall spending control

### Common Free Tier Pitfalls

**EC2 Instances**:
```bash
# Problem: Running t3.small instead of t2.micro/t3.micro
# Solution: Always use t2.micro or t3.micro for Free Tier
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].[InstanceId,InstanceType,State.Name]' \
  --output table \
  --profile patrickcmd

# Check if instances are Free Tier eligible
# Free Tier: t2.micro, t3.micro
# NOT Free Tier: t2.small, t3.small, t2.medium, etc.
```

**S3 Storage**:
- Free Tier: 5GB of S3 Standard storage
- Watch out for: S3 Glacier, S3 Intelligent-Tiering (not Free Tier)
- Data transfer OUT is limited to 100GB/month for first 12 months

**RDS Databases**:
- Free Tier: 750 hours/month of db.t2.micro, db.t3.micro, or db.t4g.micro
- Only for first **2 months** (not 12 months like EC2!)
- Watch out for: Multi-AZ deployments (doubles usage)

**CloudFront**:
- Free Tier: 1TB data transfer out
- 10 million HTTP/HTTPS requests
- For this project: Portfolio website should stay well under limits

**Lambda**:
- Always Free: 1 million requests/month
- 400,000 GB-seconds of compute time
- For this project: Visitor counter should be well under limits

### Monitoring Your Cloud Resume Challenge Costs

**Current Infrastructure** (All Free Tier):
- ✅ S3 bucket (< 1GB) → Well under 5GB limit
- ✅ CloudFront distribution (< 100GB/month) → Well under 1TB limit
- ✅ Route 53 (Hosted zone: $0.50/month) → **NOT FREE** but minimal
- ✅ CloudWatch alarms (< 10 alarms) → Free (Always Free tier)
- ✅ SNS email notifications (< 1,000/month) → Free (Always Free tier)
- ✅ AWS Budgets (2 budgets free) → Free

**Planned Backend** (Will be Free Tier):
- ✅ DynamoDB (< 25GB, < 200M requests) → Always Free
- ✅ Lambda visitor counter (< 1M requests) → Always Free
- ✅ API Gateway (< 1M requests) → Free for 12 months

**Expected Monthly Cost**:
- Route 53 Hosted Zone: **$0.50**
- Everything else: **$0.00** (if staying within Free Tier)
- **Total**: **~$0.50/month**

### Example: Setting Up Complete Free Tier Monitoring

**Step-by-Step Workflow**:

```bash
# 1. Enable IAM billing access (see billing-alarm-setup Prerequisites)
#    - Login as root
#    - Activate IAM access in My Account
#    - Add billing permissions to IAM user

# 2. Set up CloudWatch billing alarm (via script)
./bin/billing-alarm-setup

# This creates:
# - SNS topic for email notifications
# - CloudWatch alarm for $16 threshold (80% of $20)
# - Test email to verify delivery
```

**Then in AWS Console**:

```
3. Enable Free Tier Alerts:
   - Go to Billing Dashboard → Preferences
   - Check "Receive AWS Free Tier usage alerts"
   - Add email: pwalukagga@gmail.com
   - Save

4. Monitor Usage:
   - Billing Dashboard → Free Tier
   - Check usage weekly
   - Watch for services approaching limits

5. Set Up Budget (optional):
   - AWS Budgets → Create budget
   - Choose "Zero spend budget" template
   - Alert when spending > $0.01
   - Add email recipients
```

### Troubleshooting Free Tier Issues

**Not Receiving Free Tier Alerts:**
1. Check email address in Billing Preferences
2. Check spam/junk folder for AWS emails
3. Verify Free Tier alerts are enabled
4. Wait 24 hours for system to update

**Free Tier Services Showing Charges:**
1. Verify service is Free Tier eligible
   - Check [AWS Free Tier page](https://aws.amazon.com/free/)
   - Confirm instance/service type matches Free Tier
2. Check if you exceeded Free Tier limits
   - Billing Dashboard → Free Tier → View usage
3. Confirm Free Tier period hasn't expired
   - Free Tier starts when account is created
   - Most services: 12 months
   - Some services: 2 months (RDS) or Always Free

**Unexpected Charges:**
```bash
# Check detailed cost breakdown
aws ce get-cost-and-usage \
  --time-period Start=2025-12-01,End=2025-12-14 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE \
  --profile patrickcmd \
  --region us-east-1
```

### Best Practices for Staying in Free Tier

**1. Regular Monitoring:**
```bash
# Check billing weekly
./bin/budget-setup --status

# Monitor Free Tier usage in console
# Billing Dashboard → Free Tier (check weekly)
```

**2. Resource Cleanup:**
```bash
# Stop unused EC2 instances (you're charged by the hour)
aws ec2 stop-instances --instance-ids i-1234567890abcdef0 --profile patrickcmd

# Delete unused S3 objects
aws s3 rm s3://bucket-name/path --recursive --profile patrickcmd

# Delete unused CloudFormation stacks
./bin/stack-manager delete
```

**3. Use Free Tier Eligible Resources:**
- EC2: Always use t2.micro or t3.micro
- RDS: Use db.t2.micro, db.t3.micro, or db.t4g.micro
- S3: Use S3 Standard (not Glacier or Intelligent-Tiering)
- Lambda: Monitor request counts (should be < 1M/month)

**4. Set Multiple Alerts:**
- ✅ Free Tier usage alerts (85% of limits)
- ✅ CloudWatch billing alarm ($16 threshold)
- ✅ AWS Budget (zero spend for Free Tier validation)
- ✅ Cost anomaly detection (optional)

**5. Understand Service Limits:**
- 750 hours/month EC2 = **1 instance running 24/7** or **2 instances for 12 hours/day**
- If running multiple instances, monitor total hours carefully
- S3 Free Tier includes only first 5GB (not per bucket, but total account)

### Summary: Complete Monitoring Setup

For the Cloud Resume Challenge, here's the recommended monitoring setup:

**Via Scripts** (Recommended):
```bash
# 1. CloudWatch billing alarm
./bin/billing-alarm-setup

# 2. AWS Budget tracking (optional but useful)
./bin/budget-setup --create

# 3. Test alarm works
aws cloudwatch set-alarm-state \
  --alarm-name cloud-resume-challenge-billing-alarm \
  --state-value ALARM \
  --state-reason 'Testing' \
  --region us-east-1 \
  --profile patrickcmd
```

**Via AWS Console**:
```
1. Enable Free Tier usage alerts
   → Billing → Preferences → Free Tier alerts

2. Enable CloudWatch billing alerts
   → Billing → Preferences → CloudWatch alerts

3. Monitor Free Tier usage
   → Billing → Free Tier (check weekly)

4. Create Zero Spend Budget (optional)
   → AWS Budgets → Create → Zero spend template
```

**Email Notifications You'll Receive**:
- Free Tier usage approaching 85% (from AWS Free Tier system)
- Spending reaches $16 (from CloudWatch alarm via SNS)
- Budget threshold exceeded if using AWS Budgets
- Cost anomaly detection (if enabled)

This comprehensive setup ensures you stay within Free Tier limits while building your Cloud Resume Challenge project!

---

## Directory Structure

```
bin/
├── README.md                # This file
├── stack-manager            # CloudFormation stack management tool
├── frontend-deploy          # Frontend deployment script (S3 + CloudFront)
├── s3-upload                # Build and upload frontend to S3
├── route53-setup            # Configure Route 53 DNS for CloudFront
├── test-website             # Comprehensive website testing tool
├── cloudfront-invalidate    # CloudFront cache invalidation
├── budget-setup             # AWS Budget monitoring and management
├── billing-alarm-setup      # CloudWatch billing alarms (more reliable than budget-setup)
└── [future scripts]         # Backend, API, etc.
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

**Full Deployment Cycle (S3 + CloudFront + DNS)**:
```bash
# 1. Deploy infrastructure (S3 + CloudFront)
./bin/frontend-deploy

# 2. Build and upload frontend
./bin/s3-upload

# 3. Configure DNS (Route 53)
STACK_NAME=cloud-resume-challenge-portfolio-frontend-stack ./bin/route53-setup

# 4. Test website (monitor DNS propagation)
./bin/test-website

# 5. Check status
./bin/stack-manager status

# 6. View outputs (URLs)
./bin/stack-manager outputs
```

**Quick Frontend Update**:
```bash
# After making code changes, rebuild and upload
./bin/s3-upload --verbose

# Invalidate CloudFront cache (optional, for immediate updates)
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name cloud-resume-challenge-portfolio-frontend-stack \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --profile patrickcmd
```

**Configure DNS for CloudFront**:
```bash
# Setup Route 53 A records
STACK_NAME=cloud-resume-challenge-portfolio-frontend-stack ./bin/route53-setup

# Monitor DNS propagation
./bin/test-website
```

**Test Website (All Components)**:
```bash
# Run comprehensive tests
./bin/test-website

# Monitor continuously until DNS propagates
watch -n 60 ./bin/test-website
```

**Setup Billing Monitoring (Recommended)**:
```bash
# Setup CloudWatch billing alarm (more reliable)
./bin/billing-alarm-setup

# Or create AWS Budget (has detailed tracking but unreliable emails)
./bin/budget-setup --create

# Send test email to verify billing alarm works
aws cloudwatch set-alarm-state \
  --alarm-name cloud-resume-challenge-billing-alarm \
  --state-value ALARM \
  --state-reason 'Testing billing alarm' \
  --region us-east-1 \
  --profile patrickcmd

# Check budget status
./bin/budget-setup --status
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
