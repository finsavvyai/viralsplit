import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';

interface VideoUploaderProps {
  onUpload: (file: File) => Promise<void>;
  maxSize?: number;
  brand: 'viralsplit' | 'contentmulti';
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUpload,
  maxSize = 500 * 1024 * 1024, // 500MB
  brand
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      // Request upload URL
      const response = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name })
      });
      
      const { upload_url, project_id } = await response.json();
      
      // Upload directly to R2
      await uploadToR2(file, upload_url, setProgress);
      
      // Notify parent component
      await onUpload(file);
      
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUpload]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    maxSize,
    multiple: false
  });
  
  const brandStyles = {
    viralsplit: 'bg-gradient-to-r from-purple-600 to-pink-600',
    contentmulti: 'bg-gradient-to-r from-blue-600 to-cyan-600'
  };
  
  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-xl p-12
        ${isDragActive ? 'border-white bg-opacity-10' : 'border-gray-600'}
        ${uploading ? 'pointer-events-none' : 'cursor-pointer'}
        transition-all duration-200 hover:border-white
      `}
    >
      <input {...getInputProps()} />
      
      {uploading ? (
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
          <p className="text-lg mb-2">Uploading...</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`${brandStyles[brand]} h-2 rounded-full transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-xl mb-2">
            {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
          </p>
          <p className="text-sm text-gray-400">or click to browse</p>
          <p className="text-xs text-gray-500 mt-4">
            MP4, MOV, AVI, WEBM • Max {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      )}
    </div>
  );
};

async function uploadToR2(
  file: File, 
  uploadUrl: string, 
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', reject);
    
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}