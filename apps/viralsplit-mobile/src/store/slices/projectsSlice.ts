import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Project, ProjectsState } from '@/types';
import apiService from '@/services/api';

// Async thunks
export const fetchUserProjects = createAsyncThunk(
  'projects/fetchUserProjects',
  async () => {
    const projects = await apiService.getUserProjects();
    return projects;
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async ({ filename, fileSize, contentType }: { filename: string; fileSize: number; contentType: string }) => {
    const uploadResponse = await apiService.requestUpload({
      filename,
      file_size: fileSize,
      content_type: contentType,
    });
    return uploadResponse;
  }
);

export const updateProjectStatus = createAsyncThunk(
  'projects/updateProjectStatus',
  async (projectId: string) => {
    const project = await apiService.getProjectStatus(projectId);
    return project;
  }
);

export const startVideoTransform = createAsyncThunk(
  'projects/startVideoTransform',
  async ({ projectId, platforms, options }: { projectId: string; platforms: string[]; options: any }) => {
    const response = await apiService.transformVideo(projectId, { platforms, options });
    return { projectId, response };
  }
);

// Initial state
const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
};

// Slice
const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = action.payload;
      }
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.unshift(action.payload);
    },
    clearProjects: (state) => {
      state.projects = [];
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch user projects
    builder
      .addCase(fetchUserProjects.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchUserProjects.rejected, (state) => {
        state.isLoading = false;
      });

    // Create project
    builder
      .addCase(createProject.fulfilled, (state, action) => {
        // Project will be added when we get the actual project data
        console.log('Project creation initiated:', action.payload.project_id);
      });

    // Update project status
    builder
      .addCase(updateProjectStatus.fulfilled, (state, action) => {
        const project = action.payload;
        const index = state.projects.findIndex(p => p.id === project.id);
        if (index !== -1) {
          state.projects[index] = project;
        } else {
          state.projects.unshift(project);
        }
        if (state.currentProject?.id === project.id) {
          state.currentProject = project;
        }
      });

    // Start video transform
    builder
      .addCase(startVideoTransform.fulfilled, (state, action) => {
        const { projectId } = action.payload;
        const project = state.projects.find(p => p.id === projectId);
        if (project) {
          project.status = 'processing';
        }
        if (state.currentProject?.id === projectId) {
          state.currentProject.status = 'processing';
        }
      });
  },
});

export const { setCurrentProject, updateProject, addProject, clearProjects } = projectsSlice.actions;
export default projectsSlice.reducer;