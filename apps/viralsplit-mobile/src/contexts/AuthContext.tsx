import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadStoredAuth } from '@/store/slices/authSlice';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Try to load stored authentication on app start
    dispatch(loadStoredAuth());
  }, [dispatch]);

  const login = async (email: string, password: string): Promise<void> => {
    const { loginUser } = await import('@/store/slices/authSlice');
    await dispatch(loginUser({ email, password })).unwrap();
  };

  const register = async (email: string, password: string, username: string): Promise<void> => {
    const { registerUser } = await import('@/store/slices/authSlice');
    await dispatch(registerUser({ email, password, username })).unwrap();
  };

  const logout = async (): Promise<void> => {
    const { logoutUser } = await import('@/store/slices/authSlice');
    await dispatch(logoutUser()).unwrap();
  };

  const refreshUser = async (): Promise<void> => {
    const { refreshUser: refreshUserAction } = await import('@/store/slices/authSlice');
    await dispatch(refreshUserAction()).unwrap();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};