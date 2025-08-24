import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { videoService, VideoUpload, ProcessingOptions } from '../../services/videoService';

export interface UploadState {
  uploads: VideoUpload[];
  isUploading: boolean;
  error: string | null;
}

const initialState: UploadState = {
  uploads: [],
  isUploading: false,
  error: null,
};

// Async thunks
export const uploadVideo = createAsyncThunk(
  'upload/uploadVideo',
  async ({ 
    uri, 
    filename, 
    options 
  }: { 
    uri: string; 
    filename: string; 
    options: ProcessingOptions; 
  }) => {
    const videoId = await videoService.uploadVideo(uri, filename, options);
    return videoId;
  }
);

export const processVideo = createAsyncThunk(
  'upload/processVideo',
  async ({ videoId, options }: { videoId: string; options: ProcessingOptions }) => {
    await videoService.processVideo(videoId, options);
    return videoId;
  }
);

export const getProcessingStatus = createAsyncThunk(
  'upload/getProcessingStatus',
  async (videoId: string) => {
    return await videoService.getProcessingStatus(videoId);
  }
);

export const downloadVideo = createAsyncThunk(
  'upload/downloadVideo',
  async ({ videoId, platform }: { videoId: string; platform: string }) => {
    return await videoService.downloadVideo(videoId, platform);
  }
);

export const remixContent = createAsyncThunk(
  'upload/remixContent',
  async ({ videoId, remixOptions }: { videoId: string; remixOptions: any }) => {
    return await videoService.remixContent(videoId, remixOptions);
  }
);

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    updateUploadProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const upload = state.uploads.find(u => u.id === action.payload.id);
      if (upload) {
        upload.progress = action.payload.progress;
      }
    },
    updateUploadStatus: (state, action: PayloadAction<{ id: string; status: VideoUpload['status'] }>) => {
      const upload = state.uploads.find(u => u.id === action.payload.id);
      if (upload) {
        upload.status = action.payload.status;
      }
    },
    addUpload: (state, action: PayloadAction<VideoUpload>) => {
      state.uploads.push(action.payload);
    },
    removeUpload: (state, action: PayloadAction<string>) => {
      state.uploads = state.uploads.filter(upload => upload.id !== action.payload);
    },
    clearCompletedUploads: (state) => {
      state.uploads = state.uploads.filter(
        upload => upload.status !== 'completed' && upload.status !== 'failed'
      );
    },
    cancelUpload: (state, action: PayloadAction<string>) => {
      const upload = state.uploads.find(u => u.id === action.payload);
      if (upload) {
        upload.status = 'failed';
        videoService.cancelUpload(action.payload);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload video
      .addCase(uploadVideo.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadVideo.fulfilled, (state, action) => {
        state.isUploading = false;
        // Upload tracking is handled by the service
      })
      .addCase(uploadVideo.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.error.message || 'Upload failed';
      })
      
      // Process video
      .addCase(processVideo.pending, (state) => {
        state.error = null;
      })
      .addCase(processVideo.fulfilled, (state) => {
        // Processing started successfully
      })
      .addCase(processVideo.rejected, (state, action) => {
        state.error = action.error.message || 'Processing failed';
      })
      
      // Get processing status
      .addCase(getProcessingStatus.fulfilled, (state, action) => {
        // Status updates handled by real-time polling
      })
      .addCase(getProcessingStatus.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to get status';
      })
      
      // Download video
      .addCase(downloadVideo.fulfilled, (state) => {
        // Download completed
      })
      .addCase(downloadVideo.rejected, (state, action) => {
        state.error = action.error.message || 'Download failed';
      })
      
      // Remix content
      .addCase(remixContent.fulfilled, (state) => {
        // Remix completed
      })
      .addCase(remixContent.rejected, (state, action) => {
        state.error = action.error.message || 'Remix failed';
      });
  },
});

export const {
  updateUploadProgress,
  updateUploadStatus,
  addUpload,
  removeUpload,
  clearCompletedUploads,
  cancelUpload,
  clearError,
} = uploadSlice.actions;

export default uploadSlice.reducer;