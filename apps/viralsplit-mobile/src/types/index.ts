// Core API Types - matching backend FastAPI models

export interface User {
  id: string;
  email: string;
  username: string;
  credits: number;
  subscription_tier: 'free' | 'creator' | 'pro' | 'agency';
  created_at: string;
  profile_image?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Project {
  id: string;
  user_id: string;
  filename: string;
  file_key: string;
  file_size: number;
  status: 'pending_upload' | 'ready_for_processing' | 'processing' | 'completed' | 'failed';
  platforms: string[];
  created_at: number;
  completed_at?: number;
  transformations?: Record<string, any>;
  error?: string;
}

export interface Platform {
  id: string;
  name: string;
  format: string;
  optimal_length: string;
  aspect_ratio: string;
  max_duration: number;
  features: string[];
  icon: string;
}

export interface ViralScore {
  overall_score: number;
  platform_scores: Record<string, number>;
  predictions: {
    views: string;
    likes: string;
    shares: string;
    comments: string;
  };
  viral_elements: string[];
  improvement_suggestions: string[];
  confidence: number;
}

export interface Hook {
  id: string;
  text: string;
  category: string;
  viral_score: number;
  platform: string;
  style: string;
  best_for: string[];
  engagement_type: 'question' | 'shock' | 'story' | 'statistic' | 'challenge';
}

export interface Script {
  id: string;
  content: string;
  hooks: Hook[];
  duration: number;
  platform: string;
  style: string;
  viral_score: number;
  structure: {
    opening: string;
    body: string;
    closing: string;
    call_to_action: string;
  };
  emotional_journey: string[];
  engagement_predictions: {
    hook_strength: number;
    retention_rate: number;
    viral_potential: number;
  };
}

export interface MagicEditOptions {
  remove_background: boolean;
  enhance_face: boolean;
  fix_lighting: boolean;
  stabilize_video: boolean;
  upscale_quality: boolean;
  denoise_audio: boolean;
  auto_crop: boolean;
  color_grade: boolean;
  add_subtitles: boolean;
  speed_optimize: boolean;
}

export interface RemixVariation {
  id: string;
  name: string;
  platform: string;
  style: string;
  duration: string;
  format: string;
  viral_score: number;
  preview_url: string;
  download_url?: string;
  tags: string[];
  trending_elements: string[];
  engagement_prediction: {
    views: string;
    likes: string;
    shares: string;
    comments: string;
  };
}

export interface RemixOptions {
  platform_variations: boolean;
  style_variations: boolean;
  length_variations: boolean;
  format_variations: boolean;
  trending_adaptations: boolean;
  language_variations: boolean;
  audience_targeting: boolean;
  mood_variations: boolean;
  hook_variations: boolean;
  cta_variations: boolean;
  target_count: number;
}

// Mobile-specific types
export interface CameraSettings {
  quality: 'low' | 'medium' | 'high' | '4k';
  fps: 30 | 60;
  stabilization: boolean;
  flash: boolean;
  timer: number;
  grid: boolean;
}

export interface RecordingSession {
  id: string;
  uri: string;
  duration: number;
  size: number;
  thumbnail: string;
  created_at: string;
  viral_score?: number;
  ai_suggestions?: string[];
}

export interface RealTimeAnalysis {
  current_score: number;
  suggestions: string[];
  hook_strength: number;
  lighting_quality: number;
  audio_quality: number;
  composition_score: number;
  trending_elements: string[];
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduled_for?: string;
  type: 'processing_complete' | 'viral_moment' | 'trending_opportunity' | 'credit_low';
}

// Navigation Types
export type RootStackParamList = {
  // Auth Flow
  Onboarding: undefined;
  Auth: undefined;
  
  // Main App
  MainTabs: undefined;
  
  // Camera & Recording
  Camera: undefined;
  VideoReview: { videoUri: string };
  
  // Processing
  PlatformSelection: { videoUri: string };
  ProcessingStatus: { projectId: string };
  Results: { projectId: string };
  
  // Features
  AIScriptWriter: undefined;
  MagicEditor: { videoUri?: string };
  ContentRemixer: { videoUri?: string };
  
  // Profile & Settings
  Profile: undefined;
  Settings: undefined;
  Credits: undefined;
  Subscription: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Camera: undefined;
  Library: undefined;
  Analytics: undefined;
  Profile: undefined;
};

// API Request/Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

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
  options: Record<string, any>;
}

// Store Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
}

export interface CameraState {
  isRecording: boolean;
  currentSession: RecordingSession | null;
  settings: CameraSettings;
  realTimeAnalysis: RealTimeAnalysis | null;
}

export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  activeTab: string;
  isOnboarded: boolean;
  notifications: PushNotification[];
}