import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '@/types';
import apiService from '@/services/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await apiService.login(email, password);
    return response;
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password, username }: { email: string; password: string; username: string }) => {
    const response = await apiService.register(email, password, username);
    return response;
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async () => {
    const [token, userString] = await AsyncStorage.multiGet(['auth_token', 'user']);
    if (token[1] && userString[1]) {
      const user = JSON.parse(userString[1]) as User;
      return { token: token[1], user };
    }
    throw new Error('No stored auth found');
  }
);

export const refreshUser = createAsyncThunk(
  'auth/refreshUser',
  async () => {
    const user = await apiService.getCurrentUser();
    return user;
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    await apiService.logout();
  }
);

export const setSocialAuth = createAsyncThunk(
  'auth/setSocialAuth',
  async ({ token, user }: { token: string; user: User }) => {
    // Store the token and user data
    await AsyncStorage.multiSet([
      ['auth_token', token],
      ['user', JSON.stringify(user)]
    ]);
    return { token, user };
  }
);

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    updateCredits: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.credits = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        // Store to AsyncStorage
        AsyncStorage.multiSet([
          ['auth_token', action.payload.access_token],
          ['user', JSON.stringify(action.payload.user)]
        ]);
      })
      .addCase(loginUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        // Store to AsyncStorage
        AsyncStorage.multiSet([
          ['auth_token', action.payload.access_token],
          ['user', JSON.stringify(action.payload.user)]
        ]);
      })
      .addCase(registerUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });

    // Load stored auth
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });

    // Refresh user
    builder
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });

    // Social Auth
    builder
      .addCase(setSocialAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(setSocialAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(setSocialAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuth, updateUser, updateCredits } = authSlice.actions;
export default authSlice.reducer;