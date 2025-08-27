# Security Best Practices for ViralSplit

## ⚠️ CRITICAL: Password Management

**NEVER** store passwords in:
- Source code files
- Git repositories  
- Plain text files
- Shared documentation

## Secure Password Handling

### For Local Development
1. Use `.env.local` file (git-ignored)
2. Set environment variables in your terminal:
   ```bash
   export ADMIN_PASSWORD="your-secure-password"
   ```

### For Production Deployment

#### Vercel
Set environment variables in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add `ADMIN_PASSWORD` as a secret environment variable
3. Mark as "Sensitive" to hide value

#### Railway
Set environment variables in Railway Dashboard:
1. Go to your service → Variables tab
2. Add `ADMIN_PASSWORD` 
3. Railway automatically encrypts these

#### Docker/Kubernetes
Use secrets management:
```bash
kubectl create secret generic admin-credentials \
  --from-literal=password='your-password'
```

## Password Requirements
- Minimum 12 characters
- Include uppercase, lowercase, numbers, and symbols
- Use unique passwords for each service
- Enable MFA for admin accounts
- Rotate passwords every 90 days

## What To Do If Password Was Exposed
1. **Immediately change the password**
2. Check git history for any commits containing passwords
3. If committed to git:
   ```bash
   # Remove from history (requires force push)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/file' \
     --prune-empty --tag-name-filter cat -- --all
   ```
4. Rotate all related credentials
5. Enable audit logging to check for unauthorized access

## Secure Storage Alternatives
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager
- Doppler
- 1Password Secrets Automation

## Admin Account Setup
Instead of hardcoding, use:
1. Initial setup script that prompts for password
2. First-run wizard in the application
3. CLI command to create admin: `npm run create-admin`
4. Environment-specific configuration

Remember: Security is not optional in production applications!