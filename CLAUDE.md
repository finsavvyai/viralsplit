# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ViralSplit is a comprehensive multi-platform content optimization platform with AI-powered enhancements for creating and distributing viral content across social media platforms. The architecture consists of a FastAPI backend, React Native mobile app, and Next.js web frontends.

## Development Commands

### Core Commands
- `npm run dev` - Run all services concurrently (API, web apps)
- `npm run build` - Build all applications
- `npm run install:all` - Install dependencies for all apps
- `npm run lint` - Lint code (Next.js apps)

### API Backend (FastAPI)
- `cd apps/api && uvicorn main:app --reload --port 8000` - Start API server
- `cd apps/api && pytest` - Run API tests
- `cd apps/api && celery -A celery_app worker --loglevel=info` - Start Celery worker
- `cd apps/api && celery -A celery_app beat --loglevel=info` - Start Celery beat

### Mobile App (React Native/Expo)
- `cd apps/viralsplit-mobile && npm start` - Start Expo development server
- `cd apps/viralsplit-mobile && npm run ios` - Run on iOS simulator
- `cd apps/viralsplit-mobile && npm run android` - Run on Android emulator
- `cd apps/viralsplit-mobile && npm run type-check` - TypeScript type checking
- `cd apps/viralsplit-mobile && npm run lint` - Lint mobile code
- `cd apps/viralsplit-mobile && npm run build:ios` - Build iOS app
- `cd apps/viralsplit-mobile && npm run build:android` - Build Android app

### Web Apps (Next.js)
- `cd apps/viralsplit && npm run dev` - Start viralsplit web app
- `cd apps/viralsplit && npm run build` - Build for production
- `cd apps/contentmulti && npm run dev` - Start contentmulti web app

### Deployment & Version Management
- `./scripts/version.sh show` - Show current version info
- `./scripts/version.sh increment` - Increment build number
- `./scripts/version.sh deploy` - Create deployment tag
- `./scripts/version.sh status` - Check deployment status

## Architecture

### Backend Services (apps/api/)
The FastAPI backend is organized into modular services:

- **main.py** - FastAPI application with WebSocket support, routes for upload, transform, AI features
- **services/** - Core service modules:
  - `auth.py` - JWT authentication, MFA, social auth, user management
  - `storage.py` - Cloudflare R2 storage integration
  - `video_processor.py` - FFmpeg-based video processing
  - `ai_enhancer.py` - OpenAI GPT-4 integration for content analysis
  - `trend_monitor.py` - Real-time trend tracking
  - `script_writer.py` - AI script generation
  - `magic_editor.py` - Automated video editing
  - `content_remixer.py` - Content transformation engine
  - `subscription.py` - LemonSqueezy payment integration
  - `elevenlabs_advanced.py` - Text-to-speech services

### Background Processing
- **celery_app.py** - Celery configuration for async tasks
- **background_tasks.py** - Video processing, AI analysis tasks
- **redis_tasks.py** - Progress tracking via Redis
- **sse_events.py** - Server-sent events for real-time updates

### Mobile App Architecture (apps/viralsplit-mobile/)
React Native app using Expo:

- **src/navigation/** - React Navigation setup (Auth, Main, App navigators)
- **src/screens/** - Screen components organized by feature:
  - `auth/` - Login, Register, ForgotPassword
  - `main/` - Home, Profile, Library, Analytics, Settings
  - `camera/` - Camera, VideoReview
  - `processing/` - PlatformSelection, ProcessingStatus, Results
  - `features/` - AIScriptWriter, MagicEditor, ContentRemixer
- **src/contexts/** - AuthContext, ThemeContext for global state
- **src/services/** - API integration, storage, authentication
- **src/components/** - Reusable UI components

### Web App Architecture (apps/viralsplit/)
Next.js app with Turbo:

- **src/app/** - App router pages and layouts
- **src/components/** - React components:
  - Video upload/processing components
  - Authentication modals and providers
  - AI feature interfaces
  - Analytics dashboard
  - Admin dashboard

## Key Technical Patterns

### Authentication Flow
- JWT tokens with refresh mechanism
- Multi-factor authentication (MFA) with TOTP
- Social authentication (Google, Facebook, Apple)
- Secure password reset with email verification
- Admin user management system

### Video Processing Pipeline
1. Upload to temporary storage
2. Queue background processing task via Celery
3. Process with FFmpeg for platform optimization
4. Upload to Cloudflare R2 CDN
5. Update progress via Redis/WebSocket
6. Return CDN URLs to client

### AI Integration Pattern
- Structured prompts to OpenAI GPT-4
- Response parsing and validation
- Caching of AI responses
- Error handling with fallbacks
- Progress tracking for long operations

### Real-time Updates
- WebSocket connections for live progress
- Server-sent events as fallback
- Redis pub/sub for task status
- Progress percentages and status messages

## Environment Configuration

### Required Environment Variables
```bash
# API Keys
OPENAI_API_KEY=sk-xxx
REPLICATE_API_TOKEN=xxx
ELEVENLABS_API_KEY=xxx

# JWT & Security
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

# Redis
REDIS_URL=redis://localhost:6379

# Payment (LemonSqueezy)
LEMONSQUEEZY_API_KEY=xxx
LEMONSQUEEZY_WEBHOOK_SECRET=xxx
```

## Testing Strategy

### API Testing
- Unit tests with pytest in `apps/api/tests/`
- Test fixtures in `conftest.py`
- Coverage reports with pytest-cov
- Run with: `cd apps/api && pytest`

### Mobile Testing
- Component testing with Jest
- E2E testing with Detox (configured)
- Type checking with TypeScript

## Deployment

### Production Deployment
- API: Railway (api.viralsplit.io)
- Web: Vercel (viralsplit.io, app.viralsplit.io)
- CDN: Cloudflare R2
- Database: Supabase
- Redis: Railway Redis service

### Deployment Commands
```bash
# Railway deployment
railway up

# Vercel deployment
vercel deploy --prod

# Mobile app builds
eas build --platform all
```

## Current Production URLs
- API: https://api.viralsplit.io
- Web App: https://app.viralsplit.io
- Marketing Site: https://viralsplit.io
- CDN: https://cdn.viralsplit.io