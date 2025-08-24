'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { wsClient } from '../lib/websocket-client';

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

  const uploadFromUrl = async (url: string) => {
    try {
      // Check authentication
      const authToken = localStorage.getItem('auth_token');
      const isTrial = !authToken;
      
      setUploadState({ status: 'uploading', progress: 15 });

      const headers: Record<string, string> = { 
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://viralspiritio-production.up.railway.app';
      
      const response = await fetch(`${API_BASE_URL}/api/upload/youtube`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          url, 
          agreed_to_terms: agreedToTerms,
          is_trial: isTrial
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process YouTube URL');
      }

      const { project_id } = await response.json();
      
      // Connect WebSocket for real-time updates
      wsClient.connect(project_id, (update) => {
        setUploadState({
          status: update.status,
          progress: update.progress,
          error: update.error,
          projectId: project_id
        });

        // Complete the upload flow when done
        if (update.status === 'complete') {
          // Haptic-like delay before completion
          setTimeout(() => {
            onUploadComplete(project_id, isTrial);
          }, 500);
        }
      });

    } catch (error) {
      console.error('URL processing error:', error);
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

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://viralspiritio-production.up.railway.app';
      
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
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://viralspiritio-production.up.railway.app';
      
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
        if (uploadState.progress < 35) return 'Fetching video content';
        if (uploadState.progress < 65) return 'Processing video data';
        if (uploadState.progress < 90) return 'Optimizing for platforms';
        return 'Finalizing';
      }
      return uploadState.status === 'processing' ? 'Processing video' : 'Uploading';
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
                <stop offset="0%" stopColor="#007AFF" />
                <stop offset="100%" stopColor="#5856D6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-white/90">
              {Math.round(uploadState.progress)}%
            </span>
          </div>
        </div>
        
        <h3 className="text-lg font-medium text-white/90 mb-2">
          {getStatusMessage()}
        </h3>
        <p className="text-sm text-white/60">
          {inputMode === 'url' ? 'Your video is being prepared' : 'This may take a moment'}
        </p>
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
          <h3 className="text-xl font-medium text-white/90 mb-2">Ready to optimize</h3>
          <p className="text-white/60">Your video has been processed successfully</p>
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
          <h3 className="text-lg font-medium text-white/90 mb-2">Upload failed</h3>
          <p className="text-sm text-red-400 mb-6">{uploadState.error}</p>
          <button
            onClick={resetUpload}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white font-medium transition-all duration-200"
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
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white/90 mb-2">YouTube URL</h3>
            <p className="text-white/60">Process any YouTube video directly</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/50 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all backdrop-blur"
            />
            
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl backdrop-blur">
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
                      ? 'bg-blue-500 border-blue-500' 
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
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl text-white font-medium transition-all duration-200 shadow-lg backdrop-blur"
            >
              Process Video
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-white/90 mb-2">
          {dragActive ? 'Drop your video' : 'Upload video'}
        </h3>
        <p className="text-white/60 mb-6">
          Drag and drop or click to select
        </p>
        <p className="text-xs text-white/40">
          Supports MP4, MOV, AVI, WEBM • Max 500MB
        </p>
      </div>
    );
  };

  const isInteractive = uploadState.status === 'idle' || uploadState.status === 'error';

  return (
    <div className="space-y-8">
      {/* Mode Toggle - Apple style segmented control */}
      <div className="flex justify-center">
        <div className="p-1 bg-white/5 rounded-2xl backdrop-blur border border-white/10">
          <div className="flex">
            <button
              onClick={() => {
                setInputMode('file');
                resetUpload();
              }}
              className={`relative px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                inputMode === 'file' 
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-white/70 hover:text-white/90'
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
                  ? 'bg-white text-black shadow-lg' 
                  : 'text-white/70 hover:text-white/90'
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
            ? 'bg-blue-500/10 border-blue-500/30 shadow-blue-500/20' 
            : 'bg-white/5 border-white/10 shadow-black/20'
          }
          border backdrop-blur-xl shadow-2xl
          ${isInteractive && inputMode === 'file' ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'}
          ${uploadState.status === 'error' ? 'border-red-500/30' : ''}
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