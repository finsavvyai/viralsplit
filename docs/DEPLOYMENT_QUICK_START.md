# 🚀 ViralSplit Deployment Quick Start

## Overview

Your ViralSplit API is ready for cloud deployment! This guide provides the fastest path to get your application running in production.

## 🎯 Recommended: Railway (Easiest)

### Step 1: Prepare Your Environment
```bash
# 1. Set up Cloudflare R2 (if not done already)
# Follow CDN_SETUP_INSTRUCTIONS.md

# 2. Create production environment file
cp apps/api/.env apps/api/.env.production
# Edit apps/api/.env.production with your production credentials
```

### Step 2: Deploy with One Command
```bash
# Run the automated deployment script
./deploy.sh

# Select option 1 (Railway) when prompted
# Follow the interactive prompts
```

### Step 3: Configure Environment Variables
In Railway dashboard, set these variables:
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_ACCESS_KEY_ID` - Your R2 access key
- `CLOUDFLARE_SECRET_ACCESS_KEY` - Your R2 secret key
- `CDN_DOMAIN` - cdn.viralsplit.io
- `JWT_SECRET` - Strong random string
- `ENVIRONMENT` - production

### Step 4: Get Your API URL
```bash
railway domain
# Your API will be available at: https://your-app-name.railway.app
```

## 🌐 Alternative: Render

### Step 1: Connect Repository
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Select "Blueprint" deployment

### Step 2: Deploy
Render will automatically detect the `render.yaml` file and deploy:
- API service
- Redis database
- Celery worker

### Step 3: Configure Environment
Update environment variables in Render dashboard with the same values as Railway.

## ☁️ Alternative: DigitalOcean

### Step 1: Install CLI
```bash
# macOS
brew install doctl

# Linux
snap install doctl
```

### Step 2: Deploy
```bash
doctl auth init
doctl apps create --spec .do/app.yaml
```

## 🔧 Manual Deployment Steps

If you prefer manual deployment:

### 1. Test Locally First
```bash
cd apps/api
python -m pytest tests/ -v
# All 90 tests should pass
```

### 2. Build and Deploy
```bash
# Build production image
docker build -f apps/api/Dockerfile.production -t viralsplit-api .

# Deploy to your preferred platform
# See CLOUD_DEPLOYMENT_GUIDE.md for detailed instructions
```

## 🔍 Post-Deployment Checklist

- [ ] API health check: `GET /health`
- [ ] Test file upload: `POST /api/upload/request`
- [ ] Test video processing: `POST /api/transform`
- [ ] Verify Redis connection
- [ ] Check Celery worker status
- [ ] Monitor application logs

## 🚨 Common Issues

### Redis Connection Failed
```bash
# Check Redis URL format
echo $REDIS_URL
# Should be: redis://username:password@host:port/db
```

### R2 Upload Failed
```bash
# Verify Cloudflare credentials
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

### CORS Errors
Update CORS origins in `apps/api/main.py` to include your production domain.

## 📊 Monitoring

### Health Check
```bash
curl https://your-api-domain.com/health
```

### Metrics
```bash
curl https://your-api-domain.com/metrics
```

## 🔐 Security Reminders

1. **Never commit secrets** - Use environment variables
2. **Use HTTPS** - All production traffic should be encrypted
3. **Set up monitoring** - Monitor uptime and performance
4. **Regular backups** - Backup your data regularly
5. **Update dependencies** - Keep packages updated

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section in `CLOUD_DEPLOYMENT_GUIDE.md`
2. Review platform-specific documentation
3. Check application logs for errors
4. Verify environment variable configuration

---

**🎉 You're ready to deploy!** Choose Railway for the easiest experience, or follow the detailed guide for other platforms.
