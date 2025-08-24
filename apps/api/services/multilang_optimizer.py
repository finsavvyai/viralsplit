import openai
from typing import Dict, List, Optional, Tuple
import json
import asyncio
import os
from datetime import datetime
import requests
import re
from dataclasses import dataclass
from deep_translator import GoogleTranslator
import langdetect

@dataclass
class LanguageProfile:
    code: str
    name: str
    native_name: str
    cultural_context: Dict
    platform_preferences: Dict
    viral_patterns: Dict
    emoji_preferences: List[str]

class MultiLanguageOptimizer:
    """Advanced multi-language content optimization system"""
    
    def __init__(self):
        # Initialize OpenAI client with graceful handling of missing API key
        api_key = os.getenv('OPENAI_API_KEY')
        self.openai_client = openai.Client(api_key=api_key) if api_key else None
        # GoogleTranslator will be created per request as needed
        
        # Comprehensive language profiles
        self.language_profiles = {
            'en': LanguageProfile(
                code='en',
                name='English',
                native_name='English',
                cultural_context={
                    'humor_style': 'sarcasm, wordplay, pop culture references',
                    'attention_span': 'medium',
                    'trending_topics': ['tech', 'lifestyle', 'entrepreneurship'],
                    'taboo_topics': ['politics_controversial', 'personal_finance_advice'],
                    'communication_style': 'direct, casual, enthusiastic'
                },
                platform_preferences={
                    'tiktok': {'trending_formats': ['POV', 'Story Time', 'Life Hacks'], 'hashtag_style': 'creative'},
                    'instagram_reels': {'trending_formats': ['Aesthetic', 'Behind Scenes'], 'hashtag_style': 'lifestyle'},
                    'youtube_shorts': {'trending_formats': ['How To', 'Reviews'], 'hashtag_style': 'descriptive'}
                },
                viral_patterns={
                    'hook_starters': ['POV:', 'Tell me why', 'This is why', 'Nobody talks about'],
                    'engagement_phrases': ['Let me know', 'Comment below', 'Tag someone'],
                    'emotional_triggers': ['mind-blown', 'game-changer', 'life-changing']
                },
                emoji_preferences=['🔥', '💯', '✨', '🚀', '👑', '💪', '😍', '🤯']
            ),
            'es': LanguageProfile(
                code='es',
                name='Spanish',
                native_name='Español',
                cultural_context={
                    'humor_style': 'family-oriented, situational comedy, memes',
                    'attention_span': 'medium-long',
                    'trending_topics': ['family', 'food', 'music', 'travel'],
                    'taboo_topics': ['religion_criticism', 'politics_divisive'],
                    'communication_style': 'warm, expressive, community-focused'
                },
                platform_preferences={
                    'tiktok': {'trending_formats': ['Baile', 'Comedia', 'Recetas'], 'hashtag_style': 'emotional'},
                    'instagram_reels': {'trending_formats': ['Outfit', 'Cocina', 'Familia'], 'hashtag_style': 'descriptive'},
                    'youtube_shorts': {'trending_formats': ['Tutorial', 'Reseña'], 'hashtag_style': 'informative'}
                },
                viral_patterns={
                    'hook_starters': ['¿Sabías que', 'No vas a creer', 'Te cuento que', 'Mira esto'],
                    'engagement_phrases': ['Cuéntame', 'Comenta abajo', 'Etiqueta a alguien'],
                    'emotional_triggers': ['increíble', 'impresionante', 'cambió mi vida']
                },
                emoji_preferences=['❤️', '😂', '🙌', '👏', '🔥', '💃', '🎉', '😍']
            ),
            'pt': LanguageProfile(
                code='pt',
                name='Portuguese',
                native_name='Português',
                cultural_context={
                    'humor_style': 'playful, musical, cultural references',
                    'attention_span': 'medium',
                    'trending_topics': ['music', 'sports', 'lifestyle', 'humor'],
                    'taboo_topics': ['politics_partisan', 'economic_criticism'],
                    'communication_style': 'energetic, musical, friendly'
                },
                platform_preferences={
                    'tiktok': {'trending_formats': ['Dance', 'Comédia', 'Trends'], 'hashtag_style': 'rhythmic'},
                    'instagram_reels': {'trending_formats': ['Música', 'Lifestyle'], 'hashtag_style': 'artistic'},
                    'youtube_shorts': {'trending_formats': ['Como Fazer', 'Dicas'], 'hashtag_style': 'helpful'}
                },
                viral_patterns={
                    'hook_starters': ['Olha isso', 'Vocês não acreditam', 'Gente, escuta', 'Vou contar'],
                    'engagement_phrases': ['Me conta', 'Comenta aqui', 'Marca alguém'],
                    'emotional_triggers': ['incrível', 'surreal', 'mudou tudo']
                },
                emoji_preferences=['😂', '❤️', '🔥', '👏', '🙌', '💚', '🇧🇷', '⚡']
            ),
            'fr': LanguageProfile(
                code='fr',
                name='French',
                native_name='Français',
                cultural_context={
                    'humor_style': 'sophisticated, witty, cultural',
                    'attention_span': 'medium-long',
                    'trending_topics': ['fashion', 'cuisine', 'art', 'lifestyle'],
                    'taboo_topics': ['cultural_stereotypes', 'language_criticism'],
                    'communication_style': 'elegant, thoughtful, expressive'
                },
                platform_preferences={
                    'tiktok': {'trending_formats': ['Mode', 'Cuisine', 'Humour'], 'hashtag_style': 'chic'},
                    'instagram_reels': {'trending_formats': ['Fashion', 'Art de vivre'], 'hashtag_style': 'aesthetic'},
                    'youtube_shorts': {'trending_formats': ['Conseils', 'Découverte'], 'hashtag_style': 'informative'}
                },
                viral_patterns={
                    'hook_starters': ['Vous ne devinerez jamais', 'Attendez de voir', 'Je vais vous expliquer'],
                    'engagement_phrases': ['Dites-moi', 'Commentez', 'Partagez votre avis'],
                    'emotional_triggers': ['incroyable', 'magnifique', 'révolutionnaire']
                },
                emoji_preferences=['✨', '🇫🇷', '💖', '🎨', '👌', '🔥', '😍', '💫']
            ),
            'de': LanguageProfile(
                code='de',
                name='German',
                native_name='Deutsch',
                cultural_context={
                    'humor_style': 'direct, situational, dry humor',
                    'attention_span': 'long',
                    'trending_topics': ['technology', 'efficiency', 'education', 'sustainability'],
                    'taboo_topics': ['historical_sensitive', 'stereotypes'],
                    'communication_style': 'precise, informative, methodical'
                },
                platform_preferences={
                    'tiktok': {'trending_formats': ['Bildung', 'Tipps', 'Fakten'], 'hashtag_style': 'precise'},
                    'instagram_reels': {'trending_formats': ['Lifestyle', 'Natur'], 'hashtag_style': 'descriptive'},
                    'youtube_shorts': {'trending_formats': ['Erklärung', 'Review'], 'hashtag_style': 'detailed'}
                },
                viral_patterns={
                    'hook_starters': ['Das wusstet ihr nicht', 'Schaut euch das an', 'Ich erkläre euch'],
                    'engagement_phrases': ['Schreibt mir', 'Was denkt ihr', 'Lasst ein Kommentar'],
                    'emotional_triggers': ['unglaublich', 'revolutionär', 'lebensverändernd']
                },
                emoji_preferences=['🇩🇪', '💡', '⚡', '👍', '🔥', '✅', '📚', '🎯']
            ),
            'ja': LanguageProfile(
                code='ja',
                name='Japanese',
                native_name='日本語',
                cultural_context={
                    'humor_style': 'cute, situational, pop culture',
                    'attention_span': 'short-medium',
                    'trending_topics': ['kawaii', 'anime', 'food', 'technology'],
                    'taboo_topics': ['personal_criticism', 'cultural_disrespect'],
                    'communication_style': 'polite, enthusiastic, detailed'
                },
                platform_preferences={
                    'tiktok': {'trending_formats': ['かわいい', 'おもしろい', 'トレンド'], 'hashtag_style': 'cute'},
                    'instagram_reels': {'trending_formats': ['ファッション', 'フード'], 'hashtag_style': 'aesthetic'},
                    'youtube_shorts': {'trending_formats': ['やってみた', 'レビュー'], 'hashtag_style': 'detailed'}
                },
                viral_patterns={
                    'hook_starters': ['見てください', 'すごいことが', 'これは知らなかった'],
                    'engagement_phrases': ['コメントして', '教えて', 'どう思う？'],
                    'emotional_triggers': ['すごい', 'びっくり', '感動']
                },
                emoji_preferences=['✨', '🎌', '😍', '👏', '💖', '🌸', '⭐', '💫']
            ),
            'ko': LanguageProfile(
                code='ko',
                name='Korean',
                native_name='한국어',
                cultural_context={
                    'humor_style': 'trendy, pop culture, situational',
                    'attention_span': 'short',
                    'trending_topics': ['K-pop', 'beauty', 'food', 'lifestyle'],
                    'taboo_topics': ['politics_sensitive', 'cultural_appropriation'],
                    'communication_style': 'trendy, expressive, community-focused'
                },
                platform_preferences={
                    'tiktok': {'trending_formats': ['케이팝', '뷰티', '일상'], 'hashtag_style': 'trendy'},
                    'instagram_reels': {'trending_formats': ['OOTD', '먹방'], 'hashtag_style': 'stylish'},
                    'youtube_shorts': {'trending_formats': ['리뷰', '브이로그'], 'hashtag_style': 'descriptive'}
                },
                viral_patterns={
                    'hook_starters': ['대박', '진짜 미쳤다', '이거 봐', '레전드'],
                    'engagement_phrases': ['댓글로 알려줘', '어떻게 생각해?', '공감하면 좋아요'],
                    'emotional_triggers': ['대박', '미쳤다', '완전']
                },
                emoji_preferences=['💖', '✨', '🔥', '👏', '😍', '🇰🇷', '💫', '🎉']
            ),
            'zh': LanguageProfile(
                code='zh',
                name='Chinese',
                native_name='中文',
                cultural_context={
                    'humor_style': 'wordplay, cultural references, memes',
                    'attention_span': 'medium',
                    'trending_topics': ['technology', 'lifestyle', 'education', 'business'],
                    'taboo_topics': ['politics', 'sensitive_history'],
                    'communication_style': 'efficient, informative, community-oriented'
                },
                platform_preferences={
                    'tiktok': {'trending_formats': ['生活', '搞笑', '教程'], 'hashtag_style': 'concise'},
                    'instagram_reels': {'trending_formats': ['时尚', '美食'], 'hashtag_style': 'descriptive'},
                    'youtube_shorts': {'trending_formats': ['评测', '教学'], 'hashtag_style': 'informative'}
                },
                viral_patterns={
                    'hook_starters': ['你不知道的', '太震惊了', '这个方法', '必须看'],
                    'engagement_phrases': ['留言告诉我', '你觉得怎么样', '分享给朋友'],
                    'emotional_triggers': ['太棒了', '震惊', '改变一切']
                },
                emoji_preferences=['🔥', '👍', '✨', '😍', '💪', '🎉', '⭐', '👏']
            ),
            'ar': LanguageProfile(
                code='ar',
                name='Arabic',
                native_name='العربية',
                cultural_context={
                    'humor_style': 'family-oriented, situational, respectful',
                    'attention_span': 'medium-long',
                    'trending_topics': ['family', 'culture', 'food', 'travel'],
                    'taboo_topics': ['religion_controversial', 'cultural_sensitive'],
                    'communication_style': 'respectful, expressive, family-focused'
                },
                platform_preferences={
                    'tiktok': {'trending_formats': ['كوميديا', 'طبخ', 'عائلة'], 'hashtag_style': 'respectful'},
                    'instagram_reels': {'trending_formats': ['موضة', 'سفر'], 'hashtag_style': 'cultural'},
                    'youtube_shorts': {'trending_formats': ['تعليم', 'نصائح'], 'hashtag_style': 'helpful'}
                },
                viral_patterns={
                    'hook_starters': ['لن تصدقوا', 'شاهدوا هذا', 'أخبروني رأيكم'],
                    'engagement_phrases': ['اتركوا تعليق', 'ما رأيكم', 'شاركوا أصدقائكم'],
                    'emotional_triggers': ['مذهل', 'رائع', 'غير حياتي']
                },
                emoji_preferences=['🤲', '❤️', '✨', '👏', '🔥', '😍', '🙌', '💖']
            ),
            'hi': LanguageProfile(
                code='hi',
                name='Hindi',
                native_name='हिन्दी',
                cultural_context={
                    'humor_style': 'family-oriented, Bollywood references, situational',
                    'attention_span': 'medium',
                    'trending_topics': ['Bollywood', 'family', 'food', 'festivals'],
                    'taboo_topics': ['religion_divisive', 'caste_system'],
                    'communication_style': 'expressive, emotional, family-centered'
                },
                platform_preferences={
                    'tiktok': {'trending_formats': ['कॉमेडी', 'डांस', 'खाना'], 'hashtag_style': 'emotional'},
                    'instagram_reels': {'trending_formats': ['फैशन', 'त्योहार'], 'hashtag_style': 'cultural'},
                    'youtube_shorts': {'trending_formats': ['रेसिपी', 'टिप्स'], 'hashtag_style': 'helpful'}
                },
                viral_patterns={
                    'hook_starters': ['देखिए क्या हुआ', 'आपको पता नहीं', 'यह जरूर देखें'],
                    'engagement_phrases': ['कमेंट करें', 'बताइए', 'शेयर करें'],
                    'emotional_triggers': ['अविश्वसनीय', 'शानदार', 'जिंदगी बदल गई']
                },
                emoji_preferences=['🙏', '❤️', '🔥', '👏', '✨', '😍', '🇮🇳', '🎉']
            )
        }
    
    async def optimize_for_languages(self, content: Dict, target_languages: List[str], 
                                   platforms: List[str]) -> Dict:
        """Optimize content for multiple languages and cultural contexts"""
        try:
            # Detect source language
            source_lang = await self._detect_language(content.get('text', ''))
            
            optimizations = {}
            
            for lang_code in target_languages:
                if lang_code not in self.language_profiles:
                    continue
                
                lang_profile = self.language_profiles[lang_code]
                
                # Optimize content for this language
                lang_optimization = await self._optimize_for_language(
                    content, lang_profile, platforms, source_lang
                )
                
                optimizations[lang_code] = lang_optimization
            
            return {
                'source_language': source_lang,
                'optimizations': optimizations,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Multi-language optimization error: {e}")
            return self._mock_multilang_optimization(target_languages, platforms)
    
    async def _detect_language(self, text: str) -> str:
        """Detect the source language of content"""
        try:
            detected = langdetect.detect(text)
            return detected
        except:
            return 'en'  # Default to English
    
    async def _optimize_for_language(self, content: Dict, lang_profile: LanguageProfile, 
                                   platforms: List[str], source_lang: str) -> Dict:
        """Optimize content for specific language and culture"""
        try:
            if not self.openai_client or not self.openai_client.api_key:
                return self._mock_language_optimization(lang_profile, platforms)
            
            original_text = content.get('text', '')
            
            prompt = f"""
            Optimize this content for {lang_profile.native_name} ({lang_profile.name}) speakers across {', '.join(platforms)}:
            
            Original Content: {original_text}
            
            Cultural Context:
            - Communication Style: {lang_profile.cultural_context['communication_style']}
            - Humor Style: {lang_profile.cultural_context['humor_style']}
            - Trending Topics: {', '.join(lang_profile.cultural_context['trending_topics'])}
            - Avoid: {', '.join(lang_profile.cultural_context.get('taboo_topics', []))}
            
            Optimization Requirements:
            1. Translate and culturally adapt (not just literal translation)
            2. Use viral hook patterns: {', '.join(lang_profile.viral_patterns['hook_starters'][:3])}
            3. Include engagement phrases: {', '.join(lang_profile.viral_patterns['engagement_phrases'][:2])}
            4. Add emotional triggers: {', '.join(lang_profile.viral_patterns['emotional_triggers'][:3])}
            5. Adapt for cultural context and local trends
            6. Optimize for platform preferences in this language
            7. Include appropriate emojis: {' '.join(lang_profile.emoji_preferences[:5])}
            
            Return as JSON with:
            - optimized_text: culturally adapted content
            - platform_variations: specific adaptations per platform
            - cultural_notes: important cultural considerations
            - hashtag_suggestions: language-specific hashtags
            - emoji_recommendations: culturally appropriate emojis
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": f"You are a native {lang_profile.name} speaker and viral content expert. Create culturally authentic, engaging content."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=800,
                temperature=0.7
            )
            
            optimization_data = json.loads(response.choices[0].message.content)
            
            # Add platform-specific optimizations
            platform_optimizations = {}
            for platform in platforms:
                platform_opt = await self._optimize_for_platform_language(
                    optimization_data.get('optimized_text', ''), 
                    lang_profile, 
                    platform
                )
                platform_optimizations[platform] = platform_opt
            
            return {
                'language': lang_profile.name,
                'language_code': lang_profile.code,
                'optimized_content': optimization_data,
                'platform_optimizations': platform_optimizations,
                'cultural_score': self._calculate_cultural_score(optimization_data),
                'estimated_engagement_boost': self._estimate_engagement_boost(lang_profile, platforms)
            }
            
        except Exception as e:
            print(f"Language optimization error for {lang_profile.name}: {e}")
            return self._mock_language_optimization(lang_profile, platforms)
    
    async def _optimize_for_platform_language(self, text: str, lang_profile: LanguageProfile, 
                                            platform: str) -> Dict:
        """Optimize content for specific platform in target language"""
        platform_prefs = lang_profile.platform_preferences.get(platform, {})
        
        return {
            'optimized_text': text,
            'trending_formats': platform_prefs.get('trending_formats', []),
            'hashtag_style': platform_prefs.get('hashtag_style', 'general'),
            'recommended_length': self._get_platform_length_recommendation(platform, lang_profile.code),
            'cultural_adaptations': self._get_cultural_adaptations(platform, lang_profile)
        }
    
    def _get_platform_length_recommendation(self, platform: str, language: str) -> Dict:
        """Get platform-specific length recommendations for language"""
        base_lengths = {
            'tiktok': {'min': 15, 'max': 60, 'optimal': 30},
            'instagram_reels': {'min': 15, 'max': 90, 'optimal': 45},
            'youtube_shorts': {'min': 15, 'max': 60, 'optimal': 40}
        }
        
        # Adjust for language verbosity
        verbosity_multipliers = {
            'de': 1.2,  # German tends to be longer
            'ar': 1.1,  # Arabic can be more descriptive
            'zh': 0.8,  # Chinese can be more concise
            'ja': 0.9,  # Japanese can be efficient
            'en': 1.0   # Base reference
        }
        
        base = base_lengths.get(platform, base_lengths['tiktok'])
        multiplier = verbosity_multipliers.get(language, 1.0)
        
        return {
            'min_seconds': int(base['min'] * multiplier),
            'max_seconds': int(base['max'] * multiplier),
            'optimal_seconds': int(base['optimal'] * multiplier)
        }
    
    def _get_cultural_adaptations(self, platform: str, lang_profile: LanguageProfile) -> List[str]:
        """Get cultural adaptation recommendations"""
        adaptations = []
        
        cultural_context = lang_profile.cultural_context
        
        if cultural_context['attention_span'] == 'short':
            adaptations.append('Use quick pacing and frequent hooks')
        elif cultural_context['attention_span'] == 'long':
            adaptations.append('Can use more detailed explanations')
        
        if 'family' in cultural_context['trending_topics']:
            adaptations.append('Include family-friendly content themes')
        
        if 'respectful' in cultural_context['communication_style']:
            adaptations.append('Maintain respectful tone throughout')
        
        return adaptations
    
    def _calculate_cultural_score(self, optimization_data: Dict) -> float:
        """Calculate cultural adaptation score"""
        base_score = 0.7
        
        # Check for cultural elements
        if optimization_data.get('cultural_notes'):
            base_score += 0.15
        
        # Check for appropriate emojis
        if optimization_data.get('emoji_recommendations'):
            base_score += 0.1
        
        # Check for platform variations
        if optimization_data.get('platform_variations'):
            base_score += 0.05
        
        return min(base_score, 1.0)
    
    def _estimate_engagement_boost(self, lang_profile: LanguageProfile, platforms: List[str]) -> Dict:
        """Estimate engagement boost from cultural optimization"""
        base_boost = 0.3  # 30% base improvement
        
        # Cultural adaptation bonus
        cultural_bonus = 0.2 if lang_profile.cultural_context['communication_style'] == 'expressive' else 0.1
        
        # Platform-specific bonus
        platform_bonus = len(platforms) * 0.05
        
        total_boost = min(base_boost + cultural_bonus + platform_bonus, 0.8)
        
        return {
            'total_boost': total_boost,
            'cultural_adaptation_bonus': cultural_bonus,
            'platform_optimization_bonus': platform_bonus,
            'estimated_improvement': f"{int(total_boost * 100)}% higher engagement"
        }
    
    async def generate_multilingual_captions(self, video_metadata: Dict, 
                                           languages: List[str]) -> Dict:
        """Generate captions in multiple languages"""
        captions = {}
        
        for lang_code in languages:
            if lang_code not in self.language_profiles:
                continue
            
            lang_profile = self.language_profiles[lang_code]
            
            # Generate culturally appropriate captions
            caption = await self._generate_language_caption(video_metadata, lang_profile)
            captions[lang_code] = caption
        
        return {
            'multilingual_captions': captions,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    async def _generate_language_caption(self, video_metadata: Dict, 
                                       lang_profile: LanguageProfile) -> Dict:
        """Generate caption for specific language"""
        try:
            if not self.openai_client or not self.openai_client.api_key:
                return self._mock_language_caption(lang_profile)
            
            title = video_metadata.get('title', '')
            description = video_metadata.get('description', '')
            
            prompt = f"""
            Create an engaging social media caption in {lang_profile.native_name} for this video:
            
            Title: {title}
            Description: {description}
            
            Requirements:
            - Use native {lang_profile.name} expressions and cultural references
            - Include viral hook from: {', '.join(lang_profile.viral_patterns['hook_starters'][:2])}
            - Add engagement phrase: {lang_profile.viral_patterns['engagement_phrases'][0]}
            - Include appropriate emojis: {' '.join(lang_profile.emoji_preferences[:3])}
            - Match communication style: {lang_profile.cultural_context['communication_style']}
            - Keep culturally appropriate and engaging
            
            Return as JSON with caption, hashtags, and cultural notes.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": f"You are a native {lang_profile.name} speaker creating viral social media content."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=400,
                temperature=0.8
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"Caption generation error for {lang_profile.name}: {e}")
            return self._mock_language_caption(lang_profile)
    
    # Mock functions for testing
    def _mock_multilang_optimization(self, target_languages: List[str], platforms: List[str]) -> Dict:
        """Mock multi-language optimization"""
        optimizations = {}
        
        for lang_code in target_languages:
            if lang_code in self.language_profiles:
                lang_profile = self.language_profiles[lang_code]
                optimizations[lang_code] = self._mock_language_optimization(lang_profile, platforms)
        
        return {
            'source_language': 'en',
            'optimizations': optimizations,
            'generated_at': datetime.utcnow().isoformat()
        }
    
    def _mock_language_optimization(self, lang_profile: LanguageProfile, platforms: List[str]) -> Dict:
        """Mock language-specific optimization"""
        return {
            'language': lang_profile.name,
            'language_code': lang_profile.code,
            'optimized_content': {
                'optimized_text': f"Mock optimized content in {lang_profile.native_name}",
                'cultural_notes': [f"Adapted for {lang_profile.name} cultural context"],
                'hashtag_suggestions': [f"#{lang_profile.code}content", "#viral"],
                'emoji_recommendations': lang_profile.emoji_preferences[:5]
            },
            'platform_optimizations': {
                platform: {
                    'trending_formats': lang_profile.platform_preferences.get(platform, {}).get('trending_formats', []),
                    'hashtag_style': lang_profile.platform_preferences.get(platform, {}).get('hashtag_style', 'general')
                } for platform in platforms
            },
            'cultural_score': 0.85,
            'estimated_engagement_boost': {
                'total_boost': 0.4,
                'estimated_improvement': '40% higher engagement'
            }
        }
    
    def _mock_language_caption(self, lang_profile: LanguageProfile) -> Dict:
        """Mock language-specific caption"""
        return {
            'caption': f"Mock engaging caption in {lang_profile.native_name} {lang_profile.emoji_preferences[0]}",
            'hashtags': [f"#{lang_profile.code}viral", "#trending"],
            'cultural_notes': [f"Uses {lang_profile.name} cultural expressions"]
        }