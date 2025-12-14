# CloudFront Configuration Guide

This guide explains the CloudFront setup for serving your website with HTTPS, custom domain, and www redirect.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Components](#components)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Route 53 DNS Setup](#route-53-dns-setup)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Cache Invalidation](#cache-invalidation)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User's Browser                             │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       │ HTTPS Request
                       │ (www.patrickcmd.dev or patrickcmd.dev)
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Route 53 DNS                                │
│  A Record: patrickcmd.dev     → CloudFront Distribution             │
│  A Record: www.patrickcmd.dev → CloudFront Distribution (same)      │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CloudFront Distribution                           │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │          CloudFront Function (viewer-request)              │    │
│  │  - Checks if host starts with "www."                       │    │
│  │  - If yes: 301 redirect to apex domain                     │    │
│  │  - If no: pass request through                             │    │
│  └────────────────────┬───────────────────────────────────────┘    │
│                       │                                              │
│                       │ (if no redirect)                             │
│                       ▼                                              │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │          Origin Access Control (OAC)                       │    │
│  │  - Signed SigV4 requests                                   │    │
│  │  - Authenticates with S3                                   │    │
│  └────────────────────┬───────────────────────────────────────┘    │
│                       │                                              │
│   Cache Policy: CachingOptimized                                    │
│   SSL/TLS: ACM Certificate (us-east-1)                              │
│   Compression: Enabled (Brotli, Gzip)                               │
│   HTTP Versions: HTTP/2, HTTP/3                                     │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
                        │ Signed S3 Request
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       S3 Bucket (PRIVATE)                            │
│  Bucket: patrickcmd.dev                                             │
│  - No public access                                                 │
│  - Only CloudFront OAC can access                                   │
│  - Bucket policy validates CloudFront ARN                           │
│  - SSL/TLS enforced                                                 │
│  - Versioning enabled                                               │
│  - AES-256 encryption                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Traffic Flow

1. **User requests website:**
   - User visits `https://patrickcmd.dev` OR `https://www.patrickcmd.dev`

2. **DNS Resolution (Route 53):**
   - Both `patrickcmd.dev` and `www.patrickcmd.dev` resolve to the same CloudFront distribution

3. **CloudFront Function (Viewer Request):**
   - Function executes on viewer request (before caching)
   - Checks the `Host` header
   - If request is for `www.patrickcmd.dev`:
     - Returns 301 redirect to `https://patrickcmd.dev`
     - Browser redirects to apex domain
   - If request is for `patrickcmd.dev`:
     - Request continues to origin

4. **CloudFront Distribution:**
   - Checks cache for requested object
   - If cached: Returns from edge location
   - If not cached: Requests from S3 origin

5. **Origin Access Control (OAC):**
   - CloudFront signs the request with SigV4
   - Includes CloudFront distribution ARN in the request
   - S3 validates the signature and ARN

6. **S3 Bucket:**
   - Verifies the request is from authorized CloudFront distribution
   - Returns the requested object
   - CloudFront caches the response and serves to user

---

## Prerequisites

Before deploying CloudFront, ensure you have:

### 1. ACM Certificate (Required)

You must have an **ACM (AWS Certificate Manager) certificate** for your domain in **us-east-1** region.

**Important:** CloudFront requires certificates to be in **us-east-1**, regardless of where your other resources are.

To create an ACM certificate:

```bash
# Request a certificate (must be in us-east-1)
aws acm request-certificate \
  --domain-name patrickcmd.dev \
  --subject-alternative-names www.patrickcmd.dev \
  --validation-method DNS \
  --region us-east-1

# Get the certificate ARN
aws acm list-certificates --region us-east-1

# Add DNS validation records to Route 53
# (AWS will provide CNAME records to add)
```

**Get your certificate ARN:**

```bash
aws acm list-certificates --region us-east-1 --query 'CertificateSummaryList[?DomainName==`patrickcmd.dev`].CertificateArn' --output text
```

The ARN format will be: `arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 2. Route 53 Hosted Zone (Required)

You must have a **Route 53 hosted zone** for your domain:

```bash
# Check if hosted zone exists
aws route53 list-hosted-zones --query "HostedZones[?Name=='patrickcmd.dev.']"

# Get the hosted zone ID
aws route53 list-hosted-zones --query "HostedZones[?Name=='patrickcmd.dev.'].Id" --output text
```

### 3. Domain Name (Required)

Your domain must be:
- Registered (via Route 53 or any registrar)
- Pointing to Route 53 nameservers (if registered elsewhere)

---

## Components

The CloudFormation template creates these resources:

### 1. S3 Bucket (Private)

```yaml
WebsiteBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: patrickcmd.dev
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
```

**Key Features:**
- Fully private (no public access)
- Versioning enabled
- AES-256 encryption
- SSL/TLS enforced via bucket policy
- Only CloudFront can access via OAC

### 2. Origin Access Control (OAC)

```yaml
CloudFrontOriginAccessControl:
  Type: AWS::CloudFront::OriginAccessControl
  Properties:
    OriginAccessControlConfig:
      Name: patrickcmd.dev-OAC
      OriginAccessControlOriginType: s3
      SigningBehavior: always
      SigningProtocol: sigv4
```

**Why OAC over OAI:**
- ✅ Uses SigV4 signing (more secure)
- ✅ Supports S3 SSE-KMS encryption
- ✅ Supports all S3 Regions
- ✅ Recommended by AWS (OAI is legacy)

### 3. CloudFront Function (WWW Redirect)

```javascript
function handler(event) {
    var request = event.request;
    var host = request.headers.host.value;

    // If request is for www subdomain, redirect to apex domain
    if (host.startsWith('www.')) {
        var newHost = host.replace('www.', '');
        return {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                location: { value: 'https://' + newHost + request.uri }
            }
        };
    }

    // Otherwise, return request unchanged
    return request;
}
```

**Key Features:**
- Runs at edge locations (fast)
- Executes on viewer-request (before caching)
- 301 redirect (permanent, SEO-friendly)
- Extremely low cost (~$0.01/month for 100K requests)

**Why CloudFront Functions over S3 Redirect:**
- ✅ **Cheaper**: First 2M invocations free, then $0.10/1M
- ✅ **Faster**: Runs at edge, no S3 roundtrip
- ✅ **Simpler**: One distribution instead of two
- ✅ **Better UX**: Single infrastructure to manage

### 4. CloudFront Distribution

```yaml
CloudFrontDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Aliases:
        - patrickcmd.dev
        - www.patrickcmd.dev
      DefaultRootObject: index.html
      Origins:
        - Id: S3Origin
          DomainName: !GetAtt WebsiteBucket.RegionalDomainName
          OriginAccessControlId: !Ref CloudFrontOriginAccessControl
      DefaultCacheBehavior:
        TargetOriginId: S3Origin
        ViewerProtocolPolicy: redirect-to-https
        CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # CachingOptimized
        FunctionAssociations:
          - EventType: viewer-request
            FunctionARN: !GetAtt WwwRedirectFunction.FunctionARN
