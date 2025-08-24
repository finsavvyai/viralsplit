#!/bin/bash

# ViralSplit Web App Deployment Script

echo "🚀 Deploying ViralSplit Web App to Vercel"
echo "=========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel:"
    echo "   vercel login"
    echo "   Then run this script again."
    exit 1
fi

echo "✅ Vercel CLI ready"

# Navigate to web app directory
cd apps/viralsplit

echo "📦 Building web app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful"

echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Web app deployment initiated!"
echo ""
echo "📋 Next Steps:"
echo "1. Vercel will provide you with a deployment URL"
echo "2. Your web app will be live at: https://viralsplit.vercel.app"
echo "3. Future pushes to main branch will auto-deploy"
echo ""
echo "🔗 Your full stack will be:"
echo "- Web App: https://viralsplit.vercel.app"
echo "- API: https://viralspiritio-production.up.railway.app"
echo "- Mobile: Expo development server"
