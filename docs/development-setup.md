# Development Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.11+
- PostgreSQL (or Supabase account)
- Redis (for background tasks)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd viralsplit-platform
npm run install:all
```

### 2. Environment Setup

Copy the example environment files and fill in your values:

```bash
# Backend API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values

# ViralSplit Frontend
cp apps/viralsplit/.env.local.example apps/viralsplit/.env.local
# Edit with your values

# ContentMulti Frontend  
cp apps/contentmulti/.env.local.example apps/contentmulti/.env.local
# Edit with your values
```

### 3. Database Setup

Run the database setup script in your PostgreSQL/Supabase instance:

```sql
-- Run the contents of docs/database-setup.sql
```

### 4. Start Development Servers

```bash
# Start all services
npm run dev

# Or start individually:
npm run dev:api         # API server (port 8000)
npm run dev:viralsplit  # ViralSplit frontend (port 3000)  
npm run dev:contentmulti # ContentMulti frontend (port 3001)
```

## Development URLs

- **ViralSplit**: http://localhost:3000
- **ContentMulti**: http://localhost:3001  
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Docker Development

```bash
# Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f
```

## Project Structure

```
viralsplit-platform/
├── apps/
│   ├── api/               # FastAPI backend
│   ├── viralsplit/        # ViralSplit frontend (B2C)
│   └── contentmulti/      # ContentMulti frontend (B2B)
├── packages/
│   ├── ui/               # Shared UI components
│   ├── core/             # Core video processing
│   └── types/            # TypeScript types
├── infrastructure/       # Deployment configs
└── docs/                # Documentation
```

## Key Features Implemented

### ✅ Core Infrastructure
- [x] Monorepo setup with dual brands
- [x] FastAPI backend with CORS
- [x] Next.js frontends for both brands
- [x] Database schema design
- [x] Environment configuration
- [x] Docker setup

### 🔄 In Progress  
- [ ] Video upload functionality
- [ ] Platform transformation engine
- [ ] AI enhancement pipeline
- [ ] Authentication system
- [ ] Payment integration

### 📋 Planned
- [ ] Template marketplace
- [ ] Analytics dashboard
- [ ] Mobile apps
- [ ] API for developers

## Next Steps

1. **Set up external services**:
   - Supabase project
   - Cloudflare R2 bucket
   - OpenAI API key
   - Stripe account

2. **Implement core features**:
   - Video upload with direct R2 upload
   - Basic video transformation
   - User authentication
   - Payment system

3. **Deploy MVP**:
   - Set up CI/CD pipeline
   - Deploy to production
   - Configure custom domains

## Support

For development questions or issues, check:
- API documentation at `/docs` endpoint
- Database schema in `docs/database-setup.sql`
- Environment examples in each app directory