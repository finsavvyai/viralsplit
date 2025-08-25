#!/usr/bin/env python3

import requests
import time
import json

# Test Celery task execution
def test_celery_task():
    print("🧪 Testing Celery Task Execution")
    print("=" * 40)
    
    # Create a test project
    url = "https://api.viralsplit.io/api/upload/youtube"
    data = {
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "agreed_to_terms": True,
        "is_trial": True
    }
    
    print("1. Creating test project...")
    response = requests.post(url, json=data)
    
    if response.status_code != 200:
        print(f"❌ Failed to create project: {response.status_code}")
        print(response.text)
        return
    
    project_data = response.json()
    project_id = project_data["project_id"]
    task_id = project_data["task_id"]
    
    print(f"✅ Project created: {project_id}")
    print(f"✅ Task ID: {task_id}")
    
    # Monitor progress
    print("\n2. Monitoring progress...")
    for i in range(15):  # Monitor for 45 seconds
        status_url = f"https://api.viralsplit.io/api/projects/{project_id}/status"
        status_response = requests.get(status_url)
        
        if status_response.status_code == 200:
            status_data = status_response.json()
            progress = status_data.get("progress", 0)
            status = status_data.get("status", "unknown")
            message = status_data.get("message", "")
            
            print(f"Poll {i+1}: Progress={progress}% | Status={status} | Message={message}")
            
            if status == "ready_for_processing":
                print("✅ Task completed successfully!")
                break
            elif status == "failed":
                print("❌ Task failed!")
                break
        else:
            print(f"❌ Status check failed: {status_response.status_code}")
        
        time.sleep(3)
    
    print("\n🎯 Test completed!")

if __name__ == "__main__":
    test_celery_task()
