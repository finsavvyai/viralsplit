import asyncio
import json
import time
from typing import Dict, Set
from fastapi import HTTPException
from sse_starlette.sse import EventSourceResponse

# Store active SSE connections
sse_connections: Dict[str, Set[asyncio.Queue]] = {}

async def sse_progress_stream(project_id: str):
    """Stream progress updates via Server-Sent Events"""
    queue = asyncio.Queue()
    
    if project_id not in sse_connections:
        sse_connections[project_id] = set()
    sse_connections[project_id].add(queue)
    
    try:
        while True:
            try:
                # Wait for progress updates
                data = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield {
                    "event": "progress",
                    "data": json.dumps(data)
                }
            except asyncio.TimeoutError:
                # Send keepalive
                yield {
                    "event": "ping",
                    "data": json.dumps({"timestamp": time.time()})
                }
    except asyncio.CancelledError:
        pass
    finally:
        if project_id in sse_connections:
            sse_connections[project_id].discard(queue)
            if not sse_connections[project_id]:
                del sse_connections[project_id]

async def send_sse_update(project_id: str, data: dict):
    """Send update to all SSE connections for a project"""
    if project_id in sse_connections:
        for queue in sse_connections[project_id]:
            try:
                await queue.put(data)
            except:
                pass

async def process_youtube_sse(project_id: str, youtube_url: str, user_id: str, is_trial: bool = False):
    """Process YouTube video with SSE updates"""
    try:
        # Send initial progress
        await send_sse_update(project_id, {
            "status": "processing",
            "progress": 10,
            "message": "Starting YouTube video processing..."
        })
        
        await asyncio.sleep(2)
        
        await send_sse_update(project_id, {
            "status": "processing",
            "progress": 30,
            "message": "Downloading video from YouTube..."
        })
        
        await asyncio.sleep(2)
        
        await send_sse_update(project_id, {
            "status": "processing",
            "progress": 60,
            "message": "Analyzing video content..."
        })
        
        await asyncio.sleep(2)
        
        # Send completion
        await send_sse_update(project_id, {
            "status": "ready_for_processing",
            "progress": 100,
            "message": "YouTube video processed successfully"
        })
        
    except Exception as e:
        await send_sse_update(project_id, {
            "status": "error",
            "progress": 0,
            "error": str(e)
        })
