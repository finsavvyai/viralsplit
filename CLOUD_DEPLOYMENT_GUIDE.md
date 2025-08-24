# 🚀 ViralSplit Cloud Deployment Guide

## Overview

This comprehensive guide will walk you through deploying your ViralSplit API from localhost to production cloud environments. The application consists of:

- **FastAPI Backend** (Python) - Main API server
- **Celery Workers** (Python) - Background video processing
- **Redis** - Message broker and caching
- **Cloudflare R2** - Object storage and CDN
- **PostgreSQL** - Database (optional, for production)

## 🎯 Deployment Options

### Option 1: Railway (Recommended for Startups)
- **Pros**: Easy setup, automatic deployments, good free tier
- **Cons**: Limited customization
- **Best for**: MVPs and early-stage products

### Option 2: Render
- **Pros**: Good free tier, easy PostgreSQL integration
- **Cons**: Cold starts on free tier
- **Best for**: Small to medium applications

### Option 3: DigitalOcean App Platform
- **Pros**: Predictable pricing, good performance
- **Cons**: More complex setup
- **Best for**: Production applications

### Option 4: AWS ECS/Fargate
- **Pros**: Highly scalable, full control
- **Cons**: Complex setup, higher cost
- **Best for**: Enterprise applications

---

## 🛠️ Pre-Deployment Setup

### 1. Environment Variables Preparation

Create a production environment file:

```bash
# apps/api/.env.production
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_production_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_production_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_production_secret_access_key
CDN_DOMAIN=cdn.viralsplit.io
R2_BUCKET_NAME=viralsplit-media

# JWT Configuration
JWT_SECRET=your-super-secret-production-jwt-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Redis Configuration
REDIS_URL=your_production_redis_url

# Database Configuration (if using)
DATABASE_URL=your_production_database_url

# AI Services
OPENAI_API_KEY=sk-your-production-openai-key
REPLICATE_API_TOKEN=r8_your-production-replicate-token

# Payment Processing
STRIPE_SECRET_KEY=sk_live_your-production-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-production-webhook-secret

# Production Settings
DEBUG=false
ENVIRONMENT=production
```

### 2. Update Dockerfile for Production

```dockerfile
# apps/api/Dockerfile.production
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 3. Create Production Requirements

```bash
# apps/api/requirements.production.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
python-dotenv==1.1.1
boto3==1.29.7
cloudflare==2.11.7
openai==1.3.5
replicate==0.22.0
redis==5.0.1
celery==5.3.4
stripe==7.5.0
supabase==2.0.3
ffmpeg-python==0.2.0
pillow==10.1.0
numpy==1.24.3
opencv-python==4.8.1.78
moviepy==1.0.3
PyJWT==2.8.0
bcrypt==4.1.2
pydantic[email]==2.5.0
gunicorn==21.2.0
```

---

## 🚀 Railway Deployment (Recommended)

### Step 1: Prepare Repository

1. **Add Railway Configuration**

```yaml
# railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/api/Dockerfile.production"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

2. **Add Health Check Endpoint**

```python
# Add to apps/api/main.py
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment platforms"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
```

### Step 2: Deploy to Railway

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login and Initialize**
```bash
railway login
railway init
```

3. **Configure Environment Variables**
```bash
railway variables set CLOUDFLARE_ACCOUNT_ID=your_account_id
railway variables set CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
railway variables set CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
railway variables set CDN_DOMAIN=cdn.viralsplit.io
railway variables set JWT_SECRET=your-super-secret-jwt-key
railway variables set REDIS_URL=your_redis_url
railway variables set ENVIRONMENT=production
```

4. **Deploy**
```bash
railway up
```

5. **Get Your Domain**
```bash
railway domain
```

### Step 3: Set Up Redis

1. **Add Redis Service**
```bash
railway add redis
```

2. **Get Redis URL**
```bash
railway variables set REDIS_URL=$(railway variables get REDIS_URL)
```

### Step 4: Deploy Celery Workers

1. **Create Worker Service**
```bash
railway service create viral-split-worker
```

2. **Configure Worker**
```bash
cd apps/api
railway service viral-split-worker
railway variables set CELERY_WORKER=true
railway variables set REDIS_URL=your_redis_url
```

