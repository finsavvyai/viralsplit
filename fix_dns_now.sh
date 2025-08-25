#!/bin/bash

# Fix DNS Issues for viralsplit.io

echo "🔧 Fixing DNS for viralsplit.io"
echo "================================"

# Your records show the A record exists but DNS still returns the block page
# This script will help diagnose and fix the issue

# 1. Check current DNS propagation
echo "1. Checking DNS propagation..."
echo "Google DNS:"
dig @8.8.8.8 viralsplit.io A +short
echo "Cloudflare DNS:"
dig @1.1.1.1 viralsplit.io A +short
echo "OpenDNS:"
dig @208.67.222.222 viralsplit.io A +short

# 2. Flush local DNS cache
echo -e "\n2. Flushing local DNS cache..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    sudo dscacheutil -flushcache
    sudo killall -HUP mDNSResponder
    echo "✅ macOS DNS cache flushed"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemd-resolve --flush-caches
    echo "✅ Linux DNS cache flushed"
fi

# 3. Test with curl bypassing DNS
echo -e "\n3. Testing direct connection to Vercel IP..."
curl -I -H "Host: viralsplit.io" https://76.76.19.61 --resolve viralsplit.io:443:76.76.19.61 2>&1 | head -5

# 4. Check TTL and propagation time
echo -e "\n4. Checking TTL..."
dig viralsplit.io A +noall +answer

echo -e "\n5. IMPORTANT ACTIONS IN CLOUDFLARE:"
echo "===================================="
echo "1. DELETE these NS records (they're conflicting):"
echo "   - dns1.registrar-servers.com"
echo "   - dns2.registrar-servers.com"
echo ""
echo "2. VERIFY the A record:"
echo "   - Name: viralsplit.io (or @)"
echo "   - Content: 76.76.19.61"
echo "   - Proxy: OFF (gray cloud)"
echo ""
echo "3. UPDATE www record to match:"
echo "   - Change from: viralsplit-pkmyy79ao-infos-projects-08e74b74.vercel.app"
echo "   - To: viralsplit.io"
echo "   - Proxy: OFF (gray cloud)"
echo ""
echo "4. PURGE Cloudflare Cache:"
echo "   - Go to Caching → Configuration"
echo "   - Click 'Purge Everything'"
echo ""
echo "5. If still not working after 10 minutes:"
echo "   - Check Security → Events for blocks"
echo "   - Check Rules → Page Rules for redirects"
echo "   - Contact Cloudflare support about the ap-blockpage CNAME"

echo -e "\n6. Test URLs:"
echo "============="
echo "After changes, test these:"
echo "https://viralsplit.io (should work)"
echo "https://www.viralsplit.io (should work)"
echo "https://api.viralsplit.io/health (already working)"

# Create a test HTML file
cat > test_direct.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Direct Test</title></head>
<body>
<h1>Testing Direct Connection</h1>
<script>
// Test direct IP with Host header
fetch('https://76.76.19.61', {
    headers: { 'Host': 'viralsplit.io' }
}).then(r => console.log('Direct IP test:', r.status))
  .catch(e => console.error('Direct IP failed:', e));

// Test domain
fetch('https://viralsplit.io')
  .then(r => console.log('Domain test:', r.status))
  .catch(e => console.error('Domain failed:', e));
</script>
<p>Check browser console for results</p>
</body>
</html>
EOF

echo -e "\nTest file created: test_direct.html"
echo "Run: open test_direct.html"