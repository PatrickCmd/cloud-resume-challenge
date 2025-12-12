# CloudFormation Configuration Guide

This document explains the CloudFormation settings used in the Ansible playbooks for the Cloud Resume Challenge.

## Overview

The frontend deployment playbook (`frontend-deploy.yml`) uses specific CloudFormation capabilities and failure handling settings to ensure robust and secure deployments.

## Configuration Settings

### 1. CloudFormation Capabilities

```yaml
capabilities:
  - CAPABILITY_NAMED_IAM
  - CAPABILITY_AUTO_EXPAND
```

#### CAPABILITY_NAMED_IAM

**Purpose**: Allows CloudFormation to create IAM resources with custom names.

**Why we use it**:
- Provides permission for CloudFormation to create, update, or delete IAM resources
- Required when templates contain IAM roles, users, groups, or policies with custom names
- Future-proofs the infrastructure for when IAM resources are added

**What it allows**:
- Creation of IAM roles with specific names
- IAM policies with custom names
- IAM users and groups with defined names

**Example use case**:
```yaml
# Future CloudFormation template might include:
Resources:
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: portfolio-lambda-execution-role  # Custom name requires CAPABILITY_NAMED_IAM
```

**Alternative**: `CAPABILITY_IAM` (allows IAM resources with auto-generated names only)

#### CAPABILITY_AUTO_EXPAND

**Purpose**: Enables CloudFormation to process macros and nested stacks.

**Why we use it**:
- Supports CloudFormation macros that transform templates during deployment
- Enables use of nested stacks for modular infrastructure
- Allows AWS::Serverless transforms (SAM templates)

**What it allows**:
- Processing of `AWS::Serverless` transforms
- Execution of custom CloudFormation macros
- Expansion of nested stack templates
- Template transformation at deployment time

**Example use case**:
```yaml
# Template with macro transformation
Transform: AWS::Serverless-2016-10-31  # Requires CAPABILITY_AUTO_EXPAND

Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: python3.9
```

**When it's needed**:
- Using AWS SAM (Serverless Application Model)
- Implementing custom CloudFormation macros
- Creating modular infrastructure with nested stacks

### 2. Failure Handling

```yaml
on_create_failure: ROLLBACK
disable_rollback: false
```

#### on_create_failure: ROLLBACK

**Purpose**: Defines what happens when stack creation fails.

**Behavior**:
- CloudFormation automatically deletes all resources created before the failure
- Stack enters `ROLLBACK_COMPLETE` state
- Provides clean slate for retry with corrected values
- Stack events are preserved for debugging

**Available Options**:

| Option | Behavior | Use Case |
|--------|----------|----------|
| `ROLLBACK` | Delete all created resources | Production (default, recommended) |
| `DO_NOTHING` | Keep all created resources | Debugging complex failures |
| `DELETE` | Same as ROLLBACK | Alternative syntax |

**Why ROLLBACK is recommended**:
1. **Clean Environment**: No orphaned resources left behind
2. **Cost Optimization**: Failed resources don't incur charges
3. **Simplified Retry**: Can retry immediately with same stack name
4. **Clear State**: No confusion about resource state

**Example workflow**:
```bash
# 1. Deploy fails (e.g., bucket name already exists)
ansible-playbook frontend-deploy.yml
# Stack creates S3 bucket → fails → automatically deletes bucket

# 2. View failure reason
aws cloudformation describe-stack-events \
  --stack-name portfolio-frontend-stack \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# 3. Fix issue in vault (change bucket name)
ansible-vault edit vaults/config.yml

# 4. Retry deployment
ansible-playbook frontend-deploy.yml
# Stack creates with corrected bucket name → succeeds
```

#### disable_rollback: false

**Purpose**: Controls rollback behavior for stack updates.

**Behavior**:
- `false` (default): Updates that fail will rollback to previous working state
- `true`: Failed updates remain in failed state (useful for debugging)

**Why we set it to false**:
- Ensures updates don't leave infrastructure in broken state
- Automatic recovery to last known good configuration
- Minimizes downtime and service disruption

## Comparison: ROLLBACK vs DO_NOTHING

### Using ROLLBACK (Current Configuration)

**Advantages**:
- ✅ Clean environment after failures
- ✅ No resource cleanup needed
- ✅ Clear error messages in stack events
- ✅ Can retry immediately
- ✅ No unexpected AWS charges

