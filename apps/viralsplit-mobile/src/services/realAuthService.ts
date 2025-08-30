import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { apiService } from './api';
import { User, AuthResponse } from '@/types';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  mfaRequired: boolean;
  mfaSetup: boolean;
}

export interface MFASetupResponse {
  qr_code: string;
  backup_codes: string[];
  secret: string;
}

class RealAuthService {
  private authState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    mfaRequired: false,
    mfaSetup: false,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    this.loadStoredAuth();
  }

  // Subscribe to auth state changes
  subscribe(callback: (state: AuthState) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback({ ...this.authState }));
  }

  private async loadStoredAuth() {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        this.authState = {
          user,
          token,
          isAuthenticated: true,
          mfaRequired: false,
          mfaSetup: user.mfa_enabled || false,
        };
        
        // Validate token by fetching current user
        try {
          const currentUser = await apiService.getCurrentUser();
          this.authState.user = currentUser;
          await AsyncStorage.setItem('user', JSON.stringify(currentUser));
        } catch (error) {
          // Token is invalid, clear auth
          await this.clearAuth();
        }
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      this.authState = {
        user: null,
        token: null,
        isAuthenticated: false,
        mfaRequired: false,
        mfaSetup: false,
      };
      this.notifyListeners();
    }
  }

  async login(email: string, password: string, mfaCode?: string): Promise<void> {
    try {
      const response = await apiService.login(email, password, mfaCode);
      
      if (response.mfa_required) {
        this.authState = {
          ...this.authState,
          mfaRequired: true,
          mfaSetup: false,
        };
        this.notifyListeners();
        throw new Error('MFA_REQUIRED');
      }
      
      await this.setAuthData(response);
    } catch (error: any) {
      if (error.message === 'MFA_REQUIRED') {
        throw error;
      }
      
      const message = error.response?.data?.error || 'Login failed';
      throw new Error(message);
    }
  }

  async register(email: string, password: string, username: string): Promise<void> {
    try {
      const response = await apiService.register(email, password, username);
      await this.setAuthData(response);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      throw new Error(message);
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.logout();
    } catch (error) {
      // Continue with local logout even if API fails
      console.error('Logout API error:', error);
    } finally {
      await this.clearAuth();
    }
  }

  async refreshUser(): Promise<void> {
    try {
      if (!this.authState.isAuthenticated) return;
      
      const user = await apiService.getCurrentUser();
      this.authState.user = user;
      await AsyncStorage.setItem('user', JSON.stringify(user));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, the token might be invalid
      await this.clearAuth();
    }
  }

  async setupMFA(): Promise<MFASetupResponse> {
    try {
      const response = await apiService.enableMFA();
      return response;
    } catch (error: any) {
      const message = error.response?.data?.error || 'MFA setup failed';
      throw new Error(message);
    }
  }

  async verifyMFA(code: string): Promise<void> {
    try {
      const response = await apiService.verifyMFA(code);
      
      if (response.verified) {
        this.authState.mfaSetup = true;
        
        // Update user object
        if (this.authState.user) {
          this.authState.user = {
            ...this.authState.user,
            mfa_enabled: true,
          };
          await AsyncStorage.setItem('user', JSON.stringify(this.authState.user));
        }
        
        this.notifyListeners();
      } else {
        throw new Error('Invalid MFA code');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'MFA verification failed';
      throw new Error(message);
    }
  }

  async disableMFA(password: string): Promise<void> {
    try {
      await apiService.disableMFA(password);
      
      this.authState.mfaSetup = false;
      
      // Update user object
      if (this.authState.user) {
        this.authState.user = {
          ...this.authState.user,
          mfa_enabled: false,
        };
        await AsyncStorage.setItem('user', JSON.stringify(this.authState.user));
      }
      
      this.notifyListeners();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to disable MFA';
      throw new Error(message);
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiService.requestPasswordReset(email);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Password reset request failed';
      throw new Error(message);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiService.resetPassword(token, newPassword);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Password reset failed';
      throw new Error(message);
    }
  }

  // Social login integration
  async socialLogin(provider: 'google' | 'apple', idToken: string): Promise<void> {
    try {
      // Implement social login with your API
      const response = await apiService.client.post<AuthResponse>(`/api/auth/social/${provider}`, {
        id_token: idToken,
      });
      
      await this.setAuthData(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Social login failed';
      throw new Error(message);
    }
  }

  private async setAuthData(response: AuthResponse): Promise<void> {
    // Store in secure storage
    await SecureStore.setItemAsync('auth_token', response.access_token);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    
    this.authState = {
      user: response.user,
      token: response.access_token,
      isAuthenticated: true,
      mfaRequired: false,
      mfaSetup: response.user.mfa_enabled || false,
    };
    
    this.notifyListeners();
  }

  private async clearAuth(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token').catch(() => {});
    await AsyncStorage.removeItem('user').catch(() => {});
    
    this.authState = {
      user: null,
      token: null,
      isAuthenticated: false,
      mfaRequired: false,
      mfaSetup: false,
    };
    
    this.notifyListeners();
  }

  // Getters for current state
  get currentUser(): User | null {
    return this.authState.user;
  }

  get isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  get mfaRequired(): boolean {
    return this.authState.mfaRequired;
  }

  get mfaSetup(): boolean {
    return this.authState.mfaSetup;
  }

  get token(): string | null {
    return this.authState.token;
  }
}

// Export singleton instance
export const realAuthService = new RealAuthService();
export default realAuthService;