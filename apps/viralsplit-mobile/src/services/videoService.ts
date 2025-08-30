import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Alert } from 'react-native';
import { apiService } from './api';
import io from 'socket.io-client';

export interface VideoUpload {
  id: string;
  uri: string;
  filename: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  thumbnail?: string;
  duration?: number;
  viral_score?: number;
  project_id?: string;
  transformations?: Record<string, string>;
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
  private socket: any = null;
  private progressCallbacks: Map<string, (progress: any) => void> = new Map();

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

    // Generate thumbnail
    const thumbnail = await this.generateThumbnail(uri);
    
    const upload: VideoUpload = {
      id: uploadId,
      uri,
      filename,
      size: fileInfo.size || 0,
      progress: 0,
      status: 'pending',
      thumbnail,
    };

    this.uploads.set(uploadId, upload);

    try {
      // Step 1: Request upload URL from API
      const uploadRequest = await apiService.requestUpload({
        filename,
        file_size: fileInfo.size || 0,
        content_type: 'video/mp4',
      });

      upload.project_id = uploadRequest.project_id;
      this.uploads.set(uploadId, upload);

      // Step 2: Upload file using the real API
      upload.status = 'uploading';
      
      const uploadResult = await apiService.uploadVideoFile(uri, filename, (progress) => {
        this.updateUploadProgress(uploadId, progress);
        onProgress?.(progress);
      });

      // Step 3: Complete the upload
      await apiService.completeUpload(uploadRequest.project_id);
      
      upload.status = 'processing';
      this.uploads.set(uploadId, upload);
      
      // Step 4: Set up WebSocket for real-time progress
      this.setupWebSocket(uploadRequest.project_id, uploadId);
      
      // Step 5: Start processing
      await apiService.transformVideo(uploadRequest.project_id, {
        platforms: options.platforms,
        options: {
          quality: options.quality,
          ai_enhancements: options.aiEnhancements,
          viral_optimization: options.viralOptimization,
        },
      });
      
      return uploadRequest.project_id;
    } catch (error) {
      upload.status = 'failed';
      this.uploads.set(uploadId, upload);
      throw error;
    }
  }

  private async generateThumbnail(videoUri: string): Promise<string> {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000, // 1 second into the video
        quality: 0.8,
      });
      return uri;
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      return '';
    }
  }

  private setupWebSocket(projectId: string, uploadId: string) {
    if (!this.socket) {
      this.socket = io('https://viralspiritio-production.up.railway.app', {
        transports: ['websocket', 'polling'],
      });
    }

    // Listen for progress updates
    this.socket.on(`progress_${projectId}`, (data: any) => {
      const upload = this.uploads.get(uploadId);
      if (upload) {
        upload.progress = data.progress;
        if (data.status) {
          upload.status = data.status;
        }
        if (data.viral_score) {
          upload.viral_score = data.viral_score;
        }
        if (data.transformations) {
          upload.transformations = data.transformations;
        }
        this.uploads.set(uploadId, upload);
        
        // Call any registered progress callbacks
        const callback = this.progressCallbacks.get(uploadId);
        if (callback) {
          callback(data);
        }
      }
    });

    // Join project room
    this.socket.emit('join_project', projectId);
  }

  private updateUploadProgress(uploadId: string, progress: number) {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.progress = progress;
      this.uploads.set(uploadId, upload);
    }
  }

  subscribeToProgress(uploadId: string, callback: (progress: any) => void) {
    this.progressCallbacks.set(uploadId, callback);
  }

  unsubscribeFromProgress(uploadId: string) {
    this.progressCallbacks.delete(uploadId);
  }

  async saveToGallery(videoUri: string): Promise<void> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      await MediaLibrary.saveToLibraryAsync(videoUri);
    } else {
      throw new Error('Media library permission required');
    }
  }

  async analyzeVideoRealTime(videoUri: string): Promise<any> {
    try {
      return await apiService.analyzeRecording(videoUri);
    } catch (error) {
      console.error('Real-time analysis failed:', error);
      return {
        current_score: 0,
        suggestions: ['Unable to analyze video'],
        hook_strength: 0,
        lighting_quality: 0,
        audio_quality: 0,
        composition_score: 0,
        trending_elements: [],
      };
    }
  }

  async getProjectStatus(projectId: string) {
    try {
      return await apiService.getProjectStatus(projectId);
    } catch (error) {
      throw new Error('Failed to get project status');
    }
  }

  async getViralScore(projectId: string) {
    try {
      return await apiService.getViralScore(projectId);
    } catch (error) {
      throw new Error('Failed to get viral score');
    }
  }

  async downloadVideo(projectId: string, platform: string): Promise<string> {
    try {
      const project = await this.getProjectStatus(projectId);
      const transformationUrl = project.transformations?.[platform];
      
      if (!transformationUrl) {
        throw new Error(`No transformation available for ${platform}`);
      }
      
      const filename = `${projectId}_${platform}.mp4`;
      const localPath = `${FileSystem.documentDirectory}${filename}`;
      
      const downloadResult = await FileSystem.downloadAsync(transformationUrl, localPath);
      return downloadResult.uri;
    } catch (error) {
      throw new Error('Failed to download video');
    }
  }

  async remixContent(projectId: string, remixOptions: any): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('options', JSON.stringify(remixOptions));
      
      const response = await apiService.remixContent(formData);
      return response.remix_results;
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
        this.progressCallbacks.delete(id);
      }
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.progressCallbacks.clear();
  }
}

export const videoService = new VideoService();
export default videoService;