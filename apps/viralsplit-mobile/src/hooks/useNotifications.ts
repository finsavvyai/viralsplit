import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { notificationService, PushNotification, NotificationPreferences } from '../services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeNotifications();
    setupAppStateListener();
  }, []);

  const initializeNotifications = async () => {
    try {
      await notificationService.initialize();
      await loadNotifications();
      await loadPreferences();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = () => {
    const notifs = notificationService.getNotifications();
    setNotifications(notifs);
    setUnreadCount(notificationService.getUnreadCount());
  };

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Refresh notifications when app becomes active
        loadNotifications();
      }
    });

    return () => subscription?.remove();
  };

  const markAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    loadNotifications();
  };

  const clearNotifications = () => {
    notificationService.clearNotifications();
    loadNotifications();
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      await notificationService.updateNotificationPreferences(newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  };

  const scheduleProcessingComplete = async (videoId: string, filename: string) => {
    await notificationService.scheduleProcessingCompleteNotification(videoId, filename);
  };

  const scheduleAIAnalysis = async (videoId: string, viralScore: number) => {
    await notificationService.scheduleAIAnalysisNotification(videoId, viralScore);
  };

  const scheduleCreditsLow = async (remainingCredits: number) => {
    await notificationService.scheduleCreditsLowNotification(remainingCredits);
  };

  const scheduleNewFeature = async (featureName: string) => {
    await notificationService.scheduleNewFeatureNotification(featureName);
  };

  const scheduleDailyReminder = async () => {
    await notificationService.scheduleDailyReminder();
  };

  const scheduleCollaboration = async (projectName: string, collaboratorName: string) => {
    await notificationService.scheduleCollaborationNotification(projectName, collaboratorName);
  };

  return {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updatePreferences,
    scheduleProcessingComplete,
    scheduleAIAnalysis,
    scheduleCreditsLow,
    scheduleNewFeature,
    scheduleDailyReminder,
    scheduleCollaboration,
  };
};

export default useNotifications;