**Disadvantages**:
- ❌ Can't inspect failed resources
- ❌ Must rely on stack events for debugging

**Best for**:
- Production deployments
- Automated CI/CD pipelines
- Team environments
- Cost-conscious operations

### Using DO_NOTHING (Alternative)

**Advantages**:
- ✅ Failed resources remain for inspection
- ✅ Can debug resource-level issues
- ✅ Can manually fix and continue
- ✅ Better for learning/understanding failures

**Disadvantages**:
- ❌ Must manually clean up resources
- ❌ Failed stack blocks same stack name
- ❌ Potential for resource leaks
- ❌ Ongoing costs for failed resources

**Best for**:
- Development/testing
- Complex infrastructure debugging
- Learning CloudFormation
- Troubleshooting specific resource failures

## Debugging Failed Deployments

### Step 1: Check Stack Events

```bash
# View all stack events
aws cloudformation describe-stack-events \
  --stack-name portfolio-frontend-stack \
  --profile patrickcmd \
  --region us-east-1

# View only failed events
aws cloudformation describe-stack-events \
  --stack-name portfolio-frontend-stack \
  --profile patrickcmd \
  --region us-east-1 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

### Step 2: Common Failure Reasons and Solutions

#### Bucket Already Exists

```
Resource creation failed: BucketAlreadyExists
```

**Solution**: Change bucket name in vault (must be globally unique)

```bash
ansible-vault edit vaults/config.yml
# Change s3_config.bucket_name to a unique value
```

#### Insufficient Permissions

```
User is not authorized to perform: s3:CreateBucket
```

**Solution**: Add required IAM permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*"
      ],
      "Resource": "*"
    }
  ]
}
```

#### Resource Limit Exceeded

```
Maximum number of S3 buckets exceeded
```

**Solution**: Delete unused buckets or request limit increase

### Step 3: Clean Up and Retry

```bash
# If stack is in ROLLBACK_COMPLETE state, delete it
aws cloudformation delete-stack \
  --stack-name portfolio-frontend-stack \
  --profile patrickcmd \
  --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name portfolio-frontend-stack \
  --profile patrickcmd \
  --region us-east-1

# Retry with corrected configuration
ansible-playbook frontend-deploy.yml
```

## Best Practices

### 1. Use Capabilities Sparingly

Only include capabilities your template actually needs:
- Current S3 template: Doesn't strictly need IAM capabilities
- Future templates with Lambda/IAM: Will need these capabilities
- We include them now for forward compatibility

### 2. Always Use ROLLBACK in Production

```yaml
# Production
on_create_failure: ROLLBACK

# Development/Debugging only
on_create_failure: DO_NOTHING
```

### 3. Monitor Stack Events

Always check stack events after deployment:

```bash
# Automated monitoring
aws cloudformation wait stack-create-complete \
  --stack-name portfolio-frontend-stack

# Manual verification
aws cloudformation describe-stacks \
  --stack-name portfolio-frontend-stack \
  --query 'Stacks[0].StackStatus'
```

### 4. Use Tags for Resource Management

```yaml
tags:
  Project: cloud-resume-challenge
  Component: frontend
  ManagedBy: ansible
  Environment: prod
```

Benefits:
- Easy cost allocation
- Resource organization
- Automated cleanup scripts
- Compliance tracking

## IAM Permissions Required

Minimum IAM permissions for deployments:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:GetTemplate",
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:PutBucketPolicy",
        "s3:DeleteBucketPolicy",
        "s3:PutBucketWebsite",
        "s3:PutBucketVersioning",
        "s3:PutEncryptionConfiguration",
        "s3:PutBucketPublicAccessBlock",
        "s3:PutBucketOwnershipControls"
      ],
      "Resource": "*"
    }
  ]
}
```

## Additional Resources

- [AWS CloudFormation Capabilities](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-template.html#capabilities)
- [CloudFormation Rollback Triggers](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-rollback-triggers.html)
- [Best Practices for CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/best-practices.html)
- [CloudFormation Stack Events](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-describing-stacks.html)

## Summary

The current configuration provides:
- ✅ Forward compatibility with IAM resources
- ✅ Support for macros and nested stacks
- ✅ Automatic cleanup on failures
- ✅ Safe update rollback behavior
- ✅ Clear debugging information

This ensures robust, production-ready deployments while maintaining flexibility for future enhancements.
