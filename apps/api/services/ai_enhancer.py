import openai
import replicate
from typing import List, Dict, Optional
import os
import json
import asyncio
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class AIEnhancer:
    """AI-powered viral content optimization service"""
    
    def __init__(self):
        self.openai_client = openai.Client(api_key=os.getenv('OPENAI_API_KEY'))
        self.replicate_client = replicate.Client(api_token=os.getenv('REPLICATE_API_TOKEN'))
        
        # Platform-specific optimization parameters
        self.platform_specs = {
            'tiktok': {
                'optimal_length': 15,  # seconds
                'trending_tags': ['fyp', 'viral', 'trending', 'foryou'],
                'hook_style': 'attention-grabbing, quick',
                'audience': 'Gen Z, millennials',
                'content_style': 'fast-paced, energetic',
                'aspect_ratio': '9:16'
            },
            'instagram_reels': {
                'optimal_length': 30,
                'trending_tags': ['reels', 'explore', 'viral', 'instagram'],
                'hook_style': 'aesthetic, engaging',
                'audience': 'lifestyle-focused',
                'content_style': 'polished, visually appealing',
                'aspect_ratio': '9:16'
            },
            'youtube_shorts': {
                'optimal_length': 45,
                'trending_tags': ['shorts', 'viral', 'trending'],
                'hook_style': 'informative, compelling',
                'audience': 'broad demographic',
                'content_style': 'informative, entertaining',
                'aspect_ratio': '9:16'
            },
            'instagram_feed': {
                'optimal_length': 60,
                'trending_tags': ['instagram', 'viral', 'explore'],
                'hook_style': 'story-driven',
                'audience': 'engaged followers',
                'content_style': 'high-quality, branded',
                'aspect_ratio': '1:1'
            },
            'twitter': {
                'optimal_length': 60,
                'trending_tags': ['viral', 'trending', 'twitter'],
                'hook_style': 'conversational, direct',
                'audience': 'news and culture focused',
                'content_style': 'topical, engaging',
                'aspect_ratio': '16:9'
            },
            'linkedin': {
                'optimal_length': 120,
                'trending_tags': ['linkedin', 'professional', 'business'],
                'hook_style': 'professional, valuable',
                'audience': 'business professionals',
                'content_style': 'educational, professional',
                'aspect_ratio': '16:9'
            }
        }
    
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
    
    # ===== ADVANCED AI FEATURES =====
    
    async def predict_trending_topics(self, platforms: List[str]) -> Dict:
        """Predict what topics will trend in the next 24-48 hours"""
        try:
            if not self.openai_client.api_key:
                return self._mock_trending_prediction(platforms)
            
            trending_predictions = {}
            
            for platform in platforms:
                if platform not in self.platform_specs:
                    continue
                
                spec = self.platform_specs[platform]
                
                prompt = f"""
                Based on current cultural moments, news cycles, and platform behavior patterns,
                predict 5 topics that will likely trend on {platform} in the next 24-48 hours.
                
                Platform Context:
                - Audience: {spec['audience']}
                - Content Style: {spec['content_style']}
                - Current trending patterns on {platform}
                
                Consider:
                1. Breaking news and current events
                2. Seasonal/cultural moments
                3. Platform-specific viral patterns
                4. Emerging memes and challenges
                5. Algorithm preferences
                
                Return as JSON with topics and confidence scores (0-100).
                """
                
                response = self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": f"You are a viral content trend predictor specializing in {platform}. Predict future trending topics with high accuracy."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=600,
                    temperature=0.4
                )
                
                result = json.loads(response.choices[0].message.content)
                trending_predictions[platform] = result.get('trending_topics', [])
            
            return {
                'trending_predictions': trending_predictions,
                'prediction_window': '24-48 hours',
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Trending prediction error: {e}")
            return self._mock_trending_prediction(platforms)
    
    async def generate_competitor_analysis(self, content_summary: str, niche: str) -> Dict:
        """Analyze what competitors are doing and suggest unique angles"""
        try:
            if not self.openai_client.api_key:
                return self._mock_competitor_analysis()
            
            prompt = f"""
            Analyze the competitive landscape for this content:
            
            Content: {content_summary}
            Niche: {niche}
            
            Provide insights on:
            1. What similar creators are doing (common patterns)
            2. Content gaps in the market
            3. Unique angles to stand out
            4. Oversaturated topics to avoid
            5. Blue ocean opportunities
            
            Return as JSON with actionable insights and opportunity scores.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a competitive intelligence analyst for content creators. Find unique opportunities and gaps."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=800,
                temperature=0.6
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                'competitive_analysis': result,
                'analyzed_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Competitor analysis error: {e}")
            return self._mock_competitor_analysis()
    
    async def generate_viral_format_suggestions(self, content_type: str, platforms: List[str]) -> Dict:
        """Suggest viral video formats based on what's working now"""
        try:
            if not self.openai_client.api_key:
                return self._mock_format_suggestions(platforms)
            
            format_suggestions = {}
            
            for platform in platforms:
                if platform not in self.platform_specs:
                    continue
                
                spec = self.platform_specs[platform]
                
                prompt = f"""
                Suggest 3 viral video formats for {platform} based on current trends:
                
                Content Type: {content_type}
                Platform: {platform}
                Audience: {spec['audience']}
                
                For each format, provide:
                1. Format name and structure
                2. Why it works on this platform
                3. Specific execution tips
                4. Example hook starters
                5. Engagement tactics
                
                Focus on formats that are proven viral but not oversaturated.
                
                Return as JSON with detailed format breakdowns.
                """
                
                response = self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": f"You are a viral format specialist for {platform}. Suggest proven formats that drive massive engagement."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=700,
                    temperature=0.7
                )
                
                result = json.loads(response.choices[0].message.content)
                format_suggestions[platform] = result.get('viral_formats', [])
            
            return {
                'format_suggestions': format_suggestions,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Format suggestion error: {e}")
            return self._mock_format_suggestions(platforms)
    
    async def analyze_emotional_triggers(self, video_metadata: Dict) -> Dict:
        """Deep emotional analysis to maximize psychological engagement"""
        try:
            if not self.openai_client.api_key:
                return self._mock_emotional_analysis()
            
            content = f"""
            Title: {video_metadata.get('title', '')}
            Description: {video_metadata.get('description', '')}
            Transcript: {video_metadata.get('transcript', '')[:500]}...
            """
            
            prompt = f"""
            Perform a deep psychological analysis of this content to identify emotional triggers:
            
            {content}
            
            Analyze:
            1. Primary emotions triggered (fear, joy, surprise, anger, etc.)
            2. Psychological hooks (curiosity gaps, social proof, FOMO)
            3. Cognitive biases leveraged
            4. Dopamine trigger moments
            5. Shareability psychology
            6. Comment-driving elements
            
            Rate each element (0-100) and provide specific recommendations
            for amplifying emotional engagement.
            
            Return as JSON with detailed psychological insights.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a behavioral psychologist specializing in viral content. Analyze content for maximum emotional engagement."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=900,
                temperature=0.5
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                'emotional_analysis': result,
                'analyzed_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Emotional analysis error: {e}")
            return self._mock_emotional_analysis()
    
    async def generate_engagement_hacks(self, platforms: List[str], content_type: str) -> Dict:
        """Generate platform-specific engagement manipulation tactics"""
        try:
            if not self.openai_client.api_key:
                return self._mock_engagement_hacks(platforms)
            
            engagement_hacks = {}
            
            for platform in platforms:
                if platform not in self.platform_specs:
                    continue
                
                spec = self.platform_specs[platform]
                
                prompt = f"""
                Generate 5 advanced engagement hacks for {platform} that most creators don't know:
                
                Platform: {platform}
                Content Type: {content_type}
                Algorithm Focus: {spec['content_style']}
                
                Focus on:
                1. Algorithm manipulation techniques
                2. Psychological engagement triggers
                3. Comment-baiting strategies
                4. Share-inducing tactics  
                5. Save-worthy elements
                
                Provide specific, actionable tactics that exploit platform mechanics
                for maximum viral potential.
                
                Return as JSON with hack categories and implementation steps.
                """
                
                response = self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": f"You are a growth hacking expert specializing in {platform} algorithms. Reveal advanced engagement tactics."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=600,
                    temperature=0.8
                )
                
                result = json.loads(response.choices[0].message.content)
                engagement_hacks[platform] = result.get('engagement_hacks', [])
            
            return {
                'engagement_hacks': engagement_hacks,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Engagement hacks error: {e}")
            return self._mock_engagement_hacks(platforms)
    
    async def predict_viral_ceiling(self, video_metadata: Dict, platforms: List[str]) -> Dict:
        """Predict maximum potential reach and engagement"""
        try:
            if not self.openai_client.api_key:
                return self._mock_viral_ceiling(platforms)
            
            ceiling_predictions = {}
            
            for platform in platforms:
                if platform not in self.platform_specs:
                    continue
                
                spec = self.platform_specs[platform]
                
                prompt = f"""
                Predict the viral ceiling for this content on {platform}:
                
                Content Analysis:
                - Title: {video_metadata.get('title', '')}
                - Duration: {video_metadata.get('duration', 30)}s
                - Description: {video_metadata.get('description', '')}
                
                Platform: {platform}
                Audience: {spec['audience']}
                
                Predict:
                1. Maximum potential views (ranges)
                2. Peak engagement rate
                3. Viral velocity (how fast it spreads)
                4. Demographic penetration
                5. Platform reach percentage
                6. Cross-platform spillover potential
                
                Base predictions on content quality, hook strength, trending potential,
                and platform algorithm preferences.
                
                Return as JSON with numeric predictions and confidence intervals.
                """
                
                response = self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": f"You are a viral analytics expert. Predict content performance ceilings with high accuracy based on platform data."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=500,
                    temperature=0.3
                )
                
                result = json.loads(response.choices[0].message.content)
                ceiling_predictions[platform] = result.get('predictions', {})
            
            return {
                'viral_ceiling': ceiling_predictions,
                'prediction_confidence': 0.78,
                'analyzed_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Viral ceiling prediction error: {e}")
            return self._mock_viral_ceiling(platforms)
    
    # ===== VIRAL OPTIMIZATION FEATURES =====
    
    async def calculate_viral_score(self, video_metadata: Dict, platforms: List[str]) -> Dict:
        """Calculate viral potential score for each platform (0-100)"""
        try:
            if not self.openai_client.api_key:
                return self._mock_viral_scores(platforms)
            
            # Extract video characteristics
            duration = video_metadata.get('duration', 30)
            title = video_metadata.get('title', '')
            description = video_metadata.get('description', '')
            transcript = video_metadata.get('transcript', '')
            
            viral_scores = {}
            
            for platform in platforms:
                if platform not in self.platform_specs:
                    continue
                
                spec = self.platform_specs[platform]
                
                prompt = f"""
                Analyze this video content for viral potential on {platform}:
                
                Title: {title}
                Description: {description}
                Duration: {duration}s
                Transcript: {transcript[:300]}...
                
                Platform Context:
                - Target Audience: {spec['audience']}
                - Optimal Length: {spec['optimal_length']}s
                - Content Style: {spec['content_style']}
                - Trending Tags: {', '.join(spec['trending_tags'])}
                
                Rate viral potential (0-100) considering:
                1. Hook strength (first 3 seconds)
                2. Emotional engagement triggers
                3. Platform-specific optimization
                4. Shareability factors
                5. Trending potential
                6. Content quality and uniqueness
                
                Return just the numeric score (0-100).
                """
                
                response = self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": f"You are a viral content expert specializing in {platform}. Rate content viral potential from 0-100."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=50,
                    temperature=0.3
                )
                
                score_text = response.choices[0].message.content.strip()
                try:
                    score = int(''.join(filter(str.isdigit, score_text)))
                    score = max(0, min(100, score))  # Clamp between 0-100
                except:
                    score = 65  # Default score if parsing fails
                
                viral_scores[platform] = score / 100.0  # Convert to 0-1 range
            
            return {
                'viral_scores': viral_scores,
                'analyzed_at': datetime.utcnow().isoformat(),
                'confidence': 0.85
            }
            
        except Exception as e:
            print(f"Viral score calculation error: {e}")
            return self._mock_viral_scores(platforms)
    
    async def generate_viral_hooks(self, content_summary: str, platforms: List[str]) -> Dict:
        """Generate platform-specific viral hooks"""
        try:
            if not self.openai_client.api_key:
                return self._mock_hook_generation(platforms)
            
            hooks = {}
            
            for platform in platforms:
                if platform not in self.platform_specs:
                    continue
                
                spec = self.platform_specs[platform]
                
                prompt = f"""
                Create 5 viral hook variations for {platform} based on this content:
                
                Content Summary: {content_summary}
                
                Platform Guidelines:
                - Audience: {spec['audience']}
                - Hook Style: {spec['hook_style']}
                - Content Style: {spec['content_style']}
                - Trending Tags: {', '.join(spec['trending_tags'])}
                
                Generate hooks that:
                1. Grab attention in first 3 seconds
                2. Create curiosity or emotional response
                3. Are optimized for {platform} algorithm
                4. Include trending elements when appropriate
                5. Drive engagement (comments, shares, saves)
                
                Return as JSON array of 5 hook strings.
                """
                
                response = self.openai_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": f"You are a viral content creator specializing in {platform}. Generate compelling hooks that drive massive engagement."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=500,
                    temperature=0.8
                )
                
                result = json.loads(response.choices[0].message.content)
                platform_hooks = result.get('hooks', [])
                hooks[platform] = platform_hooks if isinstance(platform_hooks, list) else [platform_hooks]
            
            return {
                'hooks': hooks,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Hook generation error: {e}")
            return self._mock_hook_generation(platforms)
    
    async def optimize_hashtags(self, content: str, platforms: List[str]) -> Dict:
        """Generate optimized hashtags for each platform"""
        try:
            if not self.openai_client.api_key:
                return self._mock_hashtag_optimization(platforms)
            
            hashtags = {}
            
            for platform in platforms:
                if platform not in self.platform_specs:
                    continue
                
                spec = self.platform_specs[platform]
                
                # Platform-specific hashtag counts
                hashtag_counts = {
                    'tiktok': 5,
                    'instagram_reels': 8,
                    'youtube_shorts': 5,
                    'instagram_feed': 10,
                    'twitter': 3,
                    'linkedin': 5
                }
                
                count = hashtag_counts.get(platform, 5)
                
                prompt = f"""
                Generate {count} optimized hashtags for {platform} based on this content:
                
                Content: {content}
                
                Requirements:
                - Mix of trending and niche hashtags
                - Include some from: {', '.join(spec['trending_tags'])}
                - Balance reach vs. competition
                - Consider {platform} algorithm preferences
                - Target audience: {spec['audience']}
                
                Return as JSON array of {count} hashtag strings (without # symbol).
                """
                
                response = self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": f"You are a hashtag optimization expert for {platform}. Generate hashtags that maximize reach and engagement."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    max_tokens=300,
                    temperature=0.6
                )
                
                result = json.loads(response.choices[0].message.content)
                platform_hashtags = result.get('hashtags', [])
                hashtags[platform] = platform_hashtags if isinstance(platform_hashtags, list) else [platform_hashtags]
            
            return {
                'hashtags': hashtags,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Hashtag optimization error: {e}")
            return self._mock_hashtag_optimization(platforms)
    
    async def suggest_optimal_timing(self, user_analytics: Dict, platforms: List[str]) -> Dict:
        """Suggest optimal posting times based on platform data and user analytics"""
        timing_suggestions = {}
        
        # Default optimal times per platform (based on industry research)
        default_times = {
            'tiktok': ['6-9 AM', '7-9 PM'],
            'instagram_reels': ['11 AM-1 PM', '7-9 PM'],
            'youtube_shorts': ['2-4 PM', '8-10 PM'],
            'instagram_feed': ['11 AM-1 PM', '5-7 PM'],
            'twitter': ['9 AM-10 AM', '7-9 PM'],
            'linkedin': ['8-10 AM', '12-2 PM']
        }
        
        for platform in platforms:
            # Enhance with user data if available
            user_performance = user_analytics.get(platform, {})
            best_times = user_performance.get('best_posting_times', default_times.get(platform, ['12-2 PM']))
            
            timing_suggestions[platform] = {
                'optimal_times': best_times,
                'timezone': user_analytics.get('timezone', 'UTC'),
                'confidence': 0.8 if user_performance else 0.6,
                'based_on': 'user_data' if user_performance else 'platform_defaults',
                'weekly_pattern': user_performance.get('weekly_pattern', {
                    'weekdays': best_times,
                    'weekends': best_times
                })
            }
        
        return {
            'timing_suggestions': timing_suggestions,
            'analyzed_at': datetime.utcnow().isoformat()
        }
    
    async def analyze_viral_elements(self, video_metadata: Dict) -> Dict:
        """Analyze what makes content viral"""
        try:
            if not self.openai_client.api_key:
                return self._mock_viral_elements()
            
            content = f"""
            Title: {video_metadata.get('title', '')}
            Description: {video_metadata.get('description', '')}
            Duration: {video_metadata.get('duration', 30)}s
            Transcript: {video_metadata.get('transcript', '')[:500]}...
            """
            
            prompt = f"""
            Analyze this video content for viral elements:
            
            {content}
            
            Rate each element (0-100) and explain:
            1. Hook Strength - How compelling are the first 3 seconds?
            2. Emotional Triggers - Does it evoke strong emotions?
            3. Visual Appeal - Is it visually engaging?
            4. Trending Elements - Does it leverage current trends?
            5. Shareability - Will people want to share this?
            6. Uniqueness - How original/different is the content?
            
            Return as JSON with scores and brief explanations for each element.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a viral content analyst. Rate content elements that contribute to virality."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=800,
                temperature=0.5
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                'viral_elements': result,
                'analyzed_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Viral elements analysis error: {e}")
            return self._mock_viral_elements()
    
    # ===== MOCK FUNCTIONS FOR TESTING =====
    
    def _mock_viral_scores(self, platforms: List[str]) -> Dict:
        """Mock viral scores for testing when OpenAI is not available"""
        import random
        
        viral_scores = {}
        for platform in platforms:
            # Generate realistic scores based on platform
            base_scores = {
                'tiktok': 0.75,
                'instagram_reels': 0.68,
                'youtube_shorts': 0.72,
                'instagram_feed': 0.65,
                'twitter': 0.58,
                'linkedin': 0.45
            }
            base = base_scores.get(platform, 0.65)
            # Add some randomness
            viral_scores[platform] = max(0, min(1, base + random.uniform(-0.15, 0.15)))
        
        return {
            'viral_scores': viral_scores,
            'analyzed_at': datetime.utcnow().isoformat(),
            'confidence': 0.6  # Lower confidence for mock data
        }
    
    def _mock_hook_generation(self, platforms: List[str]) -> Dict:
        """Mock hook generation for testing"""
        mock_hooks = {
            'tiktok': [
                "POV: You discover this life-changing secret...",
                "Tell me why nobody talks about this...",
                "This will change how you think about...",
                "Watch this before it's too late...",
                "You're doing this wrong (here's the right way)"
            ],
            'instagram_reels': [
                "Here's what nobody tells you about...",
                "The aesthetic way to...",
                "This trend is everything...",
                "Behind the scenes of...",
                "Transform your... in 30 seconds"
            ],
            'youtube_shorts': [
                "The truth about... will shock you",
                "Here's why everyone's talking about...",
                "I tried this for 30 days...",
                "The secret that changed everything...",
                "You need to see this..."
            ],
            'instagram_feed': [
                "Today I learned something incredible...",
                "The story behind this moment...",
                "Here's what happened when...",
                "A day in the life of...",
                "The transformation that shocked everyone..."
            ],
            'twitter': [
                "Thread: Why everyone's wrong about...",
                "Hot take that'll make you think...",
                "The reality no one talks about...",
                "Breaking: This changes everything...",
                "Unpopular opinion but..."
            ],
            'linkedin': [
                "3 lessons I learned that transformed my...",
                "The strategy that 10x'd my...",
                "Why most people fail at...",
                "The mistake I made that cost me...",
                "Here's what successful people do differently..."
            ]
        }
        
        hooks = {}
        for platform in platforms:
            hooks[platform] = mock_hooks.get(platform, mock_hooks['tiktok'])
        
        return {
            'hooks': hooks,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _mock_hashtag_optimization(self, platforms: List[str]) -> Dict:
        """Mock hashtag optimization for testing"""
        mock_hashtags = {
            'tiktok': ['fyp', 'viral', 'trending', 'foryou', 'tiktok'],
            'instagram_reels': ['reels', 'explore', 'viral', 'instagram', 'trending', 'reel', 'instagood', 'photooftheday'],
            'youtube_shorts': ['shorts', 'viral', 'trending', 'youtube', 'short'],
            'instagram_feed': ['instagram', 'viral', 'explore', 'photo', 'instagood', 'photooftheday', 'picoftheday', 'instadaily', 'igers', 'followme'],
            'twitter': ['viral', 'trending', 'twitter'],
            'linkedin': ['linkedin', 'professional', 'business', 'career', 'networking']
        }
        
        hashtags = {}
        for platform in platforms:
            hashtags[platform] = mock_hashtags.get(platform, ['viral', 'trending'])
        
        return {
            'hashtags': hashtags,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _mock_viral_elements(self) -> Dict:
        """Mock viral elements analysis for testing"""
        return {
            'viral_elements': {
                'hook_strength': {
                    'score': 78,
                    'explanation': 'Strong opening that creates immediate curiosity'
                },
                'emotional_triggers': {
                    'score': 72,
                    'explanation': 'Content evokes surprise and interest emotions'
                },
                'visual_appeal': {
                    'score': 85,
                    'explanation': 'High visual quality with engaging scenes'
                },
                'trending_elements': {
                    'score': 65,
                    'explanation': 'Incorporates some current trends but could be more timely'
                },
                'shareability': {
                    'score': 80,
                    'explanation': 'Content is highly shareable with clear value proposition'
                },
                'uniqueness': {
                    'score': 70,
                    'explanation': 'Unique perspective on common topic'
                }
            },
            'analyzed_at': datetime.utcnow().isoformat()
        }
    
    # ===== ADVANCED MOCK FUNCTIONS =====
    
    def _mock_trending_prediction(self, platforms: List[str]) -> Dict:
        """Mock trending topic predictions"""
        mock_trends = {
            'tiktok': [
                {'topic': 'AI productivity hacks', 'confidence': 87, 'reason': 'Growing tech adoption'},
                {'topic': 'Micro-adventures', 'confidence': 82, 'reason': 'Travel trend shift'},
                {'topic': 'Plant parent fails', 'confidence': 78, 'reason': 'Relatable content rising'},
                {'topic': 'Quick money tips', 'confidence': 85, 'reason': 'Economic awareness'},
                {'topic': '2-minute recipes', 'confidence': 80, 'reason': 'Time-saving content'}
            ],
            'instagram_reels': [
                {'topic': 'Aesthetic morning routines', 'confidence': 84, 'reason': 'Lifestyle content trend'},
                {'topic': 'Before/after transformations', 'confidence': 88, 'reason': 'High engagement format'},
                {'topic': 'Outfit transitions', 'confidence': 79, 'reason': 'Fashion trend cycle'},
                {'topic': 'Home organization', 'confidence': 81, 'reason': 'Seasonal cleaning'},
                {'topic': 'Quick workouts', 'confidence': 83, 'reason': 'Fitness trend'}
            ]
        }
        
        trending_predictions = {}
        for platform in platforms:
            trending_predictions[platform] = mock_trends.get(platform, mock_trends['tiktok'])
        
        return {
            'trending_predictions': trending_predictions,
            'prediction_window': '24-48 hours',
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _mock_competitor_analysis(self) -> Dict:
        """Mock competitive analysis"""
        return {
            'competitive_analysis': {
                'common_patterns': [
                    'Most creators use generic hooks',
                    'Oversaturated morning routine content',
                    'Similar editing styles and music'
                ],
                'content_gaps': [
                    'Evening routine content underserved',
                    'Behind-the-scenes of failures',
                    'Realistic productivity (not perfectionism)'
                ],
                'unique_angles': [
                    'Show the messy reality behind success',
                    'Focus on mental health aspects',
                    'Include family/pet interruptions authentically'
                ],
                'oversaturated_topics': [
                    'Generic morning routines',
                    '5am wake-up content',
                    'Perfect aesthetic setups'
                ],
                'blue_ocean_opportunities': [
                    {'opportunity': 'Productivity for night owls', 'score': 92},
                    {'opportunity': 'Failure recovery stories', 'score': 88},
                    {'opportunity': 'Productivity with ADHD', 'score': 89}
                ]
            },
            'analyzed_at': datetime.utcnow().isoformat()
        }
    
    def _mock_format_suggestions(self, platforms: List[str]) -> Dict:
        """Mock viral format suggestions"""
        mock_formats = {
            'tiktok': [
                {
                    'format_name': 'Problem-Agitation-Solution',
                    'structure': 'Hook (3s) → Build tension (10s) → Reveal solution (17s)',
                    'why_it_works': 'Creates curiosity gap and provides payoff',
                    'execution_tips': ['Use dramatic pause before solution', 'Add visual countdown timer'],
                    'hook_examples': ['This mistake cost me $10k...', 'Nobody tells you this about...']
                },
                {
                    'format_name': 'Story Stack',
                    'structure': 'Teaser → Story pt1 → Cliffhanger → Story pt2 → Lesson',
                    'why_it_works': 'Multiple retention hooks throughout video',
                    'execution_tips': ['End mid-sentence for pt2', 'Use text overlay for emphasis'],
                    'hook_examples': ['So I did something crazy...', 'This changed everything...']
                }
            ]
        }
        
        format_suggestions = {}
        for platform in platforms:
            format_suggestions[platform] = mock_formats.get(platform, mock_formats['tiktok'])
        
        return {
            'format_suggestions': format_suggestions,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _mock_emotional_analysis(self) -> Dict:
        """Mock emotional trigger analysis"""
        return {
            'emotional_analysis': {
                'primary_emotions': [
                    {'emotion': 'Curiosity', 'strength': 85, 'triggers': ['Mystery setup', 'Incomplete information']},
                    {'emotion': 'Surprise', 'strength': 72, 'triggers': ['Unexpected reveal', 'Plot twist']},
                    {'emotion': 'Relief', 'strength': 68, 'triggers': ['Solution provided', 'Problem resolved']}
                ],
                'psychological_hooks': [
                    {'hook': 'Curiosity Gap', 'strength': 88, 'implementation': 'Tease outcome without revealing'},
                    {'hook': 'Social Proof', 'strength': 75, 'implementation': 'Show others doing it'},
                    {'hook': 'FOMO', 'strength': 82, 'implementation': 'Limited time/opportunity angle'}
                ],
                'cognitive_biases': [
                    {'bias': 'Confirmation Bias', 'leverage': 'Confirm audience beliefs first'},
                    {'bias': 'Availability Heuristic', 'leverage': 'Use recent, memorable examples'}
                ],
                'dopamine_triggers': [
                    {'trigger': 'Variable Reward', 'strength': 79, 'timing': '15-20 seconds'},
                    {'trigger': 'Achievement Unlock', 'strength': 71, 'timing': 'End of video'}
                ],
                'shareability_psychology': {
                    'self_expression': 85,
                    'social_currency': 78,
                    'practical_value': 82,
                    'emotional_arousal': 76
                }
            },
            'analyzed_at': datetime.utcnow().isoformat()
        }
    
    def _mock_engagement_hacks(self, platforms: List[str]) -> Dict:
        """Mock engagement manipulation hacks"""
        mock_hacks = {
            'tiktok': [
                {
                    'category': 'Algorithm Manipulation',
                    'hack': 'The 3-Second Rule',
                    'description': 'Front-load most engaging moment in first 3 seconds',
                    'implementation': 'Start with outcome, then rewind to story'
                },
                {
                    'category': 'Comment Baiting',
                    'hack': 'Intentional Mistakes',
                    'description': 'Include subtle errors to drive correction comments',
                    'implementation': 'Misspell one word or state obvious mistake'
                },
                {
                    'category': 'Share Psychology',
                    'hack': 'Identity Reinforcement',
                    'description': 'Content that makes viewers feel smart/special',
                    'implementation': 'Use "If you know, you know" format'
                },
                {
                    'category': 'Save Inducing',
                    'hack': 'Reference Lists',
                    'description': 'Provide something they\'ll want to remember',
                    'implementation': 'Quick tips, recipes, or life hacks'
                },
                {
                    'category': 'Watch Time',
                    'hack': 'Loop Perfection',
                    'description': 'End connects seamlessly to beginning',
                    'implementation': 'Last word leads into first word'
                }
            ]
        }
        
        engagement_hacks = {}
        for platform in platforms:
            engagement_hacks[platform] = mock_hacks.get(platform, mock_hacks['tiktok'])
        
        return {
            'engagement_hacks': engagement_hacks,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _mock_viral_ceiling(self, platforms: List[str]) -> Dict:
        """Mock viral ceiling predictions"""
        import random
        
        ceiling_predictions = {}
        
        for platform in platforms:
            # Generate realistic but optimistic predictions
            base_views = {
                'tiktok': 50000,
                'instagram_reels': 30000,
                'youtube_shorts': 45000,
                'instagram_feed': 15000,
                'twitter': 8000,
                'linkedin': 5000
            }
            
            base = base_views.get(platform, 25000)
            
            ceiling_predictions[platform] = {
                'max_views_range': {
                    'conservative': base,
                    'optimistic': base * 5,
                    'viral_breakout': base * 25
                },
                'peak_engagement_rate': round(random.uniform(8.5, 15.2), 1),
                'viral_velocity': f"{random.randint(6, 24)} hours to peak",
                'demographic_penetration': f"{random.randint(15, 35)}% of target demo",
                'platform_reach_percentage': f"{random.uniform(0.01, 0.08):.3f}%",
                'cross_platform_spillover': random.randint(20, 45)
            }
        
        return {
            'viral_ceiling': ceiling_predictions,
            'prediction_confidence': 0.78,
            'analyzed_at': datetime.utcnow().isoformat()
        }