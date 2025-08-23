import { useState, useCallback } from 'react';
import { ViralSplitAPI, validateVideoFile, formatFileSize } from '@/lib/api';

export interface UploadProgress {
  stage: 'preparing' | 'uploading' | 'completing' | 'complete';
  progress: number;
  message: string;
}

export interface UseVideoUploadResult {
  uploadFile: (file: File) => Promise<string>;
  progress: UploadProgress | null;
  error: string | null;
  isUploading: boolean;
  reset: () => void;
}

export const useVideoUpload = (): UseVideoUploadResult => {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const reset = useCallback(() => {
    setProgress(null);
    setError(null);
    setIsUploading(false);
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    setError(null);
    setIsUploading(true);

    try {
      // Validate file
      const validationError = validateVideoFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Stage 1: Prepare upload
      setProgress({
        stage: 'preparing',
        progress: 10,
        message: `Preparing ${file.name} (${formatFileSize(file.size)})...`,
      });

      const uploadRequest = await ViralSplitAPI.requestUpload({
        filename: file.name,
        file_size: file.size,
        content_type: file.type,
      });

      // Stage 2: Upload file
      setProgress({
        stage: 'uploading',
        progress: 30,
        message: 'Uploading to cloud storage...',
      });

      await ViralSplitAPI.uploadFile(uploadRequest.upload_url, file);

      setProgress({
        stage: 'uploading',
        progress: 80,
        message: 'Upload almost complete...',
      });

      // Stage 3: Complete upload
      setProgress({
        stage: 'completing',
        progress: 90,
        message: 'Finalizing upload...',
      });

      await ViralSplitAPI.completeUpload(uploadRequest.project_id);

      // Stage 4: Complete
      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Upload complete!',
      });

      setIsUploading(false);
      return uploadRequest.project_id;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setIsUploading(false);
      throw err;
    }
  }, []);

  return {
    uploadFile,
    progress,
    error,
    isUploading,
    reset,
  };
};