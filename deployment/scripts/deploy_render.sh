#!/bin/bash

# ViralSplit Render Deployment Script

echo "🚀 Deploying ViralSplit to Render"
echo "================================="

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI not found. Installing..."
    curl -s https://render.com/download-cli/install.sh | bash
    export PATH="$HOME/.render/bin:$PATH"
fi

# Check if logged in to Render
if ! render whoami &> /dev/null; then
    echo "❌ Not logged in to Render. Please login:"
    echo "   render login"
    echo "   Then run this script again."
    exit 1
fi

# Check if .env file exists
if [ ! -f "apps/api/.env" ]; then
    echo "❌ Error: apps/api/.env file not found!"
    echo "Please copy apps/api/env.template to apps/api/.env and fill in your API keys"
    exit 1
fi

echo "✅ Environment check passed"

# Create Render blueprint
echo "📦 Creating Render blueprint..."
render blueprint apply

echo ""
echo "🎉 Deployment initiated!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Find your 'viralsplit-api' service"
echo "3. Set environment variables in the dashboard:"
echo "   - OPENAI_API_KEY"
echo "   - REPLICATE_API_TOKEN"
echo "   - ELEVENLABS_API_KEY"
echo "   - JWT_SECRET"
echo "   - CLOUDFLARE_ACCOUNT_ID"
echo "   - CLOUDFLARE_ACCESS_KEY_ID"
echo "   - CLOUDFLARE_SECRET_ACCESS_KEY"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_KEY"
echo "   - LEMONSQUEEZY_API_KEY"
echo "   - LEMONSQUEEZY_WEBHOOK_SECRET"
echo ""
echo "4. Wait for deployment to complete"
echo "5. Test your API at the provided URL"
echo ""
echo "🔗 Your API will be available at: https://viralsplit-api.onrender.com"