```

**Key Features:**
- Custom domain aliases (patrickcmd.dev, www.patrickcmd.dev)
- ACM certificate for HTTPS
- HTTP/2 and HTTP/3 support
- Gzip and Brotli compression
- SPA-friendly (403/404 → index.html)
- Global edge locations (PriceClass_All)

---

## Configuration

### 1. Update Ansible Vault

Edit your vault configuration file:

```bash
# Decrypt the vault (if encrypted)
ansible-vault decrypt playbooks/vaults/config.yml --vault-password-file ~/.vault_pass.txt

# Edit the vault
vim playbooks/vaults/config.yml
```

Add the following configuration:

```yaml
# Domain and SSL/TLS Configuration
domain_config:
  domain_name: patrickcmd.dev
  acm_certificate_arn: arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id
```

**How to get your ACM Certificate ARN:**

```bash
# List certificates in us-east-1
aws acm list-certificates --region us-east-1

# Get specific certificate ARN
aws acm list-certificates --region us-east-1 \
  --query 'CertificateSummaryList[?DomainName==`patrickcmd.dev`].CertificateArn' \
  --output text
```

**Re-encrypt the vault:**

```bash
ansible-vault encrypt playbooks/vaults/config.yml --vault-password-file ~/.vault_pass.txt
```

### 2. Verify Configuration

Ensure your vault contains:

```yaml
---
# AWS Configuration
aws_config:
  region: us-east-1
  profile: patrickcmd

