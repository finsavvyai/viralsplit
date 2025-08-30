#!/bin/bash

echo "🔧 Updating environment files with new configuration..."

# Update backend .env
echo "Updating apps/api/.env..."
cat >> apps/api/.env << 'EOF'

# CDN Configuration
CDN_DOMAIN=cdn.viralsplit.io
R2_BUCKET_NAME=viralsplit-media

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Development Settings
DEBUG=true
ENVIRONMENT=development
EOF

# Update frontend .env.local
echo "Updating apps/viralsplit/.env.local..."
cat >> apps/viralsplit/.env.local << 'EOF'

# CDN Configuration
NEXT_PUBLIC_CDN_DOMAIN=cdn.viralsplit.io

# App Configuration
NEXT_PUBLIC_APP_NAME=ViralSplit
NEXT_PUBLIC_APP_URL=https://viralsplit.io

# Social Media OAuth (optional)
NEXT_PUBLIC_TIKTOK_CLIENT_KEY=your_tiktok_client_key
NEXT_PUBLIC_INSTAGRAM_APP_ID=your_instagram_app_id
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_youtube_client_id
EOF

echo "✅ Environment files updated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update the Cloudflare credentials in apps/api/.env"
echo "2. Test the setup with: ./start-dev.sh"
