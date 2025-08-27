'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { wsClient } from '../lib/websocket-client';
import { theme } from '../styles/theme';

interface VideoUploaderProps {
  onUploadComplete: (projectId: string, isTrial?: boolean) => void;
  onAuthRequired?: () => void;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
  projectId?: string;
}

export const AppleDesignUploader: React.FC<VideoUploaderProps> = ({ onUploadComplete, onAuthRequired }) => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.viralsplit.io';
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 });
  const [dragActive, setDragActive] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      wsClient.disconnect();
    };
  }, []);

  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  // Polling function for fallback when WebSocket fails
  const startPolling = (projectId: string, isTrial: boolean) => {
    console.log('Starting polling for project:', projectId);
    
    const pollInterval = setInterval(async () => {
      try {
        const headers: Record<string, string> = { 
          'Content-Type': 'application/json'
        };
        
        const authToken = localStorage.getItem('auth_token');
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/status`, {
          method: 'GET',
          headers
        });

                  if (response.ok) {
            const status = await response.json();
            
            // Use actual progress from API
            const progress = status.progress || 0;
            const statusText = status.status || 'processing';
            
            // Map backend status to frontend status
            let frontendStatus: 'uploading' | 'processing' | 'complete' | 'error' = 'processing';
            if (statusText === 'ready_for_processing' || statusText === 'complete' || progress >= 100) {
              frontendStatus = 'complete';
            } else if (statusText === 'failed' || statusText === 'error') {
              frontendStatus = 'error';
            } else if (statusText === 'processing') {
              frontendStatus = 'processing';
            }
            
            setUploadState({
              status: frontendStatus,
              progress,
              error: status.error,
              projectId
            });

            if (frontendStatus === 'complete') {
              clearInterval(pollInterval);
              setTimeout(() => {
                onUploadComplete(projectId, isTrial);
              }, 500);
            } else if (frontendStatus === 'error') {
              clearInterval(pollInterval);
            }
          }
      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling on error
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setUploadState({
        status: 'error',
        progress: 0,
        error: 'Processing timeout'
      });
    }, 300000);
  };

  const uploadFromUrl = async (url: string) => {
    try {
      // Check authentication
      const authToken = localStorage.getItem('auth_token');
      const isTrial = !authToken;
      
      setUploadState({ status: 'uploading', progress: 0 });

      const headers: Record<string, string> = { 
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      console.log('🔍 Making API request to:', `${API_BASE_URL}/api/upload/youtube`);
      console.log('📡 Request headers:', headers);
      console.log('📦 Request body:', { url, agreed_to_terms: agreedToTerms, is_trial: isTrial });
      
      const response = await fetch(`${API_BASE_URL}/api/upload/youtube`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          url, 
          agreed_to_terms: agreedToTerms,
          is_trial: isTrial
        })
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process YouTube URL');
      }

      const { project_id } = await response.json();
      
      // Try WebSocket first, fallback to polling
      let wsConnected = false;
      
      try {
        const ws = new WebSocket(`wss://api.viralsplit.io/ws/${project_id}`);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          wsConnected = true;
        };
        
        ws.onmessage = (event) => {
          const update = JSON.parse(event.data);
          
          // Map backend status to frontend status
          let frontendStatus: 'uploading' | 'processing' | 'complete' | 'error' = 'processing';
          if (update.status === 'ready_for_processing' || update.status === 'complete' || update.progress >= 100) {
            frontendStatus = 'complete';
          } else if (update.status === 'failed' || update.status === 'error') {
            frontendStatus = 'error';
          } else if (update.status === 'processing') {
            frontendStatus = 'processing';
          }
          
          setUploadState({
            status: frontendStatus,
            progress: update.progress,
            error: update.error,
            projectId: project_id
          });

          // Complete the upload flow when done
          if (frontendStatus === 'complete') {
            setTimeout(() => {
              onUploadComplete(project_id, isTrial);
              ws.close();
            }, 500);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          wsConnected = false;
          // Fallback to polling
          startPolling(project_id, isTrial);
        };
        
        ws.onclose = () => {
          console.log('WebSocket closed');
          wsConnected = false;
        };
        
        // Set a timeout for WebSocket connection
        setTimeout(() => {
          if (!wsConnected) {
            console.log('WebSocket timeout, falling back to polling');
            ws.close();
            startPolling(project_id, isTrial);
          }
        }, 3000);
        
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        startPolling(project_id, isTrial);
      }

    } catch (error) {
      console.error('❌ URL processing error:', error);
      console.error('🔧 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setUploadState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'URL processing failed'
      });
    }
  };

  const uploadFromFile = async (file: File) => {
    try {
      // Check authentication
      const authToken = localStorage.getItem('auth_token');
      const isTrial = !authToken;
      
      setUploadState({ status: 'uploading', progress: 0 });

      const headers: Record<string, string> = { 
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/upload/request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          filename: file.name, 
          size: file.size, 
          type: file.type,
          is_trial: isTrial
        })
      });

      if (!response.ok) {
        throw new Error('Failed to request upload URL');
      }

      const { upload_url, project_id } = await response.json();
      
      await uploadFileWithProgress(file, upload_url, (progress) => {
        setUploadState(prev => ({ ...prev, progress }));
      });

      setUploadState({ status: 'processing', progress: 100, projectId: project_id });
      
      const processResponse = await fetch(`${API_BASE_URL}/api/upload/complete/${project_id}`, {
        method: 'POST'
      });

      if (!processResponse.ok) {
        throw new Error('Failed to complete upload');
      }

      setUploadState({ status: 'complete', progress: 100, projectId: project_id });
      
      setTimeout(() => {
        onUploadComplete(project_id, isTrial);
      }, 500);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  };

  const uploadFileWithProgress = (file: File, url: string, onProgress: (progress: number) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 500 * 1024 * 1024;
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid video file';
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 500MB';
    }
    
    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({ status: 'error', progress: 0, error: validationError });
      return;
    }
    
    await uploadFromFile(file);
  }, []);

  const handleYouTubeSubmit = async () => {
    if (!validateYouTubeUrl(youtubeUrl)) {
      setUploadState({ 
        status: 'error', 
        progress: 0, 
        error: 'Please enter a valid YouTube URL' 
      });
      return;
    }

    if (!agreedToTerms) {
      setUploadState({ 
        status: 'error', 
        progress: 0, 
        error: 'Please confirm you have rights to use this content' 
      });
      return;
    }

    await uploadFromUrl(youtubeUrl);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (inputMode === 'file') {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    }
  }, [handleFile, inputMode]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputMode === 'file') setDragActive(true);
  }, [inputMode]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const resetUpload = () => {
    setUploadState({ status: 'idle', progress: 0 });
    setYoutubeUrl('');
    setAgreedToTerms(false);
  };

  const renderProgressContent = () => {
    const getStatusMessage = () => {
      if (inputMode === 'url') {
        // Influencer-style progress messages
        if (uploadState.progress < 10) return '🎬 Sliding into that YouTube link...';
        if (uploadState.progress < 20) return '✨ Manifesting your content goals...';
        if (uploadState.progress < 30) return '🔥 This video is about to be fire...';
        if (uploadState.progress < 40) return '💎 Turning your content into diamonds...';
        if (uploadState.progress < 50) return '🚀 Launching into viral territory...';
        if (uploadState.progress < 60) return '👑 Crowning your content royalty...';
        if (uploadState.progress < 70) return '🌟 Sprinkling that main character energy...';
        if (uploadState.progress < 80) return '💫 Making your content absolutely iconic...';
        if (uploadState.progress < 90) return '🎯 Hitting all the right algorithms...';
        if (uploadState.progress < 95) return '✅ Final boss level optimization...';
        return '🎉 Ready to break the internet!';
      }
      
      // File upload messages
      if (uploadState.status === 'processing') {
        if (uploadState.progress < 20) return '🎭 Setting the scene for greatness...';
        if (uploadState.progress < 40) return '💅 Giving your video a glow-up...';
        if (uploadState.progress < 60) return '🔮 Adding that special sauce...';
        if (uploadState.progress < 80) return '🌈 Making magic happen...';
        return '✨ Almost ready to slay...';
      }
      
      return uploadState.status === 'uploading' ? '📤 Serving looks while uploading...' : 'Processing video';
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* Apple-style progress ring */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />
            <path
              d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray={`${uploadState.progress}, 100`}
              className="transition-all duration-300 ease-out"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="50%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-white/90">
              {Math.round(uploadState.progress)}%
            </span>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent mb-2">
          {getStatusMessage()}
        </h3>
        <div className="space-y-1">
          <p className="text-sm text-white/80 font-medium">
            {inputMode === 'url' ? 'Your content is getting the VIP treatment' : 'Patience bestie, greatness takes time'}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-white/60">
            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderContent = () => {
    if (uploadState.status === 'uploading' || uploadState.status === 'processing') {
      return renderProgressContent();
    }

    if (uploadState.status === 'complete') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">That's so fetch! ✨</h3>
          <p className="text-green-300">Your content is ready to absolutely serve 💅</p>
        </motion.div>
      );
    }

    if (uploadState.status === 'error') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent mb-2">That's not very demure 😅</h3>
          <p className="text-sm text-rose-300 mb-6">{uploadState.error || 'The vibes are off bestie - let\'s run it back!'}</p>
          <button
            onClick={resetUpload}
            className="px-6 py-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 rounded-full text-white font-medium transition-all duration-200 shadow-lg shadow-fuchsia-500/25"
          >
            Try again
          </button>
        </motion.div>
      );
    }

    if (inputMode === 'url') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">YouTube URL</h3>
            <p className="text-white/70">Turn any YouTube video into pure content gold ✨</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/50 focus:border-fuchsia-500 focus:outline-none focus:ring-4 focus:ring-fuchsia-500/20 transition-all backdrop-blur"
            />
            
            <div className="p-4 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-600/10 border border-orange-500/20 rounded-2xl backdrop-blur">
              <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 transition-all ${
                    agreedToTerms 
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 border-fuchsia-500' 
                      : 'border-white/30 hover:border-white/50'
                  }`}>
                    {agreedToTerms && (
                      <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span>
                  I confirm I have the legal right to use this content and understand copyright responsibilities
                </span>
              </label>
            </div>
            
            <button
              onClick={handleYouTubeSubmit}
              disabled={!youtubeUrl || !agreedToTerms}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 backdrop-blur"
            >
              Process Video
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-fuchsia-500/25">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent mb-2">
          {dragActive ? 'Drop that content bestie! 📥' : 'Upload your masterpiece ✨'}
        </h3>
        <p className="text-white/70 mb-6">
          {dragActive ? 'Let it go, let it go! 🎵' : 'Drag, drop, or click - your content awaits!'}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-white/50">
          <span>MP4, MOV, AVI, WEBM</span>
          <div className="w-1 h-1 bg-white/30 rounded-full"></div>
          <span>Max 500MB</span>
          <div className="w-1 h-1 bg-white/30 rounded-full"></div>
          <span>Ready to go viral 🚀</span>
        </div>
      </div>
    );
  };

  const isInteractive = uploadState.status === 'idle' || uploadState.status === 'error';

  return (
    <div className="space-y-8">
      {/* Mode Toggle - Apple style segmented control */}
      <div className="flex justify-center">
        <div className="p-1 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl backdrop-blur border border-white/20 shadow-lg shadow-black/10">
          <div className="flex">
            <button
              onClick={() => {
                setInputMode('file');
                resetUpload();
              }}
              className={`relative px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                inputMode === 'file' 
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25' 
                  : 'text-white/70 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => {
                setInputMode('url');
                resetUpload();
              }}
              className={`relative px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                inputMode === 'url' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-500/25' 
                  : 'text-white/70 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              YouTube URL
            </button>
          </div>
        </div>
      </div>

      {/* Upload Area - Apple card style */}
      <motion.div
        layout
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative overflow-hidden rounded-3xl p-12 transition-all duration-300
          ${dragActive && inputMode === 'file' 
            ? 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-fuchsia-500/30 shadow-lg shadow-fuchsia-500/20' 
            : 'bg-gradient-to-br from-white/5 to-white/10 border-white/20 shadow-lg shadow-black/10'
          }
          border backdrop-blur-xl
          ${isInteractive && inputMode === 'file' ? 'cursor-pointer hover:from-white/10 hover:to-white/15 hover:border-white/30' : 'cursor-default'}
          ${uploadState.status === 'error' ? 'border-rose-500/30 from-rose-500/5 to-rose-500/10' : ''}
        `}
      >
        {isInteractive && inputMode === 'file' && (
          <input
            type="file"
            accept="video/*"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        )}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={`${uploadState.status}-${inputMode}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};