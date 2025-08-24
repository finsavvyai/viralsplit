#!/bin/bash

# ViralSplit Render Deployment Script

echo "🚀 Deploying ViralSplit to Render"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Setting up Render deployment..."

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    print_error "render.yaml not found. Please ensure it exists in the root directory."
    exit 1
fi

print_success "render.yaml found"

print_status "Deployment Steps:"
echo ""
echo "1. Go to https://render.com"
echo "2. Sign up/Login with your GitHub account"
echo "3. Click 'New +' and select 'Blueprint'"
echo "4. Connect your GitHub repository"
echo "5. Render will automatically detect render.yaml"
echo "6. Set environment variables in Render dashboard:"
echo ""
echo "Required Environment Variables:"
echo "- CLOUDFLARE_ACCOUNT_ID=d2fe608a92dc9faa2ce5b0fd2cad5eb7"
echo "- CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id"
echo "- CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key"
echo "- CDN_DOMAIN=cdn.viralsplit.io"
echo "- JWT_SECRET=373ff5b23adc68da070e8503280d15d6859fd27e266ae3c0ff71156ca17949c8"
echo "- ENVIRONMENT=production"
echo ""

print_warning "Important Notes:"
echo "- Render will automatically create Redis service"
echo "- API service will be deployed from apps/api directory"
echo "- Celery worker will be deployed as a separate service"
echo "- Free tier has limitations but is sufficient for testing"
echo ""

print_status "After deployment, your services will be available at:"
echo "- API: https://your-app-name.onrender.com"
echo "- Redis: Automatically configured"
echo "- Worker: Automatically configured"
echo ""

print_success "Ready to deploy! Follow the steps above."
print_status "Your render.yaml is already configured for automatic deployment."