# CloudFormation Stack Configuration
cloudformation:
  stack_name: portfolio-frontend-stack
  template_path: ../frontend.yaml

# S3 Bucket Configuration
s3_config:
  bucket_name: patrickcmd.dev
  index_document: index.html
  error_document: index.html

# Domain and SSL/TLS Configuration
domain_config:
  domain_name: patrickcmd.dev
  acm_certificate_arn: arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Environment Configuration
deployment:
  environment: prod

# Stack Tags
stack_tags:
  Project: cloud-resume-challenge
  Component: frontend
  ManagedBy: ansible
  Owner: Patrick Walukagga
```

---

## Deployment

### Option 1: Using Frontend Deploy Script (Recommended)

```bash
cd aws

# Deploy infrastructure (S3 + CloudFront)
./bin/frontend-deploy
```

### Option 2: Using Ansible Directly

```bash
cd aws/playbooks

# Deploy with vault password prompt
ansible-playbook frontend-deploy.yml --ask-vault-pass

# Deploy with vault password file
ansible-playbook frontend-deploy.yml --vault-password-file ~/.vault_pass.txt
```

### Deployment Timeline

CloudFront distribution deployment takes **15-30 minutes**. The stack will show `CREATE_IN_PROGRESS` status during this time.

Monitor deployment:

```bash
# Watch stack events
aws cloudformation describe-stack-events \
  --stack-name portfolio-frontend-stack \
  --region us-east-1 \
  --query 'StackEvents[0:10].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId]' \
  --output table

# Check distribution status
aws cloudfront list-distributions \
  --query 'DistributionList.Items[?Comment==`CloudFront distribution for patrickcmd.dev`].[Id,Status,DomainName]' \
  --output table
```

After deployment completes, you'll see output like:

```
============================================
Stack Deployment Complete!
============================================
Stack Name: portfolio-frontend-stack
Stack Status: CREATE_COMPLETE

S3 Bucket Outputs:
  - Bucket Name: patrickcmd.dev
  - Bucket ARN: arn:aws:s3:::patrickcmd.dev

CloudFront Outputs:
  - Distribution ID: E1234567890ABC
  - Distribution Domain: d1234567890abc.cloudfront.net
  - CloudFront URL: https://d1234567890abc.cloudfront.net

Website URLs:
  - Primary URL: https://patrickcmd.dev
  - WWW URL (redirects): https://www.patrickcmd.dev

Next Steps:
  1. Upload content with: ./bin/s3-upload
  2. Update Route 53 DNS to point to CloudFront distribution
  3. Test: https://patrickcmd.dev
  4. Test redirect: https://www.patrickcmd.dev
============================================
```

---

## Route 53 DNS Setup

After CloudFront deployment, update your Route 53 DNS records to point to CloudFront.

### Get CloudFront Distribution Domain

```bash
# Get distribution domain from stack outputs
aws cloudformation describe-stacks \
  --stack-name portfolio-frontend-stack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionDomainName`].OutputValue' \
  --output text
```

This will return something like: `d1234567890abc.cloudfront.net`

### Update DNS Records

Create/update A records (alias) for both apex and www:

```bash
# Get your hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='patrickcmd.dev.'].Id" \
  --output text | cut -d'/' -f3)

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name portfolio-frontend-stack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

# Create DNS change batch file
cat > dns-changes.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "patrickcmd.dev",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d1234567890abc.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.patrickcmd.dev",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d1234567890abc.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

# Apply DNS changes
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://dns-changes.json
```

**Important Notes:**
- `Z2FDTNDATAQYW2` is CloudFront's hosted zone ID (constant for all CloudFront distributions)
- Replace `d1234567890abc.cloudfront.net` with your actual CloudFront domain
- DNS propagation takes 1-5 minutes for Route 53

### Verify DNS

```bash
# Check DNS propagation for apex domain
dig patrickcmd.dev

# Check DNS propagation for www
dig www.patrickcmd.dev

# Verify both point to CloudFront
dig patrickcmd.dev +short
dig www.patrickcmd.dev +short
```

