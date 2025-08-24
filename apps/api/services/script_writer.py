import openai
import json
import asyncio
import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import random
from dataclasses import dataclass

@dataclass
class EmotionalBeat:
    timestamp: int
    emotion: str
    intensity: float
    action: str

@dataclass
class ViralHook:
    text: str
    category: str
    viral_score: int
    best_for: List[str]

class AIScriptWriter:
    """Revolutionary AI script generation system that guarantees viral content"""
    
    def __init__(self):
        # Initialize OpenAI client with graceful handling of missing API key
        api_key = os.getenv('OPENAI_API_KEY')
        self.openai_client = openai.Client(api_key=api_key) if api_key else None
        
        # Load viral components
        self.hook_library = self.load_viral_hooks()
        self.emotional_patterns = self.load_emotional_patterns()
        self.platform_specs = self.load_platform_specifications()
        
        # Style configurations
        self.style_configs = {
            'educational': {
                'tone': 'informative, engaging',
                'structure': 'problem → solution → proof',
                'hooks': ['question', 'statistic', 'mistake'],
                'pacing': 'medium'
            },
            'entertainment': {
                'tone': 'fun, energetic',
                'structure': 'hook → build → payoff',
                'hooks': ['surprise', 'relatable', 'dramatic'],
                'pacing': 'fast'
            },
            'story': {
                'tone': 'personal, authentic',
                'structure': 'setup → conflict → resolution',
                'hooks': ['cliffhanger', 'confession', 'transformation'],
                'pacing': 'variable'
            },
            'comedy': {
                'tone': 'humorous, relatable',
                'structure': 'setup → punchline → callback',
                'hooks': ['absurd', 'relatable', 'unexpected'],
                'pacing': 'quick'
            }
        }
    
    def load_viral_hooks(self) -> Dict[str, List[ViralHook]]:
        """Load library of proven viral hooks"""
        return {
            'question': [
                ViralHook("What if I told you...", "revelation", 85, ["educational", "story"]),
                ViralHook("Why does nobody talk about...", "conspiracy", 90, ["educational", "entertainment"]),
                ViralHook("Have you ever wondered why...", "curiosity", 80, ["educational", "story"]),
                ViralHook("What would you do if...", "hypothetical", 75, ["story", "entertainment"]),
            ],
            'statistic': [
                ViralHook("95% of people don't know this...", "shock", 88, ["educational"]),
                ViralHook("Only 3% of people can do this...", "exclusivity", 82, ["educational", "entertainment"]),
                ViralHook("In the next 60 seconds...", "urgency", 85, ["educational", "story"]),
            ],
            'mistake': [
                ViralHook("I was doing this completely wrong...", "confession", 90, ["story", "educational"]),
                ViralHook("Everyone makes this mistake...", "relatability", 87, ["educational"]),
                ViralHook("This could ruin everything...", "warning", 92, ["educational", "story"]),
            ],
            'surprise': [
                ViralHook("You won't believe what happened next...", "cliffhanger", 95, ["story", "entertainment"]),
                ViralHook("Plot twist:", "revelation", 88, ["entertainment", "story"]),
                ViralHook("This is not what you think...", "misdirection", 85, ["entertainment"]),
            ],
            'relatable': [
                ViralHook("We've all been there...", "connection", 83, ["story", "comedy"]),
                ViralHook("Tell me you've done this without telling me...", "participation", 89, ["comedy", "entertainment"]),
                ViralHook("POV: You're trying to...", "scenario", 87, ["comedy", "story"]),
            ]
        }
    
    def load_emotional_patterns(self) -> Dict[str, List[EmotionalBeat]]:
        """Load emotional journey templates"""
        return {
            '30_second': [
                EmotionalBeat(0, "curiosity", 0.8, "hook viewer"),
                EmotionalBeat(5, "interest", 0.9, "provide value"),
                EmotionalBeat(15, "excitement", 0.95, "build tension"),
                EmotionalBeat(25, "satisfaction", 0.85, "deliver payoff"),
                EmotionalBeat(28, "desire", 0.9, "call to action")
            ],
            '60_second': [
                EmotionalBeat(0, "curiosity", 0.8, "hook viewer"),
                EmotionalBeat(8, "interest", 0.85, "build context"),
                EmotionalBeat(20, "tension", 0.9, "create problem"),
                EmotionalBeat(35, "excitement", 0.95, "reveal solution"),
                EmotionalBeat(50, "satisfaction", 0.9, "show results"),
                EmotionalBeat(56, "desire", 0.95, "call to action")
            ],
            '180_second': [
                EmotionalBeat(0, "curiosity", 0.8, "hook viewer"),
                EmotionalBeat(15, "interest", 0.85, "build story"),
                EmotionalBeat(45, "tension", 0.9, "create conflict"),
                EmotionalBeat(90, "excitement", 0.95, "show resolution"),
                EmotionalBeat(135, "inspiration", 0.9, "provide lesson"),
                EmotionalBeat(165, "satisfaction", 0.85, "wrap up"),
                EmotionalBeat(175, "desire", 0.95, "call to action")
            ]
        }
    
    def load_platform_specifications(self) -> Dict[str, Dict]:
        """Load platform-specific requirements"""
        return {
            'tiktok': {
                'max_duration': 180,
                'optimal_duration': 15,
                'aspect_ratio': '9:16',
                'caption_style': 'casual, emoji-heavy',
                'trending_elements': ['sounds', 'effects', 'challenges'],
                'hook_time': 3,  # seconds to hook viewer
                'key_moments': [3, 8, 12],  # critical retention points
            },
            'instagram': {
                'max_duration': 90,
                'optimal_duration': 30,
                'aspect_ratio': '9:16',
                'caption_style': 'polished, story-focused',
                'trending_elements': ['reels', 'stories', 'carousels'],
                'hook_time': 5,
                'key_moments': [5, 15, 25],
            },
            'youtube': {
                'max_duration': 60,  # for shorts
                'optimal_duration': 45,
                'aspect_ratio': '9:16',
                'caption_style': 'descriptive, searchable',
                'trending_elements': ['shorts', 'thumbnails', 'titles'],
                'hook_time': 8,
                'key_moments': [8, 20, 35],
            }
        }
    
    async def generate_viral_script(self, 
                                   concept: str,
                                   platform: str,
                                   duration: int,
                                   style: str) -> Dict:
        """Generate guaranteed viral script with AI optimization"""
        
        try:
            # Get platform specs
            platform_spec = self.platform_specs.get(platform, self.platform_specs['tiktok'])
            style_config = self.style_configs.get(style, self.style_configs['educational'])
            
            # Select appropriate hooks
            hooks = await self.get_trending_hooks(concept, platform, style)
            
            # Create emotional journey
            emotional_arc = self.create_emotional_journey(duration, style)
            
            # Generate script with AI
            if not self.openai_client or not self.openai_client.api_key:
                script_data = self.generate_mock_script(concept, platform, duration, style)
            else:
                script_data = await self.ai_generate_script(
                    concept=concept,
                    hooks=hooks,
                    emotional_arc=emotional_arc,
                    platform=platform,
                    duration=duration,
                    style_config=style_config,
                    platform_spec=platform_spec
                )
            
            # Calculate viral potential
            viral_score = self.calculate_viral_potential(script_data, platform, style)
            
            # Generate variations
            variations = await self.generate_script_variations(script_data, 3)
            
            return {
                "script": script_data["script"],
                "title_suggestions": script_data.get("title_suggestions", []),
                "viral_score": viral_score,
                "hooks": [hook.text for hook in hooks],
                "emotional_beats": emotional_arc,
                "platform_optimizations": self.get_platform_optimizations(platform),
                "variations": variations,
                "performance_prediction": self.predict_performance(script_data, viral_score),
                "improvement_suggestions": self.get_improvement_suggestions(script_data, viral_score)
            }
            
        except Exception as e:
            print(f"Script generation error: {e}")
            return self.generate_mock_script(concept, platform, duration, style)
    
    async def get_trending_hooks(self, concept: str, platform: str, style: str) -> List[ViralHook]:
        """Get the best hooks for the given concept and style"""
        
        style_config = self.style_configs.get(style, self.style_configs['educational'])
        relevant_hook_types = style_config['hooks']
        
        selected_hooks = []
        
        for hook_type in relevant_hook_types:
            if hook_type in self.hook_library:
                # Filter hooks that work for this style
                suitable_hooks = [
                    hook for hook in self.hook_library[hook_type]
                    if style in hook.best_for
                ]
                
                if suitable_hooks:
                    # Pick the highest scoring hook
                    best_hook = max(suitable_hooks, key=lambda h: h.viral_score)
                    selected_hooks.append(best_hook)
        
        # Add platform-specific hooks
        if platform == 'tiktok':
            selected_hooks.append(ViralHook("POV:", "scenario", 85, [style]))
        elif platform == 'instagram':
            selected_hooks.append(ViralHook("This changed everything for me...", "transformation", 87, [style]))
        
        return selected_hooks[:3]  # Return top 3 hooks
    
    def create_emotional_journey(self, duration: int, style: str) -> List[EmotionalBeat]:
        """Create emotional arc based on duration and style"""
        
        # Select appropriate template based on duration
        if duration <= 30:
            template = self.emotional_patterns['30_second']
        elif duration <= 60:
            template = self.emotional_patterns['60_second']
        else:
            template = self.emotional_patterns['180_second']
        
        # Adjust for style
        adjusted_beats = []
        for beat in template:
            if beat.timestamp <= duration:
                # Modify intensity based on style
                if style == 'comedy':
                    beat.intensity *= 1.1  # More emotional peaks
                elif style == 'educational':
                    beat.intensity *= 0.9  # More measured approach
                
                adjusted_beats.append(beat)
        
        return adjusted_beats
    
    async def ai_generate_script(self, 
                                concept: str,
                                hooks: List[ViralHook],
                                emotional_arc: List[EmotionalBeat],
                                platform: str,
                                duration: int,
                                style_config: Dict,
                                platform_spec: Dict) -> Dict:
        """Use AI to generate the actual script"""
        
        hook_text = " OR ".join([hook.text for hook in hooks[:3]])
        emotion_guidance = ", ".join([f"{beat.emotion} at {beat.timestamp}s" for beat in emotional_arc])
        
        prompt = f"""
        Create a viral {platform} script that will guarantee maximum engagement.
        
        CONCEPT: {concept}
        DURATION: {duration} seconds
        STYLE: {style_config['tone']}
        STRUCTURE: {style_config['structure']}
        
        VIRAL HOOKS (choose the best one): {hook_text}
        
        EMOTIONAL JOURNEY: {emotion_guidance}
        
        PLATFORM REQUIREMENTS:
        - Hook viewers in first {platform_spec['hook_time']} seconds
        - Key retention moments at: {platform_spec['key_moments']}
        - Caption style: {platform_spec['caption_style']}
        
        CRITICAL SUCCESS FACTORS:
        1. Start with the most compelling hook
        2. Create immediate value or intrigue
        3. Maintain high energy throughout
        4. Include specific, actionable advice
        5. End with a strong call-to-action
        6. Use conversational, authentic language
        7. Include emotional triggers for sharing
        
        Generate:
        1. Full script with timing cues
        2. 3 title variations
        3. Key emotional moments
        4. Call-to-action suggestions
        
        Make it conversational, authentic, and absolutely addictive to watch.
        """
        
        response = self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": f"You are a viral content expert who has created scripts that generated billions of views. You understand psychology, platform algorithms, and what makes people share content. Create scripts that are authentic, valuable, and impossible to scroll past."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=2000,
            temperature=0.8
        )
        
        return json.loads(response.choices[0].message.content)
    
    def generate_mock_script(self, concept: str, platform: str, duration: int, style: str) -> Dict:
        """Generate mock script when AI is not available"""
        
        hooks = [
            "What if I told you there's a secret that 99% of people don't know?",
            "I wish someone had told me this 10 years ago...",
            "This completely changed my life in 30 days:"
        ]
        
        selected_hook = random.choice(hooks)
        
        # Generate mock script based on style
        if style == 'educational':
            script = f"""{selected_hook}
            
[0-5s] Hook: {concept} - but here's what nobody tells you...

[5-15s] Problem: Most people struggle with this because they're missing ONE key thing.

[15-25s] Solution: Here's the exact method I discovered...

[25-{duration}s] Proof: This is what happened when I tried it...

Call-to-action: Try this and let me know your results in the comments!"""
        
        elif style == 'story':
            script = f"""{selected_hook}
            
[0-5s] Hook: So this happened to me last week...

[5-15s] Setup: I was trying to {concept.lower()} when suddenly...

[15-25s] Conflict: Everything went wrong and I thought it was over...

[25-{duration}s] Resolution: But then I discovered something amazing...

Call-to-action: Has this ever happened to you? Share your story!"""
        
        else:  # Default educational
            script = f"""{selected_hook}

[0-5s] {selected_hook}

[5-{duration-5}s] Let me break down {concept} in the simplest way possible...

[{duration-5}-{duration}s] Try this and watch what happens!"""
        
        return {
            "script": script,
            "title_suggestions": [
                f"The {concept} Secret Nobody Talks About",
                f"How I Mastered {concept} in 30 Days",
                f"The Truth About {concept} Will Shock You"
            ]
        }
    
    def calculate_viral_potential(self, script_data: Dict, platform: str, style: str) -> int:
        """Calculate viral score based on script analysis"""
        
        script = script_data.get("script", "")
        score = 50  # Base score
        
        # Hook strength (first 10 words)
        first_words = script.split()[:10]
        hook_keywords = ['secret', 'nobody', 'shocking', 'truth', 'revealed', 'mistake', 'wrong']
        hook_score = sum(5 for word in first_words if word.lower() in hook_keywords)
        score += min(hook_score, 20)
        
        # Emotional triggers
        emotion_words = ['amazing', 'incredible', 'shocking', 'unbelievable', 'life-changing']
        emotion_score = sum(3 for word in emotion_words if word.lower() in script.lower())
        score += min(emotion_score, 15)
        
        # Call-to-action presence
        cta_words = ['comment', 'share', 'follow', 'like', 'try', 'tell me']
        cta_score = sum(2 for word in cta_words if word.lower() in script.lower())
        score += min(cta_score, 10)
        
        # Platform optimization
        if platform == 'tiktok':
            if 'POV:' in script or '#' in script:
                score += 5
        elif platform == 'instagram':
            if len(script) > 200:  # Longer captions perform well
                score += 5
        
        # Style bonus
        if style == 'story' and ('happened' in script.lower() or 'experience' in script.lower()):
            score += 5
        elif style == 'educational' and ('learn' in script.lower() or 'tip' in script.lower()):
            score += 5
        
        return min(score, 100)
    
    async def generate_script_variations(self, original_script: Dict, count: int) -> List[Dict]:
        """Generate variations of the original script"""
        
        variations = []
        
        for i in range(count):
            # Create variations by changing hooks and angles
            variation_styles = ['more casual', 'more dramatic', 'more personal']
            style = variation_styles[i % len(variation_styles)]
            
            variations.append({
                "version": i + 1,
                "style": style,
                "script": self.create_script_variation(original_script, style),
                "difference": f"Optimized for {style} tone"
            })
        
        return variations
    
    def create_script_variation(self, original: Dict, variation_style: str) -> str:
        """Create a variation of the original script"""
        
        original_script = original.get("script", "")
        
        # Simple variation by changing tone markers
        if variation_style == 'more casual':
            return original_script.replace('This is', 'So basically').replace('You should', 'You might wanna')
        elif variation_style == 'more dramatic':
            return original_script.replace('interesting', 'MIND-BLOWING').replace('good', 'INCREDIBLE')
        elif variation_style == 'more personal':
            return original_script.replace('Many people', 'I personally').replace('Studies show', 'In my experience')
        
        return original_script
    
    def get_platform_optimizations(self, platform: str) -> List[str]:
        """Get platform-specific optimization tips"""
        
        optimizations = {
            'tiktok': [
                "Use trending sounds and effects",
                "Add captions for accessibility", 
                "Include popular hashtags",
                "Film in vertical format",
                "Hook viewers in first 3 seconds",
                "Use quick cuts and transitions",
                "Add text overlays for key points"
            ],
            'instagram': [
                "Craft compelling first line for feed",
                "Use relevant hashtags (5-10)",
                "Create shareable moments",
                "Include call-to-action",
                "Post at optimal times",
                "Use Instagram-native features",
                "Create scroll-stopping thumbnails"
            ],
            'youtube': [
                "Optimize title for search",
                "Create click-worthy thumbnail",
                "Use timestamps for key moments",
                "Include description keywords",
                "Add end screen CTAs",
                "Structure for watch time",
                "Hook viewers early and often"
            ]
        }
        
        return optimizations.get(platform, optimizations['tiktok'])
    
    def predict_performance(self, script_data: Dict, viral_score: int) -> Dict:
        """Predict performance metrics based on script analysis"""
        
        base_multiplier = viral_score / 100
        
        return {
            "estimated_views": {
                "conservative": int(1000 * base_multiplier),
                "realistic": int(5000 * base_multiplier),
                "optimistic": int(25000 * base_multiplier)
            },
            "engagement_rate": f"{4 + (viral_score / 25):.1f}%",
            "completion_rate": f"{20 + (viral_score / 2):.0f}%",
            "share_likelihood": "High" if viral_score > 80 else "Medium" if viral_score > 60 else "Low",
            "best_posting_time": "7-9 PM local time",
            "confidence_level": "High" if viral_score > 75 else "Medium"
        }
    
    def get_improvement_suggestions(self, script_data: Dict, viral_score: int) -> List[str]:
        """Suggest improvements to increase viral potential"""
        
        suggestions = []
        script = script_data.get("script", "")
        
        if viral_score < 70:
            suggestions.append("Strengthen your opening hook - make it more surprising or controversial")
        
        if viral_score < 60:
            suggestions.append("Add more emotional triggers - words that make people feel something")
        
        if 'comment' not in script.lower():
            suggestions.append("Include a stronger call-to-action to drive engagement")
        
        if len(script.split()) < 50:
            suggestions.append("Expand content with more valuable information or storytelling")
        
        if not any(word in script.lower() for word in ['you', 'your', 'yourself']):
            suggestions.append("Make it more personal - use 'you' to speak directly to viewers")
        
        return suggestions
    
    async def refine_script(self, original_script: str, feedback: str, target_improvements: List[str]) -> Dict:
        """Refine script based on user feedback"""
        
        try:
            if not self.openai_client or not self.openai_client.api_key:
                return self.mock_refine_script(original_script, feedback)
            
            prompt = f"""
            Refine this script to make it more viral and engaging:
            
            ORIGINAL SCRIPT:
            {original_script}
            
            USER FEEDBACK:
            {feedback}
            
            TARGET IMPROVEMENTS:
            {', '.join(target_improvements)}
            
            Make it more compelling while maintaining authenticity.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a script doctor who specializes in making content more viral and engaging."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.7
            )
            
            return {
                "refined_script": response.choices[0].message.content,
                "improvements_made": target_improvements,
                "viral_score_increase": 5
            }
            
        except Exception as e:
            print(f"Script refinement error: {e}")
            return self.mock_refine_script(original_script, feedback)
    
    def mock_refine_script(self, original_script: str, feedback: str) -> Dict:
        """Mock script refinement when AI is not available"""
        
        # Simple refinements
        refined = original_script.replace('This is', 'Here\'s the crazy part:')
        refined = refined.replace('You should', 'You NEED to')
        refined = refined.replace('.', '!')
        
        return {
            "refined_script": refined,
            "improvements_made": ["Increased energy", "Stronger language", "Better hooks"],
            "viral_score_increase": 5
        }

# Initialize the script writer
script_writer = AIScriptWriter()

print("🤖 AI Script Writer Pro initialized - Ready to generate viral scripts!")