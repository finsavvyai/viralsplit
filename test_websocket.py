#!/usr/bin/env python3

import asyncio
import websockets
import json
import requests

async def test_websocket():
    # First, start a YouTube processing task
    print("🚀 Starting YouTube processing...")
    response = requests.post(
        "http://localhost:8000/api/upload/youtube",
        json={
            "url": "https://www.youtube.com/watch?v=test123",
            "agreed_to_terms": True,
            "is_trial": True
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        project_id = data["project_id"]
        print(f"✅ Project created: {project_id}")
        
        # Connect to WebSocket
        ws_url = f"ws://localhost:8000/ws/{project_id}"
        print(f"🔌 Connecting to WebSocket: {ws_url}")
        
        try:
            async with websockets.connect(ws_url) as websocket:
                print("✅ WebSocket connected!")
                
                # Listen for messages for 10 seconds
                timeout = 10
                start_time = asyncio.get_event_loop().time()
                
                while asyncio.get_event_loop().time() - start_time < timeout:
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                        data = json.loads(message)
                        print(f"📡 Received: {data}")
                    except asyncio.TimeoutError:
                        # Send heartbeat to keep connection alive
                        await websocket.send("ping")
                        print("💓 Sent heartbeat")
                
                print("⏰ Test completed")
                
        except Exception as e:
            print(f"❌ WebSocket error: {e}")
    else:
        print(f"❌ Failed to create project: {response.status_code}")

if __name__ == "__main__":
    asyncio.run(test_websocket())