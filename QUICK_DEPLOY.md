# 🚀 Quick Render Deployment Guide

## Step 1: Go to Render Dashboard
1. Visit [dashboard.render.com](https://dashboard.render.com)
2. Sign up/Login to your Render account

## Step 2: Create New Blueprint
1. Click **"New +"** button
2. Select **"Blueprint"**
3. Connect your GitHub account if not already connected

## Step 3: Select Repository
1. Find and select **`finsavvyai/viralsplit`**
2. Render will automatically detect the `render.yaml` file
3. Click **"Connect"**

## Step 4: Configure Services
Render will create:
- **Web Service**: `viralsplit-api` (your FastAPI app)
- **Redis**: `viralsplit-redis` (for caching and sessions)

## Step 5: Set Environment Variables
In the Render dashboard, go to your `viralsplit-api` service:

### Required Variables:
```
OPENAI_API_KEY=your_openai_api_key_here

REPLICATE_API_TOKEN=your_replicate_token_here

ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

JWT_SECRET=your_jwt_secret_here

CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here

CLOUDFLARE_ACCESS_KEY_ID=your_cloudflare_access_key_here

CLOUDFLARE_SECRET_ACCESS_KEY=your_cloudflare_secret_key_here

SUPABASE_URL=your_supabase_url_here

SUPABASE_KEY=your_supabase_key_here

LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key_here

LEMONSQUEEZY_WEBHOOK_SECRET=your_lemonsqueezy_webhook_secret_here

CDN_DOMAIN=cdn.viralsplit.io

R2_BUCKET_NAME=viralsplit-media

JWT_ALGORITHM=HS256

JWT_EXPIRATION_HOURS=24

DEBUG=false

ENVIRONMENT=production
```

**Note**: Copy the actual values from your `apps/api/.env` file.

## Step 6: Deploy
1. Click **"Create Blueprint"**
2. Wait for deployment to complete (5-10 minutes)
3. Your API will be available at: `https://viralsplit-api.onrender.com`

## Step 7: Test Your Deployment
```bash
# Health check
curl https://viralsplit-api.onrender.com/health

# API documentation
curl https://viralsplit-api.onrender.com/docs

# Test registration
curl -X POST https://viralsplit-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","username":"testuser"}'
```

## 🎉 Success!
Your ViralSplit API is now live and ready for production use!

### Access Points:
- **API**: https://viralsplit-api.onrender.com
- **Docs**: https://viralsplit-api.onrender.com/docs
- **Health**: https://viralsplit-api.onrender.com/health

### Next Steps:
1. Update your mobile app to use the production API
2. Test all features
3. Monitor performance in Render dashboard
4. Set up custom domain if needed
