# CDN Setup Instructions

## 1. Cloudflare R2 Setup

### Create R2 Bucket
1. Go to https://dash.cloudflare.com
2. Navigate to R2 Object Storage
3. Create a new bucket named `viralsplit-media`
4. Enable public access
-- https://pub-51819cf6765746a6911f22ae0a3bcd00.r2.dev
### Configure Custom Domain
1. Add custom domain: `cdn.viralsplit.io`
2. Add DNS record: `cdn.viralsplit.io` → `viralsplit-media.your-account.r2.cloudflarestorage.com`

### Namecheap DNS Configuration (If your domain is with Namecheap)
If your domain is registered with Namecheap, follow these steps:

1. **Login to Namecheap**
   - Go to https://namecheap.com and login to your account
   - Navigate to "Domain List" → Select your domain

2. **Access DNS Settings**
   - Click "Manage" next to your domain
   - Go to "Advanced DNS" tab

3. **Add CNAME Record**
   - Click "Add New Record"
   - Select "CNAME Record" from dropdown
   - Host: `cdn` (this creates cdn.yourdomain.com)
   - Value: `viralsplit-media.your-account.r2.cloudflarestorage.com`
   - TTL: Automatic (or 300 seconds)
   - Click "Save"

4. **Alternative: Use Cloudflare DNS (Recommended)**
   - Transfer your domain to Cloudflare for better integration
   - Or use Cloudflare as DNS provider while keeping domain at Namecheap:
     1. Go to Cloudflare → Add Site
     2. Enter your domain
     3. Select "Free" plan
     4. Update nameservers at Namecheap to Cloudflare's nameservers
     5. Add CNAME record in Cloudflare dashboard

### Get API Credentials
1. Go to R2 API Tokens
2. Create new API token with read/write permissions
3. Copy Account ID, Access Key ID, and Secret Access Key

## 2. Update Environment Files

### Backend (.env)
Update `apps/api/.env` with your Cloudflare credentials:
```
CLOUDFLARE_ACCOUNT_ID=your_actual_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_actual_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_actual_secret_access_key
CDN_DOMAIN=cdn.viralsplit.io
```

### Frontend (.env.local)
Update `apps/viralsplit/.env.local`:
```
NEXT_PUBLIC_CDN_DOMAIN=cdn.viralsplit.io
```

## 3. Test CDN Setup

### Test Upload
```bash
curl -X PUT "https://cdn.viralsplit.io/test-file.txt" \
  -H "Content-Type: text/plain" \
  --data-binary "Hello CDN!"
```

### Test Download
```bash
curl -I "https://cdn.viralsplit.io/test-file.txt"
```

## 4. File Naming Structure

Your files will be organized as:
```
viralsplit-media/
├── users/
│   ├── user_1/
│   │   ├── 20241201_143022_abc12345_my_video_original.mp4
│   │   └── outputs/
│   │       └── project_uuid_1/
│   │           ├── 20241201_143156_def67890_tiktok_standard.mp4
│   │           └── 20241201_143157_ghi11111_instagram_reels_standard.mp4
│   └── user_2/
│       └── ...
```

## 5. Security Configuration

### CORS Settings
Configure CORS in your R2 bucket:
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

## 6. Start Development

```bash
# Start all services
./start-dev.sh

# Or start individually
cd apps/api && python main.py
cd apps/viralsplit && npm run dev
```

## 7. Authentication

The system now includes:
- User registration and login
- JWT token authentication
- Social media account connections
- User-specific file organization
- Credit system for video processing

## 8. Troubleshooting

### Namecheap DNS Issues

**Problem**: CNAME record not working after adding to Namecheap
**Solutions**:
1. **Wait for DNS propagation** (can take up to 48 hours)
2. **Check TTL settings** - Use 300 seconds or Automatic
3. **Verify CNAME format** - Host should be `cdn`, not `cdn.yourdomain.com`
4. **Clear DNS cache** - Use `nslookup cdn.yourdomain.com` to test

**Problem**: Domain not resolving to Cloudflare R2
**Solutions**:
1. **Verify R2 bucket name** - Must match exactly
2. **Check Cloudflare account ID** - Ensure it's correct in the CNAME value
3. **Test with dig command**:
   ```bash
   dig cdn.yourdomain.com CNAME
   ```

### DNS Propagation Testing
```bash
# Test DNS resolution
nslookup cdn.yourdomain.com

# Test with different DNS servers
dig @8.8.8.8 cdn.yourdomain.com CNAME
dig @1.1.1.1 cdn.yourdomain.com CNAME

# Check if CNAME is working
curl -I https://cdn.yourdomain.com/test-file.txt
```

## 9. Next Steps

1. Set up your Cloudflare R2 bucket
2. Configure DNS records in Namecheap (or Cloudflare)
3. Update environment variables with real credentials
4. Test the CDN setup
5. Start the development servers
6. Test user registration and video upload

For detailed setup instructions, see `docs/cdn-setup.md`
