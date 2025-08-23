# ViralSplit Platform

🎬 **Multi-platform video content optimization platform**

Transform your videos for TikTok, Instagram Reels, YouTube Shorts, and more with one upload!

## 🚀 Features

✅ **Working Video Upload** - Real drag & drop functionality with progress tracking
✅ **Multi-Platform Processing** - Automatic optimization for TikTok, Instagram, YouTube
✅ **Real-Time Progress** - Live updates during upload and transformation
✅ **Cloud Storage** - Direct upload to Cloudflare R2 with zero egress fees  
✅ **Background Processing** - Scalable video transformation using Celery workers
✅ **Error Handling** - Comprehensive validation and user-friendly error messages

## 🎯 Brands
- **ViralSplit.io** - B2C viral content creation
- **ContentMulti.com** - B2B professional content tools

## 🏃‍♂️ Quick Start

```bash
# Clone and setup
git clone <repository>
cd viralsplit

# Start all services (requires Redis, Python, Node.js)
./start-dev.sh

# Or setup manually - see SETUP.md for detailed instructions
```

**Access Points:**
- 📱 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:8000  
- 📚 API Documentation: http://localhost:8000/docs

## 🛠️ Tech Stack

**Frontend (Next.js)**
- React 19 with TypeScript
- Framer Motion for animations
- Tailwind CSS for styling
- Custom hooks for upload/status management

**Backend (FastAPI)**  
- Python with async/await support
- Celery for background video processing
- FFmpeg for video transformations
- Cloudflare R2 for storage

**Infrastructure**
- Redis for Celery message broker
- Docker support included
- Terraform configurations ready

## 📋 Implementation Status

The video upload functionality is **fully implemented** and working:

🎯 **Upload Flow**
1. Drag & drop video files with validation
2. Real-time upload progress with animated indicators  
3. Direct upload to Cloudflare R2 via presigned URLs
4. Platform selection with visual feedback

🎬 **Processing Pipeline**
1. Background video transformation using Celery
2. FFmpeg processing for each target platform
3. Real-time progress updates via polling
4. Download links for completed transformations

📊 **User Experience**
- Smooth animations and transitions
- Comprehensive error handling
- Mobile-responsive design
- Professional UI/UX

See `SETUP.md` for detailed setup instructions and architecture overview.
