# Fix Cloudflare DNS for viralsplit.io

## Current Problem
Your domain `viralsplit.io` is showing a CNAME record pointing to `ap-blockpage.prod.bzq.securingsam.com` which is blocking your site.

## How to Fix in Cloudflare Dashboard

### Step 1: Login to Cloudflare
1. Go to https://dash.cloudflare.com
2. Select `viralsplit.io` domain

### Step 2: Go to DNS Records
Click on "DNS" in the left sidebar

### Step 3: Look for These Records
You might see one of these (they all mean the root domain):
- `viralsplit.io` 
- `@`
- Just the domain name with no subdomain
- A record with "Name" field empty or showing just `viralsplit.io`

The problematic record will show:
```
Type: CNAME
Name: viralsplit.io (or @ or empty)
Content: ap-blockpage.prod.bzq.securingsam.com
```

### Step 4: Delete the Blocking Record
Click the "Edit" or "Delete" button (trash icon) next to that record

### Step 5: Add the Correct Record
Click "Add record" and create:

**Option A - For Vercel (Recommended):**
```
Type: A
Name: @ (or leave empty, or viralsplit.io)
IPv4 address: 76.76.19.61
Proxy status: DNS only (gray cloud, NOT orange)
TTL: Auto
```

**Option B - If you want to use Railway for frontend too:**
```
Type: CNAME
Name: @ (or viralsplit.io)
Target: viralspiritio-production.up.railway.app
Proxy status: DNS only (gray cloud)
TTL: Auto
```

### Step 6: Add www subdomain
```
Type: CNAME
Name: www
Target: Same as your root domain choice above
Proxy status: DNS only (gray cloud)
TTL: Auto
```

## Your Final DNS Setup Should Be:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | viralsplit.io | 76.76.19.61 | DNS only |
| CNAME | www | viralsplit.io | DNS only |
| CNAME | api | Your Railway URL | DNS only |
| CNAME | cdn | Your CDN URL | DNS only |

## Verification
After making changes, wait 5 minutes then test:

```bash
# Test DNS
dig viralsplit.io A

# Should return: 76.76.19.61 (not the blockpage)

# Test the site
curl -I https://viralsplit.io

# Should return: HTTP/2 200 (not 401 or certificate error)
```

## If You Can't Find the Record

The blocking might be coming from:
1. **Cloudflare Security Settings**: Check "Security" → "WAF" → Custom rules
2. **Page Rules**: Check if there's a forwarding rule
3. **Workers**: Check if there's a Worker script redirecting traffic
4. **Cloudflare Access**: Check "Zero Trust" → "Access" → Applications

## Alternative: Export/Import DNS Records

1. Go to DNS → Advanced Actions → Export DNS records
2. Look for the line with `ap-blockpage.prod.bzq.securingsam.com`
3. Delete that line
4. Import the cleaned file back

## Contact Support
If you still can't find it, contact Cloudflare support with:
"My domain viralsplit.io is incorrectly pointing to ap-blockpage.prod.bzq.securingsam.com instead of my actual website"