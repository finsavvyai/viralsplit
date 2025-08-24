import pytest
import json
import asyncio
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient

from main import app
from services.auth import auth_service, users_db, social_accounts_db

class TestAuthenticationEndpoints:
    """Test cases for authentication API endpoints"""
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_register_user_success(self, client, clear_test_data):
        """Test successful user registration"""
        user_data = {
            "email": "newuser@example.com",
            "password": "newpass123",
            "brand": "viralsplit"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "User registered successfully"
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["brand"] == "viralsplit"
        assert data["user"]["credits"] == 100
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_register_user_duplicate(self, client, clear_test_data):
        """Test registration with existing email"""
        user_data = {
            "email": "duplicate@example.com",
            "password": "pass123",
            "brand": "viralsplit"
        }
        
        # Register first user
        client.post("/api/auth/register", json=user_data)
        
        # Try to register again
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "User already exists" in response.json()["detail"]
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_register_user_invalid_email(self, client, clear_test_data):
        """Test registration with invalid email"""
        user_data = {
            "email": "invalid-email",
            "password": "pass123",
            "brand": "viralsplit"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_login_success(self, client, clear_test_data):
        """Test successful user login"""
        # Register user first
        user_data = {
            "email": "login@example.com",
            "password": "loginpass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        # Login
        login_data = {
            "email": "login@example.com",
            "password": "loginpass123"
        }
        
        response = client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "login@example.com"
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_login_invalid_credentials(self, client, clear_test_data):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpass"
        }
        
        response = client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_get_current_user_success(self, client, clear_test_data):
        """Test getting current user with valid token"""
        # Register and login user
        user_data = {
            "email": "current@example.com",
            "password": "currentpass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "current@example.com",
            "password": "currentpass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Get current user
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "current@example.com"
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]

class TestSocialAccountEndpoints:
    """Test cases for social account management endpoints"""
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_connect_social_account_success(self, client, clear_test_data):
        """Test successful social account connection"""
        # Register and login user
        user_data = {
            "email": "social@example.com",
            "password": "socialpass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "social@example.com",
            "password": "socialpass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Connect social account
        social_data = {
            "platform": "tiktok",
            "account_id": "tiktok_123",
            "account_name": "My TikTok",
            "access_token": "access_token_123",
            "refresh_token": "refresh_token_123"
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/auth/social/connect", json=social_data, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "Successfully connected tiktok account" in data["message"]
        assert data["account"]["platform"] == "tiktok"
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_connect_social_account_unauthorized(self, client):
        """Test social account connection without authentication"""
        social_data = {
            "platform": "tiktok",
            "account_id": "tiktok_123",
            "account_name": "My TikTok",
            "access_token": "access_token_123"
        }
        
        response = client.post("/api/auth/social/connect", json=social_data)
        
        assert response.status_code == 403
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_get_social_accounts_success(self, client, clear_test_data):
        """Test getting user's social accounts"""
        # Register and login user
        user_data = {
            "email": "social@example.com",
            "password": "socialpass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "social@example.com",
            "password": "socialpass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Connect social accounts
        headers = {"Authorization": f"Bearer {token}"}
        
        tiktok_data = {
            "platform": "tiktok",
            "account_id": "tiktok_123",
            "account_name": "My TikTok",
            "access_token": "access_token_123"
        }
        client.post("/api/auth/social/connect", json=tiktok_data, headers=headers)
        
        instagram_data = {
            "platform": "instagram",
            "account_id": "instagram_456",
            "account_name": "My Instagram",
            "access_token": "access_token_456"
        }
        client.post("/api/auth/social/connect", json=instagram_data, headers=headers)
        
        # Get accounts
        response = client.get("/api/auth/social/accounts", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["accounts"]) == 2
        platforms = [acc["platform"] for acc in data["accounts"]]
        assert "tiktok" in platforms
        assert "instagram" in platforms
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_disconnect_social_account_success(self, client, clear_test_data):
        """Test successful social account disconnection"""
        # Register and login user
        user_data = {
            "email": "disconnect@example.com",
            "password": "disconnectpass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "disconnect@example.com",
            "password": "disconnectpass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Connect social account
        headers = {"Authorization": f"Bearer {token}"}
        social_data = {
            "platform": "tiktok",
            "account_id": "tiktok_123",
            "account_name": "My TikTok",
            "access_token": "access_token_123"
        }
        client.post("/api/auth/social/connect", json=social_data, headers=headers)
        
        # Disconnect account
        response = client.delete("/api/auth/social/disconnect/tiktok", headers=headers)
        
        assert response.status_code == 200
        assert "Successfully disconnected tiktok account" in response.json()["message"]
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_disconnect_nonexistent_account(self, client, clear_test_data):
        """Test disconnecting a non-existent account"""
        user_data = {
            "email": "disconnect@example.com",
            "password": "disconnectpass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "disconnect@example.com",
            "password": "disconnectpass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Try to disconnect non-existent account
        headers = {"Authorization": f"Bearer {token}"}
        response = client.delete("/api/auth/social/disconnect/nonexistent", headers=headers)
        
        assert response.status_code == 404
        assert "nonexistent account not found" in response.json()["detail"]

class TestVideoUploadEndpoints:
    """Test cases for video upload endpoints"""
    
    @pytest.mark.functional
    @pytest.mark.api
    @patch('services.storage.R2Storage')
    def test_request_upload_success(self, mock_storage, client, clear_test_data):
        """Test successful upload request"""
        # Register and login user
        user_data = {
            "email": "upload@example.com",
            "password": "uploadpass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "upload@example.com",
            "password": "uploadpass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Mock storage service
        mock_storage_instance = Mock()
        mock_storage_instance.generate_unique_key.return_value = "users/user_1/20241201_143022_abc12345_test_video_original.mp4"
        mock_storage_instance.generate_upload_url.return_value = "https://test-upload-url.com"
        mock_storage.return_value = mock_storage_instance
        
        # Request upload
        upload_request = {
            "filename": "test_video.mp4",
            "file_size": 1024 * 1024,  # 1MB
            "content_type": "video/mp4"
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/upload/request", json=upload_request, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "upload_url" in data
        assert "project_id" in data
        assert "file_key" in data
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_request_upload_unauthorized(self, client):
        """Test upload request without authentication"""
        upload_request = {
            "filename": "test_video.mp4",
            "file_size": 1024 * 1024,
            "content_type": "video/mp4"
        }
        
        response = client.post("/api/upload/request", json=upload_request)
        
        assert response.status_code == 403
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_request_upload_invalid_file_type(self, client, clear_test_data):
        """Test upload request with invalid file type"""
        # Register and login user
        user_data = {
            "email": "upload@example.com",
            "password": "uploadpass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "upload@example.com",
            "password": "uploadpass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Request upload with invalid file type
        upload_request = {
            "filename": "test.txt",
            "file_size": 1024,
            "content_type": "text/plain"
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/upload/request", json=upload_request, headers=headers)
        
        assert response.status_code == 400
        assert "Only video files are allowed" in response.json()["detail"]
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_request_upload_file_too_large(self, client, clear_test_data):
        """Test upload request with file too large"""
        # Register and login user
        user_data = {
            "email": "upload@example.com",
            "password": "uploadpass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "upload@example.com",
            "password": "uploadpass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Request upload with file too large
        upload_request = {
            "filename": "large_video.mp4",
            "file_size": 600 * 1024 * 1024,  # 600MB
            "content_type": "video/mp4"
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/upload/request", json=upload_request, headers=headers)
        
        assert response.status_code == 400
        assert "File size exceeds 500MB limit" in response.json()["detail"]
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_complete_upload_success(self, client, clear_test_data):
        """Test successful upload completion"""
        # Register and login user
        user_data = {
            "email": "complete@example.com",
            "password": "completepass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "complete@example.com",
            "password": "completepass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Create a project first (simulate upload request)
        from main import projects_db
        project_id = "test_project_123"
        projects_db[project_id] = {
            "id": project_id,
            "user_id": "user_1",
            "filename": "test_video.mp4",
            "file_key": "users/user_1/test_video.mp4",
            "file_size": 1024 * 1024,
            "status": "pending_upload",
            "created_at": 1234567890,
            "transformations": {}
        }
        
        # Complete upload
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post(f"/api/upload/complete/{project_id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Upload completed successfully"
        assert data["status"] == "ready_for_processing"
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_complete_upload_unauthorized(self, client):
        """Test upload completion without authentication"""
        response = client.post("/api/upload/complete/test_project")
        
        assert response.status_code == 403
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_complete_upload_project_not_found(self, client, clear_test_data):
        """Test upload completion with non-existent project"""
        # Register and login user
        user_data = {
            "email": "complete@example.com",
            "password": "completepass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "complete@example.com",
            "password": "completepass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Try to complete non-existent project
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/upload/complete/nonexistent_project", headers=headers)
        
        assert response.status_code == 404
        assert "Project not found" in response.json()["detail"]

class TestVideoProcessingEndpoints:
    """Test cases for video processing endpoints"""
    
    @pytest.mark.functional
    @pytest.mark.api
    @patch('services.storage.R2Storage')
    @patch('services.video_processor.VideoProcessor')
    def test_transform_video_success(self, mock_processor, mock_storage, client, clear_test_data):
        """Test successful video transformation"""
        # Register and login user
        user_data = {
            "email": "transform@example.com",
            "password": "transformpass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "transform@example.com",
            "password": "transformpass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Create a project
        from main import projects_db
        project_id = "test_project_456"
        projects_db[project_id] = {
            "id": project_id,
            "user_id": "user_1",
            "filename": "test_video.mp4",
            "file_key": "users/user_1/test_video.mp4",
            "file_size": 1024 * 1024,
            "status": "ready_for_processing",
            "created_at": 1234567890,
            "transformations": {}
        }
        
        # Mock services
        mock_storage_instance = Mock()
        mock_storage_instance.get_video_url.return_value = "https://cdn.test.com/users/user_1/test_video.mp4"
        mock_storage.return_value = mock_storage_instance
        
        mock_processor_instance = Mock()
        mock_processor_instance.process_video.return_value = {
            "tiktok": {
                "url": "https://cdn.test.com/users/user_1/outputs/project_456/tiktok_video.mp4",
                "status": "completed",
                "specs": {"resolution": (1080, 1920), "fps": 30}
            }
        }
        mock_processor.return_value = mock_processor_instance
        
        # Transform video
        transform_request = {
            "platforms": ["tiktok"],
            "options": {}
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post(f"/api/projects/{project_id}/transform", json=transform_request, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "task_id" in data
        assert data["status"] == "processing"
        assert "tiktok" in data["platforms"]
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_transform_video_insufficient_credits(self, client, clear_test_data):
        """Test video transformation with insufficient credits"""
        # Register and login user
        user_data = {
            "email": "credits@example.com",
            "password": "creditspass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        # Update user credits to low amount
        from services.auth import users_db
        users_db["user_1"]["credits"] = 5  # Not enough for multiple platforms
        
        login_data = {
            "email": "credits@example.com",
            "password": "creditspass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Create a project
        from main import projects_db
        project_id = "test_project_789"
        projects_db[project_id] = {
            "id": project_id,
            "user_id": "user_1",
            "filename": "test_video.mp4",
            "file_key": "users/user_1/test_video.mp4",
            "file_size": 1024 * 1024,
            "status": "ready_for_processing",
            "created_at": 1234567890,
            "transformations": {}
        }
        
        # Try to transform for multiple platforms (requires 20 credits)
        transform_request = {
            "platforms": ["tiktok", "instagram_reels"],
            "options": {}
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post(f"/api/projects/{project_id}/transform", json=transform_request, headers=headers)
        
        assert response.status_code == 402
        assert "Insufficient credits" in response.json()["detail"]
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_get_project_status_success(self, client, clear_test_data):
        """Test getting project status"""
        # Register and login user
        user_data = {
            "email": "status@example.com",
            "password": "statuspass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "status@example.com",
            "password": "statuspass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Create a project
        from main import projects_db
        project_id = "test_project_status"
        projects_db[project_id] = {
            "id": project_id,
            "user_id": "user_1",
            "filename": "test_video.mp4",
            "file_key": "users/user_1/test_video.mp4",
            "file_size": 1024 * 1024,
            "status": "completed",
            "created_at": 1234567890,
            "transformations": {
                "tiktok": {
                    "url": "https://cdn.test.com/tiktok_video.mp4",
                    "status": "completed"
                }
            }
        }
        
        # Get project status
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get(f"/api/projects/{project_id}/status", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["project"]["status"] == "completed"
        assert "tiktok" in data["transformations"]
    
    @pytest.mark.functional
    @pytest.mark.api
    def test_get_user_projects(self, client, clear_test_data):
        """Test getting user's projects"""
        # Register and login user
        user_data = {
            "email": "projects@example.com",
            "password": "projectspass123",
            "brand": "viralsplit"
        }
        client.post("/api/auth/register", json=user_data)
        
        login_data = {
            "email": "projects@example.com",
            "password": "projectspass123"
        }
        login_response = client.post("/api/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Create projects
        from main import projects_db
        projects_db["project_1"] = {
            "id": "project_1",
            "user_id": "user_1",
            "filename": "video1.mp4",
            "status": "completed",
            "created_at": 1234567890,
            "transformations": {}
        }
        projects_db["project_2"] = {
            "id": "project_2",
            "user_id": "user_1",
            "filename": "video2.mp4",
            "status": "processing",
            "created_at": 1234567891,
            "transformations": {}
        }
        
        # Get user projects
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/projects", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["projects"]) == 2
        assert data["projects"][0]["id"] == "project_2"  # Should be sorted by creation date (newest first)
        assert data["projects"][1]["id"] == "project_1"

class TestHealthEndpoint:
    """Test cases for health check endpoint"""
    
    @pytest.mark.unit
    @pytest.mark.api
    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
