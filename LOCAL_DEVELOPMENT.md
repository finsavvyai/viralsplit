# 🚀 ViralSplit Local Development Guide

## Quick Start

### 1. Start Everything at Once
```bash
./start_local.sh
```

### 2. Check Status
```bash
./status.sh
```

### 3. Test API
```bash
./test_api.sh
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **API Backend** | http://localhost:8000 | FastAPI server |
| **API Documentation** | http://localhost:8000/docs | Swagger UI |
| **Health Check** | http://localhost:8000/health | Service status |
| **Metrics** | http://localhost:8000/metrics | Performance metrics |
| **Web Frontend** | http://localhost:3000 | Next.js web app |
| **Mobile App** | http://localhost:8081 | Expo development server |

## 📱 Mobile Development

### Setup
1. Install **Expo Go** app on your phone
2. Scan QR code from Expo terminal
3. Or use simulators:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

### Features Available
- ✅ User authentication
- ✅ Video upload and processing
- ✅ AI-powered content enhancement
- ✅ Real-time analytics
- ✅ AR features

## 🔧 Individual Service Commands

### API Backend
```bash
cd apps/api
source venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Celery Worker (Background Tasks)
```bash
cd apps/api
source venv/bin/activate
celery -A celery_app worker --loglevel=info
```

### Celery Beat (Scheduled Tasks)
```bash
cd apps/api
source venv/bin/activate
celery -A celery_app beat --loglevel=info
```

### Web Frontend
```bash
cd apps/viralsplit
npm run dev
```

### Mobile App
```bash
cd apps/viralsplit-mobile
npm start
```

### Redis (Message Broker)
```bash
redis-server
```

## 🧪 Testing

### API Testing
```bash
./test_api.sh
```

### Manual Testing
1. **Register a user**: POST http://localhost:8000/api/auth/register
2. **Login**: POST http://localhost:8000/api/auth/login
3. **Upload video**: POST http://localhost:8000/api/upload/request
4. **Test AI features**: Various endpoints in /docs

### Test Data
- Test user: `test@viralsplit.com` / `testpass123`
- Test project: Created automatically during upload

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :8000
# Kill process
kill -9 <PID>
```

#### 2. Redis Not Running
```bash
redis-server --daemonize yes
```

#### 3. Environment Variables Missing
```bash
cp apps/api/env.template apps/api/.env
# Edit .env with your API keys
```

#### 4. Dependencies Missing
```bash
# API dependencies
cd apps/api && pip install -r requirements.txt

# Web dependencies
cd apps/viralsplit && npm install

# Mobile dependencies
cd apps/viralsplit-mobile && npm install
```

### Stop All Services
```bash
pkill -f 'uvicorn\|celery\|npm\|expo'
```

## 📊 Monitoring

### Health Checks
- API: http://localhost:8000/health
- Metrics: http://localhost:8000/metrics

### Logs
```bash
# API logs
cd apps/api && tail -f logs/app.log

# Celery logs
cd apps/api && tail -f celery.log
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │  Mobile App     │    │   API Backend   │
│   (Next.js)     │    │   (React Native)│    │   (FastAPI)     │
│   Port: 3000    │    │   Port: 8081    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Message      │
                    │    Broker)      │
                    │   Port: 6379    │
                    └─────────────────┘
```

## 🔐 Environment Variables

Required in `apps/api/.env`:
- `OPENAI_API_KEY` - OpenAI API key
- `REPLICATE_API_TOKEN` - Replicate API token
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `JWT_SECRET` - JWT signing secret
- `CLOUDFLARE_*` - Cloudflare R2 storage
- `SUPABASE_*` - Supabase database
- `REDIS_URL` - Redis connection
- `LEMONSQUEEZY_*` - Payment processing

## 🚀 Production Deployment

When ready to deploy:
1. Test everything locally ✅
2. Deploy to Railway: `railway up`
3. Set environment variables in Railway
4. Test production deployment

## 📚 Additional Resources

- [API Documentation](http://localhost:8000/docs)
- [Cloud Deployment Guide](docs/CLOUD_DEPLOYMENT_GUIDE.md)
- [CDN Setup Instructions](docs/CDN_SETUP_INSTRUCTIONS.md)
- [Mobile App Features](apps/viralsplit-mobile/AR_VIRAL_FEATURES.md)

---

**Happy coding! 🎉**
