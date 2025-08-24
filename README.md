# ViralSplit - Multi-Platform Content Optimization API

A comprehensive API for creating, optimizing, and distributing viral content across multiple social media platforms with AI-powered enhancements.

## 🚀 Features

### Core Functionality
- **Multi-Platform Video Processing** - Optimize videos for TikTok, Instagram, YouTube, and more
- **AI-Powered Content Enhancement** - Automatic script writing, thumbnail generation, and trend analysis
- **Cloud Storage & CDN** - Fast, reliable content delivery via Cloudflare R2
- **Background Processing** - Asynchronous video processing with Celery
- **User Authentication** - Secure JWT-based authentication system

### AI Features
- **Viral Score Analysis** - Predict content performance across platforms
- **Hook Generation** - AI-powered attention-grabbing hooks
- **Hashtag Optimization** - Platform-specific hashtag recommendations
- **Optimal Timing** - Best posting times for maximum engagement
- **Content Remixing** - Transform existing content for different platforms
- **Magic Editing** - One-click professional video editing

### Platform Support
- TikTok
- Instagram (Reels, Stories, Posts)
- YouTube (Shorts, Long-form)
- Twitter/X
- LinkedIn
- Facebook

## 🏗️ Architecture

```
├── apps/
│   ├── api/                 # FastAPI backend
│   ├── viralsplit-mobile/   # React Native mobile app
│   └── web/                 # Next.js web frontend
├── docs/                    # Documentation
├── scripts/                 # Deployment and utility scripts
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Celery** - Background task processing
- **Redis** - Message broker and caching
- **PostgreSQL** - Primary database (Supabase)
- **Cloudflare R2** - Object storage and CDN

### AI Services
- **OpenAI GPT-4** - Content generation and analysis
- **Replicate** - AI model inference
- **ElevenLabs** - Text-to-speech generation

### Frontend
- **React Native** - Mobile application
- **Next.js** - Web application
- **TypeScript** - Type-safe development

### Infrastructure
- **Railway** - Cloud deployment platform
- **Docker** - Containerization
- **GitHub Actions** - CI/CD

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- Redis
- Docker (optional)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/viralsplit.git
   cd viralsplit
   ```

2. **Set up environment variables**
   ```bash
   cp apps/api/env.template apps/api/.env
   # Edit apps/api/.env with your API keys
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd apps/api
   pip install -r requirements.txt
   
   # Mobile app
   cd ../viralsplit-mobile
   npm install
   
   # Web app
   cd ../web
   npm install
   ```

4. **Start the API**
   ```bash
   cd apps/api
   python -m uvicorn main:app --reload
   ```

## 🌐 API Documentation

Once the API is running, visit:
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

- `POST /api/upload` - Upload video files
- `POST /api/transform` - Transform videos for platforms
- `GET /api/projects/{project_id}/viral-score` - Get viral score analysis
- `POST /api/projects/{project_id}/generate-hooks` - Generate attention hooks
- `GET /api/health` - Health check

## 🚀 Deployment

### Railway Deployment (Recommended)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy to Railway**
   ```bash
   railway login
   railway up
   ```

3. **Set environment variables**
   ```bash
   railway variables --set "OPENAI_API_KEY=your-key"
   # Set all other required variables
   ```

### Manual Deployment

See [docs/CLOUD_DEPLOYMENT_GUIDE.md](docs/CLOUD_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 📱 Mobile App

### Development
```bash
cd apps/viralsplit-mobile
npm install
npx expo start
```

### Building
```bash
npx expo build:android
npx expo build:ios
```

## 🌍 Environment Variables

Required environment variables:

```bash
# API Keys
OPENAI_API_KEY=your-openai-api-key
REPLICATE_API_TOKEN=your-replicate-token
ELEVENLABS_API_KEY=your-elevenlabs-key

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret

# Cloudflare R2 Storage
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-access-key
CDN_DOMAIN=cdn.viralsplit.io

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Payment Processing (LemonSqueezy)
LEMONSQUEEZY_API_KEY=your-lemonsqueezy-api-key
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret
```

See [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) for detailed setup instructions.

## 🧪 Testing

### API Tests
```bash
cd apps/api
pytest
```

### Mobile Tests
```bash
cd apps/viralsplit-mobile
npm test
```

## 📚 Documentation

- [Environment Setup](docs/ENVIRONMENT_SETUP.md)
- [Cloud Deployment Guide](docs/CLOUD_DEPLOYMENT_GUIDE.md)
- [CDN Setup Instructions](docs/CDN_SETUP_INSTRUCTIONS.md)
- [Local Testing Guide](docs/LOCAL_TESTING_GUIDE.md)
- [API Features](docs/AI_FEATURES_IMPLEMENTED.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/viralsplit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/viralsplit/discussions)

## 🏆 Status

- ✅ API Backend - Complete
- ✅ AI Features - Complete
- ✅ Cloud Deployment - Complete
- ✅ Mobile App - Complete
- ✅ Web Frontend - Complete
- ✅ CDN Setup - Complete
- ✅ Payment Integration - Complete

---

**ViralSplit** - Transform your content into viral success across all platforms! 🚀