3. **Deploy Worker**
```bash
railway up --service viral-split-worker
```

---

## 🌐 Render Deployment

### Step 1: Prepare for Render

1. **Create render.yaml**
```yaml
# render.yaml
services:
  - type: web
    name: viralsplit-api
    env: python
    buildCommand: pip install -r apps/api/requirements.production.txt
    startCommand: cd apps/api && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
    envVars:
      - key: CLOUDFLARE_ACCOUNT_ID
        value: your_account_id
      - key: CLOUDFLARE_ACCESS_KEY_ID
        value: your_access_key_id
      - key: CLOUDFLARE_SECRET_ACCESS_KEY
        value: your_secret_access_key
      - key: CDN_DOMAIN
        value: cdn.viralsplit.io
      - key: JWT_SECRET
        generateValue: true
      - key: ENVIRONMENT
        value: production

  - type: redis
    name: viralsplit-redis
    ipAllowList: []

  - type: worker
    name: viralsplit-worker
    env: python
    buildCommand: pip install -r apps/api/requirements.production.txt
    startCommand: cd apps/api && celery -A main.celery_app worker --loglevel=info
    envVars:
      - key: REDIS_URL
        fromService:
          name: viralsplit-redis
          type: redis
          property: connectionString
```

### Step 2: Deploy to Render

1. **Connect Repository**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Select "Blueprint" deployment

2. **Configure Environment**
   - Update environment variables in Render dashboard
   - Set up custom domain if needed

3. **Deploy**
   - Render will automatically deploy all services
   - Monitor logs for any issues

---

## ☁️ DigitalOcean App Platform

### Step 1: Prepare App Spec

```yaml
# .do/app.yaml
name: viralsplit
services:
  - name: api
    source_dir: /apps/api
    github:
      repo: your-username/viralsplit
      branch: main
    run_command: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 4
    environment_slug: python
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: CLOUDFLARE_ACCOUNT_ID
        value: your_account_id
      - key: CLOUDFLARE_ACCESS_KEY_ID
        value: your_access_key_id
      - key: CLOUDFLARE_SECRET_ACCESS_KEY
        value: your_secret_access_key
      - key: CDN_DOMAIN
        value: cdn.viralsplit.io
      - key: JWT_SECRET
        value: your-super-secret-jwt-key
      - key: ENVIRONMENT
        value: production

  - name: worker
    source_dir: /apps/api
    github:
      repo: your-username/viralsplit
      branch: main
    run_command: celery -A main.celery_app worker --loglevel=info
    environment_slug: python
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: REDIS_URL
        value: ${redis.DATABASE_URL}
      - key: CELERY_WORKER
        value: true

databases:
  - name: redis
    engine: REDIS
    version: "6"
```

### Step 2: Deploy

1. **Install doctl**
```bash
# macOS
brew install doctl

# Linux
snap install doctl
```

2. **Authenticate**
```bash
doctl auth init
```

3. **Deploy**
```bash
doctl apps create --spec .do/app.yaml
```

---

## 🔧 Production Configuration

### 1. CORS Settings

Update your FastAPI CORS configuration for production:

```python
# apps/api/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://viralsplit.io",
        "https://contentmulti.com",
        "https://your-production-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Security Headers

Add security middleware:

```python
# apps/api/main.py
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

# Add security middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["your-domain.com"])
app.add_middleware(HTTPSRedirectMiddleware)
```

### 3. Rate Limiting

Add rate limiting:

```python
# apps/api/middleware/rate_limit.py
from fastapi import HTTPException, Request
import time
from collections import defaultdict

class RateLimiter:
    def __init__(self, requests_per_minute=60):
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(list)
    
    async def check_rate_limit(self, request: Request):
        client_ip = request.client.host
        now = time.time()
        
        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < 60
        ]
        
        # Check rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        # Add current request
        self.requests[client_ip].append(now)

rate_limiter = RateLimiter()

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    await rate_limiter.check_rate_limit(request)
    response = await call_next(request)
    return response
