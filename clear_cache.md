# Clear All Caches for Fresh Deployment

## 1. Purge Cloudflare Cache

**In Cloudflare Dashboard:**
1. Go to https://dash.cloudflare.com
2. Select `viralsplit.io` domain
3. Go to **Caching** → **Configuration**
4. Click **"Purge Everything"**
5. Confirm purge

## 2. Clear Browser Cache

**On Mobile:**
- **Safari**: Settings → Safari → Clear History and Website Data
- **Chrome**: Settings → Privacy → Clear Browsing Data → All Time
- **Or use Private/Incognito mode**

**On Desktop:**
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or open Developer Tools → Network → Disable cache

## 3. Clear DNS Cache

**On Mobile:**
- Turn Airplane Mode ON for 10 seconds, then OFF
- Or restart the device

**On Desktop:**
```bash
# macOS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches
```

## 4. Force Fresh Load

**Add cache buster to URL:**
- `https://app.viralsplit.io?v=64&t=` + current timestamp
- This bypasses all caches

## 5. Check Latest Deployment

**Verify you're getting the latest build:**
1. Open Developer Tools → Network tab
2. Visit `https://app.viralsplit.io`
3. Look for `_next/static/chunks/` files
4. Check timestamps - should be recent

## 6. Test Commands

```bash
# Check current deployment ID
curl -I https://app.viralsplit.io | grep x-vercel-id

# Compare with latest deployment
curl -I https://viralsplit-qlyz7u1bv-infos-projects-08e74b74.vercel.app | grep x-vercel-id
```

If IDs match, you're getting the latest deployment.