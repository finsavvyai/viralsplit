# ViralSplit - Multi-Platform Content Optimization Platform

A comprehensive AI-powered platform for creating, optimizing, and distributing viral content across multiple social media platforms.

## 🚀 Quick Start

### Development Setup
```bash
# Install all dependencies
npm run install:all

# Start all services (API + Web apps)
npm run dev

# Or start individual services
npm run dev:api          # FastAPI backend (port 8000)
npm run dev:viralsplit   # Next.js web app (port 3000)  
npm run dev:contentmulti # Next.js content app (port 3001)
```

### Mobile App (React Native)
```bash
cd apps/viralsplit-mobile
npm install
npm start                # Start Expo development server
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator
```

## 📁 Project Structure

```
viralsplit/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── services/          # Core services (auth, AI, storage)
│   │   ├── tests/             # API tests
│   │   └── main.py           # FastAPI application
│   ├── viralsplit/           # Next.js web application  
│   ├── viralsplit-mobile/    # React Native mobile app
│   └── contentmulti/         # Next.js content management app
├── deployment/
│   ├── scripts/             # Deployment automation
│   ├── configs/            # Environment configurations
│   └── docs/              # Deployment documentation
├── tools/
│   ├── testing/           # Test scripts and utilities
│   ├── monitoring/        # System monitoring tools
│   └── setup/            # Development setup scripts
├── docs/                 # Project documentation
└── scripts/             # Version management and utilities
```

## 🏗️ Architecture

### Backend Services (FastAPI)
- **Authentication** - JWT, MFA, social auth, user management
- **Video Processing** - FFmpeg-based optimization for platforms
- **AI Enhancement** - OpenAI GPT-4 integration for content analysis
- **Storage** - Cloudflare R2 CDN integration
- **Background Tasks** - Celery + Redis for async processing
- **Real-time Updates** - WebSocket + SSE for live progress

### Frontend Applications
- **Web App** - Next.js with Turbo, responsive design
- **Mobile App** - React Native with Expo, cross-platform
- **Content Management** - Dedicated content creation interface

### AI Features
- 🎯 **Viral Score Analysis** - Predict content performance
- 🎣 **Hook Generation** - AI-powered attention-grabbing hooks
- 📝 **Script Writing** - Automated script generation
- ✨ **Magic Editing** - One-click professional video editing
- 🔄 **Content Remixing** - Transform content for different platforms
- 🏷️ **Hashtag Optimization** - Platform-specific recommendations
- ⏰ **Optimal Timing** - Best posting times analysis

## 🛠️ Development Commands

### Core Development
```bash
npm run dev                 # Start all services concurrently
npm run build              # Build all applications
npm run install:all        # Install all dependencies
```

### API Backend
```bash
cd apps/api
uvicorn main:app --reload                    # Start API server
pytest                                      # Run tests
celery -A celery_app worker --loglevel=info # Start Celery worker
celery -A celery_app beat --loglevel=info   # Start Celery beat
```

### Frontend Development
```bash
cd apps/viralsplit
npm run dev                # Development server
npm run build             # Production build
npm run lint              # Lint code

cd apps/viralsplit-mobile
npm run type-check        # TypeScript checking
npm run build:ios         # Build for iOS
npm run build:android     # Build for Android
```

### Testing & Quality
```bash
# API Tests
./tools/testing/test_api.sh
./tools/testing/test_websocket_api.sh

# System Tests
./tools/testing/test_complete_system.sh
./tools/testing/test_cdn_setup.sh
```

### Deployment
```bash
# Version Management
./scripts/version.sh show          # Show current version
./scripts/version.sh increment     # Increment build number
./scripts/version.sh deploy        # Create deployment

# Platform Deployment
./deployment/scripts/deploy_railway.sh    # Deploy API to Railway
./deployment/scripts/deploy_vercel.sh     # Deploy web to Vercel
./deployment/scripts/deploy_all.sh        # Deploy everything
```

### Development Tools
```bash
# Setup & Configuration
./tools/setup/start-dev.sh         # Start development environment
./tools/setup/restart-dev.sh       # Restart all services
./tools/setup/status.sh           # Check service status

# Monitoring
./tools/monitoring/notifier.sh      # System notifications
```

