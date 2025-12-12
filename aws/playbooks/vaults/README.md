# Ansible Vault Guide

This guide covers how to use Ansible Vault to securely manage sensitive configuration data for the Cloud Resume Challenge AWS deployment.

## Table of Contents

- [What is Ansible Vault?](#what-is-ansible-vault)
- [Why Use Ansible Vault?](#why-use-ansible-vault)
- [Vault File Structure](#vault-file-structure)
- [Setting Up Ansible Vault](#setting-up-ansible-vault)
- [Working with Vault Files](#working-with-vault-files)
- [Using Vault in Playbooks](#using-vault-in-playbooks)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## What is Ansible Vault?

Ansible Vault is a feature that allows you to keep sensitive data encrypted at rest, rather than storing it as plaintext in your playbooks or roles. It uses AES256 encryption to protect your data.

**Key Features**:
- Encrypts YAML files containing sensitive data
- Integrates seamlessly with Ansible playbooks
- Supports password-based and file-based authentication
- Can encrypt entire files or specific variables

## Why Use Ansible Vault?

### Security Benefits

1. **Version Control Safety**: Encrypted files can be safely committed to Git
2. **Secret Management**: Centralized location for sensitive configuration
3. **Access Control**: Password/file-based access to secrets
4. **Compliance**: Meets security requirements for credential management

### Use Cases

- **AWS Credentials**: Access keys and secret keys
- **API Keys**: Third-party service credentials
- **Database Passwords**: Connection strings and passwords
- **Configuration Values**: Environment-specific settings
- **SSH Keys**: Private keys and passphrases

## Vault File Structure

Our vault configuration file (`config.yml`) is organized into logical sections:

```yaml
# AWS Configuration
aws_config:
  region: us-east-1
  profile: patrickcmd

# CloudFormation Configuration
cloudformation:
  stack_name: portfolio-frontend-stack
  template_path: ../frontend.yaml

# S3 Configuration
s3_config:
  bucket_name: patrick-portfolio-website
  index_document: index.html
  error_document: index.html

# Environment Configuration
deployment:
  environment: prod

# Stack Tags
stack_tags:
  Project: cloud-resume-challenge
  Component: frontend
  ManagedBy: ansible
  Owner: PatrickCmd
```

## Setting Up Ansible Vault

### Step 1: Create a Vault Password

Choose a strong password for encrypting your vault. You have two options:

#### Option A: Interactive Password (More Secure)

The vault password will be prompted each time you use the vault.

#### Option B: Password File (Convenient)

Create a password file for automated access:

```bash
# Create a secure password file
echo "your-strong-vault-password" > ~/.vault_pass.txt

# Secure the file (only owner can read)
chmod 600 ~/.vault_pass.txt
```

**Important**: Add `~/.vault_pass.txt` to your `.gitignore` to prevent accidental commits!

### Step 2: Encrypt the Vault File

```bash
# Navigate to playbooks directory
cd aws/playbooks

# Encrypt the vault file (will prompt for password)
ansible-vault encrypt vaults/config.yml

# Or use a password file
ansible-vault encrypt vaults/config.yml --vault-password-file ~/.vault_pass.txt
```

After encryption, the file will look like:

```
$ANSIBLE_VAULT;1.1;AES256
66386439653966363932643935373...
```

## Working with Vault Files

### View Encrypted File

```bash
# View file contents without decrypting
ansible-vault view vaults/config.yml

# With password file
ansible-vault view vaults/config.yml --vault-password-file ~/.vault_pass.txt
```

### Edit Encrypted File

```bash
# Edit file (opens in your default editor)
ansible-vault edit vaults/config.yml

# With password file
ansible-vault edit vaults/config.yml --vault-password-file ~/.vault_pass.txt
```

**What happens**:
1. Ansible decrypts the file temporarily
2. Opens it in your editor (vim, nano, etc.)
3. Re-encrypts it when you save and exit

### Decrypt File

```bash
# Decrypt file permanently (not recommended)
ansible-vault decrypt vaults/config.yml

# With password file
ansible-vault decrypt vaults/config.yml --vault-password-file ~/.vault_pass.txt
```

### Re-encrypt File

```bash
# Encrypt a decrypted file
ansible-vault encrypt vaults/config.yml
```

### Change Vault Password

```bash
# Change the vault password
ansible-vault rekey vaults/config.yml

# With password files (old and new)
ansible-vault rekey vaults/config.yml \
  --vault-password-file ~/.vault_pass_old.txt \
  --new-vault-password-file ~/.vault_pass_new.txt
```

## Using Vault in Playbooks

### Method 1: Interactive Password Prompt

Run playbook and enter password when prompted:

```bash
ansible-playbook frontend-deploy.yml --ask-vault-pass
```

### Method 2: Password File

Run playbook with password file:

```bash
ansible-playbook frontend-deploy.yml --vault-password-file ~/.vault_pass.txt
```

### Method 3: Environment Variable

Set vault password via environment variable:

```bash
# Set the environment variable
export ANSIBLE_VAULT_PASSWORD_FILE=~/.vault_pass.txt

# Run playbook (no need to specify vault password)
ansible-playbook frontend-deploy.yml
```

### Method 4: Ansible Configuration

Add to `ansible.cfg`:

```ini
[defaults]
vault_password_file = ~/.vault_pass.txt
```

Then run normally:

```bash
ansible-playbook frontend-deploy.yml
```

### Running with Tags

You can still use tags with vault-encrypted files:

```bash
# Deploy only
ansible-playbook frontend-deploy.yml --ask-vault-pass --tags deploy

# With password file
ansible-playbook frontend-deploy.yml \
  --vault-password-file ~/.vault_pass.txt \
  --tags deploy
```

### Override Vault Variables

You can override vault variables from command line:

```bash
ansible-playbook frontend-deploy.yml \
  --ask-vault-pass \
  -e "s3_config.bucket_name=my-custom-bucket"
```

## Best Practices

### 1. Security

- **Never commit unencrypted vault files** to version control
- **Use strong passwords** (minimum 20 characters, mix of letters, numbers, symbols)
- **Protect password files** with strict permissions (`chmod 600`)
- **Add password files to `.gitignore`**
- **Rotate vault passwords** periodically
- **Use separate vaults** for different environments (dev, staging, prod)

### 2. Organization

```
playbooks/
├── vaults/
│   ├── README.md              # This file
│   ├── config.yml             # Encrypted vault (committed)
│   ├── dev-config.yml         # Dev environment (encrypted)
│   ├── prod-config.yml        # Prod environment (encrypted)
│   └── .gitignore             # Ignore unencrypted files
```

### 3. Vault File Naming

- **config.yml**: General configuration
- **secrets.yml**: Highly sensitive data (credentials, keys)
- **{env}-config.yml**: Environment-specific configuration

### 4. Git Integration

Add to `.gitignore`:

```gitignore
# Ansible Vault Password Files
*.vault_pass
*.vault_pass.txt
.vault_pass*
vault_password*

# Unencrypted vault files (in case you decrypt temporarily)
**/vaults/*_decrypted.yml
**/vaults/*.unencrypted.yml
```

### 5. Variable Access in Playbooks

Always reference vault variables through defined vars:

```yaml
# Good: Clear variable mapping
vars:
  aws_region: "{{ aws_config.region }}"
  bucket_name: "{{ s3_config.bucket_name }}"

# Avoid: Direct vault variable access everywhere
# Makes refactoring harder
```

### 6. Documentation

- Document vault structure in README
- Include example unencrypted file (`config.example.yml`)
- List required variables for each playbook

## Example: Creating an Example Config File

Create `config.example.yml` for documentation:

```bash
# Copy current config (unencrypted)
cp vaults/config.yml vaults/config.example.yml

# Edit to remove sensitive values
# Replace real values with placeholders like YOUR_VALUE_HERE

# Add to git
git add vaults/config.example.yml
```

## Vault Password Management Strategies

### Strategy 1: Team Password Manager

For teams, use a password manager (1Password, LastPass, etc.):

1. Store vault password in shared team vault
2. Each team member retrieves password
3. Creates local `~/.vault_pass.txt`

### Strategy 2: CI/CD Integration

For automated deployments:

```yaml
# GitHub Actions example
- name: Run Ansible Playbook
  env:
    ANSIBLE_VAULT_PASSWORD: ${{ secrets.ANSIBLE_VAULT_PASSWORD }}
  run: |
    echo "$ANSIBLE_VAULT_PASSWORD" > ~/.vault_pass.txt
    chmod 600 ~/.vault_pass.txt
    ansible-playbook frontend-deploy.yml --vault-password-file ~/.vault_pass.txt
    rm ~/.vault_pass.txt
```

### Strategy 3: AWS Secrets Manager (Advanced)

Retrieve vault password from AWS Secrets Manager:

```bash
# Retrieve password from AWS Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id ansible-vault-password \
  --query SecretString \
  --output text > ~/.vault_pass.txt

chmod 600 ~/.vault_pass.txt
```

## Troubleshooting

### Issue 1: "Decryption failed"

**Error**: `ERROR! Decryption failed (no vault secrets would found that could decrypt)`

**Solutions**:
- Check if you're using the correct password
- Verify the vault file is actually encrypted
- Ensure password file exists and is readable

```bash
# Test password manually
ansible-vault view vaults/config.yml
```

### Issue 2: "vault_pass.txt: Permission denied"

**Error**: Permission errors when reading password file

**Solution**:
```bash
chmod 600 ~/.vault_pass.txt
```

### Issue 3: Editor not opening for edit

**Error**: `ERROR! Unable to find editor`

**Solution**:
```bash
# Set default editor
export EDITOR=vim

# Or use nano
export EDITOR=nano
```

### Issue 4: Variables not loading from vault

**Error**: Variables from vault are undefined

**Solutions**:
- Check `vars_files` path is correct
- Verify vault file is decrypted during playbook run
- Check variable names match exactly (case-sensitive)

```yaml
# Debug vault variables
- name: Debug vault variables
  ansible.builtin.debug:
    msg: "Bucket: {{ s3_config.bucket_name }}"
```

### Issue 5: Multiple vault files

If using multiple vault files with different passwords:

```bash
# Use vault-id for multiple vaults
ansible-playbook frontend-deploy.yml \
  --vault-id dev@~/.vault_pass_dev.txt \
  --vault-id prod@~/.vault_pass_prod.txt
```

## Quick Reference

### Common Commands

```bash
# Encrypt
ansible-vault encrypt vaults/config.yml

# Decrypt
ansible-vault decrypt vaults/config.yml

# View
ansible-vault view vaults/config.yml

# Edit
ansible-vault edit vaults/config.yml

# Rekey (change password)
ansible-vault rekey vaults/config.yml

# Run playbook
ansible-playbook frontend-deploy.yml --ask-vault-pass
```

### Vault File Lifecycle

```
1. Create → 2. Edit → 3. Encrypt → 4. Commit → 5. Use in Playbook
    ↑                                                    ↓
    └──────────────── 6. Edit encrypted ────────────────┘
```

## Additional Resources

- [Ansible Vault Documentation](https://docs.ansible.com/ansible/latest/user_guide/vault.html)
- [Ansible Best Practices](https://docs.ansible.com/ansible/latest/user_guide/playbooks_best_practices.html)
- [Encrypting Variables with Ansible Vault](https://docs.ansible.com/ansible/latest/user_guide/vault.html#encrypting-content-with-ansible-vault)

## Support

For issues specific to this project:
- Check [playbooks/README.md](../README.md) for general Ansible setup
- Review this guide for vault-specific questions
- Verify AWS credentials and profile configuration
