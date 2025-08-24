# 🚀 ViralSplit Render Deployment Guide

## Quick Start

### Option 1: Automated Deployment
```bash
./deploy_render.sh
```

### Option 2: Manual Deployment
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`
5. Set environment variables
6. Deploy!

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code must be in a GitHub repo
3. **Environment Variables**: All API keys ready

## 🔧 Environment Variables

Set these in Render Dashboard → Environment:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | ✅ |
| `REPLICATE_API_TOKEN` | Replicate API token | ✅ |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | ✅ |
| `CLOUDFLARE_ACCESS_KEY_ID` | Cloudflare access key | ✅ |
| `CLOUDFLARE_SECRET_ACCESS_KEY` | Cloudflare secret key | ✅ |
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_KEY` | Supabase API key | ✅ |
| `LEMONSQUEEZY_API_KEY` | LemonSqueezy API key | ✅ |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | LemonSqueezy webhook secret | ✅ |

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Web Service   │    │   Redis Cache   │
│   (Python)      │◄──►│   (Managed)     │
│   Port: 8000    │    │   Auto-scaling  │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   CDN/Storage   │
│  (Cloudflare)   │
└─────────────────┘
```

## 📊 Render Services

### 1. Web Service (API)
- **Type**: Web Service
- **Environment**: Python 3.11
- **Build Command**: `pip install -r apps/api/requirements.txt`
- **Start Command**: `cd apps/api && uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Plan**: Free (or paid for better performance)

### 2. Redis Cache
- **Type**: Redis
- **Plan**: Free
- **Purpose**: Session storage, caching, Celery broker

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### Step 2: Deploy to Render
```bash
# Run automated deployment
./deploy_render.sh
```

### Step 3: Set Environment Variables
1. Go to Render Dashboard
2. Select your `viralsplit-api` service
3. Go to "Environment" tab
4. Add all required environment variables
5. Save changes

### Step 4: Monitor Deployment
1. Watch the build logs
2. Wait for "Deploy successful"
3. Test your API endpoints

## 🌐 Access Your API

Once deployed, your API will be available at:
- **Production URL**: `https://viralsplit-api.onrender.com`
- **Health Check**: `https://viralsplit-api.onrender.com/health`
- **API Docs**: `https://viralsplit-api.onrender.com/docs`

## 🧪 Testing Deployment

### Health Check
```bash
curl https://viralsplit-api.onrender.com/health
```

### API Documentation
```bash
curl https://viralsplit-api.onrender.com/docs
```

### Test Authentication
```bash
curl -X POST https://viralsplit-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","username":"testuser"}'
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Build Fails
- Check build logs in Render Dashboard
- Ensure all dependencies are in `requirements.txt`
- Verify Python version compatibility

#### 2. Environment Variables Missing
- Double-check all variables are set in Render Dashboard
- Ensure variable names match exactly
- Check for typos in values

#### 3. API Not Responding
- Check service logs in Render Dashboard
- Verify health check endpoint
- Ensure Redis connection is working

#### 4. CORS Issues
- Check CORS configuration in `main.py`
- Add your frontend domain to allowed origins

### Debug Commands
```bash
# Check service status
curl https://viralsplit-api.onrender.com/health

# Test API endpoints
curl https://viralsplit-api.onrender.com/docs

# Check logs in Render Dashboard
# Go to your service → Logs tab
```

## 📈 Scaling

### Free Tier Limits
- **Web Service**: 750 hours/month
- **Redis**: 30 days retention
- **Bandwidth**: 100GB/month

### Paid Plans
- **Starter**: $7/month - Better performance
- **Standard**: $25/month - Auto-scaling
- **Pro**: $100/month - Dedicated resources

## 🔄 Continuous Deployment

Render automatically deploys when you push to your main branch:
```bash
git add .
git commit -m "Update API"
git push origin main
# Render will automatically redeploy
```

## 📱 Mobile App Configuration

Update your mobile app to use the production API:
```javascript
const API_BASE_URL = 'https://viralsplit-api.onrender.com';
```

## 🎯 Performance Optimization

1. **Enable Caching**: Use Redis for session storage
2. **CDN**: Cloudflare R2 for media files
3. **Database**: Supabase for data persistence
4. **Background Tasks**: Celery for async processing

## 🔐 Security

- All API keys are encrypted in Render
- HTTPS enabled by default
- CORS configured for security
- JWT authentication implemented

## 📞 Support

- **Render Support**: [help.render.com](https://help.render.com)
- **Documentation**: [render.com/docs](https://render.com/docs)
- **Community**: [render.com/community](https://render.com/community)

---

**🎉 Your ViralSplit API is now deployed and ready for production!**
