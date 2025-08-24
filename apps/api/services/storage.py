import boto3
from botocore.client import Config
import os
import uuid
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class R2Storage:
    def __init__(self):
        account_id = os.getenv('CLOUDFLARE_ACCOUNT_ID')
        access_key_id = os.getenv('CLOUDFLARE_ACCESS_KEY_ID')
        secret_access_key = os.getenv('CLOUDFLARE_SECRET_ACCESS_KEY')
        
        self.client = boto3.client(
            's3',
            endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
        self.bucket = 'viralsplit-media'
        self.cdn_domain = os.getenv('CDN_DOMAIN', 'cdn.viralsplit.io')
    
    def generate_unique_key(self, user_id: str, filename: str, file_type: str = 'original') -> str:
        """Generate unique file key with timestamp and user info"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        file_extension = os.path.splitext(filename)[1]
        
        # Clean filename for URL safety
        safe_filename = "".join(c for c in filename if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_filename = safe_filename.replace(' ', '_')[:50]  # Limit length
        
        return f"users/{user_id}/{timestamp}_{unique_id}_{safe_filename}_{file_type}{file_extension}"
    
    def generate_output_key(self, user_id: str, project_id: str, platform: str, variant: str = 'standard') -> str:
        """Generate unique output key for transformed videos"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        
        return f"users/{user_id}/outputs/{project_id}/{timestamp}_{unique_id}_{platform}_{variant}.mp4"
    
    def upload_video(self, file_path: str, key: str, content_type: str = 'video/mp4'):
        """Upload video to R2 with zero egress fees"""
        try:
            with open(file_path, 'rb') as f:
                self.client.upload_fileobj(
                    f, 
                    self.bucket, 
                    key,
                    ExtraArgs={
                        'ContentType': content_type,
                        'CacheControl': 'max-age=31536000',
                        'ACL': 'public-read'  # Make files publicly accessible via CDN
                    }
                )
            return f"https://{self.cdn_domain}/{key}"
        except Exception as e:
            print(f"Upload error: {e}")
            return None
    
    def generate_upload_url(self, key: str, expires_in: int = 3600):
        """Generate presigned URL for direct browser upload"""
        try:
            return self.client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket, 
                    'Key': key,
                    'ContentType': 'video/mp4',
                    'ACL': 'public-read'
                },
                ExpiresIn=expires_in
            )
        except Exception as e:
            print(f"Presigned URL error: {e}")
            return None
    
    def download_video(self, url: str, local_path: str):
        """Download video from R2"""
        try:
            # Extract key from URL
            if self.cdn_domain in url:
                key = url.split(f'{self.cdn_domain}/')[-1]
            else:
                key = url.split(f'{self.bucket}/')[-1]
            
            self.client.download_file(self.bucket, key, local_path)
            return True
        except Exception as e:
            print(f"Download error: {e}")
            return False
    
    def delete_video(self, key: str) -> bool:
        """Delete video from R2"""
        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except Exception as e:
            print(f"Delete error: {e}")
            return False
    
    def get_video_url(self, key: str) -> str:
        """Get public CDN URL for a video"""
        return f"https://{self.cdn_domain}/{key}"
    
    def generate_download_url(self, key: str, expires_in: int = 3600) -> Optional[str]:
        """Generate presigned download URL"""
        try:
            return self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expires_in
            )
        except Exception as e:
            print(f"Download URL generation error: {e}")
            return None