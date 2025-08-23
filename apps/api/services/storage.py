import boto3
from botocore.client import Config
import os
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
    
    def upload_video(self, file_path: str, key: str):
        """Upload video to R2 with zero egress fees"""
        try:
            with open(file_path, 'rb') as f:
                self.client.upload_fileobj(
                    f, 
                    self.bucket, 
                    key,
                    ExtraArgs={
                        'ContentType': 'video/mp4',
                        'CacheControl': 'max-age=31536000'
                    }
                )
            return f"https://cdn.viralsplit.io/{key}"
        except Exception as e:
            print(f"Upload error: {e}")
            return None
    
    def generate_upload_url(self, key: str, expires_in: int = 3600):
        """Generate presigned URL for direct browser upload"""
        try:
            return self.client.generate_presigned_url(
                'put_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expires_in
            )
        except Exception as e:
            print(f"Presigned URL error: {e}")
            return None
    
    def download_video(self, url: str, local_path: str):
        """Download video from R2"""
        try:
            # Extract key from URL
            key = url.split('cdn.viralsplit.io/')[-1]
            self.client.download_file(self.bucket, key, local_path)
            return True
        except Exception as e:
            print(f"Download error: {e}")
            return False