---

## Testing

### 1. Test CloudFront Distribution (Before DNS)

```bash
# Get CloudFront URL
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
  --stack-name portfolio-frontend-stack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionURL`].OutputValue' \
  --output text)

# Test CloudFront directly
curl -I $CLOUDFRONT_URL

# Should return: HTTP/2 200
```

### 2. Upload Content

```bash
cd aws

# Build and upload frontend
./bin/s3-upload
```

### 3. Test Custom Domain (After DNS Setup)

```bash
# Test apex domain
curl -I https://patrickcmd.dev

# Should return: HTTP/2 200
# Content-Type: text/html
# x-cache: Hit from cloudfront (if cached) or Miss from cloudfront (first request)
```

### 4. Test WWW Redirect

```bash
# Test www redirect
curl -I https://www.patrickcmd.dev

# Should return:
# HTTP/2 301
# location: https://patrickcmd.dev/
```

### 5. Test SPA Routing

```bash
# Test non-existent route (should return index.html)
curl -I https://patrickcmd.dev/some/random/path

# Should return: HTTP/2 200 (not 404)
```

### 6. Browser Testing

Open in browser:
- https://patrickcmd.dev (should load website)
- https://www.patrickcmd.dev (should redirect to https://patrickcmd.dev)
- https://patrickcmd.dev/about (should load SPA route, not 404)

Check browser developer tools:
- **Network tab:** Verify `x-cache` header (Hit/Miss from cloudfront)
- **Security tab:** Verify SSL certificate is valid
- **Response headers:** Should include `x-amz-cf-id` (CloudFront request ID)

---

## Troubleshooting

### Issue 1: Certificate Validation Error

**Error:**
```
The specified SSL certificate doesn't exist, isn't in us-east-1 region,
isn't valid, or doesn't include a valid certificate chain.
```

**Solution:**
1. Verify certificate is in `us-east-1` region:
   ```bash
   aws acm list-certificates --region us-east-1
   ```

2. Verify certificate status is `ISSUED`:
   ```bash
   aws acm describe-certificate \
     --certificate-arn YOUR_ARN \
     --region us-east-1 \
     --query 'Certificate.Status'
   ```

3. If status is `PENDING_VALIDATION`, add DNS validation records to Route 53

### Issue 2: CloudFront Returns 403 Forbidden

**Error:** Accessing CloudFront URL returns 403 Forbidden

**Causes:**
1. **No content in S3:** Upload content with `./bin/s3-upload`
2. **Wrong origin domain:** Verify CloudFront uses `RegionalDomainName`, not `WebsiteURL`
3. **OAC not working:** Check S3 bucket policy allows CloudFront service principal

**Solution:**
```bash
# Check S3 bucket has content
aws s3 ls s3://patrickcmd.dev/

# If empty, upload content
cd aws && ./bin/s3-upload

# Verify bucket policy
aws s3api get-bucket-policy --bucket patrickcmd.dev --query Policy --output text | jq
```

### Issue 3: DNS Not Resolving

**Error:** `patrickcmd.dev` doesn't resolve or resolves to wrong IP

**Solution:**
```bash
# Check Route 53 records
aws route53 list-resource-record-sets \
  --hosted-zone-id YOUR_HOSTED_ZONE_ID \
  --query "ResourceRecordSets[?Name=='patrickcmd.dev.']"

# Verify DNS propagation
dig patrickcmd.dev +trace

# Check nameservers
dig patrickcmd.dev NS
```

### Issue 4: WWW Redirect Not Working

**Error:** `www.patrickcmd.dev` doesn't redirect or returns different content

**Causes:**
1. CloudFront Function not attached
2. Function has errors
3. DNS not pointing to CloudFront

**Solution:**
```bash
# Check function exists
aws cloudfront list-functions \
  --query "FunctionList.Items[?Name=='portfolio-frontend-stack-www-redirect']"

# Test function
aws cloudfront test-function \
  --name portfolio-frontend-stack-www-redirect \
  --event-object '{
    "version": "1.0",
    "context": {"eventType": "viewer-request"},
    "viewer": {"ip": "1.2.3.4"},
    "request": {
      "method": "GET",
      "uri": "/",
      "headers": {"host": {"value": "www.patrickcmd.dev"}}
    }
  }'

