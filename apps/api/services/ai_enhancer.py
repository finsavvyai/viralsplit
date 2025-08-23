import openai
import replicate
from typing import List, Dict
import os
import json
from dotenv import load_dotenv

load_dotenv()

class AIEnhancer:
    """AI-powered video enhancements"""
    
    def __init__(self):
        self.openai_client = openai.Client(api_key=os.getenv('OPENAI_API_KEY'))
        self.replicate_client = replicate.Client(api_token=os.getenv('REPLICATE_API_TOKEN'))
    
    async def generate_captions(self, audio_path: str) -> str:
        """Generate captions using Whisper"""
        try:
            with open(audio_path, "rb") as audio_file:
                response = self.openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="srt"
                )
            return response.text
        except Exception as e:
            print(f"Caption generation error: {e}")
            return ""
    
    async def generate_hooks(self, transcript: str, num_hooks: int = 3) -> List[str]:
        """Generate multiple hook variations"""
        prompt = f"""
        Based on this video transcript, create {num_hooks} different 
        attention-grabbing hooks (first 3 seconds) that would work on TikTok.
        
        Transcript: {transcript[:500]}
        
        Return as JSON array of hooks.
        """
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            result = json.loads(response.choices[0].message.content)
            return result.get('hooks', [])
        except Exception as e:
            print(f"Hook generation error: {e}")
            return []
    
    async def match_trending_audio(self, video_metadata: dict) -> dict:
        """Match video with trending audio"""
        # In production: Query TikTok API for trending sounds
        # For MVP: Use predefined trending sound library
        
        trending_sounds = [
            {"id": "sound1", "name": "Trending Beat 1", "url": "..."},
            {"id": "sound2", "name": "Viral Sound 2", "url": "..."}
        ]
        
        # Simple matching logic (enhance with AI later)
        return trending_sounds[0]
    
    async def generate_thumbnail(self, video_path: str) -> List[str]:
        """Generate thumbnail variations"""
        try:
            # Extract key frames first (simplified)
            frames = await self._extract_key_frames(video_path)
            
            # For MVP, return placeholder thumbnails
            thumbnails = [
                "https://cdn.viralsplit.io/thumbnails/thumb1.jpg",
                "https://cdn.viralsplit.io/thumbnails/thumb2.jpg",
                "https://cdn.viralsplit.io/thumbnails/thumb3.jpg"
            ]
            
            return thumbnails
        except Exception as e:
            print(f"Thumbnail generation error: {e}")
            return []
    
    async def _extract_key_frames(self, video_path: str) -> List[str]:
        """Extract key frames from video"""
        # TODO: Implement frame extraction using OpenCV or ffmpeg
        return ["frame1.jpg", "frame2.jpg", "frame3.jpg"]