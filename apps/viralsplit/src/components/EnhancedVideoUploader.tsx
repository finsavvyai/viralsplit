'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, Link, Video } from 'lucide-react';
import { wsClient } from '../lib/websocket-client';
import { useAuth } from './AuthProvider';

interface VideoUploaderProps {
  onUploadComplete: (projectId: string) => void;
  onAuthRequired?: () => void;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
  projectId?: string;
}

export const EnhancedVideoUploader: React.FC<VideoUploaderProps> = ({ onUploadComplete, onAuthRequired }) => {
  const { user } = useAuth();
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

  const validateFile = (file: File): string | null => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm'];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid video file (MP4, MOV, AVI, WEBM)';
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 500MB';
    }
    
    return null;
  };

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
      // Step 1: Start processing
      setUploadState({ status: 'uploading', progress: 10 });

      // Check authentication
      const authToken = localStorage.getItem('auth_token');
      if (!authToken || !user) {
        if (onAuthRequired) {
          onAuthRequired();
        }
        setUploadState({ status: 'error', progress: 0, error: 'Please sign in to upload videos' });
        return;
      }

      // Step 2: Request URL processing
      const response = await fetch('/api/upload/youtube', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ url, agreed_to_terms: agreedToTerms })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process YouTube URL');
      }

      const { project_id } = await response.json();
      
      // Step 3: Connect WebSocket for real-time updates
      wsClient.connect(project_id, (update) => {
        setUploadState({
          status: update.status,
          progress: update.progress,
          error: update.error,
          projectId: project_id
        });

        // Complete the upload flow when done
        if (update.status === 'complete') {
          onUploadComplete(project_id);
        }
      });

      // Send initial progress update to server
      wsClient.sendUpdate({
        status: 'uploading',
        progress: 30,
        message: 'Processing YouTube URL...'
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
      if (!authToken || !user) {
        if (onAuthRequired) {
          onAuthRequired();
        }
        setUploadState({ status: 'error', progress: 0, error: 'Please sign in to upload videos' });
        return;
      }

      setUploadState({ status: 'uploading', progress: 0 });

      // Step 1: Request upload URL
      const response = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ filename: file.name, size: file.size, type: file.type })
      });

      if (!response.ok) {
        throw new Error('Failed to request upload URL');
      }

      const { upload_url, project_id } = await response.json();
      
      // Step 2: Connect WebSocket for real-time updates
      wsClient.connect(project_id, (update) => {
        setUploadState({
          status: update.status,
          progress: update.progress,
          error: update.error,
          projectId: project_id
        });

        // Complete the upload flow when done
        if (update.status === 'complete') {
          onUploadComplete(project_id);
        }
      });
      
      // Step 3: Upload directly to R2 with progress tracking
      await uploadFileWithProgress(file, upload_url, (progress) => {
        // Send progress updates through WebSocket
        wsClient.sendUpdate({
          status: 'uploading',
          progress: progress,
          message: 'Uploading file...'
        });
      });

      // Step 4: Mark upload as complete and start processing
      wsClient.sendUpdate({
        status: 'processing',
        progress: 95,
        message: 'Finalizing upload...'
      });

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

  const renderContent = () => {
    switch (uploadState.status) {
      case 'uploading':
        const getProgressMessage = () => {
          if (inputMode === 'url') {
            if (uploadState.progress < 30) return 'Fetching YouTube video...';
            if (uploadState.progress < 60) return 'Downloading video content...';
            if (uploadState.progress < 85) return 'Preparing for optimization...';
            return 'Almost ready...';
          }
          return 'Uploading your video...';
        };

        return (
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-400" />
            <p className="text-lg mb-2">{getProgressMessage()}</p>
            <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{Math.round(uploadState.progress)}% complete</p>
            {inputMode === 'url' && (
              <p className="text-xs text-gray-500 mt-2">
                YouTube videos typically take 10-30 seconds to process
              </p>
            )}
          </div>
        );

      case 'processing':
        return (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 animate-pulse">⚡</div>
            <p className="text-lg mb-2">Processing your video...</p>
            <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{Math.round(uploadState.progress)}% complete</p>
            <p className="text-xs text-gray-500 mt-2">Finalizing and preparing for platform selection...</p>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <p className="text-lg mb-2">
              {inputMode === 'url' ? 'YouTube video processed!' : 'Upload complete!'}
            </p>
            <p className="text-sm text-gray-400">Ready to select platforms</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-lg mb-2">Processing failed</p>
            <p className="text-sm text-red-400 mb-4">{uploadState.error}</p>
            <button
              onClick={resetUpload}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        );

      default:
        if (inputMode === 'url') {
          return (
            <div className="text-center space-y-4">
              <Link className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <p className="text-xl mb-4">Process YouTube Video</p>
              
              <div className="max-w-md mx-auto space-y-4">
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                
                <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-left">
                  <p className="text-sm text-yellow-300 mb-2">⚠️ Copyright Notice</p>
                  <label className="flex items-start gap-2 text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 accent-purple-500"
                    />
                    <span>
                      I confirm I have the legal right to use this content (I own it, have permission, 
                      or it&apos;s Creative Commons/public domain). I understand that processing copyrighted 
                      content without permission may violate copyright laws.
                    </span>
                  </label>
                </div>
                
                <button
                  onClick={handleYouTubeSubmit}
                  disabled={!youtubeUrl || !agreedToTerms}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Process YouTube Video
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl mb-2">
              {dragActive ? 'Drop your video here' : 'Drag & drop your video'}
            </p>
            <p className="text-sm text-gray-400 mb-4">or click to browse</p>
            <p className="text-xs text-gray-500">
              MP4, MOV, AVI, WEBM • Max 500MB
            </p>
          </div>
        );
    }
  };

  const isInteractive = uploadState.status === 'idle' || uploadState.status === 'error';

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => {
              setInputMode('file');
              resetUpload();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
              inputMode === 'file' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            Upload File
          </button>
          <button
            onClick={() => {
              setInputMode('url');
              resetUpload();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
              inputMode === 'url' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Link className="w-4 h-4" />
            YouTube URL
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-12 transition-all duration-200
          ${dragActive && inputMode === 'file' ? 'border-purple-400 bg-purple-400/5' : 'border-gray-600'}
          ${isInteractive && inputMode === 'file' ? 'cursor-pointer hover:border-gray-400' : 'cursor-default'}
          ${uploadState.status === 'error' ? 'border-red-500/50' : ''}
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
        
        {renderContent()}
      </div>
    </div>
  );
};