# Should return 301 redirect response
```

### Issue 5: CloudFormation Stack Stuck

**Error:** Stack shows `CREATE_IN_PROGRESS` for over 45 minutes

**Solution:**
```bash
# Check stack events for errors
aws cloudformation describe-stack-events \
  --stack-name portfolio-frontend-stack \
  --region us-east-1 \
  --max-items 20 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# If CloudFront is the issue, it can take up to 30 minutes
# Check distribution status
aws cloudfront list-distributions \
  --query 'DistributionList.Items[?Comment==`CloudFront distribution for patrickcmd.dev`].Status'
```

### Issue 6: Cache Serving Stale Content

**Error:** Updated files in S3 but CloudFront serves old content

**Solution:** See [Cache Invalidation](#cache-invalidation) section below

### Issue 7: DNS Not Resolving / "This site can't be reached"

**Error:**
- Browser shows "This site can't be reached"
- `dig patrickcmd.dev` returns no results
- DNS lookup fails even though Route 53 records exist

**Symptoms:**
```bash
$ curl -I https://patrickcmd.dev
curl: (6) Could not resolve host: patrickcmd.dev

$ dig patrickcmd.dev +short
# No output (empty)
```

**Root Cause:** DNS changes are still propagating globally. Route 53 typically propagates within 1-5 minutes, but global DNS propagation can take longer.

**Solution 1: Wait and Monitor DNS Propagation**

```bash
# Use the test-website script to monitor
cd aws
./bin/test-website

# Check DNS propagation status
dig patrickcmd.dev
dig www.patrickcmd.dev

# Check if Route 53 has the records
aws route53 list-resource-record-sets \
  --hosted-zone-id Z062129419D3W5L72N4G6 \
  --profile patrickcmd \
  --query "ResourceRecordSets[?Type=='A' && (Name=='patrickcmd.dev.' || Name=='www.patrickcmd.dev.')]"
```

**Solution 2: Verify Route 53 Records Were Created**

```bash
# Get your hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --profile patrickcmd \
  --query "HostedZones[?Name=='patrickcmd.dev.'].Id" \
  --output text | cut -d'/' -f3)

# Check A records
aws route53 list-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --profile patrickcmd \
  --query "ResourceRecordSets[?Type=='A']" \
  --output table

# Should show:
# | patrickcmd.dev.     | A | d3jnyva6fvgm7y.cloudfront.net. |
# | www.patrickcmd.dev. | A | d3jnyva6fvgm7y.cloudfront.net. |
```

**Solution 3: Re-run DNS Setup (If Records Missing)**

If Route 53 records don't exist, re-run the DNS setup:

```bash
cd aws
STACK_NAME=cloud-resume-challenge-portfolio-frontend-stack ./bin/route53-setup
```

**Solution 4: Use CloudFront Direct URL While Waiting**

While DNS propagates, access your site using the CloudFront distribution URL:

```bash
# Get CloudFront URL from stack
aws cloudformation describe-stacks \
  --stack-name cloud-resume-challenge-portfolio-frontend-stack \
  --region us-east-1 \
  --profile patrickcmd \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionDomainName`].OutputValue' \
  --output text

# Example output: d3jnyva6fvgm7y.cloudfront.net

# Test it
curl -I https://d3jnyva6fvgm7y.cloudfront.net
# OR open in browser
open https://d3jnyva6fvgm7y.cloudfront.net
```

**Solution 5: Check Global DNS Propagation**

Use online tools to check propagation worldwide:

```bash
# Check various DNS servers globally
# Open in browser:
https://www.whatsmydns.net/#A/patrickcmd.dev
https://www.whatsmydns.net/#A/www.patrickcmd.dev

# Or check manually from different DNS servers
dig @8.8.8.8 patrickcmd.dev        # Google DNS
dig @1.1.1.1 patrickcmd.dev        # Cloudflare DNS
dig @208.67.222.222 patrickcmd.dev # OpenDNS
```

**Solution 6: Flush Local DNS Cache**

