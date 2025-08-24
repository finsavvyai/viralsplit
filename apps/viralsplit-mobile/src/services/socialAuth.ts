import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import apiService from './api';

// Configure WebBrowser for auth sessions
WebBrowser.maybeCompleteAuthSession();

// Social auth configuration
const socialAuthConfig = {
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'viralsplit',
    path: 'auth',
  }),
};

export interface SocialAuthResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}

class SocialAuthService {
  /**
   * Google OAuth Authentication
   */
  async authenticateWithGoogle(): Promise<SocialAuthResult> {
    try {
      // Generate code verifier and challenge for PKCE
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36).substring(2, 15),
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );

      // Configure Google OAuth request
      const request = new AuthSession.AuthRequest({
        clientId: __DEV__ 
          ? 'your-dev-google-client-id.googleusercontent.com'
          : 'your-prod-google-client-id.googleusercontent.com',
        scopes: ['openid', 'profile', 'email'],
        redirectUri: socialAuthConfig.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      });

      // Discover Google's OAuth endpoints
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      // Prompt for authentication
      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        // Exchange authorization code for tokens
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: request.clientId!,
            code: result.params.code,
            redirectUri: socialAuthConfig.redirectUri,
                      },
          discovery
        );

        // Get user info from Google
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResult.accessToken}`
        );
        const googleUser = await userInfoResponse.json();

        // Send to backend for registration/login
        const backendResponse = await apiService.post('/auth/social-login', {
          provider: 'google',
          provider_id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          access_token: tokenResult.accessToken,
        });

        return {
          success: true,
          user: backendResponse.data.user,
          token: backendResponse.data.access_token,
        };
      }

      return {
        success: false,
        error: 'Authentication was cancelled',
      };
    } catch (error: any) {
      console.error('Google auth error:', error);
      return {
        success: false,
        error: error.message || 'Google authentication failed',
      };
    }
  }

  /**
   * Apple Sign In (iOS only)
   */
  async authenticateWithApple(): Promise<SocialAuthResult> {
    try {
      if (Platform.OS !== 'ios') {
        return {
          success: false,
          error: 'Apple Sign In is only available on iOS devices',
        };
      }

      // Import Apple Authentication (only available on iOS)
      let AppleAuthentication;
      try {
        AppleAuthentication = require('expo-apple-authentication');
      } catch (importError) {
        return {
          success: false,
          error: 'Apple Authentication module not available. Please ensure expo-apple-authentication is properly installed.',
        };
      }

      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Apple Sign In is not available on this device. Make sure you are signed into iCloud.',
        };
      }

      // Prompt for Apple Sign In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send to backend for registration/login
      const backendResponse = await apiService.post('/auth/social-login', {
        provider: 'apple',
        provider_id: credential.user,
        email: credential.email,
        name: credential.fullName 
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : null,
        identity_token: credential.identityToken,
        authorization_code: credential.authorizationCode,
      });

      return {
        success: true,
        user: backendResponse.data.user,
        token: backendResponse.data.access_token,
      };
    } catch (error: any) {
      console.error('Apple auth error:', error);
      if (error.code === 'ERR_CANCELED') {
        return {
          success: false,
          error: 'Apple Sign In was cancelled',
        };
      }
      
      // Handle specific Apple authentication errors
      let errorMessage = 'Apple authentication failed';
      if (error.message?.includes('authorization attempt failed')) {
        errorMessage = 'Apple Sign In is not configured properly. Please ensure you are signed into iCloud and try again.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Twitter OAuth Authentication
   */
  async authenticateWithTwitter(): Promise<SocialAuthResult> {
    try {
      // Twitter OAuth 2.0 with PKCE
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36).substring(2, 15),
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );

      const request = new AuthSession.AuthRequest({
        clientId: __DEV__ 
          ? 'your-dev-twitter-client-id'
          : 'your-prod-twitter-client-id',
        scopes: ['tweet.read', 'users.read'],
        redirectUri: socialAuthConfig.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });

      const discovery = {
        authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
        tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
      };

      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        // Exchange code for tokens
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: request.clientId!,
            code: result.params.code,
            redirectUri: socialAuthConfig.redirectUri,
                      },
          discovery
        );

        // Get user info from Twitter API v2
        const userInfoResponse = await fetch(
          'https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics',
          {
            headers: {
              Authorization: `Bearer ${tokenResult.accessToken}`,
            },
          }
        );
        const twitterUser = await userInfoResponse.json();

        // Send to backend
        const backendResponse = await apiService.post('/auth/social-login', {
          provider: 'twitter',
          provider_id: twitterUser.data.id,
          username: twitterUser.data.username,
          name: twitterUser.data.name,
          picture: twitterUser.data.profile_image_url,
          access_token: tokenResult.accessToken,
        });

        return {
          success: true,
          user: backendResponse.data.user,
          token: backendResponse.data.access_token,
        };
      }

      return {
        success: false,
        error: 'Twitter authentication was cancelled',
      };
    } catch (error: any) {
      console.error('Twitter auth error:', error);
      return {
        success: false,
        error: error.message || 'Twitter authentication failed',
      };
    }
  }

  /**
   * Generic social login handler
   */
  async authenticateWithProvider(provider: 'google' | 'apple' | 'twitter'): Promise<SocialAuthResult> {
    switch (provider) {
      case 'google':
        return this.authenticateWithGoogle();
      case 'apple':
        return this.authenticateWithApple();
      case 'twitter':
        return this.authenticateWithTwitter();
      default:
        return {
          success: false,
          error: `Unsupported provider: ${provider}`,
        };
    }
  }
}

export const socialAuthService = new SocialAuthService();