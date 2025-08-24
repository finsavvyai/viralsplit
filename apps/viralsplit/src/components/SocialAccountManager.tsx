'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

interface SocialAccountManagerProps {
  onClose?: () => void;
}

const SOCIAL_PLATFORMS = [
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-black',
    description: 'Connect your TikTok account for direct posting'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    description: 'Connect Instagram for Reels and Feed posts'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '📺',
    color: 'bg-red-600',
    description: 'Connect YouTube for Shorts and regular videos'
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: '🐦',
    color: 'bg-black',
    description: 'Connect Twitter for video posts'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-600',
    description: 'Connect LinkedIn for professional content'
  }
];

export const SocialAccountManager: React.FC<SocialAccountManagerProps> = ({ onClose }) => {
  const { user, socialAccounts, connectSocialAccount, disconnectSocialAccount } = useAuth();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    setError(null);

    try {
      // In a real implementation, this would open OAuth flow
      // For now, we'll simulate the connection
      const mockAccountData = {
        id: `mock_${platform}_id_${Date.now()}`,
        name: `My ${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`,
        access_token: `mock_token_${platform}_${Date.now()}`,
        refresh_token: `mock_refresh_${platform}_${Date.now()}`
      };

      await connectSocialAccount(platform, mockAccountData);
    } catch (err) {
      setError(`Failed to connect ${platform} account`);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    try {
      await disconnectSocialAccount(platform);
    } catch (err) {
      setError(`Failed to disconnect ${platform} account`);
    }
  };

  const isConnected = (platform: string) => {
    return socialAccounts.some(account => account.platform === platform);
  };

  const getConnectedAccount = (platform: string) => {
    return socialAccounts.find(account => account.platform === platform);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please log in to manage your social accounts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Social Media Accounts</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SOCIAL_PLATFORMS.map((platform) => {
          const connected = isConnected(platform.id);
          const account = getConnectedAccount(platform.id);

          return (
            <div
              key={platform.id}
              className={`border rounded-lg p-4 ${
                connected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-white text-lg`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                    {connected && (
                      <p className="text-sm text-green-600 font-medium">
                        Connected
                      </p>
                    )}
                  </div>
                </div>
                {connected && (
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {platform.description}
              </p>

              {connected && account && (
                <div className="mb-4 p-3 bg-white rounded border">
                  <p className="text-sm font-medium text-gray-900">
                    {account.account_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Connected {new Date(account.connected_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                {connected ? (
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md text-sm hover:bg-red-700 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={connecting === platform.id}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {connecting === platform.id ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {socialAccounts.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Connected Accounts</h3>
          <p className="text-sm text-blue-700">
            You have {socialAccounts.length} connected account{socialAccounts.length !== 1 ? 's' : ''}. 
            Connected accounts will be used for direct posting when available.
          </p>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Connect your social media accounts to enable direct posting</li>
          <li>• Your videos will be automatically optimized for each platform</li>
          <li>• You can post directly to connected accounts after processing</li>
          <li>• Account credentials are securely stored and encrypted</li>
        </ul>
      </div>
    </div>
  );
};
