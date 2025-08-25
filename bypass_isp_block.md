# Bypass ISP Domain Blocking for viralsplit.io

## Quick Tests to Confirm ISP Blocking

### 1. Change DNS Servers
**On macOS:**
```bash
# Temporarily use Google DNS
sudo networksetup -setdnsservers Wi-Fi 8.8.8.8 8.8.4.4

# Test the site
curl -I https://viralsplit.io

# Restore original DNS
sudo networksetup -setdnsservers Wi-Fi "Empty"
```

**On Windows:**
```cmd
# Use Cloudflare DNS
netsh interface ip set dns "Wi-Fi" static 1.1.1.1
netsh interface ip add dns "Wi-Fi" 1.0.0.1 index=2

# Test then restore
netsh interface ip set dns "Wi-Fi" dhcp
```

### 2. Use VPN
- **ProtonVPN** (free)
- **Windscribe** (free tier)
- **Cloudflare WARP** (free)

### 3. Mobile Data Test
Switch to mobile data and test `https://viralsplit.io`

## Long-term Solutions

### Solution A: Alternative Domain
Register a neutral domain name:
- `contentmulti.app`
- `videotoolkit.pro` 
- `multiplatform.studio`
- `socialoptimizer.co`

### Solution B: Subdomain Strategy
Add these DNS records in Cloudflare:

```
Type: A
Name: app
Content: 64.29.17.131
Proxy: OFF

Type: CNAME  
Name: www
Content: app.viralsplit.io
Proxy: OFF
```

Then users access: `https://app.viralsplit.io`

### Solution C: Use Cloudflare's Features
Enable these in Cloudflare:
- **Always Use HTTPS**: Force HTTPS redirect
- **HSTS**: Prevent ISP tampering
- **Encrypted SNI**: Hide domain from ISP inspection

### Solution D: DDoS Protection Workaround
Sometimes enabling Cloudflare's "I'm Under Attack" mode temporarily can bypass ISP blocks by changing the IP response pattern.

## Immediate Workaround

Create an `app.viralsplit.io` subdomain pointing to your Vercel deployment:

1. **In Cloudflare DNS**: Add A record for `app` pointing to `64.29.17.131`
2. **In Vercel**: Add `app.viralsplit.io` as a custom domain
3. **Update your links**: Use `app.viralsplit.io` as the main URL

This often bypasses ISP keyword filtering while keeping your brand.

## Test Commands

```bash
# Test different approaches
curl -H "Host: viralsplit.io" https://64.29.17.131  # Direct IP
curl https://app.viralsplit.io                       # Subdomain
curl --resolve viralsplit.io:443:64.29.17.131 https://viralsplit.io  # Force resolve
```

Most Israeli ISPs block based on domain keywords, not subdomains or IPs.