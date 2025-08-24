import pytest
import os
import tempfile
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

from services.storage import R2Storage

class TestR2Storage:
    """Test cases for R2 storage service"""
    
    @pytest.fixture
    def mock_boto3_client(self):
        """Mock boto3 client"""
        with patch('boto3.client') as mock_client:
            mock_instance = Mock()
            mock_client.return_value = mock_instance
            yield mock_instance
    
    @pytest.fixture
    def storage_service(self, mock_boto3_client):
        """Create storage service with mocked dependencies"""
        with patch.dict(os.environ, {
            'CLOUDFLARE_ACCOUNT_ID': 'test_account_id',
            'CLOUDFLARE_ACCESS_KEY_ID': 'test_access_key',
            'CLOUDFLARE_SECRET_ACCESS_KEY': 'test_secret_key',
            'CDN_DOMAIN': 'cdn.test.com'
        }):
            return R2Storage()
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_init_with_env_vars(self, mock_boto3_client):
        """Test storage service initialization with environment variables"""
        with patch.dict(os.environ, {
            'CLOUDFLARE_ACCOUNT_ID': 'test_account_id',
            'CLOUDFLARE_ACCESS_KEY_ID': 'test_access_key',
            'CLOUDFLARE_SECRET_ACCESS_KEY': 'test_secret_key',
            'CDN_DOMAIN': 'cdn.test.com'
        }):
            storage = R2Storage()
            
            assert storage.bucket == 'viralsplit-media'
            assert storage.cdn_domain == 'cdn.test.com'
            # Verify storage service was created successfully
            assert storage.client is not None
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_init_with_default_cdn(self, mock_boto3_client):
        """Test storage service initialization with default CDN domain"""
        with patch.dict(os.environ, {
            'CLOUDFLARE_ACCOUNT_ID': 'test_account_id',
            'CLOUDFLARE_ACCESS_KEY_ID': 'test_access_key',
            'CLOUDFLARE_SECRET_ACCESS_KEY': 'test_secret_key'
        }):
            storage = R2Storage()
            
            assert storage.cdn_domain == 'cdn.viralsplit.io'
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_generate_unique_key(self, storage_service):
        """Test unique key generation"""
        user_id = "user_123"
        filename = "my_video.mp4"
        file_type = "original"
        
        key = storage_service.generate_unique_key(user_id, filename, file_type)
        
        # Check structure
        assert key.startswith(f"users/{user_id}/")
        assert key.endswith("_original.mp4")
        assert "2024" in key or "2025" in key  # Should contain current year
        assert len(key.split('_')) >= 4  # timestamp_uniqueid_filename_type.ext
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_generate_unique_key_safe_filename(self, storage_service):
        """Test unique key generation with unsafe characters"""
        user_id = "user_123"
        filename = "my video (with spaces & symbols).mp4"
        file_type = "original"
        
        key = storage_service.generate_unique_key(user_id, filename, file_type)
        
        # Should not contain unsafe characters
        assert " " not in key
        assert "(" not in key
        assert ")" not in key
        assert "&" not in key
        assert key.endswith("_original.mp4")
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_generate_unique_key_long_filename(self, storage_service):
        """Test unique key generation with very long filename"""
        user_id = "user_123"
        filename = "a" * 100 + ".mp4"  # Very long filename
        file_type = "original"
        
        key = storage_service.generate_unique_key(user_id, filename, file_type)
        
        # Should truncate long filenames
        assert len(key) < 200  # Reasonable length
        assert key.endswith("_original.mp4")
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_generate_output_key(self, storage_service):
        """Test output key generation for transformed videos"""
        user_id = "user_123"
        project_id = "project_456"
        platform = "tiktok"
        variant = "standard"
        
        key = storage_service.generate_output_key(user_id, project_id, platform, variant)
        
        # Check structure
        assert key.startswith(f"users/{user_id}/outputs/{project_id}/")
        assert key.endswith("_tiktok_standard.mp4")
        assert "2024" in key or "2025" in key  # Should contain current year
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_generate_output_key_custom_variant(self, storage_service):
        """Test output key generation with custom variant"""
        user_id = "user_123"
        project_id = "project_456"
        platform = "instagram_reels"
        variant = "square"
        
        key = storage_service.generate_output_key(user_id, project_id, platform, variant)
        
        assert key.endswith("_instagram_reels_square.mp4")
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_upload_video_success(self, storage_service, temp_video_file):
        """Test successful video upload"""
        key = "test/video.mp4"
        
        # Mock the upload_fileobj method
        storage_service.client.upload_fileobj = Mock()
        
        result = storage_service.upload_video(temp_video_file, key)
        
        assert result == f"https://{storage_service.cdn_domain}/{key}"
        storage_service.client.upload_fileobj.assert_called_once()
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_upload_video_failure(self, storage_service):
        """Test video upload failure"""
        key = "test/video.mp4"
        non_existent_file = "/path/to/nonexistent/video.mp4"
        
        result = storage_service.upload_video(non_existent_file, key)
        
        assert result is None
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_generate_upload_url_success(self, storage_service):
        """Test successful presigned URL generation"""
        key = "test/video.mp4"
        expected_url = "https://test-presigned-url.com"
        
        storage_service.client.generate_presigned_url = Mock(return_value=expected_url)
        
        result = storage_service.generate_upload_url(key)
        
        assert result == expected_url
        storage_service.client.generate_presigned_url.assert_called_once()
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_generate_upload_url_failure(self, storage_service):
        """Test presigned URL generation failure"""
        key = "test/video.mp4"
        
        storage_service.client.generate_presigned_url = Mock(side_effect=Exception("Error"))
        
        result = storage_service.generate_upload_url(key)
        
        assert result is None
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_get_video_url(self, storage_service):
        """Test CDN URL generation"""
        key = "users/123/video.mp4"
        
        result = storage_service.get_video_url(key)
        
        assert result == f"https://{storage_service.cdn_domain}/{key}"
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_get_video_url_different_domain(self, storage_service):
        """Test CDN URL generation with different domain"""
        storage_service.cdn_domain = "cdn.custom.com"
        key = "users/123/video.mp4"
        
        result = storage_service.get_video_url(key)
        
        assert result == "https://cdn.custom.com/users/123/video.mp4"
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_download_video_success(self, storage_service, temp_video_file):
        """Test successful video download"""
        url = f"https://{storage_service.cdn_domain}/users/123/video.mp4"
        
        # Mock the download_file method
        storage_service.client.download_file = Mock()
        
        result = storage_service.download_video(url, temp_video_file)
        
        assert result is True
        storage_service.client.download_file.assert_called_once()
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_download_video_different_domain(self, storage_service, temp_video_file):
        """Test video download from different domain"""
        url = "https://cdn.custom.com/users/123/video.mp4"
        
        # Mock the download_file method
        storage_service.client.download_file = Mock()
        
        result = storage_service.download_video(url, temp_video_file)
        
        assert result is True
        # Should extract key correctly even with different domain
        storage_service.client.download_file.assert_called_once()
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_download_video_failure(self, storage_service):
        """Test video download failure"""
        url = "https://cdn.test.com/users/123/video.mp4"
        local_path = "/path/to/local/video.mp4"
        
        storage_service.client.download_file = Mock(side_effect=Exception("Download error"))
        
        result = storage_service.download_video(url, local_path)
        
        assert result is False
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_delete_video_success(self, storage_service):
        """Test successful video deletion"""
        key = "users/123/video.mp4"
        
        storage_service.client.delete_object = Mock()
        
        result = storage_service.delete_video(key)
        
        assert result is True
        storage_service.client.delete_object.assert_called_once_with(
            Bucket=storage_service.bucket, Key=key
        )
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_delete_video_failure(self, storage_service):
        """Test video deletion failure"""
        key = "users/123/video.mp4"
        
        storage_service.client.delete_object = Mock(side_effect=Exception("Delete error"))
        
        result = storage_service.delete_video(key)
        
        assert result is False
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_generate_download_url_success(self, storage_service):
        """Test successful download URL generation"""
        key = "users/123/video.mp4"
        expected_url = "https://test-download-url.com"
        
        storage_service.client.generate_presigned_url = Mock(return_value=expected_url)
        
        result = storage_service.generate_download_url(key)
        
        assert result == expected_url
        storage_service.client.generate_presigned_url.assert_called_once()
    
    @pytest.mark.unit
    @pytest.mark.storage
    def test_generate_download_url_failure(self, storage_service):
        """Test download URL generation failure"""
        key = "users/123/video.mp4"
        
        storage_service.client.generate_presigned_url = Mock(side_effect=Exception("Error"))
        
        result = storage_service.generate_download_url(key)
        
        assert result is None