Your local DNS cache might be holding outdated information:

```bash
# macOS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches

# Windows (as Administrator)
ipconfig /flushdns
```

**Solution 7: Verify Nameservers**

Ensure your domain registrar is using the correct Route 53 nameservers:

```bash
# Get Route 53 nameservers
aws route53 get-hosted-zone \
  --id $(aws route53 list-hosted-zones \
    --profile patrickcmd \
    --query "HostedZones[?Name=='patrickcmd.dev.'].Id" \
    --output text | cut -d'/' -f3) \
  --profile patrickcmd \
  --query 'DelegationSet.NameServers'

# Check what nameservers the domain is using
dig patrickcmd.dev NS
# OR
whois patrickcmd.dev | grep -i "Name Server"

# These should match!
```

**Expected Timeline:**
- **Route 53 internal propagation**: 1-5 minutes
- **Global DNS propagation**: 5-30 minutes (most resolvers)
- **Full worldwide propagation**: Up to 48 hours (rare, usually much faster)

**Verification Checklist:**

1. ✅ Route 53 A records exist
   ```bash
   aws route53 list-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --profile patrickcmd | grep -A5 "patrickcmd.dev"
   ```

2. ✅ CloudFront distribution working
   ```bash
   curl -I https://d3jnyva6fvgm7y.cloudfront.net
   # Should return: HTTP/2 200
   ```

3. ✅ DNS resolving from public DNS servers
   ```bash
   dig @8.8.8.8 patrickcmd.dev +short
   # Should return CloudFront IPs
   ```

4. ✅ Local DNS cache flushed
5. ✅ Domain using correct nameservers

**Quick Test Script:**

Use the provided test script to monitor all aspects:

```bash
cd aws
./bin/test-website

# Re-run every minute until DNS propagates:
watch -n 60 ./bin/test-website
```

---

## Cache Invalidation

When you update your website content, CloudFront may serve cached (old) content for up to 24 hours (default TTL).

### Understanding Asset Caching with Vite

**Important:** If you're using Vite (or any modern build tool with content hashing), you typically **only need to invalidate HTML files**, not assets.

#### How Vite Handles Caching

When you build your React app with Vite (`npm run build`), it implements **content-based hashing** for all assets:

```
dist/
├── index.html
└── assets/
    ├── index-a1b2c3d4.js      # Hash changes when JS changes
    ├── index-e5f6g7h8.css     # Hash changes when CSS changes
    └── logo-i9j0k1l2.png      # Hash changes when image changes
```

**Why This Matters:**

1. **Assets Have Unique Filenames:**
   - Every time you change JS/CSS/images and rebuild, Vite generates a **new filename** with a different hash
   - Example: `index-a1b2c3d4.js` → `index-x9y8z7w6.js` after changes
   - CloudFront sees this as a **completely different file** (cache miss)
   - It automatically fetches the new version from S3

