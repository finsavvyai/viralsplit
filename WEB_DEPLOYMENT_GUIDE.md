# 🌍 ViralSplit Web App Deployment Guide

## 🚀 **Recommended: Vercel Deployment**

### Why Vercel?
- ✅ **Perfect for Next.js** - Built by the Next.js team
- ✅ **Automatic deployments** - Deploys on every git push
- ✅ **Global CDN** - Fast worldwide performance
- ✅ **Free tier** - Generous limits
- ✅ **Easy setup** - Just connect your GitHub repo

## 📋 **Quick Deployment Steps**

### Option 1: Automated Deployment
```bash
./deploy_web.sh
```

### Option 2: Manual Deployment

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy
```bash
cd apps/viralsplit
vercel --prod
```

### Option 3: Web Interface Deployment

1. **Go to**: [vercel.com](https://vercel.com)
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Import Repository**: `finsavvyai/viralsplit`
5. **Configure**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/viralsplit`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. **Add Environment Variable**:
   - `NEXT_PUBLIC_API_URL`: `https://viralspiritio-production.up.railway.app`
7. **Deploy**

## 🔧 **Environment Variables**

Set in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://viralspiritio-production.up.railway.app` | Production API URL |

## 🌐 **Alternative Platforms**

### Cloudflare Pages
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
cd apps/viralsplit
wrangler pages deploy .next --project-name=viralsplit
```

### Netlify
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Set build command: `cd apps/viralsplit && npm run build`
4. Set publish directory: `apps/viralsplit/.next`
5. Add environment variables
6. Deploy

### Railway (Alternative)
```bash
# Create railway.json in apps/viralsplit
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300
  }
}
```

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │    │   Cloudflare    │
│   (Web App)     │◄──►│   (API)         │◄──►│   (Storage/CDN) │
│   Next.js       │    │   FastAPI       │    │   R2 Storage    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 **Performance Benefits**

### Vercel Features:
- **Edge Functions**: Serverless functions at the edge
- **Image Optimization**: Automatic image optimization
- **Analytics**: Built-in performance monitoring
- **Preview Deployments**: Automatic preview URLs for PRs
- **Custom Domains**: Easy domain configuration

## 🔄 **Continuous Deployment**

Once deployed, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Optimize builds for performance
- Provide instant rollbacks

## 🌍 **Global Distribution**

Your web app will be available at:
- **Production**: `https://viralsplit.vercel.app`
- **Preview**: `https://viralsplit-git-feature-branch.vercel.app`
- **Custom Domain**: `https://viralsplit.io` (if configured)

## 🧪 **Testing Deployment**

After deployment, test:
```bash
# Health check
curl https://viralsplit.vercel.app

# API connection
curl https://viralsplit.vercel.app/api/health

# Performance
curl -I https://viralsplit.vercel.app
```

## 📱 **Mobile App Integration**

Update your mobile app to use the production web app:
```javascript
const WEB_APP_URL = 'https://viralsplit.vercel.app';
const API_URL = 'https://viralspiritio-production.up.railway.app';
```

## 🎯 **Next Steps**

1. **Deploy to Vercel** (recommended)
2. **Set up custom domain** (optional)
3. **Configure analytics** (optional)
4. **Set up monitoring** (optional)
5. **Test all features** in production

---

**🎉 Your ViralSplit web app will be live and production-ready!**
