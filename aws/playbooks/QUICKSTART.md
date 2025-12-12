# Quick Start Guide - Ansible Vault Setup

This guide will get you up and running with Ansible Vault for AWS deployments in under 5 minutes.

## Prerequisites

- Ansible installed
- AWS CLI configured with a profile
- boto3 and amazon.aws collection installed

## Step-by-Step Setup

### 1. Create Vault Password File

```bash
# Create a secure password (use a strong password)
echo "MyStr0ngVaultP@ssw0rd2024!" > ~/.vault_pass.txt

# Secure the file
chmod 600 ~/.vault_pass.txt
```

### 2. Configure Your Vault

```bash
# Navigate to playbooks directory
cd aws/playbooks

# Copy the example config
cp vaults/config.example.yml vaults/config.yml

# Edit with your settings
nano vaults/config.yml  # or use vim, code, etc.
```

Update these values in `vaults/config.yml`:

```yaml
aws_config:
  profile: patrickcmd              # Your AWS profile name

s3_config:
  bucket_name: YOUR-UNIQUE-NAME    # Must be globally unique
```

### 3. Encrypt the Vault

```bash
# Encrypt the vault file
ansible-vault encrypt vaults/config.yml --vault-password-file ~/.vault_pass.txt

# Verify encryption (file should show encrypted content)
cat vaults/config.yml
```

### 4. Configure Ansible to Use Vault Password

Add to `ansible.cfg`:

```bash
cat >> ansible.cfg << 'EOF'

# Vault configuration
vault_password_file = ~/.vault_pass.txt
EOF
```

### 5. Deploy!

```bash
# Run the deployment
ansible-playbook frontend-deploy.yml

# Or with verbose output
ansible-playbook frontend-deploy.yml -v
```

## Common Commands

```bash
# View vault contents
ansible-vault view vaults/config.yml

# Edit vault
ansible-vault edit vaults/config.yml

# Run playbook with different environment
ansible-playbook frontend-deploy.yml -e "deployment.environment=staging"

# Deploy only (skip validation)
ansible-playbook frontend-deploy.yml --tags deploy
```

## Troubleshooting

### "Decryption failed"
- Check your vault password is correct
- Verify `~/.vault_pass.txt` exists and is readable
- Try with `--ask-vault-pass` instead

### "Bucket name already exists"
- S3 bucket names must be globally unique
- Change `s3_config.bucket_name` in vault to a different name

### "boto3 not found"
```bash
pip install boto3 botocore
```

### "amazon.aws collection not found"
```bash
ansible-galaxy collection install amazon.aws
```

## Next Steps

- See [README.md](README.md) for comprehensive Ansible documentation
- See [vaults/README.md](vaults/README.md) for detailed vault documentation
- See [../README.md](../README.md) for CloudFormation template details

## Security Reminders

- ✅ Vault file encrypted: `vaults/config.yml` (safe to commit)
- ❌ Password file: `~/.vault_pass.txt` (NEVER commit)
- ❌ Unencrypted vault files (NEVER commit)
- ✅ Example config: `vaults/config.example.yml` (safe to commit)

## Quick Reference

| File | Encrypted? | Commit to Git? | Purpose |
|------|-----------|----------------|---------|
| `vaults/config.yml` | ✅ Yes | ✅ Yes | Actual configuration (encrypted) |
| `vaults/config.example.yml` | ❌ No | ✅ Yes | Template for others |
| `~/.vault_pass.txt` | ❌ No | ❌ NEVER | Your vault password |

Happy deploying! 🚀
