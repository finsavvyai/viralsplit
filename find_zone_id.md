# How to Find Your Cloudflare Zone ID

## Method 1: From Dashboard (Easiest)

1. Go to https://dash.cloudflare.com
2. Click on your domain `viralsplit.io`
3. On the right sidebar, scroll down to the "API" section
4. You'll see:
   - **Zone ID**: (a long string like `7c5dae5552338874e5053f2534d2767a`)
   - **Account ID**: (another long string)

## Method 2: From Domain Overview

1. Go to https://dash.cloudflare.com
2. Click on `viralsplit.io`
3. Look at the URL in your browser
4. It will be something like: `https://dash.cloudflare.com/[ACCOUNT_ID]/[DOMAIN]/dns`
5. Or on the Overview page, right side panel shows Zone ID

## Method 3: Using API

First get your API token:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create a token with "Zone:Read" permissions
3. Then run:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones?name=viralsplit.io" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" | python3 -m json.tool
```

The response will include your zone_id.

## Once You Have Zone ID

Use it to list all DNS records:

```bash
# Replace YOUR_ZONE_ID and YOUR_API_TOKEN
curl -X GET "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" | python3 -m json.tool
```

This will show ALL DNS records, including any hidden ones causing the block.

## Look for the Problem Record

In the JSON response, look for:
```json
{
  "type": "CNAME",
  "name": "viralsplit.io",
  "content": "ap-blockpage.prod.bzq.securingsam.com",
  ...
}
```

Note the `"id"` field of that record.

## Delete the Blocking Record via API

```bash
# Replace RECORD_ID with the ID of the blocking record
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records/RECORD_ID" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json"
```

## Add Correct A Record via API

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records" \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{
       "type": "A",
       "name": "@",
       "content": "76.76.19.61",
       "ttl": 1,
       "proxied": false
     }'
```

This will fix your DNS and point viralsplit.io to Vercel!