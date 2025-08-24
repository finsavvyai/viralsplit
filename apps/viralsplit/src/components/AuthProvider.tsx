'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  brand: string;
  subscription_tier: string;
  subscription_status: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

interface SocialAccount {
  platform: string;
  account_id: string;
  account_name: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  connected_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  socialAccounts: SocialAccount[];
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, brand: string) => Promise<void>;
  logout: () => void;
  connectSocialAccount: (platform: string, accountData: any) => Promise<void>;
  disconnectSocialAccount: (platform: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://viralspiritio-production.up.railway.app';

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        await fetchSocialAccounts(authToken);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialAccounts = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/social/accounts`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSocialAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching social accounts:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.access_token);
        setUser(data.user);
        localStorage.setItem('auth_token', data.access_token);
        await fetchSocialAccounts(data.access_token);
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, brand: string = 'viralsplit') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, brand }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after successful registration
        await login(email, password);
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSocialAccounts([]);
    localStorage.removeItem('auth_token');
  };

  const connectSocialAccount = async (platform: string, accountData: any) => {
    if (!token) {
      setError('You must be logged in to connect social accounts');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/social/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          account_id: accountData.id,
          account_name: accountData.name,
          access_token: accountData.access_token,
          refresh_token: accountData.refresh_token,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh social accounts list
        await fetchSocialAccounts(token);
      } else {
        setError(data.detail || 'Failed to connect account');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const disconnectSocialAccount = async (platform: string) => {
    if (!token) {
      setError('You must be logged in to disconnect social accounts');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/social/disconnect/${platform}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh social accounts list
        await fetchSocialAccounts(token);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to disconnect account');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    socialAccounts,
    login,
    register,
    logout,
    connectSocialAccount,
    disconnectSocialAccount,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
