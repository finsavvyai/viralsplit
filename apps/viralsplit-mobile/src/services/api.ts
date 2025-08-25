import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  AuthResponse, 
  Project, 
  ViralScore, 
  Hook, 
  Script,
  RemixVariation,
  APIResponse,
  UploadRequest,
  UploadResponse,
  TransformRequest,
  RealTimeAnalysis
} from '@/types';

class APIService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use your existing API endpoint - update this with your actual API URL
    this.baseURL = __DEV__ 
      ? 'https://api.viralsplit.io'  // Production
      : 'https://api.viralsplit.io'; // Production
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Temporarily disable console.error to see if it's causing Toast
        // console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ===== AUTHENTICATION =====
  
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    
    // Store token for future requests
    await AsyncStorage.setItem('auth_token', response.data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  }

  async register(email: string, password: string, username: string): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/register', {
      email,
      password,
      username,
    });
    
    // Store token for future requests
    await AsyncStorage.setItem('auth_token', response.data.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<{ user: User }>('/api/auth/me');
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data.user;
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove(['auth_token', 'user']);
  }

  // ===== VIDEO UPLOAD & PROCESSING =====
  
  async requestUpload(request: UploadRequest): Promise<UploadResponse> {
    const response = await this.client.post<UploadResponse>('/api/upload/request', request);
    return response.data;
  }

  async completeUpload(projectId: string): Promise<APIResponse> {
    const response = await this.client.post<APIResponse>(`/api/upload/complete/${projectId}`);
    return response.data;
  }

  async transformVideo(projectId: string, request: TransformRequest): Promise<APIResponse> {
    const response = await this.client.post<APIResponse>(
      `/api/projects/${projectId}/transform`, 
      request
    );
    return response.data;
  }

  async getProjectStatus(projectId: string): Promise<Project> {
    const response = await this.client.get<{ project: Project }>(`/api/projects/${projectId}/status`);
    return response.data.project;
  }

  async getUserProjects(): Promise<Project[]> {
    const response = await this.client.get<{ projects: Project[] }>('/api/projects');
    return response.data.projects;
  }

  // ===== AI FEATURES =====
  
  async getViralScore(projectId: string): Promise<ViralScore> {
    const response = await this.client.post<ViralScore>(`/api/projects/${projectId}/viral-score`);
    return response.data;
  }

  async generateHooks(projectId: string): Promise<Hook[]> {
    const response = await this.client.post<{ hooks: Hook[] }>(`/api/projects/${projectId}/generate-hooks`);
    return response.data.hooks;
  }

  async optimizeHashtags(projectId: string): Promise<string[]> {
    const response = await this.client.post<{ hashtags: string[] }>(`/api/projects/${projectId}/optimize-hashtags`);
    return response.data.hashtags;
  }

  // ===== AI SCRIPT WRITER =====
  
  async generateScript(concept: string, platform: string, duration: number, style: string): Promise<Script> {
    const response = await this.client.post<{ script: Script }>('/api/scripts/generate', {
      concept,
      platform,
      duration,
      style,
    });
    return response.data.script;
  }

  async refineScript(script: string, feedback: string, improvements: string[]): Promise<Script> {
    const response = await this.client.post<{ refined_script: Script }>('/api/scripts/refine', {
      script,
      feedback,
      improvements,
    });
    return response.data.refined_script;
  }

  async getViralHooks(style: string, platform: string): Promise<Hook[]> {
    const response = await this.client.get<{ hooks: Hook[] }>('/api/scripts/hooks', {
      params: { style, platform },
    });
    return response.data.hooks;
  }

  // ===== MAGIC EDIT SUITE =====
  
  async getMagicEditPresets(): Promise<any> {
    const response = await this.client.get('/api/magic-edit/presets');
    return response.data;
  }

  async enhanceVideo(formData: FormData): Promise<APIResponse> {
    const response = await this.client.post<APIResponse>('/api/magic-edit/enhance', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async generatePreview(formData: FormData): Promise<APIResponse> {
    const response = await this.client.post<APIResponse>('/api/magic-edit/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // ===== CONTENT REMIX ENGINE =====
  
  async getRemixOptions(): Promise<any> {
    const response = await this.client.get('/api/remix/options');
    return response.data;
  }

  async remixContent(formData: FormData): Promise<{ remix_results: RemixVariation[] }> {
    const response = await this.client.post<{ remix_results: RemixVariation[] }>(
      '/api/remix/multiply', 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async previewRemix(formData: FormData): Promise<{ preview_variations: RemixVariation[] }> {
    const response = await this.client.post<{ preview_variations: RemixVariation[] }>(
      '/api/remix/preview',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async getTrendingAdaptations(platform: string, contentType: string): Promise<any> {
    const response = await this.client.get('/api/remix/trending-adaptations', {
      params: { platform, content_type: contentType },
    });
    return response.data;
  }

  // ===== MOBILE-SPECIFIC FEATURES =====
  
  async analyzeRecording(videoBlob: Blob): Promise<RealTimeAnalysis> {
    const formData = new FormData();
    formData.append('video', videoBlob as any, 'recording.mp4');
    
    const response = await this.client.post<RealTimeAnalysis>(
      '/api/mobile/recording/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
    await this.client.post('/api/mobile/push/register', {
      token,
      platform,
    });
  }

  async getTrendingContent(platforms: string[], limit: number = 10): Promise<any> {
    const response = await this.client.get('/api/mobile/features/trending', {
      params: {
        platforms: platforms.join(','),
        limit,
      },
    });
    return response.data;
  }

  // ===== ANALYTICS =====
  
  async getAnalyticsDashboard(userId: string): Promise<any> {
    const response = await this.client.get(`/api/analytics/${userId}/dashboard`);
    return response.data;
  }

  async getOptimalTiming(userId: string, platforms: string[]): Promise<any> {
    const response = await this.client.get(`/api/users/${userId}/optimal-timing`, {
      params: {
        platforms: platforms.join(','),
      },
    });
    return response.data;
  }

  // ===== UTILITY METHODS =====
  
  async uploadFile(file: any, uploadUrl: string): Promise<void> {
    // Direct upload to R2/S3 using presigned URL
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'video/mp4',
      },
    });
  }

  async downloadFile(url: string): Promise<Blob> {
    const response = await axios.get(url, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Version check
  async getVersion(): Promise<any> {
    try {
      const response = await this.client.get('/version');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch version:', error);
      return {
        version: "1.0.0",
        build: 1,
        deployment: {},
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;