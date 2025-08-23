from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import asyncio
import uuid
import os
import tempfile
from celery import Celery
from celery.result import AsyncResult
from dotenv import load_dotenv
from services.storage import R2Storage
from services.video_processor import VideoProcessor

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

# Celery for background tasks
celery_app = Celery(
    'tasks',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379')
)

# Request/Response models
class UploadRequest(BaseModel):
    filename: str
    file_size: int
    content_type: str

class TransformRequest(BaseModel):
    platforms: List[str]
    options: Dict = {}

# In-memory storage for project status (use database in production)
projects_db = {}

# ===== ENDPOINTS =====

@app.get("/")
async def root():
    return {"message": "ViralSplit/ContentMulti API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/upload/request")
async def request_upload(request: UploadRequest):
    """Generate presigned URL for direct upload to R2"""
    try:
        # Validate file type and size
        if not request.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="Only video files are allowed")
        
        if request.file_size > 500 * 1024 * 1024:  # 500MB limit
            raise HTTPException(status_code=400, detail="File size exceeds 500MB limit")
        
        # Generate unique project ID and file key
        project_id = str(uuid.uuid4())
        file_extension = os.path.splitext(request.filename)[1]
        file_key = f"uploads/{project_id}/original{file_extension}"
        
        # Generate presigned URL for direct upload
        upload_url = storage_service.generate_upload_url(file_key, expires_in=3600)
        
        if not upload_url:
            raise HTTPException(status_code=500, detail="Failed to generate upload URL")
        
        # Initialize project in database
        projects_db[project_id] = {
            "id": project_id,
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
async def complete_upload(project_id: str):
    """Mark upload as complete and ready for processing"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    projects_db[project_id]["status"] = "uploaded"
    return {"status": "upload_complete", "project_id": project_id}

@app.post("/api/projects/{project_id}/transform")
async def transform_video(
    project_id: str,
    request: TransformRequest
):
    """Start video transformation job"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects_db[project_id]
    
    if project["status"] != "uploaded":
        raise HTTPException(status_code=400, detail="Project must be uploaded before transformation")
    
    if not request.platforms:
        raise HTTPException(status_code=400, detail="At least one platform must be specified")
    
    try:
        # Update project status
        projects_db[project_id]["status"] = "processing"
        projects_db[project_id]["platforms"] = request.platforms
        
        # Start background transformation task
        task = transform_video_task.delay(project_id, request.platforms, request.options)
        
        projects_db[project_id]["task_id"] = task.id
        
        return {
            'task_id': task.id,
            'status': 'processing',
            'project_id': project_id,
            'platforms': request.platforms
        }
        
    except Exception as e:
        projects_db[project_id]["status"] = "error"
        projects_db[project_id]["error"] = str(e)
        raise HTTPException(status_code=500, detail=f"Failed to start transformation: {str(e)}")

@app.get("/api/projects/{project_id}/status")
async def get_project_status(project_id: str):
    """Get transformation status"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects_db[project_id]
    
    # If processing, check Celery task status
    if project["status"] == "processing" and "task_id" in project:
        task_result = AsyncResult(project["task_id"], app=celery_app)
        
        if task_result.ready():
            if task_result.successful():
                # Task completed successfully
                result = task_result.result
                projects_db[project_id]["status"] = "completed"
                projects_db[project_id]["transformations"] = result
            else:
                # Task failed
                projects_db[project_id]["status"] = "error"
                projects_db[project_id]["error"] = str(task_result.result)
        else:
            # Task still running - check if we have progress info
            task_info = task_result.info
            if task_info and isinstance(task_info, dict) and 'progress' in task_info:
                projects_db[project_id]["progress"] = task_info['progress']
    
    return {
        'project': {
            'id': project_id,
            'status': project["status"],
            'filename': project.get("filename"),
            'platforms': project.get("platforms", []),
            'progress': project.get("progress", 0),
            'error': project.get("error"),
            'created_at': project.get("created_at")
        },
        'transformations': project.get("transformations", {})
    }

# ===== CELERY TASKS =====

@celery_app.task(bind=True)
def transform_video_task(self, project_id: str, platforms: List[str], options: dict):
    """Background task for video transformation"""
    try:
        # Get project from database
        project = projects_db.get(project_id)
        if not project:
            raise Exception(f"Project {project_id} not found")
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 10})
        
        # Get input video URL
        input_url = f"https://cdn.viralsplit.io/{project['file_key']}"
        
        # Update progress
        self.update_state(state='PROGRESS', meta={'progress': 30})
        
        # Process video for each platform using the video processor
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            results = loop.run_until_complete(
                video_processor.process_video(input_url, platforms, project_id)
            )
            
            # Update progress for each completed platform
            for i, platform in enumerate(platforms):
                progress = 30 + ((i + 1) * 60 // len(platforms))
                self.update_state(state='PROGRESS', meta={'progress': progress})
                
        finally:
            loop.close()
        
        # Final progress update
        self.update_state(state='PROGRESS', meta={'progress': 100})
        
        return results
        
    except Exception as e:
        # Update task state with error
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise e

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)