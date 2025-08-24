import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { RootStackParamList } from '@/types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  badge?: string;
  danger?: boolean;
}

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { colors, theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleThemeChange = () => {
    const themes = ['light', 'dark', 'auto'] as const;
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'credits',
          title: 'Credits',
          subtitle: `${user?.credits || 0} credits available`,
          icon: 'diamond',
          action: () => navigation.navigate('Credits'),
        },
        {
          id: 'subscription',
          title: 'Subscription',
          subtitle: user?.subscription_tier || 'Free Plan',
          icon: 'card',
          action: () => navigation.navigate('Subscription'),
          badge: user?.subscription_tier === 'free' ? 'Upgrade' : undefined,
        },
        {
          id: 'profile',
          title: 'Edit Profile',
          icon: 'person',
          action: () => Alert.alert('Coming Soon', 'Profile editing will be available soon!'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'theme',
          title: 'Appearance',
          subtitle: theme === 'auto' ? 'System' : theme.charAt(0).toUpperCase() + theme.slice(1),
          icon: 'moon',
          action: handleThemeChange,
        },
        {
          id: 'notifications',
          title: 'Notifications',
          subtitle: 'Push notifications and alerts',
          icon: 'notifications',
          action: () => Alert.alert('Coming Soon', 'Notification settings will be available soon!'),
        },
        {
          id: 'quality',
          title: 'Video Quality',
          subtitle: 'Default recording settings',
          icon: 'videocam',
          action: () => Alert.alert('Coming Soon', 'Quality settings will be available soon!'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help Center',
          icon: 'help-circle',
          action: () => Alert.alert('Help', 'Visit our help center at help.viralsplit.io'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          icon: 'chatbubble',
          action: () => Alert.alert('Feedback', 'We\'d love to hear from you! Email us at feedback@viralsplit.io'),
        },
        {
          id: 'about',
          title: 'About ViralSplit',
          subtitle: 'Version 1.0.0',
          icon: 'information-circle',
          action: () => Alert.alert('About', 'ViralSplit - AI-powered video creation for social media'),
        },
      ],
    },
    {
      title: 'Account Actions',
      items: [
        {
          id: 'logout',
          title: 'Sign Out',
          icon: 'log-out',
          action: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={item.action}
    >
      <View style={[styles.menuIcon, { backgroundColor: item.danger ? colors.error + '20' : colors.primary + '20' }]}>
        <Ionicons 
          name={item.icon} 
          size={20} 
          color={item.danger ? colors.error : colors.primary} 
        />
      </View>
      
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: item.danger ? colors.error : colors.text }]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
            {item.subtitle}
          </Text>
        )}
      </View>
      
      <View style={styles.menuRight}>
        {item.badge && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.header}
        >
          <View style={styles.profileContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.userName}>{user?.username || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>87%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>125K</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Menu Sections */}
        <View style={styles.content}>
          {menuSections.map((section, sectionIndex) => (
            <View key={section.title} style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {section.title.toUpperCase()}
              </Text>
              <View style={styles.menuList}>
                {section.items.map(renderMenuItem)}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  menuSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 16,
  },
  menuList: {
    gap: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProfileScreen;