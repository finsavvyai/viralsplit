import openai
import replicate
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import io
import base64
import requests
from typing import List, Dict, Optional, Tuple
import json
import asyncio
import os
from datetime import datetime
import tempfile
import cv2
import numpy as np

class AIThumbnailGenerator:
    """Advanced AI-powered thumbnail generation system"""
    
    def __init__(self):
        # Initialize OpenAI client with graceful handling of missing API key
        api_key = os.getenv('OPENAI_API_KEY')
        self.openai_client = openai.Client(api_key=api_key) if api_key else None
        self.replicate_client = replicate.Client(api_token=os.getenv('REPLICATE_API_TOKEN'))
        
        # Thumbnail optimization parameters
        self.platform_specs = {
            'youtube_shorts': {'size': (1080, 1920), 'format': 'WEBP', 'quality': 85},
            'tiktok': {'size': (1080, 1920), 'format': 'JPEG', 'quality': 90},
            'instagram_reels': {'size': (1080, 1920), 'format': 'JPEG', 'quality': 88},
            'instagram_feed': {'size': (1080, 1080), 'format': 'JPEG', 'quality': 90},
            'twitter': {'size': (1200, 675), 'format': 'JPEG', 'quality': 85},
            'linkedin': {'size': (1200, 675), 'format': 'JPEG', 'quality': 90}
        }
        
        # Viral thumbnail patterns
        self.viral_patterns = {
            'reaction_face': {
                'description': 'Exaggerated facial expression',
                'elements': ['shocked_face', 'bright_colors', 'arrow_pointing'],
                'psychology': 'curiosity_gap'
            },
            'before_after': {
                'description': 'Split screen transformation',
                'elements': ['split_layout', 'contrast', 'progress_indicator'],
                'psychology': 'transformation_desire'
            },
            'number_reveal': {
                'description': 'Big number with context',
                'elements': ['large_text', 'money_symbols', 'time_urgency'],
                'psychology': 'quantified_benefit'
            },
            'behind_scenes': {
                'description': 'Exclusive access feel',
                'elements': ['candid_moment', 'authentic_lighting', 'insider_text'],
                'psychology': 'exclusivity_fomo'
            },
            'challenge_preview': {
                'description': 'Action about to happen',
                'elements': ['motion_blur', 'anticipation_pose', 'countdown'],
                'psychology': 'anticipation_dopamine'
            }
        }
        
        # Color psychology for viral content
        self.color_schemes = {
            'high_energy': ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726'],
            'luxury': ['#8E24AA', '#5E35B1', '#3949AB', '#1E88E5'],
            'trustworthy': ['#2E7D32', '#388E3C', '#43A047', '#4CAF50'],
            'urgent': ['#D32F2F', '#F57C00', '#FF5722', '#E64A19'],
            'calming': ['#00ACC1', '#26C6DA', '#4DD0E1', '#80DEEA']
        }
    
    async def generate_viral_thumbnails(self, video_metadata: Dict, platforms: List[str], 
                                      style_preferences: Dict = None) -> Dict:
        """Generate viral thumbnails for multiple platforms"""
        try:
            thumbnails = {}
            
            # Analyze video content for thumbnail optimization
            content_analysis = await self._analyze_video_content(video_metadata)
            
            # Generate thumbnails for each platform
            for platform in platforms:
                if platform not in self.platform_specs:
                    continue
                
                platform_thumbnails = await self._generate_platform_thumbnails(
                    video_metadata, platform, content_analysis, style_preferences
                )
                thumbnails[platform] = platform_thumbnails
            
            return {
                'thumbnails': thumbnails,
                'content_analysis': content_analysis,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Thumbnail generation error: {e}")
            return self._mock_thumbnail_generation(platforms)
    
    async def _analyze_video_content(self, video_metadata: Dict) -> Dict:
        """AI analysis of video content for thumbnail optimization"""
        try:
            if not self.openai_client or not self.openai_client.api_key:
                return self._mock_content_analysis()
            
            title = video_metadata.get('title', '')
            description = video_metadata.get('description', '')
            duration = video_metadata.get('duration', 30)
            
            prompt = f"""
            Analyze this video content for optimal thumbnail generation:
            
            Title: {title}
            Description: {description}
            Duration: {duration} seconds
            
            Provide analysis for:
            1. Main emotion/mood of content
            2. Target audience demographic  
            3. Key visual elements that would grab attention
            4. Optimal thumbnail style (reaction, before/after, number, etc.)
            5. Color psychology recommendations
            6. Text overlay suggestions
            7. Viral potential hooks for thumbnail
            
            Return as JSON with detailed recommendations.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a viral thumbnail optimization expert. Analyze content for maximum click-through rates."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=600,
                temperature=0.6
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"Content analysis error: {e}")
            return self._mock_content_analysis()
    
    async def _generate_platform_thumbnails(self, video_metadata: Dict, platform: str, 
                                          content_analysis: Dict, style_preferences: Dict = None) -> List[Dict]:
        """Generate multiple thumbnail variations for a platform"""
        thumbnails = []
        spec = self.platform_specs[platform]
        
        # Generate 3 different styles
        styles_to_generate = ['reaction_face', 'number_reveal', 'behind_scenes']
        
        for style in styles_to_generate:
            try:
                thumbnail = await self._create_thumbnail_variation(
                    video_metadata, platform, style, content_analysis, spec
                )
                thumbnails.append(thumbnail)
            except Exception as e:
                print(f"Error generating {style} thumbnail: {e}")
        
        return thumbnails
    
    async def _create_thumbnail_variation(self, video_metadata: Dict, platform: str, 
                                        style: str, content_analysis: Dict, spec: Dict) -> Dict:
        """Create a specific thumbnail variation"""
        try:
            # For now, generate with AI image generation
            if self.replicate_client and os.getenv('REPLICATE_API_TOKEN'):
                return await self._generate_ai_thumbnail(video_metadata, platform, style, content_analysis, spec)
            else:
                return await self._generate_template_thumbnail(video_metadata, platform, style, content_analysis, spec)
                
        except Exception as e:
            print(f"Thumbnail creation error: {e}")
            return self._mock_thumbnail_data(platform, style)
    
    async def _generate_ai_thumbnail(self, video_metadata: Dict, platform: str, 
                                   style: str, content_analysis: Dict, spec: Dict) -> Dict:
        """Generate thumbnail using AI image generation"""
        try:
            title = video_metadata.get('title', 'Viral Video')
            mood = content_analysis.get('main_emotion', 'excited')
            
            # Create detailed prompt for AI image generation
            prompt = self._create_ai_image_prompt(title, style, mood, platform)
            
            # Generate image using Replicate (SDXL or similar)
            output = self.replicate_client.run(
                "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                input={
                    "prompt": prompt,
                    "width": spec['size'][0],
                    "height": spec['size'][1],
                    "num_outputs": 1,
                    "guidance_scale": 7.5,
                    "scheduler": "DPMSolverMultistep"
                }
            )
            
            # Process the generated image
            image_url = output[0] if output else None
            
            return {
                'style': style,
                'image_url': image_url,
                'platform': platform,
                'specs': spec,
                'prompt_used': prompt,
                'generation_method': 'ai_generated',
                'estimated_ctr': self._estimate_ctr(style, mood),
                'optimization_score': self._calculate_optimization_score(style, content_analysis)
            }
            
        except Exception as e:
            print(f"AI thumbnail generation error: {e}")
            return self._mock_thumbnail_data(platform, style)
    
    def _create_ai_image_prompt(self, title: str, style: str, mood: str, platform: str) -> str:
        """Create optimized prompt for AI image generation"""
        base_prompt = f"High-quality viral thumbnail for '{title}', {mood} mood"
        
        style_prompts = {
            'reaction_face': "shocked facial expression, bright colors, dynamic composition, YouTube thumbnail style",
            'number_reveal': "large bold numbers, money symbols, urgent text, high contrast design",
            'behind_scenes': "candid moment, authentic lighting, exclusive access feel, documentary style",
            'before_after': "split screen design, transformation comparison, progress indicator",
            'challenge_preview': "action scene, motion blur, anticipation, countdown elements"
        }
        
        platform_styles = {
            'youtube_shorts': "vertical format, mobile-optimized, bold text",
            'tiktok': "trendy aesthetics, Gen Z appeal, colorful design", 
            'instagram_reels': "aesthetic composition, Instagram-style filters",
            'instagram_feed': "square format, grid-optimized, cohesive branding"
        }
        
        return f"{base_prompt}, {style_prompts.get(style, '')}, {platform_styles.get(platform, '')}, professional quality, 4K resolution"
    
    async def _generate_template_thumbnail(self, video_metadata: Dict, platform: str, 
                                         style: str, content_analysis: Dict, spec: Dict) -> Dict:
        """Generate thumbnail using templates and overlays"""
        # Create thumbnail using PIL
        width, height = spec['size']
        
        # Create base image
        img = Image.new('RGB', (width, height), color='#1a1a1a')
        draw = ImageDraw.Draw(img)
        
        # Apply style-specific modifications
        if style == 'reaction_face':
            img = self._apply_reaction_style(img, video_metadata)
        elif style == 'number_reveal':
            img = self._apply_number_style(img, video_metadata)
        elif style == 'behind_scenes':
            img = self._apply_behind_scenes_style(img, video_metadata)
        
        # Add text overlays
        img = self._add_text_overlays(img, video_metadata, style)
        
        # Optimize for platform
        img = self._optimize_for_platform(img, platform, spec)
        
        # Save to temporary file and get URL
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
        img.save(temp_file.name, quality=spec['quality'])
        
        return {
            'style': style,
            'image_path': temp_file.name,
            'platform': platform,
            'specs': spec,
            'generation_method': 'template_based',
            'estimated_ctr': self._estimate_ctr(style, content_analysis.get('main_emotion', 'neutral')),
            'optimization_score': self._calculate_optimization_score(style, content_analysis)
        }
    
    def _apply_reaction_style(self, img: Image.Image, video_metadata: Dict) -> Image.Image:
        """Apply reaction face thumbnail style"""
        # Add bright gradient background
        overlay = Image.new('RGBA', img.size, (255, 107, 107, 128))  # Red overlay
        img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
        
        # Add shock elements (arrows, exclamation marks)
        draw = ImageDraw.Draw(img)
        
        # Arrow pointing
        arrow_points = [(img.width - 200, img.height // 2 - 50), 
                       (img.width - 100, img.height // 2),
                       (img.width - 200, img.height // 2 + 50)]
        draw.polygon(arrow_points, fill='#FFD700')
        
        return img
    
    def _apply_number_style(self, img: Image.Image, video_metadata: Dict) -> Image.Image:
        """Apply number reveal thumbnail style"""
        # Create money/number focused design
        draw = ImageDraw.Draw(img)
        
        # Large number overlay
        try:
            # Try to load a bold font
            font_size = img.height // 4
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
        
        # Draw large number
        text = "$10K"  # Example number
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (img.width - text_width) // 2
        y = (img.height - text_height) // 2
        
        # Shadow effect
        draw.text((x+5, y+5), text, font=font, fill='#000000')
        draw.text((x, y), text, font=font, fill='#00FF00')  # Green money color
        
        return img
    
    def _apply_behind_scenes_style(self, img: Image.Image, video_metadata: Dict) -> Image.Image:
        """Apply behind-the-scenes thumbnail style"""
        # Create authentic, candid feel
        # Add film grain effect
        noise = np.random.normal(0, 25, (img.height, img.width, 3)).astype(np.uint8)
        img_array = np.array(img)
        noisy_img = np.clip(img_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        return Image.fromarray(noisy_img)
    
    def _add_text_overlays(self, img: Image.Image, video_metadata: Dict, style: str) -> Image.Image:
        """Add text overlays optimized for viral appeal"""
        draw = ImageDraw.Draw(img)
        title = video_metadata.get('title', 'Amazing Video')
        
        # Truncate title for thumbnail
        if len(title) > 30:
            title = title[:27] + "..."
        
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial Bold.ttf", 48)
        except:
            font = ImageFont.load_default()
        
        # Position text at bottom
        bbox = draw.textbbox((0, 0), title, font=font)
        text_width = bbox[2] - bbox[0]
        
        x = (img.width - text_width) // 2
        y = img.height - 150
        
        # Add background for text readability
        text_bg = Image.new('RGBA', (text_width + 20, 60), (0, 0, 0, 128))
        img.paste(text_bg, (x-10, y-10), text_bg)
        
        # Draw text
        draw.text((x, y), title, font=font, fill='#FFFFFF')
        
        return img
    
    def _optimize_for_platform(self, img: Image.Image, platform: str, spec: Dict) -> Image.Image:
        """Apply platform-specific optimizations"""
        # Resize to exact platform specs
        img = img.resize(spec['size'], Image.Resampling.LANCZOS)
        
        # Platform-specific adjustments
        if platform == 'tiktok':
            # Increase saturation for TikTok
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(1.2)
        
        elif platform == 'instagram_reels':
            # Apply Instagram-style filter
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.1)
        
        return img
    
    def _estimate_ctr(self, style: str, mood: str) -> float:
        """Estimate click-through rate based on style and mood"""
        base_ctr = {
            'reaction_face': 0.12,
            'number_reveal': 0.15,
            'behind_scenes': 0.08,
            'before_after': 0.11,
            'challenge_preview': 0.14
        }
        
        mood_multiplier = {
            'excited': 1.2,
            'surprised': 1.3,
            'curious': 1.1,
            'happy': 1.0,
            'serious': 0.9
        }
        
        return base_ctr.get(style, 0.1) * mood_multiplier.get(mood, 1.0)
    
    def _calculate_optimization_score(self, style: str, content_analysis: Dict) -> float:
        """Calculate thumbnail optimization score"""
        base_score = 0.7
        
        # Bonus for style-content alignment
        recommended_style = content_analysis.get('optimal_thumbnail_style', '')
        if style.lower() in recommended_style.lower():
            base_score += 0.2
        
        # Bonus for high viral potential
        viral_hooks = len(content_analysis.get('viral_potential_hooks', []))
        base_score += min(viral_hooks * 0.05, 0.1)
        
        return min(base_score, 1.0)
    
    # Mock functions for testing
    def _mock_content_analysis(self) -> Dict:
        return {
            'main_emotion': 'excited',
            'target_audience': 'millennials',
            'key_visual_elements': ['person', 'product', 'results'],
            'optimal_thumbnail_style': 'reaction_face',
            'color_recommendations': ['high_energy'],
            'text_overlay_suggestions': ['You won\'t believe this!', 'This changed everything'],
            'viral_potential_hooks': ['shocking result', 'before/after', 'exclusive reveal']
        }
    
    def _mock_thumbnail_generation(self, platforms: List[str]) -> Dict:
        thumbnails = {}
        for platform in platforms:
            thumbnails[platform] = [
                self._mock_thumbnail_data(platform, 'reaction_face'),
                self._mock_thumbnail_data(platform, 'number_reveal'),
                self._mock_thumbnail_data(platform, 'behind_scenes')
            ]
        
        return {
            'thumbnails': thumbnails,
            'content_analysis': self._mock_content_analysis(),
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _mock_thumbnail_data(self, platform: str, style: str) -> Dict:
        return {
            'style': style,
            'image_url': f'https://cdn.viralsplit.io/thumbnails/{platform}_{style}_sample.jpg',
            'platform': platform,
            'specs': self.platform_specs[platform],
            'generation_method': 'mock',
            'estimated_ctr': self._estimate_ctr(style, 'excited'),
            'optimization_score': 0.85
        }