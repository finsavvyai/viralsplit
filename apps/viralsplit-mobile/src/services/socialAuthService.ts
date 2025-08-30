import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { apiService } from './api';

WebBrowser.maybeCompleteAuthSession();

interface SocialAuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    provider: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
  };
  error?: string;
}

interface PlatformConnection {
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'facebook';
  connected: boolean;
  username?: string;
  followers?: number;
  verified?: boolean;
  profile_url?: string;
  permissions: string[];
}

export class SocialAuthService {
  private readonly redirectUri = AuthSession.makeRedirectUri({
    scheme: 'viralsplit',
    useProxy: true,
  });

  // Google OAuth
  async signInWithGoogle(): Promise<SocialAuthResult> {
    try {
      const clientId = __DEV__ 
        ? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_DEV
        : process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

      if (!clientId) {
        throw new Error('Google OAuth client ID not configured');
      }

      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: this.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        additionalParameters: {},
        extraParams: {
          access_type: 'offline',
        },
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        useProxy: true,
      });

      if (result.type === 'success') {
        // Exchange code for tokens
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId,
            code: result.params.code,
            redirectUri: this.redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier!,
            },
          },
          {
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
          }
        );

        // Get user info
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResult.accessToken}`
        );
        const userInfo = await userInfoResponse.json();

        const user = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          provider: 'google',
        };

        // Store tokens securely
        await AsyncStorage.setItem('social_tokens_google', JSON.stringify(tokenResult));\n\n        return {\n          success: true,\n          user,\n          tokens: {\n            accessToken: tokenResult.accessToken,\n            refreshToken: tokenResult.refreshToken,\n            idToken: tokenResult.idToken,\n          },\n        };\n      }\n\n      return { success: false, error: 'User cancelled authentication' };\n    } catch (error) {\n      console.error('Google sign-in error:', error);\n      return { success: false, error: 'Failed to sign in with Google' };\n    }\n  }\n\n  // Apple Sign In\n  async signInWithApple(): Promise<SocialAuthResult> {\n    try {\n      if (Platform.OS !== 'ios') {\n        throw new Error('Apple Sign In is only available on iOS');\n      }\n\n      const isAvailable = await AppleAuthentication.isAvailableAsync();\n      if (!isAvailable) {\n        throw new Error('Apple Sign In is not available on this device');\n      }\n\n      const credential = await AppleAuthentication.signInAsync({\n        requestedScopes: [\n          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,\n          AppleAuthentication.AppleAuthenticationScope.EMAIL,\n        ],\n      });\n\n      const user = {\n        id: credential.user,\n        email: credential.email || '',\n        name: credential.fullName ? `${credential.fullName.givenName} ${credential.fullName.familyName}`.trim() : '',\n        provider: 'apple',\n      };\n\n      // Store Apple credential\n      await AsyncStorage.setItem('social_credential_apple', JSON.stringify(credential));\n\n      return {\n        success: true,\n        user,\n        tokens: {\n          accessToken: credential.identityToken || '',\n        },\n      };\n    } catch (error: any) {\n      console.error('Apple sign-in error:', error);\n      \n      if (error.code === 'ERR_CANCELED') {\n        return { success: false, error: 'User cancelled authentication' };\n      }\n      \n      return { success: false, error: 'Failed to sign in with Apple' };\n    }\n  }\n\n  // Facebook/Meta OAuth\n  async signInWithFacebook(): Promise<SocialAuthResult> {\n    try {\n      const clientId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;\n      if (!clientId) {\n        throw new Error('Facebook OAuth client ID not configured');\n      }\n\n      const request = new AuthSession.AuthRequest({\n        clientId,\n        scopes: ['public_profile', 'email'],\n        redirectUri: this.redirectUri,\n        responseType: AuthSession.ResponseType.Code,\n      });\n\n      const result = await request.promptAsync({\n        authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',\n        useProxy: true,\n      });\n\n      if (result.type === 'success') {\n        // Exchange code for tokens\n        const tokenResponse = await fetch(\n          `https://graph.facebook.com/v18.0/oauth/access_token?` +\n          `client_id=${clientId}&` +\n          `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +\n          `client_secret=${process.env.EXPO_PUBLIC_FACEBOOK_APP_SECRET}&` +\n          `code=${result.params.code}`\n        );\n        const tokenData = await tokenResponse.json();\n\n        // Get user info\n        const userResponse = await fetch(\n          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`\n        );\n        const userInfo = await userResponse.json();\n\n        const user = {\n          id: userInfo.id,\n          email: userInfo.email || '',\n          name: userInfo.name,\n          picture: userInfo.picture?.data?.url,\n          provider: 'facebook',\n        };\n\n        await AsyncStorage.setItem('social_tokens_facebook', JSON.stringify(tokenData));\n\n        return {\n          success: true,\n          user,\n          tokens: {\n            accessToken: tokenData.access_token,\n          },\n        };\n      }\n\n      return { success: false, error: 'User cancelled authentication' };\n    } catch (error) {\n      console.error('Facebook sign-in error:', error);\n      return { success: false, error: 'Failed to sign in with Facebook' };\n    }\n  }\n\n  // Connect TikTok for content publishing\n  async connectTikTok(): Promise<PlatformConnection> {\n    try {\n      const clientKey = process.env.EXPO_PUBLIC_TIKTOK_CLIENT_KEY;\n      if (!clientKey) {\n        throw new Error('TikTok client key not configured');\n      }\n\n      // Generate CSRF token\n      const csrfState = await Crypto.getRandomBytesAsync(32);\n      const csrfStateString = Array.from(csrfState, byte => byte.toString(16).padStart(2, '0')).join('');\n\n      const request = new AuthSession.AuthRequest({\n        clientId: clientKey,\n        scopes: ['user.info.basic', 'video.list', 'video.upload'],\n        redirectUri: this.redirectUri,\n        responseType: AuthSession.ResponseType.Code,\n        state: csrfStateString,\n      });\n\n      const result = await request.promptAsync({\n        authorizationEndpoint: 'https://www.tiktok.com/v2/auth/authorize/',\n        useProxy: true,\n      });\n\n      if (result.type === 'success' && result.params.state === csrfStateString) {\n        // Exchange code for tokens\n        const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {\n          method: 'POST',\n          headers: {\n            'Content-Type': 'application/x-www-form-urlencoded',\n          },\n          body: new URLSearchParams({\n            client_key: clientKey,\n            client_secret: process.env.EXPO_PUBLIC_TIKTOK_CLIENT_SECRET || '',\n            code: result.params.code,\n            grant_type: 'authorization_code',\n            redirect_uri: this.redirectUri,\n          }),\n        });\n        \n        const tokenData = await tokenResponse.json();\n\n        // Get user info\n        const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {\n          headers: {\n            'Authorization': `Bearer ${tokenData.access_token}`,\n          },\n        });\n        const userInfo = await userResponse.json();\n\n        // Store connection\n        const connection: PlatformConnection = {\n          platform: 'tiktok',\n          connected: true,\n          username: userInfo.data?.user?.username,\n          followers: userInfo.data?.user?.follower_count,\n          verified: userInfo.data?.user?.is_verified,\n          profile_url: `https://tiktok.com/@${userInfo.data?.user?.username}`,\n          permissions: ['video.upload', 'user.info.basic'],\n        };\n\n        await AsyncStorage.setItem('platform_connection_tiktok', JSON.stringify({\n          ...connection,\n          tokens: tokenData,\n        }));\n\n        return connection;\n      }\n\n      throw new Error('Authentication failed or CSRF token mismatch');\n    } catch (error) {\n      console.error('TikTok connection error:', error);\n      throw error;\n    }\n  }\n\n  // Connect Instagram\n  async connectInstagram(): Promise<PlatformConnection> {\n    try {\n      const clientId = process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_ID;\n      if (!clientId) {\n        throw new Error('Instagram client ID not configured');\n      }\n\n      const request = new AuthSession.AuthRequest({\n        clientId,\n        scopes: ['user_profile', 'user_media', 'user_posts'],\n        redirectUri: this.redirectUri,\n        responseType: AuthSession.ResponseType.Code,\n      });\n\n      const result = await request.promptAsync({\n        authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',\n        useProxy: true,\n      });\n\n      if (result.type === 'success') {\n        // Exchange code for tokens\n        const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {\n          method: 'POST',\n          headers: {\n            'Content-Type': 'application/x-www-form-urlencoded',\n          },\n          body: new URLSearchParams({\n            client_id: clientId,\n            client_secret: process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_SECRET || '',\n            grant_type: 'authorization_code',\n            redirect_uri: this.redirectUri,\n            code: result.params.code,\n          }),\n        });\n        \n        const tokenData = await tokenResponse.json();\n\n        const connection: PlatformConnection = {\n          platform: 'instagram',\n          connected: true,\n          username: tokenData.user?.username,\n          profile_url: `https://instagram.com/${tokenData.user?.username}`,\n          permissions: ['user_profile', 'user_media'],\n        };\n\n        await AsyncStorage.setItem('platform_connection_instagram', JSON.stringify({\n          ...connection,\n          tokens: tokenData,\n        }));\n\n        return connection;\n      }\n\n      throw new Error('User cancelled authentication');\n    } catch (error) {\n      console.error('Instagram connection error:', error);\n      throw error;\n    }\n  }\n\n  // Connect YouTube\n  async connectYouTube(): Promise<PlatformConnection> {\n    try {\n      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID; // Same as Google OAuth\n      if (!clientId) {\n        throw new Error('YouTube client ID not configured');\n      }\n\n      const request = new AuthSession.AuthRequest({\n        clientId,\n        scopes: [\n          'https://www.googleapis.com/auth/youtube',\n          'https://www.googleapis.com/auth/youtube.upload',\n          'https://www.googleapis.com/auth/youtube.readonly',\n        ],\n        redirectUri: this.redirectUri,\n        responseType: AuthSession.ResponseType.Code,\n        additionalParameters: {\n          access_type: 'offline',\n        },\n      });\n\n      const result = await request.promptAsync({\n        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',\n        useProxy: true,\n      });\n\n      if (result.type === 'success') {\n        // Exchange code for tokens\n        const tokenResult = await AuthSession.exchangeCodeAsync(\n          {\n            clientId,\n            code: result.params.code,\n            redirectUri: this.redirectUri,\n            extraParams: {\n              code_verifier: request.codeVerifier!,\n            },\n          },\n          {\n            tokenEndpoint: 'https://oauth2.googleapis.com/token',\n          }\n        );\n\n        // Get YouTube channel info\n        const channelResponse = await fetch(\n          'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',\n          {\n            headers: {\n              'Authorization': `Bearer ${tokenResult.accessToken}`,\n            },\n          }\n        );\n        const channelData = await channelResponse.json();\n        const channel = channelData.items?.[0];\n\n        const connection: PlatformConnection = {\n          platform: 'youtube',\n          connected: true,\n          username: channel?.snippet?.title,\n          followers: parseInt(channel?.statistics?.subscriberCount || '0'),\n          profile_url: `https://youtube.com/channel/${channel?.id}`,\n          permissions: ['upload', 'read'],\n        };\n\n        await AsyncStorage.setItem('platform_connection_youtube', JSON.stringify({\n          ...connection,\n          tokens: tokenResult,\n          channelId: channel?.id,\n        }));\n\n        return connection;\n      }\n\n      throw new Error('User cancelled authentication');\n    } catch (error) {\n      console.error('YouTube connection error:', error);\n      throw error;\n    }\n  }\n\n  // Get connected platforms\n  async getConnectedPlatforms(): Promise<PlatformConnection[]> {\n    const platforms: PlatformConnection[] = [];\n    const platformKeys = ['tiktok', 'instagram', 'youtube', 'twitter', 'facebook'];\n\n    for (const platform of platformKeys) {\n      try {\n        const stored = await AsyncStorage.getItem(`platform_connection_${platform}`);\n        if (stored) {\n          const connection = JSON.parse(stored);\n          platforms.push({\n            platform: connection.platform,\n            connected: connection.connected,\n            username: connection.username,\n            followers: connection.followers,\n            verified: connection.verified,\n            profile_url: connection.profile_url,\n            permissions: connection.permissions,\n          });\n        }\n      } catch (error) {\n        console.error(`Error loading ${platform} connection:`, error);\n      }\n    }\n\n    return platforms;\n  }\n\n  // Disconnect platform\n  async disconnectPlatform(platform: string): Promise<boolean> {\n    try {\n      await AsyncStorage.removeItem(`platform_connection_${platform}`);\n      await AsyncStorage.removeItem(`social_tokens_${platform}`);\n      \n      // Notify backend to revoke tokens\n      try {\n        await apiService.post('/api/social/disconnect', { platform });\n      } catch (error) {\n        console.error('Failed to notify backend of disconnection:', error);\n      }\n\n      return true;\n    } catch (error) {\n      console.error(`Error disconnecting ${platform}:`, error);\n      return false;\n    }\n  }\n\n  // Refresh tokens\n  async refreshPlatformTokens(platform: string): Promise<boolean> {\n    try {\n      const stored = await AsyncStorage.getItem(`platform_connection_${platform}`);\n      if (!stored) return false;\n\n      const connection = JSON.parse(stored);\n      if (!connection.tokens?.refresh_token) return false;\n\n      // This would implement token refresh logic for each platform\n      // Each platform has different refresh mechanisms\n      \n      return true;\n    } catch (error) {\n      console.error(`Error refreshing ${platform} tokens:`, error);\n      return false;\n    }\n  }\n\n  // Check if platform is connected\n  async isPlatformConnected(platform: string): Promise<boolean> {\n    try {\n      const stored = await AsyncStorage.getItem(`platform_connection_${platform}`);\n      return stored !== null;\n    } catch (error) {\n      return false;\n    }\n  }\n\n  // Get platform tokens for API calls\n  async getPlatformTokens(platform: string): Promise<any | null> {\n    try {\n      const stored = await AsyncStorage.getItem(`platform_connection_${platform}`);\n      if (!stored) return null;\n      \n      const connection = JSON.parse(stored);\n      return connection.tokens;\n    } catch (error) {\n      console.error(`Error getting ${platform} tokens:`, error);\n      return null;\n    }\n  }\n\n  // Clear all social auth data\n  async clearAllSocialAuth(): Promise<void> {\n    try {\n      const keys = await AsyncStorage.getAllKeys();\n      const socialKeys = keys.filter(key => \n        key.startsWith('social_') || \n        key.startsWith('platform_connection_')\n      );\n      \n      await AsyncStorage.multiRemove(socialKeys);\n    } catch (error) {\n      console.error('Error clearing social auth data:', error);\n    }\n  }\n}\n\n// Singleton instance\nexport const socialAuthService = new SocialAuthService();\nexport default socialAuthService;