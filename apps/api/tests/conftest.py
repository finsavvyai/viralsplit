import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import os
import tempfile
import shutil

# Import the app
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from services.auth import auth_service, users_db, social_accounts_db
from services.storage import R2Storage
from services.video_processor import VideoProcessor

@pytest.fixture
def client():
    """Test client for FastAPI app"""
    return TestClient(app)

@pytest.fixture
def test_user():
    """Test user data"""
    return {
        "email": "test@example.com",
        "password": "testpass123",
        "brand": "viralsplit"
    }

@pytest.fixture
def test_user_2():
    """Second test user data"""
    return {
        "email": "test2@example.com",
        "password": "testpass456",
        "brand": "contentmulti"
    }

@pytest.fixture
def auth_headers():
    """Get authentication headers for a test user"""
    def _auth_headers(token):
        return {"Authorization": f"Bearer {token}"}
    return _auth_headers

@pytest.fixture
def mock_boto3_client():
    """Mock boto3 client for R2 storage"""
    with patch('boto3.client') as mock_client:
        mock_instance = Mock()
        mock_client.return_value = mock_instance
        yield mock_client

@pytest.fixture
def storage_service():
    """Create a real storage service instance for testing"""
    return R2Storage()

@pytest.fixture
def video_processor():
    """Create a real video processor instance for testing"""
    return VideoProcessor()

@pytest.fixture
def mock_storage():
    """Mock R2 storage service"""
    with patch('services.storage.R2Storage') as mock:
        storage_instance = Mock()
        storage_instance.generate_unique_key.return_value = "users/user_1/20241201_143022_abc12345_test_video_original.mp4"
        storage_instance.generate_output_key.return_value = "users/user_1/outputs/project_1/20241201_143156_def67890_tiktok_standard.mp4"
        storage_instance.upload_video.return_value = "https://cdn.viralsplit.io/users/user_1/20241201_143022_abc12345_test_video_original.mp4"
        storage_instance.generate_upload_url.return_value = "https://test-upload-url.com"
        storage_instance.get_video_url.return_value = "https://cdn.viralsplit.io/users/user_1/20241201_143022_abc12345_test_video_original.mp4"
        mock.return_value = storage_instance
        yield storage_instance

@pytest.fixture
def mock_video_processor():
    """Mock video processor service"""
    with patch('services.video_processor.VideoProcessor') as mock:
        processor_instance = Mock()
        processor_instance.process_video.return_value = {
            "tiktok": {
                "url": "https://cdn.viralsplit.io/users/user_1/outputs/project_1/20241201_143156_def67890_tiktok_standard.mp4",
                "status": "completed",
                "specs": {"resolution": (1080, 1920), "fps": 30}
            }
        }
        mock.return_value = processor_instance
        yield processor_instance

@pytest.fixture
def temp_video_file():
    """Create a temporary video file for testing"""
    temp_dir = tempfile.mkdtemp()
    video_path = os.path.join(temp_dir, "test_video.mp4")
    
    # Create a minimal MP4 file (just header)
    with open(video_path, 'wb') as f:
        f.write(b'\x00\x00\x00\x20ftypmp42\x00\x00\x00\x00mp42isom')
    
    yield video_path
    
    # Cleanup
    shutil.rmtree(temp_dir)

@pytest.fixture
def clear_test_data():
    """Clear test data before and after tests"""
    # Clear before test
    users_db.clear()
    social_accounts_db.clear()
    
    # Clear projects_db if it exists
    try:
        from main import projects_db
        projects_db.clear()
    except ImportError:
        pass
    
    yield
    
    # Clear after test
    users_db.clear()
    social_accounts_db.clear()
    
    # Clear projects_db if it exists
    try:
        from main import projects_db
        projects_db.clear()
    except ImportError:
        pass

@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
