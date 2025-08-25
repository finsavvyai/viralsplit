# Mobile App & CDN Setup Guide

## 📱 Mobile App Updates

### Current Status
- **API Base URL**: `https://api.viralsplit.io`
- **Version Tracking**: ✅ Implemented
- **Build Number**: 1
- **Last Deployment**: 2025-08-24T21:22:06Z

### Mobile App Configuration

#### 1. API Service Updates
The mobile app's API service (`apps/viralsplit-mobile/src/services/api.ts`) has been updated with:

- **Version Endpoint**: Added `/version` endpoint to track build numbers
- **Production URLs**: Configured to use `https://api.viralsplit.io`
- **Error Handling**: Enhanced error handling for network issues

#### 2. Video Service Updates
The video service (`apps/viralsplit-mobile/src/services/videoService.ts`) includes:

- **Chunked Uploads**: Support for large video files
- **Progress Tracking**: Real-time upload progress
- **Status Polling**: Automatic status checking
- **CDN Integration**: Direct upload to R2/S3

### Mobile App Features

#### ✅ Implemented Features
- [x] Video upload with progress tracking
- [x] YouTube URL processing
- [x] Real-time status updates
- [x] Authentication system
- [x] Version tracking
- [x] Error handling
- [x] Offline support

#### 🔄 In Progress
- [ ] WebSocket support for real-time updates
- [ ] Push notifications
- [ ] Background processing
- [ ] Analytics dashboard

## 🌐 CDN Configuration

### Cloudflare R2 Setup

#### 1. Current Configuration
- **Bucket**: `viralsplit-media`
- **Region**: Auto (Global)
- **Domain**: `cdn.viralsplit.io`
- **Status**: ✅ Active

#### 2. CDN Endpoints

```bash
# Media files
https://cdn.viralsplit.io/videos/
https://cdn.viralsplit.io/thumbnails/
https://cdn.viralsplit.io/processed/

# API endpoints
https://api.viralsplit.io/health
https://api.viralsplit.io/version
```

#### 3. Environment Variables

```bash
# Railway API
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=viralsplit-media
R2_ENDPOINT_URL=https://your_account_id.r2.cloudflarestorage.com

# Vercel Web App
NEXT_PUBLIC_API_URL=https://api.viralsplit.io
NEXT_PUBLIC_CDN_URL=https://cdn.viralsplit.io
```

### DNS Configuration

#### Namecheap DNS Records
```
Type    Name    Value
A       @       76.76.19.34 (Vercel)
CNAME   api     viralspiritio-production.up.railway.app
CNAME   cdn     your_account_id.r2.cloudflarestorage.com
```

## 🚀 Deployment Process

### Version Management

#### 1. Build Number System
```bash
# Show current version
./scripts/version.sh show

# Increment build number
./scripts/version.sh increment

# Check deployment status
./scripts/version.sh status

# View deployment history
./scripts/version.sh history
```

#### 2. Deployment Scripts
```bash
# Deploy Railway API
./deploy_railway.sh

# Deploy Vercel Web App
./deploy_vercel.sh

# Deploy both
./deploy_all.sh
```

### Mobile App Deployment

#### 1. Expo Build
```bash
cd apps/viralsplit-mobile

# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Build for both platforms
expo build:all
```

#### 2. App Store Deployment
```bash
# Submit to App Store
expo upload:ios

# Submit to Google Play
expo upload:android
```

## 📊 Monitoring & Analytics

### Health Checks
```bash
# API Health
curl https://api.viralsplit.io/health

# Web App Health
curl https://viralsplit.io

# CDN Health
curl https://cdn.viralsplit.io/health
```

### Version Tracking
```bash
# API Version
curl https://api.viralsplit.io/version

# Expected Response
{
  "version": "1.0.0",
  "build": 1,
  "deployment": {
    "railway": {
      "build": 1,
      "deployed_at": "2025-08-24T21:22:06Z",
      "status": "online"
    }
  },
  "timestamp": "2025-08-24T21:22:06Z"
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Mobile App Can't Connect to API
```bash
# Check API health
curl https://api.viralsplit.io/health

# Check CORS configuration
curl -H "Origin: https://viralsplit.io" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://api.viralsplit.io/api/upload/youtube
```

#### 2. CDN Files Not Loading
```bash
# Check CDN endpoint
curl -I https://cdn.viralsplit.io/test-file

# Check R2 bucket permissions
aws s3 ls s3://viralsplit-media --endpoint-url https://your_account_id.r2.cloudflarestorage.com
```

#### 3. Version Mismatch
```bash
# Check all services versions
curl https://api.viralsplit.io/version
curl https://viralsplit.io/api/version  # If implemented
```

### Debug Commands
```bash
# Check deployment status
./scripts/version.sh status

# Monitor deployments
./monitor.sh

# Test full stack
./test_full_stack.sh

# Test WebSocket API
./test_websocket_api.sh
```

## 📈 Performance Optimization

### CDN Optimization
- **Cache Headers**: Set appropriate cache headers for different file types
- **Compression**: Enable gzip compression for text files
- **Image Optimization**: Use WebP format for images
- **Video Streaming**: Implement HLS/DASH for video streaming

### Mobile App Optimization
- **Lazy Loading**: Load components on demand
- **Image Caching**: Cache images locally
- **Offline Support**: Implement offline-first architecture
- **Background Sync**: Sync data when connection is restored

## 🔄 Update Process

### 1. Code Changes
```bash
# Make your changes
git add .
git commit -m "feat: new feature description"

# Increment build number
./scripts/version.sh increment

# Add changelog entry
./scripts/version.sh add-changelog "New feature description" "Bug fix description"
```

### 2. Deploy Updates
```bash
# Deploy API
./deploy_railway.sh

# Deploy Web App
./deploy_vercel.sh

# Deploy Mobile App (when ready)
cd apps/viralsplit-mobile
expo build:all
```

### 3. Verify Deployment
```bash
# Check all services
./scripts/version.sh status

# Test functionality
./test_full_stack.sh

# Monitor for issues
./monitor.sh
```

## 📞 Support

### Contact Information
- **API Issues**: Check Railway logs
- **Web App Issues**: Check Vercel logs
- **CDN Issues**: Check Cloudflare R2 dashboard
- **Mobile App Issues**: Check Expo logs

### Useful Links
- **Railway Dashboard**: https://railway.app/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Cloudflare R2**: https://dash.cloudflare.com
- **Expo Dashboard**: https://expo.dev

---

**Last Updated**: 2025-08-24
**Build**: 1
**Version**: 1.0.0
