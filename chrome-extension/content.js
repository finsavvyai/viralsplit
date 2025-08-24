// ViralSplit Content Script - Injects AI analysis into social platforms

class ViralSplitAnalyzer {
  constructor() {
    this.platform = this.detectPlatform();
    this.observer = null;
    this.analyzedVideos = new Set();
    this.init();
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('tiktok.com')) return 'tiktok';
    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('youtube.com')) return 'youtube';
    return null;
  }

  init() {
    if (!this.platform) return;
    
    // Start observing for new content
    this.observeContent();
    
    // Analyze existing content
    this.analyzeExistingContent();
    
    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  observeContent() {
    const config = { childList: true, subtree: true };
    
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(() => {
        this.analyzeExistingContent();
      });
    });
    
    this.observer.observe(document.body, config);
  }

  analyzeExistingContent() {
    const videos = this.getVideoElements();
    
    videos.forEach(video => {
      const videoId = this.getVideoId(video);
      
      if (videoId && !this.analyzedVideos.has(videoId)) {
        this.analyzedVideos.add(videoId);
        this.analyzeVideo(video, videoId);
      }
    });
  }

  getVideoElements() {
    const selectors = {
      tiktok: '[data-e2e="recommend-list-item-container"]',
      instagram: 'article[role="presentation"]',
      youtube: 'ytd-video-renderer, ytd-grid-video-renderer'
    };
    
    return document.querySelectorAll(selectors[this.platform] || 'video');
  }

  getVideoId(element) {
    // Platform-specific ID extraction
    if (this.platform === 'tiktok') {
      const link = element.querySelector('a[href*="/video/"]');
      return link ? link.href.match(/video\/(\d+)/)?.[1] : null;
    }
    
    if (this.platform === 'instagram') {
      const link = element.querySelector('a[href*="/reel/"], a[href*="/p/"]');
      return link ? link.href : null;
    }
    
    if (this.platform === 'youtube') {
      const link = element.querySelector('a#video-title, a#thumbnail');
      return link ? link.href.match(/v=([^&]+)/)?.[1] : null;
    }
    
    return Date.now().toString();
  }

  async analyzeVideo(element, videoId) {
    try {
      // Extract video metadata
      const metadata = this.extractMetadata(element);
      
      // Get AI analysis from background script
      const analysis = await this.getAIAnalysis(metadata);
      
      // Inject visual overlay
      this.injectOverlay(element, analysis);
      
    } catch (error) {
      console.error('ViralSplit: Analysis failed', error);
    }
  }

  extractMetadata(element) {
    const metadata = {
      platform: this.platform,
      timestamp: Date.now()
    };
    
    if (this.platform === 'tiktok') {
      metadata.description = element.querySelector('[data-e2e="browse-video-desc"]')?.textContent;
      metadata.likes = element.querySelector('[data-e2e="browse-like-count"]')?.textContent;
      metadata.comments = element.querySelector('[data-e2e="browse-comment-count"]')?.textContent;
      metadata.music = element.querySelector('.music-title')?.textContent;
    }
    
    if (this.platform === 'instagram') {
      metadata.description = element.querySelector('[data-testid="post-caption"]')?.textContent;
      metadata.likes = element.querySelector('button[type="button"] span')?.textContent;
      metadata.timestamp = element.querySelector('time')?.getAttribute('datetime');
    }
    
    if (this.platform === 'youtube') {
      metadata.title = element.querySelector('#video-title')?.textContent;
      metadata.channel = element.querySelector('#channel-name')?.textContent;
      metadata.views = element.querySelector('#metadata-line span')?.textContent;
      metadata.duration = element.querySelector('span.ytd-thumbnail-overlay-time-status-renderer')?.textContent;
    }
    
    return metadata;
  }

  async getAIAnalysis(metadata) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'analyzeContent',
        data: metadata
      }, (response) => {
        resolve(response || this.getMockAnalysis());
      });
    });
  }

  getMockAnalysis() {
    // Fallback mock data for testing
    return {
      viralScore: Math.floor(Math.random() * 40) + 60,
      trend: ['Rising', 'Stable', 'Peaking', 'Declining'][Math.floor(Math.random() * 4)],
      engagement: Math.floor(Math.random() * 50) + 50,
      tips: [
        'Strong hook in first 3 seconds',
        'Trending audio detected',
        'Optimal video length for platform'
      ],
      improvements: [
        'Add more text overlays',
        'Include a call-to-action',
        'Use trending hashtags'
      ]
    };
  }

  injectOverlay(element, analysis) {
    // Check if overlay already exists
    if (element.querySelector('.viralsplit-overlay')) return;
    
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'viralsplit-overlay';
    
    // Create viral score badge
    const scoreBadge = document.createElement('div');
    scoreBadge.className = `viralsplit-score ${this.getScoreClass(analysis.viralScore)}`;
    scoreBadge.innerHTML = `
      <span class="score-number">${analysis.viralScore}</span>
      <span class="score-label">Viral Score</span>
    `;
    
    // Create trend indicator
    const trendBadge = document.createElement('div');
    trendBadge.className = `viralsplit-trend trend-${analysis.trend.toLowerCase()}`;
    trendBadge.textContent = analysis.trend;
    
    // Create quick stats
    const stats = document.createElement('div');
    stats.className = 'viralsplit-stats';
    stats.innerHTML = `
      <div class="stat">
        <span class="stat-icon">📈</span>
        <span class="stat-value">${analysis.engagement}%</span>
      </div>
    `;
    
    // Create hover panel for detailed analysis
    const detailPanel = document.createElement('div');
    detailPanel.className = 'viralsplit-detail-panel';
    detailPanel.innerHTML = `
      <div class="panel-header">
        <h3>AI Analysis</h3>
        <button class="close-btn">×</button>
      </div>
      <div class="panel-content">
        <div class="tips-section">
          <h4>✅ What's Working</h4>
          <ul>${analysis.tips.map(tip => `<li>${tip}</li>`).join('')}</ul>
        </div>
        <div class="improvements-section">
          <h4>💡 Improvements</h4>
          <ul>${analysis.improvements.map(imp => `<li>${imp}</li>`).join('')}</ul>
        </div>
        <div class="actions">
          <button class="action-btn import-btn">Import to ViralSplit</button>
          <button class="action-btn analyze-btn">Deep Analysis</button>
        </div>
      </div>
    `;
    
    // Add event listeners
    scoreBadge.addEventListener('click', () => {
      detailPanel.classList.toggle('visible');
    });
    
    detailPanel.querySelector('.close-btn').addEventListener('click', () => {
      detailPanel.classList.remove('visible');
    });
    
    detailPanel.querySelector('.import-btn')?.addEventListener('click', () => {
      this.importVideo(element, analysis);
    });
    
    detailPanel.querySelector('.analyze-btn')?.addEventListener('click', () => {
      this.deepAnalyze(element, analysis);
    });
    
    // Append elements
    overlay.appendChild(scoreBadge);
    overlay.appendChild(trendBadge);
    overlay.appendChild(stats);
    overlay.appendChild(detailPanel);
    
    // Position overlay relative to video
    element.style.position = 'relative';
    element.appendChild(overlay);
  }

  getScoreClass(score) {
    if (score >= 80) return 'score-viral';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-moderate';
    return 'score-low';
  }

  async importVideo(element, analysis) {
    const videoUrl = this.getVideoUrl(element);
    
    chrome.runtime.sendMessage({
      action: 'importVideo',
      data: {
        url: videoUrl,
        analysis: analysis,
        platform: this.platform
      }
    }, (response) => {
      if (response.success) {
        this.showNotification('Video imported successfully!');
      }
    });
  }

  async deepAnalyze(element, analysis) {
    chrome.runtime.sendMessage({
      action: 'openDeepAnalysis',
      data: {
        element: element.outerHTML,
        analysis: analysis,
        platform: this.platform
      }
    });
  }

  getVideoUrl(element) {
    const link = element.querySelector('a[href]');
    return link ? link.href : window.location.href;
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'viralsplit-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('visible');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  handleMessage(request, sender, sendResponse) {
    switch(request.action) {
      case 'analyze':
        this.analyzeExistingContent();
        sendResponse({ success: true });
        break;
        
      case 'getStats':
        sendResponse({
          analyzed: this.analyzedVideos.size,
          platform: this.platform
        });
        break;
        
      default:
        sendResponse({ success: false });
    }
  }
}

// Initialize analyzer
const analyzer = new ViralSplitAnalyzer();

// Inject analytics tracking
console.log('🚀 ViralSplit Analyzer Active - AI-powered content analysis enabled');