## 🌐 Environment Configuration

### Required Environment Variables
```bash
# API Keys
OPENAI_API_KEY=sk-xxx
REPLICATE_API_TOKEN=xxx
ELEVENLABS_API_KEY=xxx

# Authentication
JWT_SECRET=xxx
JWT_ALGORITHM=HS256

# Storage (Cloudflare R2)
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_ACCESS_KEY_ID=xxx
CLOUDFLARE_SECRET_ACCESS_KEY=xxx
CDN_DOMAIN=cdn.viralsplit.io

# Database
SUPABASE_URL=xxx
SUPABASE_KEY=xxx

# Redis & Background Processing
REDIS_URL=redis://localhost:6379

# Payments (LemonSqueezy)
LEMONSQUEEZY_API_KEY=xxx
LEMONSQUEEZY_WEBHOOK_SECRET=xxx
```

### Development Setup
1. Copy environment template:
   ```bash
   cp apps/api/env.template apps/api/.env
   ```

2. Edit `.env` with your API keys

3. Install dependencies:
   ```bash
   npm run install:all
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

## 🚀 Deployment

### Production URLs
- **API**: https://api.viralsplit.io
- **Web App**: https://app.viralsplit.io
- **Marketing**: https://viralsplit.io
- **CDN**: https://cdn.viralsplit.io

### Deployment Platforms
- **API Backend**: Railway
- **Web Applications**: Vercel
- **CDN & Storage**: Cloudflare R2
- **Database**: Supabase
- **Background Jobs**: Railway Redis

### Quick Deploy
```bash
# Deploy all services
./deployment/scripts/deploy_all.sh

# Individual deployments
./deployment/scripts/deploy_railway.sh    # API
./deployment/scripts/deploy_vercel.sh     # Web apps
```

## 📚 Documentation

- **[Environment Setup](docs/ENVIRONMENT_SETUP.md)** - Development environment configuration
- **[Cloud Deployment](docs/CLOUD_DEPLOYMENT_GUIDE.md)** - Production deployment guide
- **[AI Features](docs/AI_FEATURES_IMPLEMENTED.md)** - AI capabilities and usage
- **[Local Testing](docs/LOCAL_TESTING_GUIDE.md)** - Testing procedures
- **[CDN Setup](docs/CDN_SETUP_INSTRUCTIONS.md)** - CDN configuration

## 🧪 Testing

### API Testing
```bash
cd apps/api
pytest                                    # Run all tests
pytest tests/test_auth.py                # Test authentication
pytest tests/test_video_processor.py     # Test video processing
```

### Integration Testing
```bash
./tools/testing/test_complete_system.sh  # Full system test
./tools/testing/test_api.sh             # API endpoints
./tools/testing/test_websocket_api.sh    # WebSocket functionality
```

### Mobile Testing
```bash
cd apps/viralsplit-mobile
npm test                                 # Component tests
npm run type-check                       # TypeScript validation
```

## 🔧 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Celery + Redis** - Background task processing
- **PostgreSQL** - Primary database (Supabase)
- **Cloudflare R2** - Object storage and CDN
- **JWT** - Authentication with MFA support

### AI & ML
- **OpenAI GPT-4** - Content generation and analysis
- **Replicate** - AI model inference
- **ElevenLabs** - Text-to-speech generation

### Frontend
- **Next.js 15** - React framework with Turbo
- **React Native + Expo** - Cross-platform mobile
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling

### Infrastructure
- **Railway** - Backend deployment
- **Vercel** - Frontend deployment  
- **GitHub Actions** - CI/CD pipelines
- **Docker** - Containerization

## 📈 Features

### Content Processing
- Multi-platform video optimization (TikTok, Instagram, YouTube)
- Automatic format conversion and compression
- Real-time processing with progress tracking
- Cloud storage with global CDN delivery

### AI-Powered Enhancement
- Viral content score prediction
- Automated script generation
- Professional video editing
- Platform-specific optimization
- Trend analysis and recommendations

### User Management
- Secure authentication with MFA
- Social login (Google, Facebook, Apple)
- Subscription management
- Credit-based usage system
- Admin dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/viralsplit/platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/viralsplit/platform/discussions)

---

**ViralSplit** - Transform your content into viral success across all platforms! 🚀