# Namecheap DNS Setup for ViralSplit CDN

## Overview

This guide provides step-by-step instructions for configuring DNS records in Namecheap to work with Cloudflare R2 CDN for your ViralSplit application.

## Prerequisites

- Namecheap account with your domain
- Cloudflare R2 bucket set up
- Cloudflare account ID and R2 bucket name

## Step-by-Step Instructions

### 1. Login to Namecheap

1. Go to https://namecheap.com
2. Click "Sign In" and enter your credentials
3. Navigate to "Domain List" in your dashboard

### 2. Access Domain Management

1. Find your domain in the list
2. Click "Manage" next to your domain name
3. You'll be taken to the domain management page

### 3. Navigate to DNS Settings

1. Click on the "Advanced DNS" tab
2. You'll see a list of existing DNS records

### 4. Add CNAME Record for CDN

1. Click "Add New Record" button
2. Configure the record as follows:
   - **Type**: CNAME Record
   - **Host**: `cdn` (this creates cdn.yourdomain.com)
   - **Value**: `viralsplit-media.your-account.r2.cloudflarestorage.com`
   - **TTL**: Automatic (or 300 seconds)
3. Click "Save Changes"

### 5. Verify the Record

After saving, you should see a new CNAME record like:
```
Type: CNAME Record
Host: cdn
Value: viralsplit-media.your-account.r2.cloudflarestorage.com
TTL: Automatic
```

## Alternative: Use Cloudflare as DNS Provider

For better integration with Cloudflare R2, consider using Cloudflare as your DNS provider:

### Option A: Transfer Domain to Cloudflare

1. Go to https://cloudflare.com
2. Click "Add a Site"
3. Enter your domain name
4. Select the "Free" plan
5. Follow the transfer process
6. Add CNAME record in Cloudflare dashboard

### Option B: Use Cloudflare DNS with Namecheap Domain

1. **Add Site to Cloudflare**:
   - Go to https://cloudflare.com
   - Click "Add a Site"
   - Enter your domain name
   - Select "Free" plan
   - Skip the transfer option

2. **Get Cloudflare Nameservers**:
   - Cloudflare will provide you with 2 nameservers
   - Example: `nina.ns.cloudflare.com` and `rick.ns.cloudflare.com`

3. **Update Nameservers in Namecheap**:
   - Go back to Namecheap domain management
   - Click "Domain" tab
   - Click "Nameservers" dropdown
   - Select "Custom DNS"
   - Enter the Cloudflare nameservers
   - Click "✓" to save

4. **Add CNAME Record in Cloudflare**:
   - Go to Cloudflare dashboard
   - Select your domain
   - Go to "DNS" tab
   - Add CNAME record:
     - Name: `cdn`
     - Target: `viralsplit-media.your-account.r2.cloudflarestorage.com`
     - Proxy status: DNS only (gray cloud)

## Testing Your Setup

### 1. Test DNS Resolution

```bash
# Test with nslookup
nslookup cdn.yourdomain.com

# Test with dig
dig cdn.yourdomain.com CNAME

# Test with different DNS servers
dig @8.8.8.8 cdn.yourdomain.com CNAME
dig @1.1.1.1 cdn.yourdomain.com CNAME
```

### 2. Test CDN Access

```bash
# Test if CDN is accessible
curl -I https://cdn.yourdomain.com

# Upload a test file (if you have R2 credentials)
curl -X PUT "https://cdn.yourdomain.com/test.txt" \
  -H "Content-Type: text/plain" \
  --data-binary "Hello CDN!"
```

## Common Issues and Solutions

### Issue: CNAME Record Not Working

**Symptoms**: `nslookup cdn.yourdomain.com` returns no results

**Solutions**:
1. **Wait for DNS propagation** (up to 48 hours)
2. **Check TTL settings** - Use 300 seconds or Automatic
3. **Verify CNAME format** - Host should be `cdn`, not `cdn.yourdomain.com`
4. **Clear browser DNS cache**

### Issue: Wrong R2 Bucket Name

**Symptoms**: DNS resolves but CDN doesn't work

**Solutions**:
1. **Verify bucket name** - Must be exactly `viralsplit-media`
2. **Check Cloudflare account ID** - Ensure it's correct in the CNAME value
3. **Test bucket access** - Try accessing the R2 bucket directly

### Issue: SSL Certificate Errors

**Symptoms**: Browser shows SSL certificate warnings

**Solutions**:
1. **Use Cloudflare DNS** - Provides automatic SSL
2. **Wait for certificate generation** - Can take up to 24 hours
3. **Check CNAME proxy status** - Should be "DNS only" (gray cloud)

## DNS Propagation Timeline

- **Namecheap DNS**: 15 minutes to 48 hours
- **Cloudflare DNS**: 5 minutes to 1 hour
- **Global propagation**: Up to 48 hours

## Environment Configuration

After DNS is set up, update your environment files:

### Backend (.env)
```env
CDN_DOMAIN=cdn.yourdomain.com
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_CDN_DOMAIN=cdn.yourdomain.com
```

## Verification Checklist

- [ ] CNAME record added in Namecheap/Cloudflare
- [ ] DNS propagation completed (tested with nslookup)
- [ ] CDN domain accessible via HTTPS
- [ ] Environment variables updated
- [ ] Application can upload to CDN
- [ ] Files are accessible via CDN URL

## Support

If you continue to have issues:

1. **Check Namecheap support**: https://support.namecheap.com
2. **Check Cloudflare support**: https://support.cloudflare.com
3. **Test with different DNS servers**
4. **Verify R2 bucket configuration**

---

**Note**: DNS changes can take time to propagate globally. If it's not working immediately, wait a few hours and test again.
