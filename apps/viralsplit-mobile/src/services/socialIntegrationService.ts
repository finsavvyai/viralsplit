import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Linking, Alert } from 'react-native';
import { socialAuthService } from './socialAuthService';
import { apiService } from './api';

// Platform-specific video requirements
interface PlatformSpecs {
  maxDuration: number; // seconds
  maxFileSize: number; // bytes
  aspectRatios: string[];
  videoCodec: string[];
  audioCodec: string[];
  resolution: {
    min: { width: number; height: number };
    max: { width: number; height: number };
    recommended: { width: number; height: number };
  };
  framerate: number[];
  bitrate: {
    video: { min: number; max: number };
    audio: { min: number; max: number };
  };
}

interface PostingOptions {
  caption?: string;
  hashtags?: string[];
  mentions?: string[];
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  privacy?: 'public' | 'private' | 'friends' | 'followers';
  scheduledTime?: Date;
  crossPost?: string[]; // Other platforms to cross-post to
  thumbnailTime?: number; // Seconds into video for thumbnail
}

interface PostResult {
  success: boolean;
  platform: string;
  postId?: string;
  postUrl?: string;
  error?: string;
  analytics?: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
}

interface TrendingData {
  hashtags: Array<{
    tag: string;
    volume: number;
    growth: number;
  }>;
  sounds: Array<{
    id: string;
    name: string;
    artist?: string;
    usage: number;
    trend: 'rising' | 'stable' | 'declining';
  }>;
  challenges: Array<{
    name: string;
    description: string;
    participantCount: number;
    hashtagsRequired: string[];
  }>;
}

export class SocialIntegrationService {
  private readonly platformSpecs: Record<string, PlatformSpecs> = {
    tiktok: {
      maxDuration: 180, // 3 minutes
      maxFileSize: 287762808, // ~275MB
      aspectRatios: ['9:16', '1:1'],
      videoCodec: ['H.264', 'H.265'],
      audioCodec: ['AAC'],
      resolution: {
        min: { width: 540, height: 960 },
        max: { width: 1080, height: 1920 },
        recommended: { width: 1080, height: 1920 },
      },
      framerate: [23.976, 24, 25, 29.97, 30],
      bitrate: {
        video: { min: 516, max: 16000 }, // kbps
        audio: { min: 128, max: 320 }, // kbps
      },
    },
    instagram: {
      maxDuration: 90, // 1.5 minutes for Reels
      maxFileSize: 104857600, // 100MB
      aspectRatios: ['9:16', '4:5', '1:1'],
      videoCodec: ['H.264'],
      audioCodec: ['AAC'],
      resolution: {
        min: { width: 540, height: 960 },
        max: { width: 1080, height: 1920 },
        recommended: { width: 1080, height: 1920 },
      },
      framerate: [23, 25, 30, 50, 60],
      bitrate: {
        video: { min: 1000, max: 8000 },
        audio: { min: 128, max: 320 },
      },
    },
    youtube: {
      maxDuration: 43200, // 12 hours (for verified accounts)
      maxFileSize: 137438953472, // 128GB
      aspectRatios: ['16:9', '9:16', '4:3', '1:1'],
      videoCodec: ['H.264', 'H.265', 'VP8', 'VP9'],
      audioCodec: ['AAC', 'MP3'],
      resolution: {
        min: { width: 426, height: 240 },
        max: { width: 7680, height: 4320 }, // 8K
        recommended: { width: 1920, height: 1080 },
      },
      framerate: [24, 25, 30, 48, 50, 60],
      bitrate: {
        video: { min: 1000, max: 85000 },
        audio: { min: 128, max: 384 },
      },
    },
    facebook: {
      maxDuration: 1200, // 20 minutes
      maxFileSize: 10737418240, // 10GB
      aspectRatios: ['16:9', '9:16', '4:5', '1:1'],
      videoCodec: ['H.264'],
      audioCodec: ['AAC'],
      resolution: {
        min: { width: 720, height: 720 },
        max: { width: 1920, height: 1080 },
        recommended: { width: 1080, height: 1080 },
      },
      framerate: [23, 24, 25, 29.97, 30],
      bitrate: {
        video: { min: 1000, max: 8000 },
        audio: { min: 128, max: 320 },
      },
    },
  };

  // Get platform specifications
  getPlatformSpecs(platform: string): PlatformSpecs | null {
    return this.platformSpecs[platform] || null;
  }

