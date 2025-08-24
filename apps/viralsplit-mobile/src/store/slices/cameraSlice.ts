import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CameraState, CameraSettings, RecordingSession, RealTimeAnalysis } from '@/types';

// Initial state
const initialState: CameraState = {
  isRecording: false,
  currentSession: null,
  settings: {
    quality: 'high',
    fps: 30,
    stabilization: true,
    flash: false,
    timer: 0,
    grid: false,
  },
  realTimeAnalysis: null,
};

// Slice
const cameraSlice = createSlice({
  name: 'camera',
  initialState,
  reducers: {
    startRecording: (state, action: PayloadAction<RecordingSession>) => {
      state.isRecording = true;
      state.currentSession = action.payload;
      state.realTimeAnalysis = null;
    },
    stopRecording: (state) => {
      state.isRecording = false;
    },
    updateRecordingSession: (state, action: PayloadAction<Partial<RecordingSession>>) => {
      if (state.currentSession) {
        state.currentSession = { ...state.currentSession, ...action.payload };
      }
    },
    setCurrentSession: (state, action: PayloadAction<RecordingSession | null>) => {
      state.currentSession = action.payload;
    },
    updateCameraSettings: (state, action: PayloadAction<Partial<CameraSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setRealTimeAnalysis: (state, action: PayloadAction<RealTimeAnalysis | null>) => {
      state.realTimeAnalysis = action.payload;
    },
    clearCamera: (state) => {
      state.isRecording = false;
      state.currentSession = null;
      state.realTimeAnalysis = null;
    },
  },
});

export const {
  startRecording,
  stopRecording,
  updateRecordingSession,
  setCurrentSession,
  updateCameraSettings,
  setRealTimeAnalysis,
  clearCamera,
} = cameraSlice.actions;

export default cameraSlice.reducer;