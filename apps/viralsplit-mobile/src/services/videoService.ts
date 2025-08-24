import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { apiService } from './api';

export interface VideoUpload {
  id: string;
  uri: string;
  filename: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
}

export interface ProcessingOptions {
  quality: 'low' | 'medium' | 'high' | '4k';
  platforms: string[];
  aiEnhancements: boolean;
  viralOptimization: boolean;
}

class VideoService {
  private uploads: Map<string, VideoUpload> = new Map();
  private uploadTasks: Map<string, FileSystem.DownloadResumable> = new Map();

  async uploadVideo(
    uri: string, 
    filename: string, 
    options: ProcessingOptions,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    const uploadId = Date.now().toString();
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      throw new Error('Video file not found');
    }

    const upload: VideoUpload = {
      id: uploadId,
      uri,
      filename,
      size: fileInfo.size || 0,
      progress: 0,
      status: 'pending'
    };

    this.uploads.set(uploadId, upload);

    try {
      // Create multipart form data
      const formData = new FormData();
      formData.append('video', {
        uri,
        type: 'video/mp4',
        name: filename,
      } as any);
      formData.append('options', JSON.stringify(options));

      // Start chunked upload
      const uploadTask = FileSystem.createUploadTask(
        `${process.env.API_BASE_URL}/api/videos/upload`,
        uri,
        {
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'video',
          parameters: {
            filename,
            options: JSON.stringify(options)
          }
        },
        (progress) => {
          const progressPercent = progress.totalBytesSent / progress.totalBytesExpectedToSend * 100;
          this.updateUploadProgress(uploadId, progressPercent);
          onProgress?.(progressPercent);
        }
      );

      this.uploadTasks.set(uploadId, uploadTask);
      upload.status = 'uploading';
      
      const result = await uploadTask.uploadAsync();
      
      if (result && result.status === 200) {
        const response = JSON.parse(result.body);
        upload.status = 'processing';
        
        // Start polling for processing status
        this.pollProcessingStatus(response.videoId, uploadId);
        
        return response.videoId;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      upload.status = 'failed';
      this.uploads.set(uploadId, upload);
      throw error;
    }
  }

  private updateUploadProgress(uploadId: string, progress: number) {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.progress = progress;
      this.uploads.set(uploadId, upload);
    }
  }

  private async pollProcessingStatus(videoId: string, uploadId: string) {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await apiService.get(`/api/videos/${videoId}/status`);
        const upload = this.uploads.get(uploadId);
        
        if (upload) {
          if (status.status === 'completed') {
            upload.status = 'completed';
            this.uploads.set(uploadId, upload);
            return;
          } else if (status.status === 'failed') {
            upload.status = 'failed';
            this.uploads.set(uploadId, upload);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          // Timeout
          if (upload) {
            upload.status = 'failed';
            this.uploads.set(uploadId, upload);
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
        const upload = this.uploads.get(uploadId);
        if (upload) {
          upload.status = 'failed';
          this.uploads.set(uploadId, upload);
        }
      }
    };

    poll();
  }

  async processVideo(videoId: string, options: ProcessingOptions): Promise<void> {
    try {
      await apiService.post(`/api/videos/${videoId}/process`, options);
    } catch (error) {
      throw new Error('Failed to start video processing');
    }
  }

  async getProcessingStatus(videoId: string) {
    try {
      return await apiService.get(`/api/videos/${videoId}/status`);
    } catch (error) {
      throw new Error('Failed to get processing status');
    }
  }

  async downloadVideo(videoId: string, platform: string): Promise<string> {
    try {
      const response = await apiService.get(`/api/videos/${videoId}/download/${platform}`);
      const downloadUrl = response.downloadUrl;
      
      const filename = `${videoId}_${platform}.mp4`;
      const localPath = `${FileSystem.documentDirectory}${filename}`;
      
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, localPath);
      return downloadResult.uri;
    } catch (error) {
      throw new Error('Failed to download video');
    }
  }

  async remixContent(videoId: string, remixOptions: any): Promise<string[]> {
    try {
      const response = await apiService.post(`/api/videos/${videoId}/remix`, remixOptions);
      return response.remixedVideoIds;
    } catch (error) {
      throw new Error('Failed to remix content');
    }
  }

  async retryUpload(uploadId: string): Promise<void> {
    const upload = this.uploads.get(uploadId);
    if (!upload) {
      throw new Error('Upload not found');
    }

    upload.status = 'pending';
    upload.progress = 0;
    this.uploads.set(uploadId, upload);

    // Restart upload
    // Implementation would restart the upload process
  }

  cancelUpload(uploadId: string): void {
    const uploadTask = this.uploadTasks.get(uploadId);
    if (uploadTask) {
      uploadTask.pauseAsync();
      this.uploadTasks.delete(uploadId);
    }

    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.status = 'failed';
      this.uploads.set(uploadId, upload);
    }
  }

  getUpload(uploadId: string): VideoUpload | undefined {
    return this.uploads.get(uploadId);
  }

  getAllUploads(): VideoUpload[] {
    return Array.from(this.uploads.values());
  }

  clearCompletedUploads(): void {
    for (const [id, upload] of this.uploads.entries()) {
      if (upload.status === 'completed' || upload.status === 'failed') {
        this.uploads.delete(id);
        this.uploadTasks.delete(id);
      }
    }
  }
}

export const videoService = new VideoService();