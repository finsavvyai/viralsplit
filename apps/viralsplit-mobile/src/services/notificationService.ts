import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationPreferences {
  processingComplete: boolean;
  aiAnalysisReady: boolean;
  creditsLow: boolean;
  newFeatures: boolean;
  dailyReminders: boolean;
  collaborationUpdates: boolean;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data: any;
  type: 'processing' | 'analysis' | 'credits' | 'features' | 'reminder' | 'collaboration';
  timestamp: number;
  read: boolean;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notifications: PushNotification[] = [];

  async initialize(): Promise<void> {
    try {
      await this.registerForPushNotifications();
      await this.loadNotifications();
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  private async registerForPushNotifications(): Promise<void> {
    if (!Device.isDevice) {
      console.log('Push notifications are not supported in simulator');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID,
    });

    this.expoPushToken = token.data;

    // Register token with backend
    await this.registerTokenWithBackend(token.data);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await apiService.post('/api/users/push-token', { token });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  private setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      this.addNotificationToHistory(notification);
    });

    // Handle notification response (user tapped notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      this.handleNotificationResponse(response);
    });
  }

  private addNotificationToHistory(notification: Notifications.Notification): void {
    const pushNotification: PushNotification = {
      id: notification.request.identifier,
      title: notification.request.content.title || '',
      body: notification.request.content.body || '',
      data: notification.request.content.data,
      type: notification.request.content.data?.type || 'general',
      timestamp: Date.now(),
      read: false,
    };

    this.notifications.unshift(pushNotification);
    this.saveNotifications();
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;
    
    // Handle different notification types
    switch (data?.type) {
      case 'processing':
        // Navigate to processing status screen
        break;
      case 'analysis':
        // Navigate to analytics screen
        break;
      case 'credits':
        // Navigate to credits screen
        break;
      case 'collaboration':
        // Navigate to shared project
        break;
      default:
        // Default behavior
        break;
    }

    // Mark notification as read
    this.markAsRead(response.notification.request.identifier);
  }

  async sendLocalNotification(
    title: string,
    body: string,
    data: any = {},
    schedulingOptions?: Notifications.NotificationRequestInput['trigger']
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: schedulingOptions || null,
    });
  }

  async scheduleProcessingCompleteNotification(videoId: string, filename: string): Promise<void> {
    await this.sendLocalNotification(
      'Video Processing Complete! 🎉',
      `Your video "${filename}" is ready for download`,
      {
        type: 'processing',
        videoId,
      }
    );
  }

  async scheduleAIAnalysisNotification(videoId: string, viralScore: number): Promise<void> {
    await this.sendLocalNotification(
      'AI Analysis Complete! 🤖',
      `Your video scored ${viralScore}% viral potential`,
      {
        type: 'analysis',
        videoId,
        viralScore,
      }
    );
  }

  async scheduleCreditsLowNotification(remainingCredits: number): Promise<void> {
    await this.sendLocalNotification(
      'Credits Running Low ⚡',
      `You have ${remainingCredits} credits remaining`,
      {
        type: 'credits',
        remainingCredits,
      }
    );
  }

  async scheduleNewFeatureNotification(featureName: string): Promise<void> {
    await this.sendLocalNotification(
      'New Feature Available! ✨',
      `Check out ${featureName} in your app`,
      {
        type: 'features',
        featureName,
      }
    );
  }

  async scheduleDailyReminder(): Promise<void> {
    await this.sendLocalNotification(
      'Create Something Amazing Today! 🚀',
      'Your viral content awaits - start recording now!',
      {
        type: 'reminder',
      },
      {
        hour: 10,
        minute: 0,
        repeats: true,
      }
    );
  }

  async scheduleCollaborationNotification(projectName: string, collaboratorName: string): Promise<void> {
    await this.sendLocalNotification(
      'Collaboration Update! 👥',
      `${collaboratorName} commented on "${projectName}"`,
      {
        type: 'collaboration',
        projectName,
        collaboratorName,
      }
    );
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const preferences = await AsyncStorage.getItem('notification_preferences');
      if (preferences) {
        return JSON.parse(preferences);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }

    // Default preferences
    return {
      processingComplete: true,
      aiAnalysisReady: true,
      creditsLow: true,
      newFeatures: true,
      dailyReminders: false,
      collaborationUpdates: true,
    };
  }

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));
      
      // Update backend with preferences
      await apiService.post('/api/users/notification-preferences', preferences);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  private async loadNotifications(): Promise<void> {
    try {
      const notifications = await AsyncStorage.getItem('notifications_history');
      if (notifications) {
        this.notifications = JSON.parse(notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications history:', error);
    }
  }

  private async saveNotifications(): Promise<void> {
    try {
      // Keep only last 100 notifications
      const recentNotifications = this.notifications.slice(0, 100);
      await AsyncStorage.setItem('notifications_history', JSON.stringify(recentNotifications));
    } catch (error) {
      console.error('Failed to save notifications history:', error);
    }
  }

  getNotifications(): PushNotification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  clearNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async cancelScheduledNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  getPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();