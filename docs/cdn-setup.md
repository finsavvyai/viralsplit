# CDN Setup Guide for ViralSplit

## Overview

This guide covers setting up Cloudflare R2 as a CDN for ViralSplit with proper file naming, user isolation, and public access.

## 1. Cloudflare R2 Setup

### Create R2 Bucket

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Navigate to R2 Object Storage

2. **Create Bucket**
   ```bash
   # Using Cloudflare CLI
   wrangler r2 bucket create viralsplit-media
   ```

3. **Configure Public Access**
   - Enable public access for the bucket
   - Set up custom domain: `cdn.viralsplit.io`

### Configure Custom Domain

1. **Add Custom Domain**
   ```bash
   # Add custom domain to R2 bucket
   wrangler r2 bucket domain create viralsplit-media cdn.viralsplit.io
   ```

2. **DNS Configuration**
   - Add CNAME record: `cdn.viralsplit.io` → `viralsplit-media.your-account.r2.cloudflarestorage.com`

## 2. Environment Configuration

### Backend Environment Variables

```env
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key

# CDN Configuration
CDN_DOMAIN=cdn.viralsplit.io
R2_BUCKET_NAME=viralsplit-media

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

### Frontend Environment Variables

```env
# CDN Configuration
NEXT_PUBLIC_CDN_DOMAIN=cdn.viralsplit.io
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 3. File Naming Structure

### User-Specific File Organization

```
viralsplit-media/
├── users/
│   ├── user_1/
│   │   ├── 20241201_143022_abc12345_my_video_original.mp4
│   │   ├── outputs/
│   │   │   ├── project_uuid_1/
│   │   │   │   ├── 20241201_143156_def67890_tiktok_standard.mp4
│   │   │   │   ├── 20241201_143157_ghi11111_instagram_reels_standard.mp4
│   │   │   │   └── 20241201_143158_jkl22222_youtube_shorts_standard.mp4
│   │   │   └── project_uuid_2/
│   │   │       └── ...
│   │   └── ...
│   ├── user_2/
│   │   └── ...
│   └── ...
└── public/
    ├── templates/
    └── assets/
```

### File Naming Convention

**Original Uploads:**
```
{timestamp}_{unique_id}_{safe_filename}_{file_type}.{extension}
```

**Transformed Videos:**
```
{timestamp}_{unique_id}_{platform}_{variant}.mp4
```

**Examples:**
- `20241201_143022_abc12345_my_video_original.mp4`
- `20241201_143156_def67890_tiktok_standard.mp4`
- `20241201_143157_ghi11111_instagram_reels_standard.mp4`

## 4. Security Configuration

### R2 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForGetBucketObjects",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::viralsplit-media/*"
    },
    {
      "Sid": "AuthenticatedUsersUpload",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::your-account:user/your-user"
      },
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::viralsplit-media/users/*"
    }
  ]
}
```

### CORS Configuration

```json
[
  {
    "AllowedOrigins": [
      "https://viralsplit.io",
      "https://contentmulti.com",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 5. CDN Optimization

### Cache Headers

```python
# In storage.py upload_video method
ExtraArgs={
    'ContentType': content_type,
    'CacheControl': 'max-age=31536000',  # 1 year cache
    'ACL': 'public-read'
}
```

### Cloudflare Page Rules

1. **Cache Everything**
   - URL: `cdn.viralsplit.io/*`
   - Settings: Cache Level → Cache Everything

2. **Edge Caching**
   - URL: `cdn.viralsplit.io/users/*`
   - Settings: Cache Level → Standard

3. **Security Headers**
   - URL: `cdn.viralsplit.io/*`
   - Settings: Security Level → Medium

## 6. Monitoring and Analytics

### Cloudflare Analytics

1. **Enable Analytics**
   - Go to Cloudflare Analytics
   - Monitor bandwidth usage
   - Track cache hit rates

2. **Set up Alerts**
   - Bandwidth usage alerts
   - Error rate monitoring
   - Cache performance alerts

### Custom Monitoring

```python
# Add to storage.py
def log_upload_metrics(self, file_size: int, user_id: str):
    """Log upload metrics for monitoring"""
    metrics = {
        'timestamp': datetime.utcnow().isoformat(),
        'user_id': user_id,
        'file_size': file_size,
        'action': 'upload'
    }
    # Send to monitoring service
    print(f"Upload metrics: {metrics}")
```

## 7. Cost Optimization

### R2 Pricing (as of 2024)

- **Storage**: $0.015 per GB per month
- **Class A Operations** (writes): $4.50 per million
- **Class B Operations** (reads): $0.36 per million
- **Egress**: $0 per GB (free)

### Optimization Strategies

1. **Compression**
   - Use efficient video codecs (H.264, H.265)
   - Optimize bitrates per platform

2. **Caching**
   - Set appropriate cache headers
   - Use Cloudflare's edge caching

3. **Cleanup**
   - Implement automatic cleanup of old files
   - Archive completed projects

## 8. Production Deployment

### Environment Variables

```bash
# Production .env
CLOUDFLARE_ACCOUNT_ID=your_production_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_production_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=your_production_secret_key
CDN_DOMAIN=cdn.viralsplit.io
JWT_SECRET=your-production-jwt-secret
```

### SSL Certificate

1. **Automatic SSL**
   - Cloudflare provides automatic SSL
   - Enable "Always Use HTTPS"

2. **Custom Certificate** (optional)
   - Upload custom SSL certificate
   - Configure for custom domain

## 9. Testing

### Test CDN Setup

```bash
# Test upload
curl -X PUT "https://cdn.viralsplit.io/test-file.txt" \
  -H "Content-Type: text/plain" \
  --data-binary "Hello CDN!"

# Test download
curl -I "https://cdn.viralsplit.io/test-file.txt"
```

### Performance Testing

```python
# Test upload/download speeds
import time
import requests

def test_cdn_performance():
    start_time = time.time()
    response = requests.get("https://cdn.viralsplit.io/test-video.mp4")
    download_time = time.time() - start_time
    
    print(f"Download time: {download_time:.2f}s")
    print(f"Speed: {len(response.content) / download_time / 1024 / 1024:.2f} MB/s")
```

## 10. Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS configuration in R2
   - Verify allowed origins

2. **403 Forbidden**
   - Check bucket permissions
   - Verify API keys

3. **Slow Downloads**
   - Check cache headers
   - Verify CDN configuration

4. **File Not Found**
   - Check file naming
   - Verify bucket path

### Debug Commands

```bash
# Check bucket contents
wrangler r2 object list viralsplit-media

# Check bucket settings
wrangler r2 bucket get viralsplit-media

# Test custom domain
curl -I https://cdn.viralsplit.io/test-file.txt
```

## 11. Backup and Recovery

### Backup Strategy

1. **Cross-Region Replication**
   - Set up R2 bucket replication
   - Backup to secondary region

2. **Versioning**
   - Enable bucket versioning
   - Keep multiple versions of files

3. **Monitoring**
   - Set up backup monitoring
   - Test recovery procedures

This setup provides a robust, scalable CDN solution for ViralSplit with proper user isolation, security, and performance optimization.
