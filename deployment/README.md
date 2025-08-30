# Deployment Directory

This directory contains all deployment-related scripts, configurations, and documentation for the ViralSplit platform.

## Structure

```
deployment/
├── scripts/           # Deployment automation scripts
├── configs/          # Environment and configuration templates  
├── docs/            # Deployment-specific documentation
└── README.md        # This file
```

## Quick Deployment

### Deploy Everything
```bash
./deployment/scripts/deploy_all.sh
```

### Individual Deployments
```bash
./deployment/scripts/deploy_railway.sh    # Deploy API to Railway
./deployment/scripts/deploy_vercel.sh     # Deploy web apps to Vercel
```

### Backward Compatibility
Wrapper scripts are available in the root directory:
```bash
./deploy_all.sh        # Calls deployment/scripts/deploy_all.sh
./deploy_railway.sh    # Calls deployment/scripts/deploy_railway.sh
./deploy_vercel.sh     # Calls deployment/scripts/deploy_vercel.sh
```

## Deployment Scripts

### `deploy_all.sh`
- Deploys both Railway API and Vercel web applications
- Handles version incrementing and status tracking
- Provides comprehensive deployment notifications

### `deploy_railway.sh` 
- Deploys the FastAPI backend to Railway
- Monitors deployment health and version verification
- Updates deployment status in version tracking

### `deploy_vercel.sh`
- Deploys Next.js web applications to Vercel
- Handles build process and deployment verification
- Checks deployment health and version consistency

## Configuration

Environment templates and deployment configurations are stored in `configs/`:

- `env.template` - API environment variables template
- Copy to `apps/api/.env` and customize with your values

## Monitoring

Deployment scripts integrate with the monitoring system in `tools/monitoring/` for:
- Real-time deployment notifications
- Status tracking and logging
- Health check verification

## Version Management

All deployment scripts work with the version management system:
- Automatic build number incrementing
- Deployment status tracking
- Version verification after deployment

See `scripts/version.sh` for version management commands.