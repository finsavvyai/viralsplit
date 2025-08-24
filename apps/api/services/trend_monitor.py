import asyncio
import aiohttp
import json
import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import openai
from dataclasses import dataclass
import sqlite3
import threading
import time
from collections import defaultdict
import re
import hashlib

@dataclass
class TrendData:
    topic: str
    platform: str
    momentum_score: float
    velocity: float
    predicted_peak: datetime
    confidence: float
    keywords: List[str]
    sample_content: List[str]
    first_detected: datetime

class RealTimeTrendMonitor:
    """Real-time viral trend monitoring and prediction system"""
    
    def __init__(self):
        # Initialize OpenAI client with graceful handling of missing API key
        api_key = os.getenv('OPENAI_API_KEY')
        self.openai_client = openai.Client(api_key=api_key) if api_key else None
        self.trends_db = "trends.db"
        self.monitoring_active = False
        self.trend_cache = {}
        self.momentum_tracker = defaultdict(list)
        self.init_database()
        
        # Platform-specific monitoring parameters
        self.platform_configs = {
            'tiktok': {
                'check_interval': 300,  # 5 minutes
                'momentum_threshold': 0.7,
                'velocity_weight': 0.8,
                'keyword_sensitivity': 0.6
            },
            'instagram_reels': {
                'check_interval': 600,  # 10 minutes
                'momentum_threshold': 0.6,
                'velocity_weight': 0.7,
                'keyword_sensitivity': 0.5
            },
            'youtube_shorts': {
                'check_interval': 900,  # 15 minutes
                'momentum_threshold': 0.65,
                'velocity_weight': 0.75,
                'keyword_sensitivity': 0.55
            }
        }
    
    def init_database(self):
        """Initialize trends database"""
        conn = sqlite3.connect(self.trends_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                platform TEXT NOT NULL,
                momentum_score REAL,
                velocity REAL,
                predicted_peak TEXT,
                confidence REAL,
                keywords TEXT,
                sample_content TEXT,
                first_detected TEXT,
                last_updated TEXT,
                status TEXT DEFAULT 'active'
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trend_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trend_id INTEGER,
                timestamp TEXT,
                momentum_score REAL,
                engagement_data TEXT,
                FOREIGN KEY (trend_id) REFERENCES trends (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    async def start_monitoring(self):
        """Start real-time trend monitoring"""
        if self.monitoring_active:
            return
        
        self.monitoring_active = True
        print("🔥 Starting Real-Time Viral Trend Monitor...")
        
        # Start monitoring tasks for each platform
        tasks = []
        for platform in self.platform_configs.keys():
            task = asyncio.create_task(self._monitor_platform(platform))
            tasks.append(task)
        
        # Start trend analysis task
        analysis_task = asyncio.create_task(self._analyze_trends())
        tasks.append(analysis_task)
        
        # Start cleanup task
        cleanup_task = asyncio.create_task(self._cleanup_old_trends())
        tasks.append(cleanup_task)
        
        await asyncio.gather(*tasks)
    
    async def stop_monitoring(self):
        """Stop trend monitoring"""
        self.monitoring_active = False
        print("🛑 Stopping Real-Time Viral Trend Monitor...")
    
    async def _monitor_platform(self, platform: str):
        """Monitor trends for a specific platform"""
        config = self.platform_configs[platform]
        
        while self.monitoring_active:
            try:
                print(f"📊 Scanning {platform} for emerging trends...")
                
                # Simulate trend detection (in production, integrate with platform APIs)
                trends = await self._detect_platform_trends(platform)
                
                for trend in trends:
                    await self._process_trend(trend)
                
                await asyncio.sleep(config['check_interval'])
                
            except Exception as e:
                print(f"❌ Error monitoring {platform}: {e}")
                await asyncio.sleep(60)  # Wait before retry
    
    async def _detect_platform_trends(self, platform: str) -> List[Dict]:
        """Detect emerging trends on platform (mock implementation)"""
        # In production, this would integrate with:
        # - TikTok API for hashtag trends
        # - Instagram Graph API for story mentions
        # - YouTube Data API for search trends
        # - Twitter API for trending topics
        # - Reddit API for hot posts
        
        mock_trends = {
            'tiktok': [
                {
                    'topic': 'AI productivity morning routine',
                    'keywords': ['ai productivity', 'morning routine', 'chatgpt hacks'],
                    'engagement_velocity': 0.85,
                    'content_samples': [
                        'My AI-powered 5AM routine changed everything',
                        'Using ChatGPT to plan my entire day',
                        'AI tools that replaced my assistant'
                    ]
                },
                {
                    'topic': 'Micro-habit stacking 2025',
                    'keywords': ['micro habits', 'habit stacking', '2025 goals'],
                    'engagement_velocity': 0.72,
                    'content_samples': [
                        '3 micro-habits that transformed my year',
                        'Habit stacking for busy entrepreneurs',
                        'Build habits in 60 seconds daily'
                    ]
                }
            ],
            'instagram_reels': [
                {
                    'topic': 'Aesthetic home office setups',
                    'keywords': ['home office', 'aesthetic setup', 'productivity space'],
                    'engagement_velocity': 0.68,
                    'content_samples': [
                        'Home office glow-up under $200',
                        'Aesthetic productivity space tour',
                        'Work from home setup essentials'
                    ]
                }
            ]
        }
        
        return mock_trends.get(platform, [])
    
    async def _process_trend(self, trend_data: Dict):
        """Process and analyze a detected trend"""
        topic = trend_data['topic']
        platform = trend_data.get('platform', 'unknown')
        
        # Calculate momentum score using AI
        momentum = await self._calculate_momentum_score(trend_data)
        
        # Predict viral potential
        viral_potential = await self._predict_viral_potential(trend_data)
        
        # Store trend data
        trend = TrendData(
            topic=topic,
            platform=platform,
            momentum_score=momentum,
            velocity=trend_data.get('engagement_velocity', 0.5),
            predicted_peak=datetime.utcnow() + timedelta(hours=24),
            confidence=viral_potential.get('confidence', 0.7),
            keywords=trend_data.get('keywords', []),
            sample_content=trend_data.get('content_samples', []),
            first_detected=datetime.utcnow()
        )
        
        await self._save_trend(trend)
        
        # Update momentum tracker
        self.momentum_tracker[f"{platform}:{topic}"].append({
            'timestamp': datetime.utcnow(),
            'score': momentum
        })
        
        print(f"🔥 New trend detected: {topic} ({platform}) - Momentum: {momentum:.2f}")
    
    async def _calculate_momentum_score(self, trend_data: Dict) -> float:
        """Calculate trend momentum using AI analysis"""
        try:
            if not self.openai_client or not self.openai_client.api_key:
                return trend_data.get('engagement_velocity', 0.5)
            
            content_sample = '\n'.join(trend_data.get('content_samples', []))
            keywords = ', '.join(trend_data.get('keywords', []))
            
            prompt = f"""
            Analyze this trending topic for viral momentum potential:
            
            Topic: {trend_data['topic']}
            Keywords: {keywords}
            Content Examples: {content_sample}
            
            Rate the viral momentum (0.0-1.0) based on:
            1. Topic novelty and uniqueness
            2. Emotional engagement potential
            3. Shareability and relatability
            4. Timing and cultural relevance
            5. Cross-platform potential
            
            Return only the numeric score (0.0-1.0).
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a viral trend analyst. Analyze content momentum potential with high accuracy."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=50,
                temperature=0.3
            )
            
            score_text = response.choices[0].message.content.strip()
            score = float(re.search(r'0\.\d+|1\.0', score_text).group())
            return max(0.0, min(1.0, score))
            
        except Exception as e:
            print(f"Error calculating momentum: {e}")
            return trend_data.get('engagement_velocity', 0.5)
    
    async def _predict_viral_potential(self, trend_data: Dict) -> Dict:
        """Predict viral potential using advanced AI analysis"""
        try:
            if not self.openai_client or not self.openai_client.api_key:
                return {'confidence': 0.7, 'potential': 'medium'}
            
            content_sample = '\n'.join(trend_data.get('content_samples', []))
            
            prompt = f"""
            Predict viral potential for this trending topic:
            
            Topic: {trend_data['topic']}
            Content Examples: {content_sample}
            
            Analyze:
            1. Viral ceiling potential (low/medium/high/breakout)
            2. Time to peak virality (hours)
            3. Cross-platform spillover potential
            4. Sustainability (flash trend vs lasting trend)
            5. Audience appeal breadth
            
            Return as JSON with confidence score (0-1) and detailed predictions.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are a viral prediction expert. Analyze trend potential with scientific precision."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=400,
                temperature=0.4
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"Error predicting viral potential: {e}")
            return {'confidence': 0.7, 'potential': 'medium'}
    
    async def _save_trend(self, trend: TrendData):
        """Save trend to database"""
        conn = sqlite3.connect(self.trends_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO trends (
                topic, platform, momentum_score, velocity, 
                predicted_peak, confidence, keywords, sample_content,
                first_detected, last_updated, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            trend.topic,
            trend.platform,
            trend.momentum_score,
            trend.velocity,
            trend.predicted_peak.isoformat(),
            trend.confidence,
            json.dumps(trend.keywords),
            json.dumps(trend.sample_content),
            trend.first_detected.isoformat(),
            datetime.utcnow().isoformat(),
            'active'
        ))
        
        conn.commit()
        conn.close()
    
    async def _analyze_trends(self):
        """Analyze trend patterns and update predictions"""
        while self.monitoring_active:
            try:
                print("🧠 Analyzing trend patterns...")
                
                # Get active trends
                trends = await self._get_active_trends()
                
                for trend in trends:
                    # Update momentum based on historical data
                    await self._update_trend_momentum(trend)
                    
                    # Check if trend has peaked
                    if await self._has_trend_peaked(trend):
                        await self._mark_trend_peaked(trend)
                
                await asyncio.sleep(1800)  # Analyze every 30 minutes
                
            except Exception as e:
                print(f"❌ Error analyzing trends: {e}")
                await asyncio.sleep(300)
    
    async def _cleanup_old_trends(self):
        """Clean up old and peaked trends"""
        while self.monitoring_active:
            try:
                cutoff_date = datetime.utcnow() - timedelta(days=7)
                
                conn = sqlite3.connect(self.trends_db)
                cursor = conn.cursor()
                
                cursor.execute('''
                    UPDATE trends SET status = 'archived'
                    WHERE first_detected < ? AND status != 'archived'
                ''', (cutoff_date.isoformat(),))
                
                conn.commit()
                conn.close()
                
                print("🧹 Cleaned up old trends")
                await asyncio.sleep(3600)  # Clean every hour
                
            except Exception as e:
                print(f"❌ Error cleaning trends: {e}")
                await asyncio.sleep(1800)
    
    async def get_real_time_trends(self, platforms: List[str] = None, limit: int = 10) -> List[Dict]:
        """Get current real-time trends"""
        conn = sqlite3.connect(self.trends_db)
        cursor = conn.cursor()
        
        where_clause = "WHERE status = 'active'"
        params = []
        
        if platforms:
            placeholders = ','.join(['?' for _ in platforms])
            where_clause += f" AND platform IN ({placeholders})"
            params.extend(platforms)
        
        cursor.execute(f'''
            SELECT topic, platform, momentum_score, velocity, 
                   predicted_peak, confidence, keywords, sample_content,
                   first_detected, last_updated
            FROM trends {where_clause}
            ORDER BY momentum_score DESC, first_detected DESC
            LIMIT ?
        ''', params + [limit])
        
        trends = []
        for row in cursor.fetchall():
            trends.append({
                'topic': row[0],
                'platform': row[1],
                'momentum_score': row[2],
                'velocity': row[3],
                'predicted_peak': row[4],
                'confidence': row[5],
                'keywords': json.loads(row[6]),
                'sample_content': json.loads(row[7]),
                'first_detected': row[8],
                'last_updated': row[9],
                'status': 'trending' if row[2] > 0.7 else 'emerging'
            })
        
        conn.close()
        return trends
    
    async def _get_active_trends(self) -> List[Dict]:
        """Get all active trends for analysis"""
        return await self.get_real_time_trends(limit=100)
    
    async def _update_trend_momentum(self, trend: Dict):
        """Update trend momentum based on recent data"""
        # In production: analyze recent engagement data
        # For now: simulate momentum decay
        pass
    
    async def _has_trend_peaked(self, trend: Dict) -> bool:
        """Check if trend has reached its peak"""
        predicted_peak = datetime.fromisoformat(trend['predicted_peak'])
        return datetime.utcnow() > predicted_peak
    
    async def _mark_trend_peaked(self, trend: Dict):
        """Mark trend as peaked"""
        conn = sqlite3.connect(self.trends_db)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE trends SET status = 'peaked', last_updated = ?
            WHERE topic = ? AND platform = ?
        ''', (datetime.utcnow().isoformat(), trend['topic'], trend['platform']))
        
        conn.commit()
        conn.close()

# Global trend monitor instance
trend_monitor = RealTimeTrendMonitor()

async def start_trend_monitoring():
    """Start the global trend monitor"""
    await trend_monitor.start_monitoring()

async def get_live_trends(platforms: List[str] = None, limit: int = 10) -> List[Dict]:
    """Get current live trends"""
    return await trend_monitor.get_real_time_trends(platforms, limit)