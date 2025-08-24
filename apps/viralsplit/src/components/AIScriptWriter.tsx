'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedScript {
  script: string;
  title_suggestions: string[];
  viral_score: number;
  hooks: string[];
  emotional_beats: Array<{
    timestamp: number;
    emotion: string;
    intensity: number;
    action: string;
  }>;
  platform_optimizations: string[];
  variations: Array<{
    version: number;
    style: string;
    script: string;
    difference: string;
  }>;
  performance_prediction: {
    estimated_views: {
      conservative: number;
      realistic: number;
      optimistic: number;
    };
    engagement_rate: string;
    completion_rate: string;
    share_likelihood: string;
  };
  improvement_suggestions: string[];
}

interface Hook {
  text: string;
  category: string;
  viral_score: number;
  best_for: string[];
}

interface AIScriptWriterProps {
  onScriptGenerated?: (script: GeneratedScript) => void;
}

const AIScriptWriter: React.FC<AIScriptWriterProps> = ({ onScriptGenerated }) => {
  const [concept, setConcept] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [duration, setDuration] = useState(60);
  const [style, setStyle] = useState('educational');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [activeTab, setActiveTab] = useState('generate');
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [selectedHook, setSelectedHook] = useState<string>('');

  // Load user credits on component mount
  useEffect(() => {
    fetchUserCredits();
    loadHooks();
  }, [style, platform]);

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const userData = await response.json();
      setUserCredits(userData.credits || 0);
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
    }
  };

  const loadHooks = async () => {
    try {
      const response = await fetch(`/api/scripts/hooks?style=${style}&platform=${platform}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHooks(data.hooks);
      }
    } catch (error) {
      console.error('Failed to load hooks:', error);
    }
  };

  const handleGenerate = async () => {
    if (userCredits < 10) {
      alert('Insufficient credits! You need 10 credits to generate a script.');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          concept: selectedHook ? `${selectedHook} ${concept}` : concept,
          platform,
          duration,
          style
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeneratedScript(result.script);
        setUserCredits(result.credits_remaining);
        onScriptGenerated?.(result.script);
      } else {
        alert(result.detail || 'Failed to generate script');
      }
    } catch (error) {
      console.error('Script generation failed:', error);
      alert('Failed to generate script. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="ai-script-writer">
      {/* Header */}
      <div className="script-writer-header">
        <div className="header-content">
          <h1 className="main-title">
            <span className="robot-icon">🤖</span>
            AI Script Writer Pro
          </h1>
          <p className="subtitle">Generate viral scripts that guarantee engagement</p>
          <div className="credits-display">
            <span className="credits-icon">⚡</span>
            <span className="credits-count">{userCredits}</span>
            <span className="credits-label">credits</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <span className="tab-icon">✨</span>
          Generate Script
        </button>
        <button
          className={`tab-button ${activeTab === 'hooks' ? 'active' : ''}`}
          onClick={() => setActiveTab('hooks')}
        >
          <span className="tab-icon">🎣</span>
          Viral Hooks
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'generate' ? (
          <motion.div
            key="generate"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="generate-tab"
          >
            {/* Form */}
            <div className="script-form">
              {/* Concept Input */}
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">💡</span>
                  Video Concept
                </label>
                <div className="concept-input-container">
                  {selectedHook && (
                    <div className="selected-hook">
                      <span className="hook-text">{selectedHook}</span>
                      <button
                        onClick={() => setSelectedHook('')}
                        className="remove-hook"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <textarea
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    placeholder={selectedHook ? 
                      "Continue your concept..." : 
                      "Describe your video idea... (e.g., 'How to make $10k from home')"
                    }
                    className="concept-input"
                    rows={4}
                  />
                </div>
              </div>

              {/* Platform & Settings Row */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📱</span>
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="form-select"
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram Reels</option>
                    <option value="youtube">YouTube Shorts</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">⏱️</span>
                    Duration
                  </label>
                  <div className="duration-input">
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min="15"
                      max="300"
                      className="form-input"
                    />
                    <span className="duration-unit">seconds</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">🎭</span>
                    Style
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="form-select"
                  >
                    <option value="educational">Educational</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="story">Story Time</option>
                    <option value="comedy">Comedy</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                onClick={handleGenerate}
                disabled={!concept.trim() || isGenerating || userCredits < 10}
                className={`generate-btn ${isGenerating ? 'generating' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isGenerating ? (
                  <>
                    <div className="loading-spinner" />
                    <span>Crafting Your Viral Script...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✨</span>
                    <span>Generate Viral Script (10 credits)</span>
                  </>
                )}
              </motion.button>

              {userCredits < 10 && (
                <div className="insufficient-credits">
                  <span className="warning-icon">⚠️</span>
                  <span>You need 10 credits to generate a script. </span>
                  <a href="/pricing" className="upgrade-link">Upgrade now</a>
                </div>
              )}
            </div>

            {/* Generated Script Display */}
            {generatedScript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="script-result"
              >
                <ScriptPreview script={generatedScript} />
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="hooks"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="hooks-tab"
          >
            <div className="hooks-header">
              <h3>🎣 Trending Viral Hooks</h3>
              <p>Click any hook to use it in your script</p>
            </div>
            
            <div className="hooks-grid">
              {hooks.map((hook, index) => (
                <motion.div
                  key={index}
                  className={`hook-card ${selectedHook === hook.text ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedHook(hook.text);
                    setActiveTab('generate');
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="hook-header">
                    <span className="hook-category">{hook.category}</span>
                    <span className="viral-score">{hook.viral_score}</span>
                  </div>
                  <div className="hook-text">{hook.text}</div>
                  <div className="hook-tags">
                    {hook.best_for.map(tag => (
                      <span key={tag} className="hook-tag">{tag}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .ai-script-writer {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .script-writer-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .header-content {
          position: relative;
          display: inline-block;
        }

        .main-title {
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 10px 0;
        }

        .robot-icon {
          font-size: 2.5rem;
          margin-right: 15px;
        }

        .subtitle {
          font-size: 1.2rem;
          color: #6b7280;
          margin-bottom: 20px;
        }

        .credits-display {
          position: absolute;
          top: 0;
          right: -120px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 25px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
          font-weight: 600;
        }

        .credits-icon {
          font-size: 1.2rem;
        }

        .tab-navigation {
          display: flex;
          justify-content: center;
          margin-bottom: 40px;
          background: #f9fafb;
          padding: 8px;
          border-radius: 12px;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
        }

        .tab-button {
          background: transparent;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }

        .tab-button.active {
          background: white;
          color: #667eea;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .tab-button:hover:not(.active) {
          color: #374151;
        }

        .script-form {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          margin-bottom: 40px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .label-icon {
          font-size: 18px;
        }

        .concept-input-container {
          position: relative;
        }

        .selected-hook {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px 8px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 500;
        }

        .hook-text {
          flex: 1;
        }

        .remove-hook {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
        }

        .concept-input {
          width: 100%;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: ${selectedHook ? '0 0 8px 8px' : '8px'};
          font-size: 16px;
          resize: vertical;
          min-height: 120px;
          transition: all 0.2s;
        }

        .concept-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }

        .form-select,
        .form-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-select:focus,
        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .duration-input {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .duration-unit {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }

        .generate-btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.2s;
          margin-top: 32px;
        }

        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .generate-btn.generating {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .btn-icon {
          font-size: 20px;
        }

        .insufficient-credits {
          background: #fef3c7;
          color: #d97706;
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .warning-icon {
          font-size: 18px;
        }

        .upgrade-link {
          color: #dc2626;
          text-decoration: underline;
          font-weight: 600;
        }

        .hooks-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .hooks-header h3 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #374151;
          margin-bottom: 8px;
        }

        .hooks-header p {
          color: #6b7280;
        }

        .hooks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }

        .hook-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s;
        }

        .hook-card:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .hook-card.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .hook-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .hook-category {
          background: #e0e7ff;
          color: #4338ca;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .viral-score {
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: bold;
          min-width: 32px;
          text-align: center;
        }

        .hook-text {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .hook-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .hook-tag {
          background: #f3f4f6;
          color: #6b7280;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .script-result {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .credits-display {
            position: static;
            margin-top: 16px;
            width: fit-content;
            margin-left: auto;
            margin-right: auto;
          }

          .hooks-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Script Preview Component
const ScriptPreview: React.FC<{ script: GeneratedScript }> = ({ script }) => {
  const [activeSection, setActiveSection] = useState('script');

  return (
    <div className="script-preview">
      {/* Header with viral score */}
      <div className="preview-header">
        <div className="header-left">
          <h3 className="preview-title">
            <span className="fire-icon">🔥</span>
            Your Viral Script
          </h3>
          <p className="script-subtitle">AI-generated for maximum engagement</p>
        </div>
        <div className="viral-score-display">
          <div className={`score-circle ${getScoreClass(script.viral_score)}`}>
            <span className="score-number">{script.viral_score}</span>
          </div>
          <div className="score-info">
            <span className="score-label">Viral Score</span>
            <span className="score-description">
              {script.viral_score >= 80 ? 'Explosive' : 
               script.viral_score >= 60 ? 'High Potential' : 'Good Foundation'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="preview-tabs">
        <button
          className={`preview-tab ${activeSection === 'script' ? 'active' : ''}`}
          onClick={() => setActiveSection('script')}
        >
          📜 Script
        </button>
        <button
          className={`preview-tab ${activeSection === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveSection('insights')}
        >
          📊 Insights
        </button>
        <button
          className={`preview-tab ${activeSection === 'variations' ? 'active' : ''}`}
          onClick={() => setActiveSection('variations')}
        >
          🔄 Variations
        </button>
        <button
          className={`preview-tab ${activeSection === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveSection('performance')}
        >
          📈 Performance
        </button>
      </div>

      {/* Content Sections */}
      <div className="preview-content">
        <AnimatePresence mode="wait">
          {activeSection === 'script' && (
            <motion.div
              key="script"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="script-section"
            >
              <div className="script-text">
                {script.script.split('\n').map((line, i) => (
                  <p key={i} className="script-line">
                    {line}
                  </p>
                ))}
              </div>

              {script.title_suggestions && script.title_suggestions.length > 0 && (
                <div className="title-suggestions">
                  <h4 className="suggestions-title">📝 Title Suggestions:</h4>
                  <div className="titles-grid">
                    {script.title_suggestions.map((title, i) => (
                      <div key={i} className="title-card">
                        <span className="title-text">{title}</span>
                        <button className="copy-title" onClick={() => navigator.clipboard?.writeText(title)}>
                          📋
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="insights-section"
            >
              {/* Viral Hooks */}
              <div className="insight-card">
                <h4 className="insight-title">
                  <span className="insight-icon">🎣</span>
                  Viral Hooks Used
                </h4>
                <div className="hooks-list">
                  {script.hooks.map((hook, i) => (
                    <div key={i} className="hook-item">
                      <span className="hook-text">{hook}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emotional Journey */}
              <div className="insight-card">
                <h4 className="insight-title">
                  <span className="insight-icon">💫</span>
                  Emotional Journey
                </h4>
                <div className="emotion-timeline">
                  {script.emotional_beats.map((beat, i) => (
                    <div key={i} className="emotion-beat">
                      <div className="beat-time">{beat.timestamp}s</div>
                      <div className="beat-emotion">{beat.emotion}</div>
                      <div className="beat-action">{beat.action}</div>
                      <div 
                        className="beat-intensity"
                        style={{ width: `${beat.intensity * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Optimizations */}
              <div className="insight-card">
                <h4 className="insight-title">
                  <span className="insight-icon">🎯</span>
                  Platform Optimizations
                </h4>
                <div className="optimizations-list">
                  {script.platform_optimizations.map((tip, i) => (
                    <div key={i} className="optimization-item">
                      <span className="check-icon">✓</span>
                      <span className="tip-text">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'variations' && (
            <motion.div
              key="variations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="variations-section"
            >
              <div className="variations-grid">
                {script.variations.map((variation, i) => (
                  <div key={i} className="variation-card">
                    <div className="variation-header">
                      <span className="variation-number">V{variation.version}</span>
                      <span className="variation-style">{variation.style}</span>
                    </div>
                    <div className="variation-script">
                      {variation.script.split('\n').slice(0, 3).map((line, j) => (
                        <p key={j}>{line}</p>
                      ))}
                      {variation.script.split('\n').length > 3 && <p>...</p>}
                    </div>
                    <div className="variation-difference">{variation.difference}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="performance-section"
            >
              {/* View Predictions */}
              <div className="performance-card">
                <h4 className="performance-title">
                  <span className="performance-icon">👀</span>
                  View Predictions
                </h4>
                <div className="predictions-grid">
                  <div className="prediction-item conservative">
                    <div className="prediction-label">Conservative</div>
                    <div className="prediction-value">
                      {formatNumber(script.performance_prediction.estimated_views.conservative)}
                    </div>
                  </div>
                  <div className="prediction-item realistic">
                    <div className="prediction-label">Realistic</div>
                    <div className="prediction-value">
                      {formatNumber(script.performance_prediction.estimated_views.realistic)}
                    </div>
                  </div>
                  <div className="prediction-item optimistic">
                    <div className="prediction-label">Optimistic</div>
                    <div className="prediction-value">
                      {formatNumber(script.performance_prediction.estimated_views.optimistic)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon">❤️</div>
                  <div className="metric-value">{script.performance_prediction.engagement_rate}</div>
                  <div className="metric-label">Engagement Rate</div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon">⏱️</div>
                  <div className="metric-value">{script.performance_prediction.completion_rate}</div>
                  <div className="metric-label">Completion Rate</div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon">📤</div>
                  <div className="metric-value">{script.performance_prediction.share_likelihood}</div>
                  <div className="metric-label">Share Likelihood</div>
                </div>
              </div>

              {/* Improvements */}
              {script.improvement_suggestions && script.improvement_suggestions.length > 0 && (
                <div className="improvements-card">
                  <h4 className="improvements-title">
                    <span className="improvements-icon">💡</span>
                    Suggested Improvements
                  </h4>
                  <div className="improvements-list">
                    {script.improvement_suggestions.map((suggestion, i) => (
                      <div key={i} className="improvement-item">
                        <span className="improvement-icon">→</span>
                        <span className="improvement-text">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="script-actions">
        <button className="action-btn primary">
          <span className="btn-icon">✅</span>
          Use This Script
        </button>
        <button className="action-btn secondary">
          <span className="btn-icon">📋</span>
          Copy Script
        </button>
        <button className="action-btn secondary">
          <span className="btn-icon">🔄</span>
          Generate New Version
        </button>
      </div>

      <style jsx>{`
        .script-preview {
          // Styles here would be extensive, showing the complete preview component
          // This includes all the tabs, sections, and styling for the full script display
        }

        // ... (extensive styling would continue here)
      `}</style>
    </div>
  );
};

// Helper function to get score class
function getScoreClass(score: number): string {
  if (score >= 80) return 'score-viral';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-moderate';
  return 'score-low';
}

// Helper function to format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default AIScriptWriter;