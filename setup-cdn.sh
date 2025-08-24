#!/bin/bash

# ViralSplit CDN Setup Script

echo "🚀 Setting up ViralSplit CDN and Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the viralsplit root directory"
    exit 1
fi

print_status "Starting CDN and environment setup..."

# Create backend environment file if it doesn't exist
if [ ! -f "apps/api/.env" ]; then
    print_status "Creating backend environment file..."
    cat > apps/api/.env << EOF
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key_here

# CDN Configuration
CDN_DOMAIN=cdn.viralsplit.io
R2_BUCKET_NAME=viralsplit-media

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Redis Configuration (for Celery)
REDIS_URL=redis://localhost:6379

# Database Configuration (for production)
DATABASE_URL=postgresql://username:password@localhost:5432/viralsplit

# AI Services (optional)
OPENAI_API_KEY=sk-your-openai-api-key
REPLICATE_API_TOKEN=r8_your-replicate-token

# Payment Processing (optional)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Development Settings
DEBUG=true
ENVIRONMENT=development
EOF
    print_success "Backend environment file created at apps/api/.env"
else
    print_warning "Backend environment file already exists at apps/api/.env"
fi

# Create frontend environment file if it doesn't exist
if [ ! -f "apps/viralsplit/.env.local" ]; then
    print_status "Creating frontend environment file..."
    cat > apps/viralsplit/.env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

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
    print_success "Frontend environment file created at apps/viralsplit/.env.local"
else
    print_warning "Frontend environment file already exists at apps/viralsplit/.env.local"
fi

# Install new dependencies
print_status "Installing new dependencies..."
cd apps/api
pip install PyJWT==2.8.0 bcrypt==4.1.2 "pydantic[email]==2.5.0"
cd ../..

print_success "Dependencies installed successfully"

# Create CDN setup instructions
print_status "Creating CDN setup instructions..."
cat > CDN_SETUP_INSTRUCTIONS.md << EOF
# CDN Setup Instructions

## 1. Cloudflare R2 Setup

### Create R2 Bucket
1. Go to https://dash.cloudflare.com
2. Navigate to R2 Object Storage
3. Create a new bucket named \`viralsplit-media\`
4. Enable public access

### Configure Custom Domain
1. Add custom domain: \`cdn.viralsplit.io\`
2. Add DNS record: \`cdn.viralsplit.io\` → \`viralsplit-media.your-account.r2.cloudflarestorage.com\`

### Get API Credentials
1. Go to R2 API Tokens
2. Create new API token with read/write permissions
3. Copy Account ID, Access Key ID, and Secret Access Key

## 2. Update Environment Files

### Backend (.env)
Update \`apps/api/.env\` with your Cloudflare credentials:
\`\`\`
CLOUDFLARE_ACCOUNT_ID=your_actual_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_actual_access_key_id
CLOUDFLARE_SECRET_ACCESS_KEY=your_actual_secret_access_key
CDN_DOMAIN=cdn.viralsplit.io
\`\`\`

### Frontend (.env.local)
Update \`apps/viralsplit/.env.local\`:
\`\`\`
NEXT_PUBLIC_CDN_DOMAIN=cdn.viralsplit.io
\`\`\`

## 3. Test CDN Setup

### Test Upload
\`\`\`bash
curl -X PUT "https://cdn.viralsplit.io/test-file.txt" \\
  -H "Content-Type: text/plain" \\
  --data-binary "Hello CDN!"
\`\`\`

### Test Download
\`\`\`bash
curl -I "https://cdn.viralsplit.io/test-file.txt"
\`\`\`

## 4. File Naming Structure

Your files will be organized as:
\`\`\`
viralsplit-media/
├── users/
│   ├── user_1/
│   │   ├── 20241201_143022_abc12345_my_video_original.mp4
│   │   └── outputs/
│   │       └── project_uuid_1/
│   │           ├── 20241201_143156_def67890_tiktok_standard.mp4
│   │           └── 20241201_143157_ghi11111_instagram_reels_standard.mp4
│   └── user_2/
│       └── ...
\`\`\`

## 5. Security Configuration

### CORS Settings
Configure CORS in your R2 bucket:
\`\`\`json
[
  {
    "AllowedOrigins": [
      "https://viralsplit.io",
      "https://contentmulti.com",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
\`\`\`

## 6. Start Development

\`\`\`bash
# Start all services
./start-dev.sh

# Or start individually
cd apps/api && python main.py
cd apps/viralsplit && npm run dev
\`\`\`

## 7. Authentication

The system now includes:
- User registration and login
- JWT token authentication
- Social media account connections
- User-specific file organization
- Credit system for video processing

## 8. Next Steps

1. Set up your Cloudflare R2 bucket
2. Update environment variables with real credentials
3. Test the CDN setup
4. Start the development servers
5. Test user registration and video upload

For detailed setup instructions, see \`docs/cdn-setup.md\`
EOF

print_success "CDN setup instructions created at CDN_SETUP_INSTRUCTIONS.md"

# Summary
echo ""
print_success "🎉 CDN and Environment Setup Complete!"
echo ""
print_status "Next steps:"
echo "1. Set up your Cloudflare R2 bucket (see CDN_SETUP_INSTRUCTIONS.md)"
echo "2. Update apps/api/.env with your Cloudflare credentials"
echo "3. Update apps/viralsplit/.env.local with your CDN domain"
echo "4. Run ./start-dev.sh to start development servers"
echo ""
print_warning "Remember to change the JWT_SECRET in production!"
echo ""
print_status "For detailed instructions, see:"
echo "- CDN_SETUP_INSTRUCTIONS.md"
echo "- docs/cdn-setup.md"
