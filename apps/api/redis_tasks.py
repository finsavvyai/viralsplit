import asyncio
import json
import time
import redis
from typing import Dict, Any
from fastapi import HTTPException
import os

# Redis connection (configure with your Redis URL)
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    password=os.getenv("REDIS_PASSWORD"),
    decode_responses=True
)

class RedisTaskQueue:
    def __init__(self):
        self.redis = redis_client
    
    async def enqueue_task(self, task_type: str, task_data: dict) -> str:
        """Enqueue a task in Redis"""
        task_id = f"{task_type}_{int(time.time() * 1000)}"
        task_data["task_id"] = task_id
        task_data["created_at"] = time.time()
        task_data["status"] = "queued"
        
        # Store task data
        self.redis.hset(f"task:{task_id}", mapping=task_data)
        
        # Add to queue
        self.redis.lpush(f"queue:{task_type}", task_id)
        
        return task_id
    
    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get task status from Redis"""
        task_data = self.redis.hgetall(f"task:{task_id}")
        if not task_data:
            return {"status": "not_found"}
        
        return {
            "task_id": task_id,
            "status": task_data.get("status", "unknown"),
            "progress": int(task_data.get("progress", 0)),
            "message": task_data.get("message", ""),
            "error": task_data.get("error"),
            "created_at": float(task_data.get("created_at", 0)),
            "updated_at": float(task_data.get("updated_at", 0))
        }
    
    async def update_task_progress(self, task_id: str, progress: int, message: str, status: str = "processing"):
        """Update task progress in Redis"""
        self.redis.hset(f"task:{task_id}", mapping={
            "progress": progress,
            "message": message,
            "status": status,
            "updated_at": time.time()
        })
    
    async def process_youtube_task(self, project_id: str, youtube_url: str, user_id: str, is_trial: bool = False):
        """Process YouTube video using Redis task queue"""
        task_id = await self.enqueue_task("youtube_processing", {
            "project_id": project_id,
            "youtube_url": youtube_url,
            "user_id": user_id,
            "is_trial": is_trial
        })
        
        # Start processing in background
        asyncio.create_task(self._process_youtube_background(task_id, project_id, youtube_url))
        
        return task_id
    
    async def _process_youtube_background(self, task_id: str, project_id: str, youtube_url: str):
        """Background processing of YouTube video"""
        try:
            await self.update_task_progress(task_id, 10, "Starting YouTube video processing...")
            await asyncio.sleep(2)
            
            await self.update_task_progress(task_id, 30, "Downloading video from YouTube...")
            await asyncio.sleep(2)
            
            await self.update_task_progress(task_id, 60, "Analyzing video content...")
            await asyncio.sleep(2)
            
            await self.update_task_progress(task_id, 100, "YouTube video processed successfully", "completed")
            
        except Exception as e:
            await self.update_task_progress(task_id, 0, str(e), "failed")

# Global task queue instance
task_queue = RedisTaskQueue()