2. **HTML Files Reference New Assets:**
   - `index.html` contains references to the hashed asset filenames
   - When you invalidate `index.html`, CloudFront serves the fresh HTML
   - The fresh HTML points to the new asset filenames
   - CloudFront fetches those new assets from S3 (they don't exist in cache yet)

3. **Cache Control Headers:**
   - **Assets** (JS/CSS/images): `max-age=31536000,public,immutable` (1 year)
   - **HTML files**: `no-cache,must-revalidate` (always fresh)
   - This is set automatically by the `s3-upload` playbook

#### Example Workflow

**Before Update:**
```
index.html → references → assets/index-OLD123.js
CloudFront Cache:
  - index.html (no-cache, always fetches fresh)
  - assets/index-OLD123.js (cached for 1 year)
```

**After Update (you changed some JS):**
```bash
# 1. Build creates new files
npm run build
# Output: assets/index-NEW456.js (different hash!)

# 2. Upload to S3
./bin/s3-upload

# 3. Invalidate HTML only
./bin/cloudfront-invalidate --html
```

**Result:**
```
Fresh index.html → references → assets/index-NEW456.js (cache miss, fetches from S3)
CloudFront Cache:
  - index.html (fresh from S3)
  - assets/index-OLD123.js (still cached, but nobody requests it)
  - assets/index-NEW456.js (newly cached)
```

#### When You WOULD Need to Invalidate Assets

You would only need to invalidate assets (`--all` flag) if:

1. **You modify an asset in-place** (same filename, different content)
   - Example: Manually editing `logo.png` without changing the filename
   - **Don't do this!** Let Vite handle the hashing

2. **You're not using a build tool with hashing**
   - If you had static files like `style.css` (no hash)
   - Your S3 upload uses Vite, so this doesn't apply

3. **You want to clear old cached assets** (optional cleanup)
   - Old hashed files remain in CloudFront cache until TTL expires
   - This costs nothing and uses minimal storage
   - You can use `--all` invalidation if you want to clean up

### Recommended Invalidation Strategy

**For SPAs with Vite (Recommended):**
```bash
# Only invalidate HTML files (2 paths = cost-effective)
./bin/cloudfront-invalidate --html
```

**Why this is optimal:**
- ✅ **Cost-effective**: Only 2 paths (`/index.html`, `/*.html`)
- ✅ **Fast**: Minimal invalidation time
- ✅ **Sufficient**: Assets are automatically handled by Vite's hashing
- ✅ **Industry standard**: This is how most SPAs handle cache invalidation

### Option 1: Invalidate Entire Distribution

```bash
# Get distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name portfolio-frontend-stack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

# Invalidate all files
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Option 2: Invalidate Specific Files

```bash
# Invalidate only HTML files (recommended for SPA)
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/index.html" "/*.html"

# Invalidate specific paths
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/index.html" "/assets/*" "/images/*"
```

### Option 3: Automated Invalidation in S3 Upload

Update `playbooks/s3-upload.yml` to include automatic invalidation:

```yaml
- name: Invalidate CloudFront cache
  amazon.aws.cloudfront_invalidation:
    distribution_id: "{{ cloudfront_distribution_id }}"
    target_paths:
      - "/*"
  register: invalidation_result
  tags:
    - upload
    - invalidate
```

**Cost Note:**
- First 1,000 invalidation paths per month: FREE
- After that: $0.005 per path
- Use wildcards to minimize paths (e.g., `/*` counts as 1 path)

### Check Invalidation Status

```bash
# List invalidations
aws cloudfront list-invalidations \
  --distribution-id $DISTRIBUTION_ID

# Check specific invalidation
aws cloudfront get-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --id INVALIDATION_ID
```

---

## Cost Estimate

Estimated monthly costs for a portfolio website with moderate traffic (10,000 visitors/month):

| Service | Usage | Cost |
|---------|-------|------|
| **S3 Storage** | 1 GB | $0.02 |
| **S3 Requests** | 10,000 GET | $0.004 |
| **CloudFront Data Transfer** | 10 GB out | $0.85 |
| **CloudFront Requests** | 10,000 HTTPS | $0.01 |
| **CloudFront Functions** | 20,000 invocations | FREE (under 2M) |
| **Route 53 Hosted Zone** | 1 zone | $0.50 |
| **Route 53 Queries** | 100,000 queries | $0.04 |
| **ACM Certificate** | 1 certificate | FREE |
| **Total** | | **~$1.50/month** |

**Additional Costs:**
- Cache Invalidations: First 1,000 paths/month FREE, then $0.005/path
- Data Transfer: First 1 TB/month at $0.085/GB

---

## Next Steps

1. ✅ **Deploy Infrastructure:** `./bin/frontend-deploy`
2. ✅ **Upload Content:** `./bin/s3-upload`
3. ✅ **Configure DNS:** Point Route 53 A records to CloudFront
4. ✅ **Test Website:** https://patrickcmd.dev
5. ✅ **Test Redirect:** https://www.patrickcmd.dev
6. 🚀 **Go Live!**

---

## Additional Resources

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [CloudFront Functions Documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html)
- [Origin Access Control (OAC)](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [AWS ACM Documentation](https://docs.aws.amazon.com/acm/)
- [Route 53 Documentation](https://docs.aws.amazon.com/route53/)
- [CloudFormation CloudFront Resource](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cloudfront-distribution.html)

---

**Note:** This configuration is production-ready and follows AWS best practices for security, performance, and cost optimization.
