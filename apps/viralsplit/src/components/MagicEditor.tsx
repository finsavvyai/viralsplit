'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Enhancement {
  name: string;
  description: string;
  icon: string;
  credits: number;
  processing_time: string;
  premium: boolean;
}

interface Preset {
  name: string;
  description: string;
  specs: string;
  best_for: string[];
}

interface EnhancementResult {
  success: boolean;
  enhanced_video_url?: string;
  before_preview?: string;
  after_preview?: string;
  processing_time?: string;
  enhancements_applied?: string[];
  quality_improvement?: string;
  file_size_change?: string;
  processing_stats?: any;
  credits_used?: number;
  credits_remaining?: number;
  message?: string;
}

interface MagicEditorProps {
  onVideoEnhanced?: (result: EnhancementResult) => void;
}

const MagicEditor: React.FC<MagicEditorProps> = ({ onVideoEnhanced }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('mobile');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<EnhancementResult | null>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [presets, setPresets] = useState<Record<string, Preset>>({});
  const [enhancements, setEnhancements] = useState<Record<string, Enhancement>>({});
  const [activeTab, setActiveTab] = useState('enhance');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load presets and user credits on mount
  useEffect(() => {
    loadPresetsAndEnhancements();
    fetchUserCredits();
  }, []);

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

  const loadPresetsAndEnhancements = async () => {
    try {
      const response = await fetch('/api/magic-edit/presets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPresets(data.presets);
        setEnhancements(data.enhancements);
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const calculateTotalCredits = () => {
    const baseCredits = 20;
    const enhancementCredits = selectedEnhancements.reduce((total, enhancement) => {
      return total + (enhancements[enhancement]?.credits || 0);
    }, 0);
    return baseCredits + enhancementCredits;
  };

  const handleFileSelect = (file: File) => {
    setVideoFile(file);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleEnhancementToggle = (enhancement: string) => {
    if (selectedEnhancements.includes(enhancement)) {
      setSelectedEnhancements(selectedEnhancements.filter(e => e !== enhancement));
    } else {
      setSelectedEnhancements([...selectedEnhancements, enhancement]);
    }
  };

  const handleEnhance = async () => {
    if (!videoFile || selectedEnhancements.length === 0) return;

    const totalCredits = calculateTotalCredits();
    if (userCredits < totalCredits) {
      alert(`Insufficient credits! You need ${totalCredits} credits but have ${userCredits}.`);
      return;
    }

    setIsProcessing(true);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('enhancements', JSON.stringify(selectedEnhancements));
    formData.append('preset', selectedPreset);

    try {
      const response = await fetch('/api/magic-edit/enhance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setResult(result);
        setUserCredits(result.credits_remaining);
        onVideoEnhanced?.(result);
      } else {
        alert(result.message || 'Enhancement failed');
      }
    } catch (error) {
      console.error('Enhancement failed:', error);
      alert('Enhancement failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (timeStr: string) => {
    return timeStr.replace(/(\d+)-(\d+)/, '$1-$2').replace('minutes', 'min').replace('seconds', 'sec');
  };

  return (
    <div className="magic-editor">
      {/* Header */}
      <div className="editor-header">
        <div className="header-content">
          <h1 className="main-title">
            <span className="magic-icon">✨</span>
            Magic Edit Suite
          </h1>
          <p className="subtitle">Professional video editing with one click</p>
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
          className={`tab-button ${activeTab === 'enhance' ? 'active' : ''}`}
          onClick={() => setActiveTab('enhance')}
        >
          <span className="tab-icon">🎬</span>
          Enhance Video
        </button>
        <button
          className={`tab-button ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          <span className="tab-icon">🎨</span>
          Presets
        </button>
        <button
          className={`tab-button ${activeTab === 'examples' ? 'active' : ''}`}
          onClick={() => setActiveTab('examples')}
        >
          <span className="tab-icon">📸</span>
          Examples
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'enhance' ? (
          <motion.div
            key="enhance"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="enhance-tab"
          >
            {/* Video Upload */}
            <div className="video-upload-section">
              <div
                className={`drop-zone ${dragActive ? 'active' : ''} ${videoFile ? 'has-file' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                
                {videoFile ? (
                  <div className="file-preview">
                    <div className="file-icon">🎬</div>
                    <div className="file-info">
                      <div className="file-name">{videoFile.name}</div>
                      <div className="file-size">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoFile(null);
                      }}
                      className="remove-file"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="drop-zone-content">
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                      <div className="main-text">Drop your video here or click to browse</div>
                      <div className="sub-text">Supports MP4, MOV, AVI • Max 500MB</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preset Selection */}
            <div className="preset-section">
              <h3 className="section-title">
                <span className="section-icon">🎯</span>
                Choose Output Quality
              </h3>
              <div className="preset-grid">
                {Object.entries(presets).map(([key, preset]) => (
                  <div
                    key={key}
                    className={`preset-card ${selectedPreset === key ? 'selected' : ''}`}
                    onClick={() => setSelectedPreset(key)}
                  >
                    <div className="preset-name">{preset.name}</div>
                    <div className="preset-specs">{preset.specs}</div>
                    <div className="preset-best-for">
                      Best for: {preset.best_for.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhancement Selection */}
            <div className="enhancement-section">
              <h3 className="section-title">
                <span className="section-icon">✨</span>
                Select Enhancements
              </h3>
              <div className="enhancement-grid">
                {Object.entries(enhancements).map(([key, enhancement]) => (
                  <motion.div
                    key={key}
                    className={`enhancement-card ${selectedEnhancements.includes(key) ? 'selected' : ''} ${enhancement.premium ? 'premium' : ''}`}
                    onClick={() => handleEnhancementToggle(key)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="enhancement-header">
                      <span className="enhancement-icon">{enhancement.icon}</span>
                      <span className="enhancement-name">{enhancement.name}</span>
                      {enhancement.premium && <span className="premium-badge">PRO</span>}
                    </div>
                    <div className="enhancement-description">{enhancement.description}</div>
                    <div className="enhancement-footer">
                      <span className="credits-cost">{enhancement.credits} credits</span>
                      <span className="processing-time">{formatTime(enhancement.processing_time)}</span>
                    </div>
                    {selectedEnhancements.includes(key) && (
                      <div className="selected-indicator">
                        <div className="checkmark">✓</div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Enhancement Summary */}
            {selectedEnhancements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="enhancement-summary"
              >
                <div className="summary-header">
                  <h4>Enhancement Summary</h4>
                  <div className="total-credits">
                    Total: {calculateTotalCredits()} credits
                  </div>
                </div>
                <div className="selected-enhancements">
                  {selectedEnhancements.map(key => (
                    <div key={key} className="selected-enhancement">
                      <span className="enhancement-icon">{enhancements[key].icon}</span>
                      <span className="enhancement-name">{enhancements[key].name}</span>
                      <span className="enhancement-credits">{enhancements[key].credits}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Enhance Button */}
            <motion.button
              onClick={handleEnhance}
              disabled={!videoFile || selectedEnhancements.length === 0 || isProcessing || userCredits < calculateTotalCredits()}
              className={`enhance-btn ${isProcessing ? 'processing' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isProcessing ? (
                <>
                  <div className="loading-spinner" />
                  <span>Applying Magic...</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  <span>Apply Magic Edits ({calculateTotalCredits()} credits)</span>
                </>
              )}
            </motion.button>

            {userCredits < calculateTotalCredits() && selectedEnhancements.length > 0 && (
              <div className="insufficient-credits">
                <span className="warning-icon">⚠️</span>
                <span>You need {calculateTotalCredits()} credits but have {userCredits}. </span>
                <a href="/pricing" className="upgrade-link">Upgrade now</a>
              </div>
            )}

            {/* Results */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="enhancement-results"
              >
                <EnhancementResults result={result} />
              </motion.div>
            )}
          </motion.div>
        ) : activeTab === 'presets' ? (
          <motion.div
            key="presets"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="presets-tab"
          >
            <div className="presets-header">
              <h3>🎨 Quality Presets</h3>
              <p>Choose the perfect output format for your needs</p>
            </div>
            
            <div className="presets-detailed-grid">
              {Object.entries(presets).map(([key, preset]) => (
                <div key={key} className="detailed-preset-card">
                  <div className="preset-header">
                    <h4>{preset.name}</h4>
                    <span className="preset-specs">{preset.specs}</span>
                  </div>
                  <p className="preset-description">{preset.description}</p>
                  <div className="preset-best-for-section">
                    <span className="best-for-label">Best for:</span>
                    <div className="best-for-tags">
                      {preset.best_for.map(platform => (
                        <span key={platform} className="platform-tag">{platform}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="examples"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="examples-tab"
          >
            <div className="examples-header">
              <h3>📸 Before & After Examples</h3>
              <p>See the magic in action</p>
            </div>
            
            <div className="examples-grid">
              {Object.entries(enhancements).slice(0, 6).map(([key, enhancement]) => (
                <div key={key} className="example-card">
                  <div className="example-header">
                    <span className="example-icon">{enhancement.icon}</span>
                    <span className="example-title">{enhancement.name}</span>
                  </div>
                  <div className="before-after">
                    <div className="before-section">
                      <div className="image-placeholder">
                        <span>Before</span>
                      </div>
                    </div>
                    <div className="arrow">→</div>
                    <div className="after-section">
                      <div className="image-placeholder enhanced">
                        <span>After</span>
                      </div>
                    </div>
                  </div>
                  <p className="example-description">{enhancement.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .magic-editor {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .editor-header {
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
          background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 10px 0;
        }

        .magic-icon {
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
          background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 25px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
          font-weight: 600;
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
          color: #8b5cf6;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .video-upload-section {
          margin-bottom: 40px;
        }

        .drop-zone {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafbfc;
        }

        .drop-zone:hover,
        .drop-zone.active {
          border-color: #8b5cf6;
          background: #f5f3ff;
        }

        .drop-zone.has-file {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .drop-zone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .upload-icon {
          font-size: 3rem;
          opacity: 0.6;
        }

        .main-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
        }

        .sub-text {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .file-preview {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .file-icon {
          font-size: 2rem;
        }

        .file-info {
          flex: 1;
          text-align: left;
        }

        .file-name {
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }

        .file-size {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .remove-file {
          background: #ef4444;
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 20px;
        }

        .preset-grid,
        .presets-detailed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }

        .preset-card,
        .detailed-preset-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-card:hover,
        .detailed-preset-card:hover {
          border-color: #8b5cf6;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
        }

        .preset-card.selected {
          border-color: #8b5cf6;
          background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
        }

        .preset-name {
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .preset-specs {
          font-size: 0.9rem;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .preset-best-for {
          font-size: 0.8rem;
          color: #8b5cf6;
        }

        .enhancement-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .enhancement-card {
          position: relative;
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s;
          overflow: hidden;
        }

        .enhancement-card:hover {
          border-color: #8b5cf6;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
        }

        .enhancement-card.selected {
          border-color: #8b5cf6;
          background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
        }

        .enhancement-card.premium {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        }

        .enhancement-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .enhancement-icon {
          font-size: 1.5rem;
        }

        .enhancement-name {
          font-weight: 600;
          color: #374151;
          flex: 1;
        }

        .premium-badge {
          background: #f59e0b;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .enhancement-description {
          color: #6b7280;
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .enhancement-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }

        .credits-cost {
          font-weight: 600;
          color: #8b5cf6;
        }

        .processing-time {
          color: #6b7280;
        }

        .selected-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkmark {
          color: white;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .enhancement-summary {
          background: white;
          border: 2px solid #8b5cf6;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .summary-header h4 {
          margin: 0;
          color: #374151;
        }

        .total-credits {
          background: #8b5cf6;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
        }

        .selected-enhancements {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .selected-enhancement {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f5f3ff;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #8b5cf6;
        }

        .enhance-btn {
          width: 100%;
          background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
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
          margin-bottom: 16px;
        }

        .enhance-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .enhance-btn.processing {
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

        .insufficient-credits {
          background: #fef3c7;
          color: #d97706;
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .upgrade-link {
          color: #dc2626;
          text-decoration: underline;
          font-weight: 600;
        }

        .enhancement-results {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .examples-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .example-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .example-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .example-title {
          font-weight: 600;
          color: #374151;
        }

        .before-after {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .image-placeholder {
          width: 100px;
          height: 60px;
          background: #f3f4f6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .image-placeholder.enhanced {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
        }

        .arrow {
          font-size: 1.5rem;
          color: #8b5cf6;
          font-weight: bold;
        }

        .example-description {
          font-size: 0.9rem;
          color: #6b7280;
          line-height: 1.4;
          margin: 0;
        }

        @media (max-width: 768px) {
          .enhancement-grid {
            grid-template-columns: 1fr;
          }

          .credits-display {
            position: static;
            margin-top: 16px;
            width: fit-content;
            margin-left: auto;
            margin-right: auto;
          }

          .preset-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Enhancement Results Component
const EnhancementResults: React.FC<{ result: EnhancementResult }> = ({ result }) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="results-container">
      {/* Header */}
      <div className="results-header">
        <div className="success-indicator">
          <span className="success-icon">🎉</span>
          <div>
            <h3>Enhancement Complete!</h3>
            <p>{result.message}</p>
          </div>
        </div>
        <div className="processing-stats">
          <div className="stat">
            <span className="stat-label">Processing Time</span>
            <span className="stat-value">{result.processing_time}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Quality</span>
            <span className="stat-value">{result.quality_improvement}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Credits Used</span>
            <span className="stat-value">{result.credits_used}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="results-tabs">
        <button
          className={`results-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`results-tab ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          🔍 Before/After
        </button>
        <button
          className={`results-tab ${activeTab === 'enhancements' ? 'active' : ''}`}
          onClick={() => setActiveTab('enhancements')}
        >
          ✨ Enhancements
        </button>
      </div>

      {/* Tab Content */}
      <div className="results-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="overview-stats">
                <div className="stat-card">
                  <span className="stat-icon">🎬</span>
                  <div>
                    <div className="stat-number">{result.enhancements_applied?.length || 0}</div>
                    <div className="stat-description">Enhancements Applied</div>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">📈</span>
                  <div>
                    <div className="stat-number">{result.quality_improvement}</div>
                    <div className="stat-description">Quality Improvement</div>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">💾</span>
                  <div>
                    <div className="stat-number">{result.file_size_change}</div>
                    <div className="stat-description">File Size Change</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'comparison' && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="comparison-section">
                <div className="before-after-container">
                  <div className="comparison-side">
                    <h4>Before</h4>
                    {result.before_preview ? (
                      <img src={result.before_preview} alt="Before" className="comparison-image" />
                    ) : (
                      <div className="placeholder-image">Original Video</div>
                    )}
                  </div>
                  <div className="comparison-arrow">
                    <span>→</span>
                  </div>
                  <div className="comparison-side">
                    <h4>After</h4>
                    {result.after_preview ? (
                      <img src={result.after_preview} alt="After" className="comparison-image" />
                    ) : (
                      <div className="placeholder-image enhanced">Enhanced Video</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'enhancements' && (
            <motion.div
              key="enhancements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="enhancements-list">
                {result.enhancements_applied?.map((enhancement, index) => (
                  <div key={index} className="enhancement-item">
                    <span className="enhancement-check">✅</span>
                    <span className="enhancement-text">{enhancement}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button className="action-btn primary">
          <span className="btn-icon">⬇️</span>
          Download Enhanced Video
        </button>
        <button className="action-btn secondary">
          <span className="btn-icon">🔄</span>
          Enhance Another Video
        </button>
        <button className="action-btn secondary">
          <span className="btn-icon">📤</span>
          Share Result
        </button>
      </div>

      <style jsx>{`
        .results-container {
          // Add comprehensive styling for results display
          // This would include all the tabs, comparison views, stats, etc.
        }
        // ... (extensive styling would continue here)
      `}</style>
    </div>
  );
};

export default MagicEditor;