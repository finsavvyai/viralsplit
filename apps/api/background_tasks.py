import asyncio
import time
from typing import Dict, Any
from fastapi import BackgroundTasks

# In-memory task store (replace with Redis/database in production)
background_tasks: Dict[str, Dict[str, Any]] = {}

async def process_youtube_background(
    project_id: str, 
    youtube_url: str, 
    user_id: str, 
    is_trial: bool = False
):
    """Background task for processing YouTube videos using FastAPI background tasks"""
    try:
        # Initialize task status
        background_tasks[project_id] = {
            "status": "processing",
            "progress": 10,
            "message": "Starting YouTube video processing...",
            "updated_at": time.time()
        }
        
        # Simulate processing steps
        await asyncio.sleep(2)
        
        background_tasks[project_id].update({
            "progress": 30,
            "message": "Downloading video from YouTube...",
            "updated_at": time.time()
        })
        
        await asyncio.sleep(2)
        
        background_tasks[project_id].update({
            "progress": 60,
            "message": "Analyzing video content...",
            "updated_at": time.time()
        })
        
        await asyncio.sleep(2)
        
        # Mark as complete
        background_tasks[project_id].update({
            "status": "ready_for_processing",
            "progress": 100,
            "message": "YouTube video processed successfully",
            "updated_at": time.time()
        })
        
        print(f"✅ Background task completed for project {project_id}")
        
    except Exception as e:
        background_tasks[project_id] = {
            "status": "failed",
            "progress": 0,
            "error": str(e),
            "updated_at": time.time()
        }
        print(f"❌ Background task failed for project {project_id}: {e}")

def get_task_status(project_id: str) -> Dict[str, Any]:
    """Get the status of a background task"""
    return background_tasks.get(project_id, {
        "status": "not_found",
        "progress": 0,
        "message": "Task not found"
    })
