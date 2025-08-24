from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import asyncio
import uuid
import os
import tempfile
import time
from datetime import datetime
from celery import Celery
from celery.result import AsyncResult
from dotenv import load_dotenv
from services.storage import R2Storage
from services.video_processor import VideoProcessor
from services.auth import auth_service, UserCreate, UserLogin, SocialAccount, User
from services.ai_enhancer import AIEnhancer
from services.trend_monitor import trend_monitor, get_live_trends
from services.thumbnail_generator import AIThumbnailGenerator
from services.voice_to_video import VoiceToVideoGenerator
from services.multilang_optimizer import MultiLanguageOptimizer
from services.script_writer import script_writer
from services.magic_editor import magic_editor, MagicEditOptions
from services.content_remixer import content_remixer, RemixOptions
import os
import json

load_dotenv()

app = FastAPI(
    title="ViralSplit/ContentMulti API",
    version="1.0.0",
    description="Multi-platform video content optimization API"
)

# CORS for both domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://viralsplit.io",
        "https://contentmulti.com", 
        "http://localhost:3000",
        "http://localhost:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
storage_service = R2Storage()
video_processor = VideoProcessor(storage=storage_service)
ai_enhancer = AIEnhancer()
thumbnail_generator = AIThumbnailGenerator()
voice_video_generator = VoiceToVideoGenerator()
multilang_optimizer = MultiLanguageOptimizer()

# Import Celery app
from celery_app import celery_app

# Request/Response models
class UploadRequest(BaseModel):
    filename: str
    file_size: int
    content_type: str

class TransformRequest(BaseModel):
    platforms: List[str]
    options: Dict = {}

class SocialAccountRequest(BaseModel):
    platform: str
    account_id: str
    account_name: str
    access_token: str
    refresh_token: Optional[str] = None

# In-memory project store (replace with database in production)
projects_db = {}

# Application start time for metrics
start_time = time.time()

