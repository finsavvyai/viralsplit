// ViralSplit Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize popup
  await initializePopup();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load data
  await loadPageStats();
  await loadTrends();
  await checkAuthentication();
});

async function initializePopup() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Check if on supported platform
  const supportedPlatforms = ['tiktok.com', 'instagram.com', 'youtube.com'];
  const isSupported = supportedPlatforms.some(platform => tab.url?.includes(platform));
  
  if (!isSupported) {
    document.querySelector('.stats-section').innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p style="color: #6b7280; font-size: 13px;">
          Navigate to TikTok, Instagram, or YouTube to start analyzing content
        </p>
      </div>
    `;
  }
}

function setupEventListeners() {
  // Analyze page button
  document.getElementById('analyze-page')?.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: 'analyze' }, (response) => {
      if (response?.success) {
        showNotification('Analysis started!');
        setTimeout(() => loadPageStats(), 1000);
      }
    });
  });
  
  // Import best video
  document.getElementById('import-best')?.addEventListener('click', async () => {
    const bestVideo = await findBestVideo();
    
    if (bestVideo) {
      chrome.runtime.sendMessage({
        action: 'importVideo',
        data: bestVideo
      }, (response) => {
        if (response?.success) {
          showNotification('Video imported successfully!');
        } else {
          showNotification('Please sign in to import videos', 'warning');
        }
      });
    } else {
      showNotification('No videos found on this page', 'warning');
    }
  });
  
  // Competitor spy
  document.getElementById('competitor-spy')?.addEventListener('click', async () => {
    const competitors = await getCompetitorAnalysis();
    showCompetitorModal(competitors);
  });
  
  // Trend alerts
  document.getElementById('trend-alert')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://viralsplit.io/alerts?source=extension' });
  });
  
  // Settings button
  document.getElementById('settings-btn')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Login button
  document.getElementById('login-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://viralsplit.io/auth?source=extension' });
  });
  
  // Upgrade button
  document.getElementById('upgrade-btn')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://viralsplit.io/pricing?source=extension' });
  });
}

async function loadPageStats() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Get stats from content script
  chrome.tabs.sendMessage(tab.id, { action: 'getStats' }, (response) => {
    if (response) {
      document.getElementById('videos-analyzed').textContent = response.analyzed || 0;
      
      // Calculate average score (mock for now)
      if (response.analyzed > 0) {
        const avgScore = Math.floor(Math.random() * 20) + 60;
        document.getElementById('avg-score').textContent = avgScore;
      }
    }
  });
}

async function loadTrends() {
  try {
    // Get trends from background script
    chrome.runtime.sendMessage({ action: 'getTrends' }, (response) => {
      const trendsList = document.getElementById('trends-list');
      
      if (!response || Object.keys(response).length === 0) {
        trendsList.innerHTML = '<div class="loading">No trends available</div>';
        return;
      }
      
      // Get current platform
      const [tab] = chrome.tabs.query({ active: true, currentWindow: true });
      let platform = 'instagram'; // default
      
      if (tab.url?.includes('tiktok.com')) platform = 'tiktok';
      else if (tab.url?.includes('youtube.com')) platform = 'youtube';
      
      const trends = response[platform] || [];
      
      if (trends.length === 0) {
        trendsList.innerHTML = '<div class="loading">No trends for this platform</div>';
        return;
      }
      
      // Display trends
      trendsList.innerHTML = trends.map(trend => `
        <div class="trend-item">
          <span class="trend-name">${trend.topic}</span>
          <div class="trend-stats">
            <span class="trend-score">${trend.score}</span>
            <span class="trend-growth">${trend.growth}</span>
          </div>
        </div>
      `).join('');
    });
  } catch (error) {
    console.error('Failed to load trends:', error);
  }
}

async function checkAuthentication() {
  // Check if user is authenticated
  const data = await chrome.storage.sync.get('userToken');
  
  if (!data.userToken) {
    // Show login section
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('pro-section').style.display = 'none';
  } else {
    // Check if pro user (mock for now)
    const isPro = false; // Would check with API
    
    if (!isPro) {
      document.getElementById('pro-section').style.display = 'block';
    }
  }
}

async function findBestVideo() {
  // Mock implementation - would get from content script
  return {
    url: window.location.href,
    platform: 'tiktok',
    viralScore: 85,
    metadata: {
      title: 'Best performing video',
      views: '1.2M',
      likes: '245K'
    }
  };
}

async function getCompetitorAnalysis() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getCompetitors' }, (response) => {
      resolve(response || {});
    });
  });
}

function showCompetitorModal(data) {
  if (!data.topCompetitors || data.topCompetitors.length === 0) {
    showNotification('No competitor data available', 'warning');
    return;
  }
  
  // Create modal HTML
  const modalHtml = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; border-radius: 12px; padding: 20px; max-width: 90%; max-height: 80%; overflow-y: auto;">
        <h3 style="margin-bottom: 16px;">Competitor Analysis</h3>
        ${data.topCompetitors.map(comp => `
          <div style="margin-bottom: 12px; padding: 12px; background: #f9fafb; border-radius: 8px;">
            <strong>${comp.name}</strong>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              Followers: ${comp.followers} | Avg Views: ${comp.avgViews}<br>
              Posting: ${comp.postingFrequency} | Content: ${comp.topContent}
            </div>
          </div>
        `).join('')}
        <button id="close-modal" style="width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 12px;">
          Close
        </button>
      </div>
    </div>
  `;
  
  // Inject modal into current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: (html) => {
        const modal = document.createElement('div');
        modal.innerHTML = html;
        document.body.appendChild(modal);
        
        modal.querySelector('#close-modal').addEventListener('click', () => {
          modal.remove();
        });
      },
      args: [modalHtml]
    });
  });
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    font-size: 13px;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Listen for updates from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    loadPageStats();
  }
});

console.log('🚀 ViralSplit Popup Initialized');