class TestStorageIntegration:
    """Integration tests for storage service"""
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_full_upload_workflow(self, storage_service, temp_video_file):
        """Test complete upload workflow"""
        user_id = "user_123"
        filename = "test_video.mp4"
        
        # Generate unique key
        key = storage_service.generate_unique_key(user_id, filename, "original")
        
        # Mock upload
        storage_service.client.upload_fileobj = Mock()
        
        # Upload video
        result = storage_service.upload_video(temp_video_file, key)
        
        assert result is not None
        assert result.startswith(f"https://{storage_service.cdn_domain}/")
        assert key in result
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_file_naming_convention(self, storage_service):
        """Test file naming convention consistency"""
        user_id = "user_123"
        filename = "test_video.mp4"
        
        # Generate multiple keys
        keys = []
        for i in range(10):
            key = storage_service.generate_unique_key(user_id, filename, "original")
            keys.append(key)
        
        # All keys should follow the same pattern
        for key in keys:
            parts = key.split('_')
            assert len(parts) >= 4  # timestamp_uniqueid_filename_type.ext
            assert parts[0].startswith("users/")
            assert parts[-1] == "original.mp4"
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_output_key_generation_consistency(self, storage_service):
        """Test output key generation consistency"""
        user_id = "user_123"
        project_id = "project_456"
        platform = "tiktok"
        
        # Generate multiple output keys
        keys = []
        for i in range(5):
            key = storage_service.generate_output_key(user_id, project_id, platform, "standard")
            keys.append(key)
        
        # All keys should follow the same pattern
        for key in keys:
            assert key.startswith(f"users/{user_id}/outputs/{project_id}/")
            assert key.endswith("_tiktok_standard.mp4")
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_cdn_url_generation(self, storage_service):
        """Test CDN URL generation for different file types"""
        test_cases = [
            ("users/123/video.mp4", "video"),
            ("users/123/thumbnail.jpg", "image"),
            ("users/123/audio.mp3", "audio")
        ]
        
        for key, file_type in test_cases:
            url = storage_service.get_video_url(key)
            assert url.startswith(f"https://{storage_service.cdn_domain}/")
            assert key in url
    
    @pytest.mark.integration
    @pytest.mark.storage
    def test_error_handling_consistency(self, storage_service):
        """Test consistent error handling across methods"""
        # Test upload with invalid file
        upload_result = storage_service.upload_video("/invalid/path", "test.mp4")
        assert upload_result is None
        
        # Test presigned URL generation with error
        storage_service.client.generate_presigned_url = Mock(side_effect=Exception("Error"))
        url_result = storage_service.generate_upload_url("test.mp4")
        assert url_result is None
        
        # Test download with error
        storage_service.client.download_file = Mock(side_effect=Exception("Error"))
        download_result = storage_service.download_video("https://test.com/video.mp4", "/tmp/test.mp4")
        assert download_result is False
        
        # Test delete with error
        storage_service.client.delete_object = Mock(side_effect=Exception("Error"))
        delete_result = storage_service.delete_video("test.mp4")
        assert delete_result is False
