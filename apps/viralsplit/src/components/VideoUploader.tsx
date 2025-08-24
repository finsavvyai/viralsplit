'use client';

import React, { useCallback, useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface VideoUploaderProps {
  onUploadComplete: (projectId: string) => void;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  error?: string;
  projectId?: string;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onUploadComplete }) => {
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 });
  const [dragActive, setDragActive] = useState(false);

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

  const uploadToAPI = async (file: File) => {
    try {
      setUploadState({ status: 'uploading', progress: 0 });

      // Step 1: Request upload URL
      const response = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, size: file.size, type: file.type })
      });

      if (!response.ok) {
        throw new Error('Failed to request upload URL');
      }

      const { upload_url, project_id } = await response.json();
      
      // Step 2: Upload directly to R2 with progress tracking
      await uploadFileWithProgress(file, upload_url, (progress) => {
        setUploadState(prev => ({ ...prev, progress }));
      });

      // Step 3: Mark upload as complete and start processing
      setUploadState({ status: 'processing', progress: 100, projectId: project_id });
      
      const processResponse = await fetch(`/api/projects/${project_id}/complete-upload`, {
        method: 'POST'
      });

      if (!processResponse.ok) {
        throw new Error('Failed to complete upload');
      }

      setUploadState({ status: 'complete', progress: 100, projectId: project_id });
      onUploadComplete(project_id);

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
    
    await uploadToAPI(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

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
  };

  const renderContent = () => {
    switch (uploadState.status) {
      case 'uploading':
        return (
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-400" />
            <p className="text-lg mb-2">Uploading your video...</p>
            <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{Math.round(uploadState.progress)}% complete</p>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 animate-pulse">⚡</div>
            <p className="text-lg mb-2">Processing your video...</p>
            <p className="text-sm text-gray-400">This may take a few moments</p>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <p className="text-lg mb-2">Upload complete!</p>
            <p className="text-sm text-gray-400">Ready to select platforms</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-lg mb-2">Upload failed</p>
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
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-xl p-12 transition-all duration-200
        ${dragActive ? 'border-purple-400 bg-purple-400/5' : 'border-gray-600'}
        ${isInteractive ? 'cursor-pointer hover:border-gray-400' : 'cursor-default'}
        ${uploadState.status === 'error' ? 'border-red-500/50' : ''}
      `}
    >
      {isInteractive && (
        <input
          type="file"
          accept="video/*"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      )}
      
      {renderContent()}
    </div>
  );
};