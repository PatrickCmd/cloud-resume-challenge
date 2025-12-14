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
