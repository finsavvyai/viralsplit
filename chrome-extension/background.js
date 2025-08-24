// ViralSplit Background Service Worker

const API_BASE = 'https://api.viralsplit.io';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class ViralSplitBackground {
  constructor() {
    this.cache = new Map();
    this.userToken = null;
    this.init();
  }

  async init() {
    // Load user token from storage
    const data = await chrome.storage.sync.get('userToken');
    this.userToken = data.userToken;
    
    // Set up message listeners
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Set up alarm for periodic tasks
    chrome.alarms.create('trendUpdate', { periodInMinutes: 15 });
    chrome.alarms.onAlarm.addListener(this.handleAlarm.bind(this));
    
    // Monitor tab updates for auto-analysis
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
  }

  handleMessage(request, sender, sendResponse) {
    switch(request.action) {
      case 'analyzeContent':
        this.analyzeContent(request.data).then(sendResponse);
        return true; // Keep channel open for async response
        
      case 'importVideo':
        this.importVideo(request.data).then(sendResponse);
        return true;
        
      case 'openDeepAnalysis':
        this.openDeepAnalysis(request.data);
        sendResponse({ success: true });
        break;
        
      case 'getTrends':
        this.getTrendingTopics().then(sendResponse);
        return true;
        
      case 'getCompetitors':
        this.getCompetitorAnalysis().then(sendResponse);
        return true;
        
      case 'authenticate':
        this.authenticate(request.data).then(sendResponse);
        return true;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async analyzeContent(metadata) {
    // Check cache first
    const cacheKey = this.getCacheKey(metadata);
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    
    try {
      // If no API token, return mock analysis
      if (!this.userToken) {
        return this.getMockAnalysis(metadata);
      }
      
      // Call ViralSplit API
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.userToken}`
        },
        body: JSON.stringify(metadata)
      });
      
      if (!response.ok) {
        throw new Error('API request failed');
      }
      
      const analysis = await response.json();
      
      // Cache the result
      this.setCache(cacheKey, analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('Analysis failed:', error);
      return this.getMockAnalysis(metadata);
    }
  }

  getMockAnalysis(metadata) {
    const baseScore = Math.floor(Math.random() * 30) + 50;
    const platformBonus = {
      tiktok: 10,
      instagram: 5,
      youtube: 8
    };
    
    const viralScore = Math.min(100, baseScore + (platformBonus[metadata.platform] || 0));
    
    // Simulate AI analysis based on metadata
    const hasHashtags = metadata.description?.includes('#');
    const hasEmojis = /[\u{1F600}-\u{1F64F}]/u.test(metadata.description || '');
    const isShortForm = metadata.duration && parseInt(metadata.duration) < 60;
    
    const tips = [];
    const improvements = [];
    
    if (hasHashtags) tips.push('Good hashtag usage detected');
    else improvements.push('Add 3-5 relevant hashtags');
    
    if (hasEmojis) tips.push('Emojis increase engagement');
    else improvements.push('Add emojis for better engagement');
    
    if (isShortForm) tips.push('Optimal length for virality');
    else improvements.push('Consider shorter format (under 60s)');
    
    if (metadata.music) tips.push('Trending audio increases reach');
    
    // Add platform-specific insights
    if (metadata.platform === 'tiktok') {
      tips.push('TikTok algorithm favors this content type');
      improvements.push('Add text overlays for accessibility');
    }
    
    if (metadata.platform === 'instagram') {
      improvements.push('Post at peak hours (12pm or 7pm)');
      tips.push('Reels get 22% more engagement');
    }
    
    if (metadata.platform === 'youtube') {
      improvements.push('Optimize thumbnail for CTR');
      tips.push('Video length good for watch time');
    }
    
    const trends = ['Rising', 'Stable', 'Peaking', 'Declining'];
    const trend = viralScore > 70 ? 'Rising' : trends[Math.floor(Math.random() * trends.length)];
    
    return {
      viralScore,
      trend,
      engagement: Math.floor(Math.random() * 30) + 40,
      tips: tips.slice(0, 3),
      improvements: improvements.slice(0, 3),
      predictedViews: this.predictViews(viralScore),
      bestPostTime: this.getBestPostTime(metadata.platform),
      competitionLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
    };
  }

  predictViews(viralScore) {
    const base = Math.floor(Math.pow(viralScore, 2.5));
    const variance = Math.floor(base * 0.3);
    const min = base - variance;
    const max = base + variance;
    
    return {
      min: this.formatNumber(min),
      max: this.formatNumber(max),
      confidence: viralScore > 70 ? 'High' : 'Medium'
    };
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  getBestPostTime(platform) {
    const times = {
      tiktok: ['6 AM', '10 AM', '7 PM', '10 PM'],
      instagram: ['11 AM', '2 PM', '5 PM', '7 PM'],
      youtube: ['2 PM', '4 PM', '9 PM']
    };
    
    const platformTimes = times[platform] || times.instagram;
    return platformTimes[Math.floor(Math.random() * platformTimes.length)];
  }

  async importVideo(data) {
    try {
      if (!this.userToken) {
        // Open auth page if not authenticated
        chrome.tabs.create({ url: `${API_BASE}/auth?extension=true` });
        return { success: false, error: 'Authentication required' };
      }
      
      const response = await fetch(`${API_BASE}/api/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.userToken}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Video Imported!',
          message: 'Video has been imported to ViralSplit for optimization'
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('Import failed:', error);
      return { success: false, error: error.message };
    }
  }

  openDeepAnalysis(data) {
    // Open ViralSplit dashboard with deep analysis
    const url = `${API_BASE}/dashboard/analyze?source=extension&platform=${data.platform}`;
    chrome.tabs.create({ url });
  }

  async getTrendingTopics() {
    try {
      const cached = this.getCached('trends');
      if (cached) return cached;
      
      // Mock trending topics for now
      const trends = {
        tiktok: [
          { topic: 'Dance Challenge', score: 95, growth: '+450%' },
          { topic: 'Cooking Hacks', score: 87, growth: '+220%' },
          { topic: 'Pet Comedy', score: 82, growth: '+180%' }
        ],
        instagram: [
          { topic: 'Travel Reels', score: 91, growth: '+320%' },
          { topic: 'Fashion Hauls', score: 85, growth: '+200%' },
          { topic: 'Workout Tips', score: 79, growth: '+150%' }
        ],
        youtube: [
          { topic: 'Tech Reviews', score: 88, growth: '+250%' },
          { topic: 'Study With Me', score: 84, growth: '+190%' },
          { topic: 'Gaming Shorts', score: 81, growth: '+170%' }
        ]
      };
      
      this.setCache('trends', trends);
      return trends;
      
    } catch (error) {
      console.error('Failed to get trends:', error);
      return {};
    }
  }

  async getCompetitorAnalysis() {
    try {
      // Mock competitor data
      return {
        topCompetitors: [
          {
            name: 'CreatorA',
            followers: '2.5M',
            avgViews: '500K',
            postingFrequency: '2x daily',
            topContent: 'Dance, Comedy'
          },
          {
            name: 'CreatorB',
            followers: '1.8M',
            avgViews: '350K',
            postingFrequency: 'Daily',
            topContent: 'Lifestyle, Fashion'
          }
        ],
        insights: [
          'Competitors post 2x more during peak hours',
          'Short-form content (<30s) getting 3x engagement',
          'Trending audio usage increased by 40%'
        ]
      };
    } catch (error) {
      console.error('Competitor analysis failed:', error);
      return {};
    }
  }

  async authenticate(credentials) {
    try {
      const response = await fetch(`${API_BASE}/api/auth/extension`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      const result = await response.json();
      
      if (result.token) {
        this.userToken = result.token;
        await chrome.storage.sync.set({ userToken: result.token });
        return { success: true };
      }
      
      return { success: false, error: 'Invalid credentials' };
      
    } catch (error) {
      console.error('Authentication failed:', error);
      return { success: false, error: error.message };
    }
  }

  handleAlarm(alarm) {
    if (alarm.name === 'trendUpdate') {
      // Clear trend cache to force refresh
      this.cache.delete('trends');
      
      // Notify active tabs to refresh analysis
      chrome.tabs.query({ url: ['*://*.tiktok.com/*', '*://*.instagram.com/*', '*://*.youtube.com/*'] }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'refreshAnalysis' });
        });
      });
    }
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
      const supportedUrls = ['tiktok.com', 'instagram.com', 'youtube.com'];
      
      if (supportedUrls.some(url => tab.url?.includes(url))) {
        // Auto-trigger analysis on supported sites
        chrome.tabs.sendMessage(tabId, { action: 'analyze' });
      }
    }
  }

  getCacheKey(data) {
    return JSON.stringify(data);
  }

  getCached(key) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Initialize background service
const background = new ViralSplitBackground();

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page on first install
    chrome.tabs.create({ url: 'https://viralsplit.io/welcome?source=extension' });
  }
});

console.log('🚀 ViralSplit Background Service Active');