```

### 4. Logging Configuration

```python
# apps/api/logging_config.py
import logging
import sys
from loguru import logger

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
    level="INFO"
)
logger.add(
    "logs/app.log",
    rotation="1 day",
    retention="30 days",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
    level="DEBUG"
)
```

---

## 🔍 Monitoring and Health Checks

### 1. Health Check Endpoint

```python
# apps/api/main.py
@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    try:
        # Check Redis connection
        redis_client = redis.from_url(os.getenv("REDIS_URL"))
        redis_client.ping()
        
        # Check R2 connection
        storage = R2Storage()
        await storage._test_connection()
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "redis": "connected",
                "r2_storage": "connected",
                "celery": "running"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")
```

### 2. Metrics Endpoint

```python
# apps/api/main.py
@app.get("/metrics")
async def get_metrics():
    """Application metrics"""
    return {
        "uptime": time.time() - start_time,
        "memory_usage": psutil.virtual_memory().percent,
        "cpu_usage": psutil.cpu_percent(),
        "active_connections": len(active_connections),
        "tasks_processed": tasks_processed_count
    }
```

---

## 🔐 Security Checklist

### ✅ Environment Variables
- [ ] All secrets are environment variables
- [ ] No hardcoded credentials
- [ ] JWT secret is strong and unique
- [ ] Database credentials are secure

### ✅ CORS Configuration
- [ ] Only production domains allowed
- [ ] Credentials properly configured
- [ ] No wildcard origins in production

### ✅ Authentication
- [ ] JWT tokens properly configured
- [ ] Token expiration set
- [ ] Refresh token mechanism (if needed)

### ✅ File Upload Security
- [ ] File type validation
- [ ] File size limits
- [ ] Virus scanning (optional)
- [ ] Secure file storage

### ✅ API Security
- [ ] Rate limiting enabled
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] CDN configured
- [ ] Domain DNS configured

### Deployment
- [ ] Deploy API service
- [ ] Deploy Celery workers
- [ ] Configure Redis
- [ ] Set up monitoring
- [ ] Test all endpoints

### Post-Deployment
- [ ] Verify health checks
- [ ] Test file uploads
- [ ] Test video processing
- [ ] Monitor error logs
- [ ] Set up alerts

---

## 🔧 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
```bash
# Check Redis URL format
echo $REDIS_URL
# Should be: redis://username:password@host:port/db
```

2. **R2 Upload Failed**
```bash
# Verify Cloudflare credentials
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

3. **Celery Workers Not Starting**
```bash
# Check Redis connection
celery -A main.celery_app inspect ping
```

4. **CORS Errors**
```bash
# Verify CORS configuration
curl -H "Origin: https://your-domain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://your-api-domain.com/api/upload/request
```

### Debug Commands

```bash
# Check application logs
railway logs
# or
render logs

# Check Redis status
redis-cli ping

# Test R2 connection
python -c "
import boto3
s3 = boto3.client('s3', 
    endpoint_url='https://your-account-id.r2.cloudflarestorage.com',
    aws_access_key_id='your-access-key',
    aws_secret_access_key='your-secret-key'
)
print(s3.list_buckets())
"

# Test Celery
celery -A main.celery_app inspect active
```

---

## 📊 Performance Optimization

### 1. Database Optimization
- Use connection pooling
- Implement caching with Redis
- Optimize database queries

### 2. File Processing
- Use async file operations
- Implement file compression
- Optimize video processing pipeline

### 3. API Optimization
- Implement response caching
- Use pagination for large datasets
- Optimize JSON serialization

### 4. Infrastructure
- Use CDN for static assets
- Implement load balancing
- Monitor resource usage

---

## 🎯 Next Steps

1. **Set up monitoring** (Uptime Robot, Pingdom)
2. **Configure alerts** (email, Slack notifications)
3. **Set up CI/CD** (GitHub Actions, GitLab CI)
4. **Implement backup strategy** (database, files)
5. **Plan scaling strategy** (auto-scaling, load balancing)

---

## 📞 Support

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review platform-specific documentation
3. Check application logs for errors
4. Verify environment variable configuration
5. Test endpoints individually

---

**🎉 Congratulations!** Your ViralSplit API is now ready for production deployment. Choose the platform that best fits your needs and follow the step-by-step guide above.
