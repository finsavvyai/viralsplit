const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UploadRequest {
  filename: string;
  file_size: number;
  content_type: string;
}

export interface UploadResponse {
  upload_url: string;
  project_id: string;
  file_key: string;
}

export interface TransformRequest {
  platforms: string[];
  options?: Record<string, unknown>;
}

export interface ProjectStatus {
  project: {
    id: string;
    status: 'pending_upload' | 'uploaded' | 'processing' | 'completed' | 'error';
    filename?: string;
    platforms?: string[];
    progress?: number;
    error?: string;
    created_at?: number;
  };
  transformations: Record<string, {
    url: string;
    status: string;
    specs: Record<string, unknown>;
  }>;
}

export class ViralSplitAPI {
  static async requestUpload(request: UploadRequest): Promise<UploadResponse> {
    const response = await fetch(`${API_BASE_URL}/api/upload/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload request failed');
    }

    return response.json();
  }

  static async uploadFile(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }
  }

  static async completeUpload(projectId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/upload/complete/${projectId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload completion failed');
    }
  }

  static async transformVideo(projectId: string, request: TransformRequest): Promise<Record<string, unknown>> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/transform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Transformation failed');
    }

    return response.json();
  }

  static async getProjectStatus(projectId: string): Promise<ProjectStatus> {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get project status');
    }

    return response.json();
  }
}

export const validateVideoFile = (file: File): string | null => {
  // Check file type
  if (!file.type.startsWith('video/')) {
    return 'Please select a video file';
  }

  // Check file size (500MB limit)
  const maxSize = 500 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'File size must be less than 500MB';
  }

  // Check file extension
  const allowedExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return 'Supported formats: MP4, MOV, AVI, WEBM, MKV';
  }

  return null;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};