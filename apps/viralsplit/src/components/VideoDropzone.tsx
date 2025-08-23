import { useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { validateVideoFile } from '@/lib/api';

interface VideoDropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  className?: string;
}

export const VideoDropzone: React.FC<VideoDropzoneProps> = ({
  onFileSelect,
  isUploading = false,
  className = '',
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
      setDragError(null);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setDragError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      setDragError(null);

      if (isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0];
      const validationError = validateVideoFile(file);
      
      if (validationError) {
        setDragError(validationError);
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect, isUploading]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const validationError = validateVideoFile(file);
      
      if (validationError) {
        setDragError(validationError);
        return;
      }

      setDragError(null);
      onFileSelect(file);
      
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    if (isUploading || !fileInputRef.current) return;
    fileInputRef.current.click();
  }, [isUploading]);

  return (
    <div className={className}>
      <motion.div
        className={`
          relative border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-purple-400 bg-purple-500/10' : ''}
          ${dragError ? 'border-red-400 bg-red-500/10' : 'border-gray-600 hover:border-white'}
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        whileHover={{ scale: isUploading ? 1 : 1.02 }}
        whileTap={{ scale: isUploading ? 1 : 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="text-center">
          <motion.div 
            className="text-6xl mb-4"
            animate={{ 
              scale: isDragActive ? 1.1 : 1,
              rotate: isDragActive ? 5 : 0 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {isDragActive ? '📥' : '📹'}
          </motion.div>
          
          <p className="text-xl mb-2">
            {isDragActive ? 'Drop your video here!' : 'Drag & drop your video'}
          </p>
          
          <p className="text-sm text-gray-400">
            or click to browse
          </p>
          
          <p className="text-xs text-gray-500 mt-4">
            MP4, MOV, AVI, WEBM • Max 500MB
          </p>

          {dragError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm"
            >
              {dragError}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};