#!/bin/bash

# Nuclear option: Delete and re-add the A record
# Replace YOUR_ZONE_ID and YOUR_API_TOKEN

ZONE_ID="YOUR_ZONE_ID"  # Get from Cloudflare dashboard
API_TOKEN="YOUR_API_TOKEN"  # Get from Cloudflare API tokens

echo "🗑️  Deleting existing A record..."
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/f12f4cc6477f887fbc875babbaef5b44" \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json"

echo -e "\n⏳ Waiting 10 seconds..."
sleep 10

echo "➕ Adding new A record..."
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{
       "type": "A",
       "name": "@",
       "content": "76.76.19.61",
       "ttl": 1,
       "proxied": false
     }'

echo -e "\n🧹 Purging Cloudflare cache..."
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'

echo -e "\n✅ Done! Wait 2-3 minutes then test https://viralsplit.io"