  // Validate video against platform requirements
  async validateVideoForPlatform(videoPath: string, platform: string): Promise<{
    valid: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const specs = this.getPlatformSpecs(platform);
    if (!specs) {
      return { valid: false, issues: ['Unsupported platform'], warnings: [] };
    }

    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(videoPath);
      if (fileInfo.exists && fileInfo.size && fileInfo.size > specs.maxFileSize) {
        issues.push(`File size (${(fileInfo.size / 1024 / 1024).toFixed(1)}MB) exceeds platform limit (${(specs.maxFileSize / 1024 / 1024).toFixed(1)}MB)`);
      }

      // In a real implementation, you'd use a video metadata library
      // For now, we'll do basic checks
      
      return {
        valid: issues.length === 0,
        issues,
        warnings,
      };
    } catch (error) {
      return {
        valid: false,
        issues: ['Failed to validate video file'],
        warnings: [],
      };
    }
  }

  // Post to TikTok
  async postToTikTok(videoPath: string, options: PostingOptions = {}): Promise<PostResult> {
    try {
      // Check if TikTok is connected
      const isConnected = await socialAuthService.isPlatformConnected('tiktok');
      if (!isConnected) {
        throw new Error('TikTok account not connected');
      }

      // Validate video
      const validation = await this.validateVideoForPlatform(videoPath, 'tiktok');
      if (!validation.valid) {
        throw new Error(`Video validation failed: ${validation.issues.join(', ')}`);
      }

      // Get access tokens
      const tokens = await socialAuthService.getPlatformTokens('tiktok');
      if (!tokens) {
        throw new Error('No valid TikTok tokens found');
      }

      // Prepare video for upload
      const videoData = await FileSystem.readAsStringAsync(videoPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Step 1: Initialize upload
      const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_info: {
            title: options.caption || '',
            privacy_level: options.privacy === 'public' ? 'MUTUAL_FOLLOW_FRIEND' : 'SELF_ONLY',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: (options.thumbnailTime || 1) * 1000,
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: (await FileSystem.getInfoAsync(videoPath)).size,
            chunk_size: 10485760, // 10MB chunks
            total_chunk_count: Math.ceil((await FileSystem.getInfoAsync(videoPath)).size! / 10485760),
          },
        }),
      });

      const initData = await initResponse.json();
      if (!initData.data?.publish_id) {
        throw new Error(initData.error?.message || 'Failed to initialize TikTok upload');
      }

      // Step 2: Upload video chunks
      const publishId = initData.data.publish_id;
      const uploadUrl = initData.data.upload_url;
      
      // For simplicity, we'll upload as a single chunk here
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Range': `bytes 0-${(await FileSystem.getInfoAsync(videoPath)).size! - 1}/${(await FileSystem.getInfoAsync(videoPath)).size}`,
        },
        body: videoData, // In production, use proper binary data
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video to TikTok');
      }

      // Step 3: Finalize upload
      const finalizeResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/complete/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publish_id: publishId,
        }),
      });

      const finalizeData = await finalizeResponse.json();
      if (finalizeData.error) {
        throw new Error(finalizeData.error.message);
      }

      return {
        success: true,
        platform: 'tiktok',
        postId: publishId,
        postUrl: `https://tiktok.com/@user/video/${publishId}`, // Approximate URL
      };

    } catch (error: any) {
      console.error('TikTok posting error:', error);
      return {
        success: false,
        platform: 'tiktok',
        error: error.message || 'Failed to post to TikTok',
      };
    }
  }

  // Post to Instagram
  async postToInstagram(videoPath: string, options: PostingOptions = {}): Promise<PostResult> {
    try {
      const isConnected = await socialAuthService.isPlatformConnected('instagram');
      if (!isConnected) {
        throw new Error('Instagram account not connected');
      }

      const validation = await this.validateVideoForPlatform(videoPath, 'instagram');
      if (!validation.valid) {
        throw new Error(`Video validation failed: ${validation.issues.join(', ')}`);
      }

      const tokens = await socialAuthService.getPlatformTokens('instagram');
      if (!tokens) {
        throw new Error('No valid Instagram tokens found');
      }

      // Upload to Instagram using their API
      const uploadResponse = await fetch('https://graph.instagram.com/me/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_url: videoPath, // In production, this needs to be a publicly accessible URL
          caption: this.formatCaption(options.caption, options.hashtags),
          media_type: 'VIDEO',
          access_token: tokens.access_token,
        }),
      });

      const uploadData = await uploadResponse.json();
      if (uploadData.error) {
        throw new Error(uploadData.error.message);
      }

      // Publish the media
      const publishResponse = await fetch('https://graph.instagram.com/me/media_publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creation_id: uploadData.id,
          access_token: tokens.access_token,
        }),
      });

      const publishData = await publishResponse.json();
      if (publishData.error) {
        throw new Error(publishData.error.message);
      }

      return {
        success: true,
        platform: 'instagram',
        postId: publishData.id,
        postUrl: `https://instagram.com/p/${publishData.id}`,
      };

    } catch (error: any) {
      console.error('Instagram posting error:', error);
      return {
        success: false,
        platform: 'instagram',
        error: error.message || 'Failed to post to Instagram',
      };
    }
  }

  // Post to YouTube
  async postToYouTube(videoPath: string, options: PostingOptions = {}): Promise<PostResult> {
    try {
      const isConnected = await socialAuthService.isPlatformConnected('youtube');
      if (!isConnected) {
        throw new Error('YouTube account not connected');
      }

      const validation = await this.validateVideoForPlatform(videoPath, 'youtube');
      if (!validation.valid) {
        throw new Error(`Video validation failed: ${validation.issues.join(', ')}`);
      }

      const tokens = await socialAuthService.getPlatformTokens('youtube');
      if (!tokens) {
        throw new Error('No valid YouTube tokens found');
      }

      // Prepare video metadata
      const metadata = {
        snippet: {
          title: options.caption || 'ViralSplit Video',
          description: this.formatCaption(options.caption, options.hashtags, options.mentions),
          categoryId: '22', // People & Blogs
          defaultLanguage: 'en',
          tags: options.hashtags?.map(tag => tag.replace('#', '')) || [],
        },
        status: {
          privacyStatus: options.privacy === 'public' ? 'public' : 'private',
          selfDeclaredMadeForKids: false,
        },
      };

      // Upload video to YouTube
      // Note: This is a simplified version. In production, you'd need to handle resumable uploads
      const formData = new FormData();
      formData.append('video', {
        uri: videoPath,
        type: 'video/mp4',
        name: 'video.mp4',
      } as any);

      const uploadResponse = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'multipart/related',
          },
          body: JSON.stringify({
            part: ['snippet', 'status'],
            resource: metadata,
          }),
        }
      );

      const uploadData = await uploadResponse.json();
      if (uploadData.error) {
        throw new Error(uploadData.error.message);
      }

      return {
        success: true,
        platform: 'youtube',
        postId: uploadData.id,
        postUrl: `https://youtube.com/watch?v=${uploadData.id}`,
      };

    } catch (error: any) {
      console.error('YouTube posting error:', error);
      return {
        success: false,
        platform: 'youtube',
        error: error.message || 'Failed to post to YouTube',
      };
    }
  }

  // Cross-platform posting
  async postToMultiplePlatforms(
    videoPath: string,
    platforms: string[],
    options: PostingOptions = {}
  ): Promise<PostResult[]> {
    const results: PostResult[] = [];

    for (const platform of platforms) {
      let result: PostResult;

      switch (platform) {
        case 'tiktok':
          result = await this.postToTikTok(videoPath, options);
          break;
        case 'instagram':
          result = await this.postToInstagram(videoPath, options);
          break;
        case 'youtube':
          result = await this.postToYouTube(videoPath, options);
          break;
        default:
          result = {
            success: false,
            platform,
            error: 'Unsupported platform',
          };
      }

      results.push(result);

      // Add delay between posts to avoid rate limiting
      if (platforms.indexOf(platform) < platforms.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }

  // Get trending content for platform
  async getTrendingContent(platform: string): Promise<TrendingData | null> {
    try {
      // This would typically fetch from platform APIs or trending services
      // For now, return mock trending data
      
      const trendingData: Record<string, TrendingData> = {
        tiktok: {
          hashtags: [
            { tag: '#fyp', volume: 50000000, growth: 12.5 },
            { tag: '#viral', volume: 25000000, growth: 8.3 },
            { tag: '#trending', volume: 15000000, growth: 15.7 },
            { tag: '#foryou', volume: 40000000, growth: 5.2 },
            { tag: '#challenge', volume: 12000000, growth: 22.1 },
          ],
          sounds: [
            {
              id: 'sound_1',
              name: 'Trending Sound 1',
              artist: 'Artist Name',
              usage: 2500000,
              trend: 'rising',
            },
            {
              id: 'sound_2',
              name: 'Viral Beat',
              artist: 'Beat Maker',
              usage: 1800000,
              trend: 'stable',
            },
          ],
          challenges: [
            {
              name: 'Dance Challenge 2024',
              description: 'Show us your best dance moves',
              participantCount: 850000,
              hashtagsRequired: ['#dancechallenge2024', '#fyp'],
            },
          ],
        },
        instagram: {
          hashtags: [
            { tag: '#reels', volume: 30000000, growth: 10.2 },
            { tag: '#instagram', volume: 45000000, growth: 3.1 },
            { tag: '#viral', volume: 20000000, growth: 14.8 },
            { tag: '#trending', volume: 18000000, growth: 9.5 },
            { tag: '#explore', volume: 25000000, growth: 6.7 },
          ],
          sounds: [
            {
              id: 'ig_sound_1',
              name: 'Trending Audio',
              usage: 1200000,
              trend: 'rising',
            },
          ],
          challenges: [
            {
              name: 'Style Challenge',
              description: 'Share your unique style',
              participantCount: 500000,
              hashtagsRequired: ['#stylechallenge', '#fashion'],
            },
          ],
        },
      };

      return trendingData[platform] || null;
    } catch (error) {
      console.error(`Error fetching trending data for ${platform}:`, error);
      return null;
    }
  }

  // Get optimal posting times
  async getOptimalPostingTimes(platform: string, userId?: string): Promise<{
    timezone: string;
    optimalTimes: Array<{
      day: string;
      hours: number[];
      engagement: number;
    }>;
  } | null> {
    try {
      // This would analyze user's audience and engagement patterns
      // For now, return general best practices
      
      const optimalTimes: Record<string, any> = {
        tiktok: {
          timezone: 'UTC',
          optimalTimes: [
            { day: 'monday', hours: [18, 19, 20], engagement: 0.85 },
            { day: 'tuesday', hours: [19, 20, 21], engagement: 0.92 },
            { day: 'wednesday', hours: [18, 19, 20], engagement: 0.88 },
            { day: 'thursday', hours: [19, 20, 21], engagement: 0.95 },
            { day: 'friday', hours: [17, 18, 19, 20], engagement: 0.98 },
            { day: 'saturday', hours: [11, 12, 19, 20], engagement: 0.90 },
            { day: 'sunday', hours: [12, 13, 19, 20], engagement: 0.87 },
          ],
        },
        instagram: {
          timezone: 'UTC',
          optimalTimes: [
            { day: 'monday', hours: [11, 13, 17], engagement: 0.82 },
            { day: 'tuesday', hours: [11, 13, 17], engagement: 0.89 },
            { day: 'wednesday', hours: [11, 13, 17], engagement: 0.91 },
            { day: 'thursday', hours: [11, 13, 17, 19], engagement: 0.94 },
            { day: 'friday', hours: [11, 13, 15], engagement: 0.88 },
            { day: 'saturday', hours: [12, 14], engagement: 0.75 },
            { day: 'sunday', hours: [12, 14], engagement: 0.78 },
          ],
        },
      };

      return optimalTimes[platform] || null;
    } catch (error) {
      console.error(`Error fetching optimal posting times for ${platform}:`, error);
      return null;
    }
  }

  // Generate hashtag suggestions
  async generateHashtagSuggestions(
    content: string,
    platform: string,
    maxCount = 30
  ): Promise<string[]> {
    try {
      // Use the API service to generate AI-powered hashtag suggestions
      const response = await apiService.optimizeHashtags('temp_project_id');
      
      if (Array.isArray(response)) {
        return response.slice(0, maxCount);
      }

      // Fallback to trending hashtags
      const trendingData = await this.getTrendingContent(platform);
      if (trendingData) {
        return trendingData.hashtags
          .sort((a, b) => b.growth - a.growth)
          .slice(0, maxCount)
          .map(h => h.tag);
      }

      return [];
    } catch (error) {
      console.error('Error generating hashtag suggestions:', error);
      return [];
    }
  }

  // Format caption with hashtags and mentions
  private formatCaption(
    caption?: string,
    hashtags?: string[],
    mentions?: string[]
  ): string {
    let formattedCaption = caption || '';

    if (mentions && mentions.length > 0) {
      const mentionString = mentions.map(m => m.startsWith('@') ? m : `@${m}`).join(' ');
      formattedCaption += formattedCaption ? ` ${mentionString}` : mentionString;
    }

    if (hashtags && hashtags.length > 0) {
      const hashtagString = hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
      formattedCaption += formattedCaption ? `\n\n${hashtagString}` : hashtagString;
    }

    return formattedCaption;
  }

  // Share via native sharing
  async shareNatively(
    videoPath: string,
    options: PostingOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        // Fallback to device's default sharing
        const supported = await Linking.canOpenURL(videoPath);
        if (supported) {
          await Linking.openURL(videoPath);
          return { success: true };
        }
        throw new Error('Sharing not available');
      }

      await Sharing.shareAsync(videoPath, {
        dialogTitle: 'Share your video',
        mimeType: 'video/mp4',
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Save to camera roll
  async saveToCameraRoll(videoPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission not granted');
      }

      const asset = await MediaLibrary.createAssetAsync(videoPath);
      
      // Create ViralSplit album if it doesn't exist
      let album = await MediaLibrary.getAlbumAsync('ViralSplit');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync('ViralSplit', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get post analytics
  async getPostAnalytics(platform: string, postId: string): Promise<PostResult['analytics'] | null> {
    try {
      const tokens = await socialAuthService.getPlatformTokens(platform);
      if (!tokens) {
        throw new Error('No valid tokens found');
      }

      switch (platform) {
        case 'youtube':
          // YouTube Analytics API
          const youtubeResponse = await fetch(
            `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel%3D%3DMINE&metrics=views%2Clikes%2Cshares%2Ccomments&dimensions=video&filters=video%3D%3D${postId}&startDate=2024-01-01&endDate=2024-12-31`,
            {
              headers: {
                'Authorization': `Bearer ${tokens.accessToken}`,
              },
            }
          );
          const youtubeData = await youtubeResponse.json();
          if (youtubeData.rows && youtubeData.rows.length > 0) {
            const [views, likes, shares, comments] = youtubeData.rows[0].slice(1);
            return { views, likes, shares, comments };
          }
          break;

        case 'instagram':
          // Instagram Graph API
          const igResponse = await fetch(
            `https://graph.instagram.com/${postId}/insights?metric=impressions,likes,comments,shares&access_token=${tokens.access_token}`
          );
          const igData = await igResponse.json();
          if (igData.data) {
            const analytics: any = {};
            igData.data.forEach((metric: any) => {
              switch (metric.name) {
                case 'impressions':
                  analytics.views = metric.values[0].value;
                  break;
                case 'likes':
                  analytics.likes = metric.values[0].value;
                  break;
                case 'comments':
                  analytics.comments = metric.values[0].value;
                  break;
                case 'shares':
                  analytics.shares = metric.values[0].value;
                  break;
              }
            });
            return analytics;
          }
          break;

        default:
          return null;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching analytics for ${platform}:`, error);
      return null;
    }
  }

  // Schedule post for later
  async schedulePost(
    videoPath: string,
    platform: string,
    scheduledTime: Date,
    options: PostingOptions = {}
  ): Promise<{ success: boolean; scheduledId?: string; error?: string }> {
    try {
      // This would integrate with a job scheduling service
      // For now, we'll simulate scheduling
      
      const scheduledPost = {
        id: `scheduled_${Date.now()}`,
        videoPath,
        platform,
        scheduledTime: scheduledTime.toISOString(),
        options,
        status: 'scheduled',
      };

      // In a real app, store this in a database or scheduling service
      console.log('Post scheduled:', scheduledPost);

      return {
        success: true,
        scheduledId: scheduledPost.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get connected platforms summary
  async getConnectedPlatformsSummary(): Promise<Array<{
    platform: string;
    connected: boolean;
    username?: string;
    followers?: number;
    lastPost?: Date;
    analytics?: {
      totalViews: number;
      totalLikes: number;
      avgEngagement: number;
    };
  }>> {
    try {
      const platforms = await socialAuthService.getConnectedPlatforms();
      
      return await Promise.all(
        platforms.map(async (platform) => ({
          platform: platform.platform,
          connected: platform.connected,
          username: platform.username,
          followers: platform.followers,
          lastPost: undefined, // Would fetch from API
          analytics: {
            totalViews: 0,
            totalLikes: 0,
            avgEngagement: 0,
          },
        }))
      );
    } catch (error) {
      console.error('Error getting platforms summary:', error);
      return [];
    }
  }
}

// Singleton instance
export const socialIntegrationService = new SocialIntegrationService();
export default socialIntegrationService;