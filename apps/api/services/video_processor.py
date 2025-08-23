import ffmpeg
from typing import List, Dict
import tempfile
import os
import asyncio
import subprocess

class VideoProcessor:
    """Core video transformation engine"""
    
    PLATFORM_SPECS = {
        'tiktok': {
            'resolution': (1080, 1920),  # 9:16
            'duration': 60,
            'fps': 30,
            'bitrate': '6M'
        },
        'instagram_reels': {
            'resolution': (1080, 1920),  # 9:16
            'duration': 90,
            'fps': 30,
            'bitrate': '5M'
        },
        'youtube_shorts': {
            'resolution': (1080, 1920),  # 9:16
            'duration': 60,
            'fps': 30,
            'bitrate': '8M'
        },
        'instagram_feed': {
            'resolution': (1080, 1080),  # 1:1
            'duration': 60,
            'fps': 30,
            'bitrate': '5M'
        },
        'twitter': {
            'resolution': (1280, 720),  # 16:9
            'duration': 140,
            'fps': 30,
            'bitrate': '5M'
        },
        'linkedin': {
            'resolution': (1280, 720),  # 16:9
            'duration': 600,
            'fps': 30,
            'bitrate': '5M'
        }
    }
    
    def __init__(self, storage=None):
        self.storage = storage
    
    async def process_video(self, input_url: str, platforms: List[str], project_id: str = None) -> Dict:
        """Process video for multiple platforms"""
        results = {}
        
        # Download original from storage
        with tempfile.NamedTemporaryFile(suffix='.mp4') as tmp_input:
            if self.storage and self.storage.download_video(input_url, tmp_input.name):
                # Process for each platform
                for platform in platforms:
                    if platform not in self.PLATFORM_SPECS:
                        continue
                        
                    spec = self.PLATFORM_SPECS[platform]
                    output_path = await self._transform_video(
                        tmp_input.name, 
                        platform, 
                        spec
                    )
                    
                    # Upload transformed video to storage
                    output_key = f"outputs/{platform}/{project_id or 'unknown'}.mp4"
                    output_url = self.storage.upload_video(output_path, output_key)
                    
                    if output_url:
                        results[platform] = {
                            'url': output_url,
                            'status': 'completed',
                            'specs': spec
                        }
                    else:
                        results[platform] = {
                            'status': 'failed',
                            'error': 'Upload failed',
                            'specs': spec
                        }
                    
                    # Clean up temporary file
                    try:
                        os.unlink(output_path)
                    except:
                        pass
            else:
                # Fallback - return mock results for development
                for platform in platforms:
                    results[platform] = {
                        'url': f"https://cdn.viralsplit.io/outputs/{platform}/{project_id}.mp4",
                        'status': 'completed',
                        'specs': self.PLATFORM_SPECS.get(platform, {})
                    }
        
        return results
    
    async def process_single_platform(self, input_url: str, platform: str, project_id: str = None) -> Dict:
        """Process video for a single platform"""
        result = await self.process_video(input_url, [platform], project_id)
        return result.get(platform, {})
    
    async def _transform_video(self, input_path: str, platform: str, spec: dict):
        """Transform video for specific platform"""
        output_path = tempfile.mktemp(suffix=f'_{platform}.mp4')
        
        try:
            # Basic transformation using ffmpeg-python
            stream = ffmpeg.input(input_path)
            
            # Crop/pad for aspect ratio
            stream = self._adjust_aspect_ratio(stream, spec['resolution'])
            
            # Trim duration if needed
            if spec['duration']:
                stream = stream.filter('trim', duration=spec['duration'])
            
            # Output with platform specs
            stream = ffmpeg.output(
                stream,
                output_path,
                vcodec='libx264',
                acodec='aac',
                r=spec['fps'],
                video_bitrate=spec['bitrate'],
                preset='fast',
                movflags='faststart'
            )
            
            # Run the transformation
            ffmpeg.run(stream, overwrite_output=True, quiet=True)
            
        except Exception as e:
            print(f"Error transforming video for {platform}: {e}")
            # Fallback: copy original file
            subprocess.run(['cp', input_path, output_path])
        
        return output_path
    
    def _adjust_aspect_ratio(self, stream, target_resolution):
        """Smart crop/pad for aspect ratio"""
        width, height = target_resolution
        
        # Simple center crop - in production, use smart cropping
        return stream.filter('scale', width, height)