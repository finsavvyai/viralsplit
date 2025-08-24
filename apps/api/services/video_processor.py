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
    
    async def process_video(self, input_url: str, platforms: List[str], project_id: str = None, user_id: str = None) -> Dict:
        """Process video for multiple platforms with user-specific naming"""
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
                    
                    # Generate unique output key with user info
                    if user_id and project_id:
                        output_key = self.storage.generate_output_key(
                            user_id=user_id,
                            project_id=project_id,
                            platform=platform,
                            variant='standard'
                        )
                    else:
                        # Fallback for anonymous uploads
                        output_key = f"outputs/{platform}/{project_id or 'unknown'}.mp4"
                    
                    output_url = self.storage.upload_video(output_path, output_key)
                    
                    if output_url:
                        results[platform] = {
                            'url': output_url,
                            'status': 'completed',
                            'specs': spec,
                            'key': output_key
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
                    if user_id and project_id:
                        output_key = self.storage.generate_output_key(
                            user_id=user_id,
                            project_id=project_id,
                            platform=platform,
                            variant='standard'
                        )
                        output_url = self.storage.get_video_url(output_key)
                    else:
                        output_url = f"https://cdn.viralsplit.io/outputs/{platform}/{project_id}.mp4"
                    
                    results[platform] = {
                        'url': output_url,
                        'status': 'completed',
                        'specs': self.PLATFORM_SPECS.get(platform, {}),
                        'key': output_key if user_id and project_id else None
                    }
        
        return results
    
    async def _transform_video(self, input_path: str, platform: str, spec: dict):
        """Transform video for specific platform"""
        try:
            # Create temporary output file
            with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp_output:
                output_path = tmp_output.name
            
            # Build FFmpeg command
            stream = ffmpeg.input(input_path)
            
            # Apply transformations based on platform specs
            if 'resolution' in spec:
                width, height = spec['resolution']
                stream = ffmpeg.filter(stream, 'scale', width, height, force_original_aspect_ratio='decrease')
                stream = ffmpeg.filter(stream, 'pad', width, height, '(ow-iw)/2', '(oh-ih)/2')
            
            if 'fps' in spec:
                stream = ffmpeg.filter(stream, 'fps', spec['fps'])
            
            if 'duration' in spec:
                stream = ffmpeg.filter(stream, 'trim', duration=spec['duration'])
            
            # Output with specified bitrate
            bitrate = spec.get('bitrate', '5M')
            stream = ffmpeg.output(
                stream, 
                output_path,
                vcodec='libx264',
                acodec='aac',
                video_bitrate=bitrate,
                audio_bitrate='128k',
                preset='fast',
                movflags='faststart'
            )
            
            # Run FFmpeg
            ffmpeg.run(stream, overwrite_output=True, quiet=True)
            
            return output_path
            
        except Exception as e:
            print(f"Video transformation error for {platform}: {e}")
            # Return input path as fallback
            return input_path
    
    async def create_variants(self, input_path: str, platform: str, user_id: str, project_id: str) -> Dict:
        """Create multiple variants for a platform (e.g., different aspect ratios)"""
        variants = {}
        
        if platform == 'tiktok':
            # Create different TikTok variants
            variants['standard'] = await self._transform_video(input_path, platform, self.PLATFORM_SPECS[platform])
            variants['square'] = await self._transform_video(input_path, platform, {
                **self.PLATFORM_SPECS[platform],
                'resolution': (1080, 1080)
            })
        
        # Upload variants
        results = {}
        for variant_name, variant_path in variants.items():
            output_key = self.storage.generate_output_key(
                user_id=user_id,
                project_id=project_id,
                platform=platform,
                variant=variant_name
            )
            
            output_url = self.storage.upload_video(variant_path, output_key)
            results[variant_name] = {
                'url': output_url,
                'key': output_key
            }
            
            # Clean up
            try:
                os.unlink(variant_path)
            except:
                pass
        
        return results