# ===== HEALTH CHECK & MONITORING =====

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment platforms"""
    try:
        # Basic health check
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime": time.time() - start_time
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.get("/metrics")
async def get_metrics():
    """Application metrics"""
    try:
        import psutil
        return {
            "uptime": time.time() - start_time,
            "memory_usage": psutil.virtual_memory().percent,
            "cpu_usage": psutil.cpu_percent(),
            "timestamp": datetime.utcnow().isoformat()
        }
    except ImportError:
        return {
            "uptime": time.time() - start_time,
            "timestamp": datetime.utcnow().isoformat(),
            "note": "psutil not available for detailed metrics"
        }

# ===== AUTHENTICATION ENDPOINTS =====

@app.post("/api/auth/register")
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        user = await auth_service.register_user(user_data)
        return {
            "message": "User registered successfully",
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/login")
async def login_user(login_data: UserLogin):
    """Login user and get access token"""
    try:
        result = await auth_service.login_user(login_data)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/auth/me")
async def get_current_user(user: User = Depends(auth_service.get_current_user)):
    """Get current user information"""
    return {"user": user}

# ===== SOCIAL ACCOUNT MANAGEMENT =====

@app.post("/api/auth/social/connect")
async def connect_social_account(
    social_data: SocialAccountRequest,
    user: User = Depends(auth_service.get_current_user)
):
    """Connect a social media account"""
    try:
        social_account = SocialAccount(**social_data.model_dump())
        result = await auth_service.connect_social_account(user.id, social_account)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to connect account: {str(e)}")

@app.get("/api/auth/social/accounts")
async def get_social_accounts(user: User = Depends(auth_service.get_current_user)):
    """Get user's connected social accounts"""
    try:
        accounts = await auth_service.get_user_social_accounts(user.id)
        return {"accounts": accounts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get accounts: {str(e)}")

@app.delete("/api/auth/social/disconnect/{platform}")
async def disconnect_social_account(
    platform: str,
    user: User = Depends(auth_service.get_current_user)
):
    """Disconnect a social media account"""
    try:
        result = await auth_service.disconnect_social_account(user.id, platform)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disconnect account: {str(e)}")

# ===== VIDEO UPLOAD ENDPOINTS =====

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/upload/request")
async def request_upload(
    request: UploadRequest,
    user: User = Depends(auth_service.get_current_user)
):
    """Generate presigned URL for direct upload to R2 with user-specific naming"""
    try:
        # Validate file type and size
        if not request.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="Only video files are allowed")
        
        if request.file_size > 500 * 1024 * 1024:  # 500MB limit
            raise HTTPException(status_code=400, detail="File size exceeds 500MB limit")
        
        # Generate unique project ID and file key with user info
        project_id = str(uuid.uuid4())
        file_key = storage_service.generate_unique_key(
            user_id=user.id,
            filename=request.filename,
            file_type='original'
        )
        
        # Generate presigned URL for direct upload
        upload_url = storage_service.generate_upload_url(file_key, expires_in=3600)
        
        if not upload_url:
            raise HTTPException(status_code=500, detail="Failed to generate upload URL")
        
        # Initialize project in database
        projects_db[project_id] = {
            "id": project_id,
            "user_id": user.id,
            "filename": request.filename,
            "file_key": file_key,
            "file_size": request.file_size,
            "status": "pending_upload",
            "created_at": asyncio.get_event_loop().time(),
            "transformations": {}
        }
        
        return {
            "upload_url": upload_url,
            "project_id": project_id,
            "file_key": file_key
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload request failed: {str(e)}")

@app.post("/api/upload/complete/{project_id}")
async def complete_upload(
    project_id: str,
    user: User = Depends(auth_service.get_current_user)
):
    """Mark upload as complete and ready for processing"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Update project status
        project["status"] = "ready_for_processing"
        project["upload_completed_at"] = asyncio.get_event_loop().time()
        
        return {
            "message": "Upload completed successfully",
            "project_id": project_id,
            "status": "ready_for_processing"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload completion failed: {str(e)}")

@app.post("/api/projects/{project_id}/transform")
async def transform_video(
    project_id: str,
    request: TransformRequest,
    user: User = Depends(auth_service.get_current_user)
):
    """Start video transformation with user authentication"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Check user credits
        credits_needed = len(request.platforms) * 10  # 10 credits per platform
        if user.credits < credits_needed:
            raise HTTPException(status_code=402, detail=f"Insufficient credits. Need {credits_needed}, have {user.credits}")
        
        # Update project status
        project["status"] = "processing"
        project["platforms"] = request.platforms
        project["options"] = request.options
        
        # Start background task
        task = celery_app.send_task('main.transform_video_task', kwargs={
            'project_id': project_id,
            'platforms': request.platforms,
            'options': request.options,
            'user_id': user.id
        })
        
        # Update project with task ID
        project["task_id"] = task.id
        
        return {
            "task_id": task.id,
            "status": "processing",
            "platforms": request.platforms
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transformation failed: {str(e)}")

@app.get("/api/projects/{project_id}/status")
async def get_project_status(
    project_id: str,
    user: User = Depends(auth_service.get_current_user)
):
    """Get project status with user authentication"""
    try:
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Get task status if processing
        task_status = None
        if project.get("task_id"):
            task_result = AsyncResult(project["task_id"], app=celery_app)
            task_status = {
                "state": task_result.state,
                "progress": task_result.info.get("progress", 0) if task_result.info else 0
            }
        
        return {
            "project": project,
            "task_status": task_status,
            "transformations": project.get("transformations", {})
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get project status: {str(e)}")

@app.get("/api/projects")
async def get_user_projects(user: User = Depends(auth_service.get_current_user)):
    """Get all projects for the current user"""
    try:
        user_projects = [
            project for project in projects_db.values()
            if project.get("user_id") == user.id
        ]
        
        # Sort by creation date (newest first)
        user_projects.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        
        return {"projects": user_projects}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get projects: {str(e)}")

# ===== AI OPTIMIZATION ENDPOINTS =====

@app.post("/api/projects/{project_id}/viral-score")
async def get_viral_score(
    project_id: str,
    user: User = Depends(auth_service.get_current_user)
):
    """Get AI-powered viral score prediction for video"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Create video metadata from project
        video_metadata = {
            'title': project.get('filename', ''),
            'description': '',
            'duration': 30,  # Default duration
            'transcript': ''  # Would be extracted in real implementation
        }
        
        platforms = project.get('platforms', ['tiktok'])
        viral_analysis = await ai_enhancer.calculate_viral_score(video_metadata, platforms)
        
        return viral_analysis
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Viral score analysis failed: {str(e)}")

@app.post("/api/projects/{project_id}/generate-hooks")
async def generate_hooks(
    project_id: str,
    user: User = Depends(auth_service.get_current_user)
):
    """Generate viral hooks for video content"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Create content summary from project
        content_summary = f"Video: {project.get('filename', 'Untitled video')}"
        platforms = project.get('platforms', ['tiktok'])
        
        hooks = await ai_enhancer.generate_viral_hooks(content_summary, platforms)
        
        return hooks
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hook generation failed: {str(e)}")

@app.post("/api/projects/{project_id}/optimize-hashtags")
async def optimize_hashtags(
    project_id: str,
    user: User = Depends(auth_service.get_current_user)
):
    """Generate optimized hashtags for video"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        content = f"Video content: {project.get('filename', '')}"
        platforms = project.get('platforms', ['tiktok'])
        
        hashtags = await ai_enhancer.optimize_hashtags(content, platforms)
        
        return hashtags
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hashtag optimization failed: {str(e)}")

@app.get("/api/users/{user_id}/optimal-timing")
async def get_optimal_timing(
    user_id: str,
    platforms: str = "tiktok,instagram_reels",  # Comma-separated platforms
    user: User = Depends(auth_service.get_current_user)
):
    """Get optimal posting times for user"""
    try:
        # Verify user access
        if user.id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        platform_list = platforms.split(',')
        user_analytics = {}  # Would come from user's historical data
        
        timing = await ai_enhancer.suggest_optimal_timing(user_analytics, platform_list)
        
        return timing
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Timing analysis failed: {str(e)}")

@app.post("/api/projects/{project_id}/analyze-viral-elements")
async def analyze_viral_elements(
    project_id: str,
    user: User = Depends(auth_service.get_current_user)
):
    """Analyze what makes content viral"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Create video metadata from project
        video_metadata = {
            'title': project.get('filename', ''),
            'description': '',
            'duration': 30,
            'transcript': ''
        }
        
        analysis = await ai_enhancer.analyze_viral_elements(video_metadata)
        
        return analysis
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Viral elements analysis failed: {str(e)}")

@app.get("/api/analytics/{user_id}/dashboard")
async def get_analytics_dashboard(
    user_id: str,
    user: User = Depends(auth_service.get_current_user)
):
    """Get analytics dashboard data for user"""
    try:
        # Verify user access
        if user.id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Get user's projects
        user_projects = [
            project for project in projects_db.values()
            if project.get("user_id") == user.id
        ]
        
        # Mock analytics data (would come from real analytics in production)
        total_videos = len(user_projects)
        completed_videos = len([p for p in user_projects if p.get('status') == 'completed'])
        
        analytics_data = {
            'overview': {
                'total_videos_processed': total_videos,
                'completed_videos': completed_videos,
                'success_rate': (completed_videos / total_videos * 100) if total_videos > 0 else 0,
                'total_platforms': sum(len(p.get('platforms', [])) for p in user_projects),
                'credits_used': sum(len(p.get('platforms', [])) * 10 for p in user_projects),
                'credits_remaining': user.credits
            },
            'platform_breakdown': _calculate_platform_stats(user_projects),
            'recent_activity': _get_recent_activity(user_projects),
            'performance_metrics': {
                'avg_processing_time': '45 seconds',
                'most_used_platform': 'tiktok',
                'optimal_posting_time': '7-9 PM',
                'viral_score_avg': 0.72
            }
        }
        
        return analytics_data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics retrieval failed: {str(e)}")

def _calculate_platform_stats(projects):
    """Calculate platform usage statistics"""
    platform_stats = {}
    for project in projects:
        for platform in project.get('platforms', []):
            if platform not in platform_stats:
                platform_stats[platform] = {
                    'count': 0,
                    'success_rate': 0,
                    'avg_viral_score': 0.65
                }
            platform_stats[platform]['count'] += 1
            # Mock success rate calculation
            platform_stats[platform]['success_rate'] = 95
    
    return platform_stats

# ===== ADVANCED AI ENDPOINTS =====

@app.get("/api/trending/predict")
async def predict_trending_topics(
    platforms: str = "tiktok,instagram_reels",
    user: User = Depends(auth_service.get_current_user)
):
    """Predict trending topics for next 24-48 hours"""
    try:
        platform_list = platforms.split(',')
        predictions = await ai_enhancer.predict_trending_topics(platform_list)
        
        return predictions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trending prediction failed: {str(e)}")

@app.post("/api/projects/{project_id}/competitor-analysis")
async def analyze_competitors(
    project_id: str,
    niche: str = "general",
    user: User = Depends(auth_service.get_current_user)
):
    """Analyze competitive landscape and suggest unique angles"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        content_summary = f"Video: {project.get('filename', 'Content creation')}"
        analysis = await ai_enhancer.generate_competitor_analysis(content_summary, niche)
        
        return analysis
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Competitor analysis failed: {str(e)}")

@app.post("/api/projects/{project_id}/viral-formats")
async def get_viral_formats(
    project_id: str,
    content_type: str = "educational",
    user: User = Depends(auth_service.get_current_user)
):
    """Get viral format suggestions"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        platforms = project.get('platforms', ['tiktok'])
        formats = await ai_enhancer.generate_viral_format_suggestions(content_type, platforms)
        
        return formats
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Format suggestions failed: {str(e)}")

@app.post("/api/projects/{project_id}/emotional-analysis")
async def analyze_emotions(
    project_id: str,
    user: User = Depends(auth_service.get_current_user)
):
    """Deep emotional trigger analysis"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Create video metadata from project
        video_metadata = {
            'title': project.get('filename', ''),
            'description': '',
            'transcript': ''
        }
        
        analysis = await ai_enhancer.analyze_emotional_triggers(video_metadata)
        
        return analysis
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotional analysis failed: {str(e)}")

@app.post("/api/projects/{project_id}/engagement-hacks")
async def get_engagement_hacks(
    project_id: str,
    content_type: str = "educational",
    user: User = Depends(auth_service.get_current_user)
):
    """Get advanced engagement manipulation tactics"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        platforms = project.get('platforms', ['tiktok'])
        hacks = await ai_enhancer.generate_engagement_hacks(platforms, content_type)
        
        return hacks
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Engagement hacks failed: {str(e)}")

@app.post("/api/projects/{project_id}/viral-ceiling")
async def predict_viral_ceiling(
    project_id: str,
    user: User = Depends(auth_service.get_current_user)
):
    """Predict maximum viral potential and reach"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Create video metadata from project
        video_metadata = {
            'title': project.get('filename', ''),
            'description': '',
            'duration': 30
        }
        
        platforms = project.get('platforms', ['tiktok'])
        ceiling = await ai_enhancer.predict_viral_ceiling(video_metadata, platforms)
        
        return ceiling
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Viral ceiling prediction failed: {str(e)}")

# ===== NEXT-GEN ADVANCED FEATURES =====

@app.get("/api/trends/live")
async def get_real_time_trends(
    platforms: str = "tiktok,instagram_reels",
    limit: int = 10,
    user: User = Depends(auth_service.get_current_user)
):
    """Get real-time viral trends (24-48 hour predictions)"""
    try:
        platform_list = platforms.split(',')
        live_trends = await get_live_trends(platform_list, limit)
        
        return {
            'live_trends': live_trends,
            'update_frequency': '5 minutes',
            'prediction_window': '24-48 hours',
            'retrieved_at': datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live trends retrieval failed: {str(e)}")

@app.post("/api/projects/{project_id}/thumbnails/generate")
async def generate_ai_thumbnails(
    project_id: str,
    style_preferences: Dict = {},
    user: User = Depends(auth_service.get_current_user)
):
    """Generate AI-powered viral thumbnails"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Create video metadata
        video_metadata = {
            'title': project.get('filename', ''),
            'description': '',
            'duration': 30
        }
        
        platforms = project.get('platforms', ['tiktok'])
        thumbnails = await thumbnail_generator.generate_viral_thumbnails(
            video_metadata, platforms, style_preferences
        )
        
        return thumbnails
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Thumbnail generation failed: {str(e)}")

@app.post("/api/voice-to-video/create")
async def create_voice_video(
    voice_input: Dict,
    platforms: List[str],
    preferences: Dict = {},
    user: User = Depends(auth_service.get_current_user)
):
    """Create complete video from voice input"""
    try:
        # Check user credits for voice-to-video (premium feature)
        credits_needed = len(platforms) * 20  # 20 credits per platform for premium feature
        if user.credits < credits_needed:
            raise HTTPException(status_code=402, detail=f"Insufficient credits. Need {credits_needed}, have {user.credits}")
        
        # Generate voice video
        result = await voice_video_generator.create_voice_video(
            voice_input, platforms, preferences
        )
        
        # Deduct credits
        await auth_service.update_user_credits(user.id, credits_needed)
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice-to-video creation failed: {str(e)}")

@app.post("/api/projects/{project_id}/multilang-optimize")
async def optimize_multilingual(
    project_id: str,
    target_languages: List[str],
    platforms: List[str],
    user: User = Depends(auth_service.get_current_user)
):
    """Optimize content for multiple languages and cultures"""
    try:
        # Verify project ownership
        project = projects_db.get(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if project.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
        # Create content data
        content = {
            'text': project.get('filename', '') + ' - ' + (project.get('description', ''))
        }
        
        # Optimize for multiple languages
        optimizations = await multilang_optimizer.optimize_for_languages(
            content, target_languages, platforms
        )
        
        return optimizations
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multi-language optimization failed: {str(e)}")

@app.post("/api/captions/multilingual")
async def generate_multilingual_captions(
    video_metadata: Dict,
    languages: List[str],
    user: User = Depends(auth_service.get_current_user)
):
    """Generate captions in multiple languages"""
    try:
        captions = await multilang_optimizer.generate_multilingual_captions(
            video_metadata, languages
        )
        
        return captions
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Multilingual captions failed: {str(e)}")

@app.post("/api/trend-monitor/start")
async def start_trend_monitoring(
    user: User = Depends(auth_service.get_current_user)
):
    """Start real-time trend monitoring (admin only)"""
    try:
        # Only allow premium users to start monitoring
        if user.credits < 1000:  # Premium users only
            raise HTTPException(status_code=403, detail="Premium account required")
        
        # Start monitoring in background
        asyncio.create_task(trend_monitor.start_monitoring())
        
        return {
            'status': 'started',
            'monitoring_platforms': ['tiktok', 'instagram_reels', 'youtube_shorts'],
            'update_frequency': '5 minutes',
            'message': 'Real-time trend monitoring activated'
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trend monitoring startup failed: {str(e)}")

def _get_recent_activity(projects):
    """Get recent user activity"""
    # Sort projects by creation time and get recent ones
    sorted_projects = sorted(
        projects, 
        key=lambda x: x.get('created_at', 0), 
        reverse=True
    )
    
    recent_activity = []
    for project in sorted_projects[:10]:  # Last 10 projects
        activity = {
            'project_id': project['id'],
            'filename': project.get('filename', 'Unknown'),
            'status': project.get('status', 'unknown'),
            'platforms': project.get('platforms', []),
            'created_at': project.get('created_at', 0),
            'completed_at': project.get('completed_at')
        }
        recent_activity.append(activity)
    
    return recent_activity

# ===== CELERY TASKS =====

@celery_app.task(bind=True)
def transform_video_task(self, project_id: str, platforms: List[str], options: dict, user_id: str):
    """Background task for video transformation with user info"""
    try:
        # Get project from database
        project = projects_db.get(project_id)
        if not project:
            raise Exception(f"Project {project_id} not found")
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 10})
        
        # Get input video URL
        input_url = storage_service.get_video_url(project['file_key'])
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 30})
        
        # Process video for each platform using the video processor
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            results = loop.run_until_complete(
                video_processor.process_video(
                    input_url=input_url,
                    platforms=platforms,
                    project_id=project_id,
                    user_id=user_id
                )
            )
            
            # Update progress for each completed platform
            for i, platform in enumerate(platforms):
                progress = 30 + ((i + 1) * 60 // len(platforms))
                self.update_state(state='PROGRESS', meta={'progress': progress})
                
        finally:
            loop.close()
        
        # Update project with results
        project["transformations"] = results
        project["status"] = "completed"
        project["completed_at"] = asyncio.get_event_loop().time()
        
        # Deduct credits from user
        credits_used = len(platforms) * 10
        asyncio.create_task(auth_service.update_user_credits(user_id, credits_used))
        
        # Final progress update
        self.update_state(state='PROGRESS', meta={'progress': 100})
        
        return results
        
    except Exception as e:
        # Update project status to failed
        if project_id in projects_db:
            projects_db[project_id]["status"] = "failed"
            projects_db[project_id]["error"] = str(e)
        
        # Update task state with error
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise e

# ============================================================================
# AI SCRIPT WRITER API ENDPOINTS
# ============================================================================

class ScriptRequest(BaseModel):
    concept: str
    platform: str = "tiktok"
    duration: int = 60
    style: str = "educational"

class RefineRequest(BaseModel):
    script: str
    feedback: str
    improvements: List[str] = []

@app.post("/api/scripts/generate")
async def generate_viral_script(
    request: ScriptRequest,
    user: User = Depends(auth_service.get_current_user)
):
    """🤖 Generate AI-powered viral script that guarantees engagement"""
    try:
        # Check user credits
        user_credits = await auth_service.get_credits(user.id)
        if user_credits < 10:
            raise HTTPException(status_code=402, detail="Insufficient credits")
        
        # Generate viral script
        script_data = await script_writer.generate_viral_script(
            concept=request.concept,
            platform=request.platform,
            duration=request.duration,
            style=request.style
        )
        
        # Deduct credits (10 credits for script generation)
        await auth_service.deduct_credits(user.id, 10)
        remaining_credits = await auth_service.get_credits(user.id)
        
        return {
            "success": True,
            "script": script_data,
            "credits_used": 10,
            "credits_remaining": remaining_credits,
            "generation_time": "< 30 seconds",
            "message": "🔥 Viral script generated successfully!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Script generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Script generation failed: {str(e)}")

@app.post("/api/scripts/refine")
async def refine_script(
    request: RefineRequest,
    user: User = Depends(auth_service.get_current_user)
):
    """✨ Refine and improve existing script for better viral potential"""
    try:
        # Check user credits
        user_credits = await auth_service.get_credits(user.id)
        if user_credits < 5:
            raise HTTPException(status_code=402, detail="Insufficient credits")
        
        # Refine script
        refined_data = await script_writer.refine_script(
            original_script=request.script,
            feedback=request.feedback,
            target_improvements=request.improvements
        )
        
        # Deduct credits (5 credits for refinement)
        await auth_service.deduct_credits(user.id, 5)
        remaining_credits = await auth_service.get_credits(user.id)
        
        return {
            "success": True,
            "refined_script": refined_data,
            "credits_used": 5,
            "credits_remaining": remaining_credits,
            "message": "Script refined successfully!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Script refinement error: {e}")
        raise HTTPException(status_code=500, detail=f"Script refinement failed: {str(e)}")

@app.get("/api/scripts/hooks")
async def get_viral_hooks(
    style: str = "educational",
    platform: str = "tiktok",
    user: User = Depends(auth_service.get_current_user)
):
    """🎣 Get trending viral hooks for your content style"""
    try:
        hooks = await script_writer.get_trending_hooks("general", platform, style)
        
        return {
            "success": True,
            "hooks": [
                {
                    "text": hook.text,
                    "category": hook.category,
                    "viral_score": hook.viral_score,
                    "best_for": hook.best_for
                } for hook in hooks
            ],
            "platform": platform,
            "style": style,
            "message": f"Found {len(hooks)} viral hooks for {style} content"
        }
        
    except Exception as e:
        print(f"Hooks retrieval error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get hooks: {str(e)}")

@app.get("/api/scripts/templates")
async def get_script_templates(
    platform: str = "tiktok",
    duration: int = 60,
    user: User = Depends(auth_service.get_current_user)
):
    """📜 Get proven script templates for different content types"""
    try:
        templates = {
            "educational": {
                "name": "Educational Tutorial",
                "structure": "Hook → Problem → Solution → Proof → CTA",
                "example": "What if I told you... [problem] But here's what nobody tells you... [solution] This is what happened... [proof] Try this!",
                "viral_score": 85,
                "best_for": ["tutorials", "tips", "how-to"]
            },
            "story": {
                "name": "Personal Story",
                "structure": "Hook → Setup → Conflict → Resolution → Lesson",
                "example": "So this happened to me... [setup] Everything went wrong... [conflict] But then... [resolution] The lesson? [CTA]",
                "viral_score": 88,
                "best_for": ["experiences", "failures", "transformations"]
            },
            "entertainment": {
                "name": "Entertainment Hook",
                "structure": "Surprise → Build → Payoff → Share",
                "example": "You won't believe... [surprise] Here's what happened... [build] Plot twist! [payoff] Tag someone who...",
                "viral_score": 92,
                "best_for": ["comedy", "reactions", "trends"]
            },
            "listicle": {
                "name": "Quick Tips List",
                "structure": "Hook → Preview → Tips → Recap → CTA",
                "example": "5 secrets that... [hook] Here they are: [preview] 1. First tip... [tips] Remember these! [CTA]",
                "viral_score": 80,
                "best_for": ["tips", "advice", "quick-wins"]
            }
        }
        
        return {
            "success": True,
            "templates": templates,
            "platform": platform,
            "duration": duration,
            "message": f"Found {len(templates)} proven templates"
        }
        
    except Exception as e:
        print(f"Templates retrieval error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get templates: {str(e)}")

# ============================================================================
# MAGIC EDIT SUITE API ENDPOINTS
# ============================================================================

class MagicEditRequest(BaseModel):
    enhancements: List[str] = []  # List of enhancement names
    preset: str = "mobile"  # mobile, desktop, tiktok, instagram, youtube

@app.post("/api/magic-edit/enhance")
async def magic_enhance_video(
    video: UploadFile = File(...),
    enhancements: str = Form(...),  # JSON string of enhancements
    preset: str = Form("mobile"),
    user: User = Depends(auth_service.get_current_user)
):
    """✨ Apply professional AI video enhancements with one click"""
    try:
        # Parse enhancements
        enhancement_list = json.loads(enhancements) if enhancements else []
        
        # Calculate credits needed
        base_credits = 20  # Base enhancement
        enhancement_costs = {
            'remove_background': 15,
            'enhance_face': 10,
            'fix_lighting': 5,
            'stabilize_video': 10,
            'upscale_quality': 25,
            'denoise_audio': 8,
            'auto_crop': 5,
            'color_grade': 8,
            'add_subtitles': 12,
            'speed_optimize': 5
        }
        
        total_credits = base_credits + sum(enhancement_costs.get(enh, 0) for enh in enhancement_list)
        
        # Check user credits
        user_credits = await auth_service.get_credits(user.id)
        if user_credits < total_credits:
            raise HTTPException(
                status_code=402, 
                detail=f"Insufficient credits. Need {total_credits}, have {user_credits}"
            )
        
        # Save uploaded video
        temp_dir = tempfile.mkdtemp()
        video_path = os.path.join(temp_dir, f"input_{video.filename}")
        
        with open(video_path, "wb") as buffer:
            content = await video.read()
            buffer.write(content)
        
        # Create enhancement options
        options = MagicEditOptions(
            remove_background='remove_background' in enhancement_list,
            enhance_face='enhance_face' in enhancement_list,
            fix_lighting='fix_lighting' in enhancement_list,
            stabilize_video='stabilize_video' in enhancement_list,
            upscale_quality='upscale_quality' in enhancement_list,
            denoise_audio='denoise_audio' in enhancement_list,
            auto_crop='auto_crop' in enhancement_list,
            color_grade='color_grade' in enhancement_list,
            add_subtitles='add_subtitles' in enhancement_list,
            speed_optimize='speed_optimize' in enhancement_list
        )
        
        # Apply magic enhancements
        result = await magic_editor.magic_enhance(video_path, options, preset)
        
        if result.get("success"):
            # Deduct credits
            await auth_service.deduct_credits(user.id, total_credits)
            remaining_credits = await auth_service.get_credits(user.id)
            
            # Store enhanced video (you'd upload to your storage service here)
            # For now, we'll return the local path
            
            return {
                "success": True,
                "enhanced_video_url": result["enhanced_video"],  # In production, upload to R2/S3
                "before_preview": result.get("before_preview"),
                "after_preview": result.get("after_preview"),
                "processing_time": result["processing_time"],
                "enhancements_applied": result["enhancements_applied"],
                "quality_improvement": result["quality_improvement"],
                "file_size_change": result.get("file_size_reduction", "Optimized"),
                "processing_stats": result.get("processing_stats", {}),
                "credits_used": total_credits,
                "credits_remaining": remaining_credits,
                "message": "🎬 Video enhanced to professional quality!"
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Enhancement failed"),
                "message": "Enhancement failed, please try again"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Magic enhancement error: {e}")
        raise HTTPException(status_code=500, detail=f"Enhancement failed: {str(e)}")

@app.get("/api/magic-edit/presets")
async def get_enhancement_presets(
    user: User = Depends(auth_service.get_current_user)
):
    """🎨 Get available enhancement presets and options"""
    try:
        presets = {
            "mobile": {
                "name": "Mobile Optimized",
                "description": "Perfect for phones and social media",
                "specs": "1080x1920, 30fps, 2Mbps",
                "best_for": ["TikTok", "Instagram Stories", "Mobile viewing"]
            },
            "desktop": {
                "name": "Desktop Quality",
                "description": "High quality for computer viewing",
                "specs": "1920x1080, 30fps, 5Mbps", 
                "best_for": ["YouTube", "Facebook", "Desktop viewing"]
            },
            "tiktok": {
                "name": "TikTok Perfect",
                "description": "Optimized for TikTok algorithm",
                "specs": "1080x1920, 30fps, 2Mbps",
                "best_for": ["TikTok", "Short-form vertical video"]
            },
            "instagram": {
                "name": "Instagram Ready",
                "description": "Perfect for Instagram posts and stories",
                "specs": "1080x1080, 30fps, 3Mbps",
                "best_for": ["Instagram Feed", "Instagram Stories", "Reels"]
            },
            "youtube": {
                "name": "YouTube Pro",
                "description": "High quality for YouTube uploads",
                "specs": "1920x1080, 60fps, 8Mbps",
                "best_for": ["YouTube", "Long-form content", "Monetized videos"]
            }
        }
        
        enhancements = {
            "remove_background": {
                "name": "Remove Background",
                "description": "AI-powered background removal",
                "icon": "🎭",
                "credits": 15,
                "processing_time": "2-3 minutes",
                "premium": False
            },
            "enhance_face": {
                "name": "Enhance Faces", 
                "description": "AI face restoration and enhancement",
                "icon": "✨",
                "credits": 10,
                "processing_time": "1-2 minutes",
                "premium": False
            },
            "fix_lighting": {
                "name": "Fix Lighting",
                "description": "Professional lighting correction",
                "icon": "💡",
                "credits": 5,
                "processing_time": "30 seconds",
                "premium": False
            },
            "stabilize_video": {
                "name": "Stabilize Video",
                "description": "Remove camera shake and jitter",
                "icon": "📹",
                "credits": 10,
                "processing_time": "1 minute",
                "premium": True
            },
            "upscale_quality": {
                "name": "Upscale to 4K",
                "description": "AI-powered quality enhancement",
                "icon": "📺", 
                "credits": 25,
                "processing_time": "3-5 minutes",
                "premium": True
            },
            "denoise_audio": {
                "name": "Clean Audio",
                "description": "Remove background noise",
                "icon": "🎵",
                "credits": 8,
                "processing_time": "30 seconds",
                "premium": True
            },
            "auto_crop": {
                "name": "Smart Crop",
                "description": "AI content-aware cropping",
                "icon": "✂️",
                "credits": 5,
                "processing_time": "30 seconds",
                "premium": False
            },
            "color_grade": {
                "name": "Color Grading",
                "description": "Professional color correction",
                "icon": "🎨",
                "credits": 8,
                "processing_time": "45 seconds",
                "premium": True
            },
            "add_subtitles": {
                "name": "Auto Subtitles",
                "description": "AI-generated captions",
                "icon": "📝",
                "credits": 12,
                "processing_time": "1-2 minutes",
                "premium": True
            },
            "speed_optimize": {
                "name": "Pacing Optimizer",
                "description": "AI pacing for engagement",
                "icon": "⚡",
                "credits": 5,
                "processing_time": "30 seconds",
                "premium": True
            }
        }
        
        return {
            "success": True,
            "presets": presets,
            "enhancements": enhancements,
            "base_credits": 20,
            "message": "Enhancement options loaded"
        }
        
    except Exception as e:
        print(f"Presets retrieval error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get presets: {str(e)}")

@app.post("/api/magic-edit/preview")
async def generate_enhancement_preview(
    video: UploadFile = File(...),
    enhancement_type: str = Form("fix_lighting"),
    user: User = Depends(auth_service.get_current_user)
):
    """👁️ Generate before/after preview for specific enhancement"""
    try:
        # Check if user has preview credits (free previews)
        user_credits = await auth_service.get_credits(user.id)
        if user_credits < 1:
            raise HTTPException(status_code=402, detail="Need at least 1 credit for preview")
        
        # Save uploaded video
        temp_dir = tempfile.mkdtemp()
        video_path = os.path.join(temp_dir, f"preview_{video.filename}")
        
        with open(video_path, "wb") as buffer:
            content = await video.read()
            buffer.write(content)
        
        # Apply single enhancement for preview
        options = MagicEditOptions()
        setattr(options, enhancement_type, True)
        
        result = await magic_editor.magic_enhance(video_path, options, "mobile")
        
        if result.get("success"):
            return {
                "success": True,
                "before_preview": result.get("before_preview"),
                "after_preview": result.get("after_preview"),
                "processing_time": result["processing_time"],
                "enhancement": enhancement_type,
                "quality_improvement": result["quality_improvement"],
                "message": f"Preview generated for {enhancement_type}"
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Preview generation failed"),
                "message": "Preview failed, please try again"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Preview generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")

@app.get("/api/magic-edit/examples")
async def get_enhancement_examples(
    user: User = Depends(auth_service.get_current_user)
):
    """📸 Get before/after examples of each enhancement type"""
    try:
        examples = {
            "remove_background": {
                "before": "/examples/before_bg_removal.jpg",
                "after": "/examples/after_bg_removal.jpg",
                "description": "Clean background removal preserving subject details"
            },
            "enhance_face": {
                "before": "/examples/before_face_enhance.jpg", 
                "after": "/examples/after_face_enhance.jpg",
                "description": "Natural face enhancement without over-processing"
            },
            "fix_lighting": {
                "before": "/examples/before_lighting.jpg",
                "after": "/examples/after_lighting.jpg", 
                "description": "Professional lighting correction and color balance"
            },
            "upscale_quality": {
                "before": "/examples/before_upscale.jpg",
                "after": "/examples/after_upscale.jpg",
                "description": "AI upscaling with enhanced details and sharpness"
            },
            "color_grade": {
                "before": "/examples/before_color.jpg",
                "after": "/examples/after_color.jpg",
                "description": "Cinematic color grading for professional look"
            }
        }
        
        return {
            "success": True,
            "examples": examples,
            "message": "Enhancement examples loaded"
        }
        
    except Exception as e:
        print(f"Examples retrieval error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get examples: {str(e)}")

# ============================================================================
# CONTENT REMIX ENGINE API ENDPOINTS
# ============================================================================

class RemixRequest(BaseModel):
    variations: List[str] = []  # Types of variations to create
    target_platforms: List[str] = ["tiktok", "instagram_reels", "youtube_shorts"]
    remix_count: int = 10  # Number of variations to create

@app.post("/api/remix/multiply")
async def remix_content(
    video: UploadFile = File(...),
    variations: str = Form(...),  # JSON string of variation types
    target_platforms: str = Form(...),  # JSON string of platforms
    remix_count: int = Form(10),
    user: User = Depends(auth_service.get_current_user)
):
    """🎭 Transform 1 video into 20+ viral variations across platforms"""
    try:
        # Parse parameters
        variation_list = json.loads(variations) if variations else ["platform", "style", "length"]
        platform_list = json.loads(target_platforms) if target_platforms else ["tiktok", "instagram_reels"]
        
        # Calculate credits needed
        base_credits = 30  # Base remixing
        variation_costs = {
            'platform': 5,    # Platform optimization
            'style': 8,       # Style variations
            'length': 3,      # Length cuts
            'format': 5,      # Format changes
            'trending': 12,   # Trending adaptations
            'language': 10,   # Language variations
            'audience': 8,    # Audience targeting
            'mood': 6,        # Mood variations
            'hook': 10,       # Hook variations
            'cta': 5          # CTA variations
        }
        
        platform_multiplier = len(platform_list)  # More platforms = more credits
        variation_credits = sum(variation_costs.get(var, 0) for var in variation_list)
        total_credits = base_credits + (variation_credits * platform_multiplier) + (remix_count * 2)
        
        # Check user credits
        user_credits = await auth_service.get_credits(user.id)
        if user_credits < total_credits:
            raise HTTPException(
                status_code=402, 
                detail=f"Insufficient credits. Need {total_credits}, have {user_credits}"
            )
        
        # Save uploaded video
        temp_dir = tempfile.mkdtemp()
        video_path = os.path.join(temp_dir, f"remix_input_{video.filename}")
        
        with open(video_path, "wb") as buffer:
            content = await video.read()
            buffer.write(content)
        
        # Create remix options
        options = RemixOptions(
            platform_variations='platform' in variation_list,
            style_variations='style' in variation_list,
            length_variations='length' in variation_list,
            format_variations='format' in variation_list,
            trending_adaptations='trending' in variation_list,
            language_variations='language' in variation_list,
            audience_targeting='audience' in variation_list,
            mood_variations='mood' in variation_list,
            hook_variations='hook' in variation_list,
            cta_variations='cta' in variation_list,
            target_count=remix_count
        )
        
        # Apply content remixing
        result = await content_remixer.remix_content(video_path, options, platform_list)
        
        if result.get("success"):
            # Deduct credits
            await auth_service.deduct_credits(user.id, total_credits)
            remaining_credits = await auth_service.get_credits(user.id)
            
            return {
                "success": True,
                "remix_results": result["variations"],
                "total_variations": result["total_variations"],
                "platforms_covered": result["platforms_covered"],
                "processing_time": result["processing_time"],
                "variation_breakdown": result["variation_breakdown"],
                "viral_scores": result["viral_scores"],
                "platform_optimization": result["platform_optimization"],
                "trending_analysis": result.get("trending_analysis", {}),
                "credits_used": total_credits,
                "credits_remaining": remaining_credits,
                "message": f"🎬 {result['total_variations']} viral variations created!"
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Content remixing failed"),
                "message": "Remixing failed, please try again"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Content remixing error: {e}")
        raise HTTPException(status_code=500, detail=f"Content remixing failed: {str(e)}")

@app.get("/api/remix/options")
async def get_remix_options(
    user: User = Depends(auth_service.get_current_user)
):
    """🎨 Get available remix variations and platform options"""
    try:
        variation_types = {
            "platform": {
                "name": "Platform Optimization",
                "description": "Optimize for specific social media platforms",
                "icon": "📱",
                "credits": 5,
                "processing_time": "30 seconds per platform",
                "premium": False
            },
            "style": {
                "name": "Style Variations", 
                "description": "Different visual and editing styles",
                "icon": "🎨",
                "credits": 8,
                "processing_time": "1 minute per style",
                "premium": False
            },
            "length": {
                "name": "Length Cuts",
                "description": "Multiple duration versions",
                "icon": "✂️",
                "credits": 3,
                "processing_time": "20 seconds",
                "premium": False
            },
            "format": {
                "name": "Format Changes",
                "description": "Different aspect ratios and formats",
                "icon": "📐",
                "credits": 5,
                "processing_time": "30 seconds",
                "premium": False
            },
            "trending": {
                "name": "Trending Adaptations",
                "description": "Adapt to current viral trends",
                "icon": "🔥",
                "credits": 12,
                "processing_time": "2 minutes",
                "premium": True
            },
            "language": {
                "name": "Language Variations",
                "description": "Multiple language versions",
                "icon": "🌍",
                "credits": 10,
                "processing_time": "1-2 minutes",
                "premium": True
            },
            "audience": {
                "name": "Audience Targeting",
                "description": "Optimize for different demographics",
                "icon": "👥",
                "credits": 8,
                "processing_time": "1 minute",
                "premium": True
            },
            "mood": {
                "name": "Mood Variations",
                "description": "Different emotional tones",
                "icon": "😊",
                "credits": 6,
                "processing_time": "45 seconds",
                "premium": True
            },
            "hook": {
                "name": "Hook Variations",
                "description": "Multiple opening hooks",
                "icon": "🎣",
                "credits": 10,
                "processing_time": "1 minute",
                "premium": True
            },
            "cta": {
                "name": "CTA Variations",
                "description": "Different call-to-action endings",
                "icon": "📢",
                "credits": 5,
                "processing_time": "30 seconds",
                "premium": False
            }
        }
        
        platforms = {
            "tiktok": {
                "name": "TikTok",
                "format": "9:16 vertical",
                "optimal_length": "15-60 seconds",
                "features": ["trending sounds", "effects", "hashtags"]
            },
            "instagram_reels": {
                "name": "Instagram Reels",
                "format": "9:16 vertical", 
                "optimal_length": "15-90 seconds",
                "features": ["music", "effects", "trends"]
            },
            "youtube_shorts": {
                "name": "YouTube Shorts",
                "format": "9:16 vertical",
                "optimal_length": "15-60 seconds", 
                "features": ["trending topics", "shorts shelf"]
            },
            "twitter": {
                "name": "Twitter/X",
                "format": "16:9 or square",
                "optimal_length": "15-45 seconds",
                "features": ["captions", "threads", "engagement"]
            },
            "facebook": {
                "name": "Facebook",
                "format": "Square or landscape",
                "optimal_length": "30-90 seconds",
                "features": ["native video", "auto-captions"]
            },
            "linkedin": {
                "name": "LinkedIn",
                "format": "Square or landscape",
                "optimal_length": "30-180 seconds",
                "features": ["professional tone", "industry focus"]
            },
            "snapchat": {
                "name": "Snapchat",
                "format": "9:16 vertical",
                "optimal_length": "3-60 seconds",
                "features": ["AR filters", "stories", "discover"]
            }
        }
        
        return {
            "success": True,
            "variation_types": variation_types,
            "platforms": platforms,
            "base_credits": 30,
            "max_variations": 50,
            "recommended_combo": ["platform", "style", "length", "hook"],
            "message": "Remix options loaded"
        }
        
    except Exception as e:
        print(f"Remix options retrieval error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get remix options: {str(e)}")

@app.post("/api/remix/preview")
async def preview_remix_variations(
    video: UploadFile = File(...),
    variation_type: str = Form("style"),
    target_platform: str = Form("tiktok"),
    user: User = Depends(auth_service.get_current_user)
):
    """👁️ Preview how content will look with specific remix variation"""
    try:
        # Check preview credits
        user_credits = await auth_service.get_credits(user.id)
        if user_credits < 2:
            raise HTTPException(status_code=402, detail="Need at least 2 credits for remix preview")
        
        # Save uploaded video
        temp_dir = tempfile.mkdtemp()
        video_path = os.path.join(temp_dir, f"preview_remix_{video.filename}")
        
        with open(video_path, "wb") as buffer:
            content = await video.read()
            buffer.write(content)
        
        # Create limited remix options for preview
        options = RemixOptions(target_count=3)  # Just 3 previews
        setattr(options, f"{variation_type}_variations", True)
        
        result = await content_remixer.remix_content(video_path, options, [target_platform])
        
        if result.get("success"):
            # Deduct small preview credits
            await auth_service.deduct_credits(user.id, 2)
            
            return {
                "success": True,
                "preview_variations": result["variations"][:3],  # Limit to 3 for preview
                "variation_type": variation_type,
                "target_platform": target_platform,
                "processing_time": result["processing_time"],
                "viral_scores": result["viral_scores"],
                "credits_used": 2,
                "message": f"Preview generated for {variation_type} variations"
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Preview generation failed"),
                "message": "Preview failed, please try again"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Remix preview error: {e}")
        raise HTTPException(status_code=500, detail=f"Remix preview failed: {str(e)}")

@app.get("/api/remix/trending-adaptations")
async def get_trending_adaptations(
    platform: str = "tiktok",
    content_type: str = "educational",
    user: User = Depends(auth_service.get_current_user)
):
    """🔥 Get current trending formats and adaptations for content"""
    try:
        # Get trending data from content remixer
        trending_data = await content_remixer.get_trending_adaptations(platform, content_type)
        
        return {
            "success": True,
            "trending_adaptations": trending_data["adaptations"],
            "trending_sounds": trending_data.get("sounds", []),
            "viral_formats": trending_data.get("formats", []),
            "hashtag_clusters": trending_data.get("hashtags", []),
            "engagement_patterns": trending_data.get("patterns", {}),
            "platform": platform,
            "content_type": content_type,
            "last_updated": trending_data.get("updated_at"),
            "message": f"Found {len(trending_data['adaptations'])} trending adaptations"
        }
        
    except Exception as e:
        print(f"Trending adaptations error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get trending adaptations: {str(e)}")

@app.post("/api/remix/batch-process")
async def batch_remix_videos(
    videos: List[UploadFile] = File(...),
    remix_config: str = Form(...),  # JSON config for batch processing
    user: User = Depends(auth_service.get_current_user)
):
    """📦 Process multiple videos with same remix configuration"""
    try:
        # Parse batch configuration
        config = json.loads(remix_config)
        variation_list = config.get("variations", ["platform", "style"])
        platform_list = config.get("platforms", ["tiktok", "instagram_reels"])
        remix_count = config.get("remix_count", 5)
        
        # Calculate total credits for batch
        single_video_credits = 30 + sum(
            {'platform': 5, 'style': 8, 'length': 3, 'format': 5, 'trending': 12}.get(var, 0) 
            for var in variation_list
        ) * len(platform_list)
        
        total_credits = len(videos) * single_video_credits
        
        # Check user credits
        user_credits = await auth_service.get_credits(user.id)
        if user_credits < total_credits:
            raise HTTPException(
                status_code=402, 
                detail=f"Insufficient credits for batch processing. Need {total_credits}, have {user_credits}"
            )
        
        batch_results = []
        processed_count = 0
        
        # Process each video
        for video in videos:
            try:
                # Save video
                temp_dir = tempfile.mkdtemp()
                video_path = os.path.join(temp_dir, f"batch_{video.filename}")
                
                with open(video_path, "wb") as buffer:
                    content = await video.read()
                    buffer.write(content)
                
                # Create remix options
                options = RemixOptions(
                    platform_variations='platform' in variation_list,
                    style_variations='style' in variation_list,
                    length_variations='length' in variation_list,
                    target_count=remix_count
                )
                
                # Process video
                result = await content_remixer.remix_content(video_path, options, platform_list)
                
                if result.get("success"):
                    batch_results.append({
                        "video_name": video.filename,
                        "status": "success",
                        "variations_created": result["total_variations"],
                        "processing_time": result["processing_time"],
                        "variations": result["variations"]
                    })
                    processed_count += 1
                else:
                    batch_results.append({
                        "video_name": video.filename,
                        "status": "failed",
                        "error": result.get("error", "Unknown error")
                    })
                
            except Exception as video_error:
                batch_results.append({
                    "video_name": video.filename,
                    "status": "failed",
                    "error": str(video_error)
                })
        
        # Deduct credits based on successful processing
        credits_used = processed_count * single_video_credits
        if credits_used > 0:
            await auth_service.deduct_credits(user.id, credits_used)
        
        remaining_credits = await auth_service.get_credits(user.id)
        
        return {
            "success": True,
            "batch_results": batch_results,
            "total_videos": len(videos),
            "processed_successfully": processed_count,
            "failed_videos": len(videos) - processed_count,
            "total_variations_created": sum(
                result.get("variations_created", 0) for result in batch_results 
                if result["status"] == "success"
            ),
            "credits_used": credits_used,
            "credits_remaining": remaining_credits,
            "message": f"Batch processing complete: {processed_count}/{len(videos)} videos processed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Batch remix error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)