import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import Button from '@/components/Button';
import Card from '@/components/Card';
import Glass from '@/components/Glass';
import { typography, spacing, borderRadius, animationConfig } from '@/styles/design-system';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchUserProjects } from '@/store/slices/projectsSlice';
import { RootStackParamList } from '@/types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  screen: keyof RootStackParamList;
  credits?: number;
}

const quickActions: QuickAction[] = [
  {
    id: 'camera',
    title: 'Record Video',
    subtitle: 'AI-guided recording',
    icon: 'videocam',
    gradient: ['#9333EA', '#EC4899'],
    screen: 'Camera',
  },
  {
    id: 'script-writer',
    title: 'AI Script Writer',
    subtitle: 'Generate viral scripts',
    icon: 'document-text',
    gradient: ['#EC4899', '#F59E0B'],
    screen: 'AIScriptWriter',
    credits: 10,
  },
  {
    id: 'magic-editor',
    title: 'Magic Editor',
    subtitle: 'AI video enhancement',
    icon: 'color-wand',
    gradient: ['#F59E0B', '#10B981'],
    screen: 'MagicEditor',
    credits: 25,
  },
  {
    id: 'content-remixer',
    title: 'Content Remixer',
    subtitle: '20+ variations',
    icon: 'layers',
    gradient: ['#10B981', '#3B82F6'],
    screen: 'ContentRemixer',
    credits: 50,
  },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { projects, isLoading } = useAppSelector(state => state.projects);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchUserProjects());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchUserProjects());
    setRefreshing(false);
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.credits && user && user.credits < action.credits) {
      // Navigate to credits screen
      navigation.navigate('Credits');
      return;
    }
    navigation.navigate(action.screen as any);
  };

  const recentProjects = projects.slice(0, 3);
  const processingProjects = projects.filter(p => p.status === 'processing');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.username || 'Creator'}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Glass variant="subtle" borderRadius="round" style={styles.creditsButton}>
              <TouchableOpacity 
                style={styles.creditsButton}
                onPress={() => navigation.navigate('Credits')}
              >
                <Ionicons name="star-outline" size={16} color={colors.primary} />
                <Text style={[styles.creditsText, { color: colors.text }]}>
                  {user?.credits || 0}
                </Text>
              </TouchableOpacity>
            </Glass>
          </View>
        </View>

        {/* Processing Status */}
        {processingProjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="hourglass" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Processing ({processingProjects.length})
                </Text>
              </View>
            </View>
            <Card variant="glass" padding="sm">
              {processingProjects.map((project, index) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.processingItem,
                    index !== processingProjects.length - 1 && { 
                      borderBottomColor: colors.border 
                    }
                  ]}
                  onPress={() => navigation.navigate('ProcessingStatus', { projectId: project.id })}
                >
                  <View style={styles.processingInfo}>
                    <Text style={[styles.processingName, { color: colors.text }]}>
                      {project.filename}
                    </Text>
                    <Text style={[styles.processingPlatforms, { color: colors.textSecondary }]}>
                      {project.platforms.join(', ')}
                    </Text>
                  </View>
                  <View style={styles.processingStatus}>
                    <View style={[styles.processingDot, { backgroundColor: colors.warning }]} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={() => handleQuickAction(action)}
              >
                <LinearGradient
                  colors={action.gradient}
                  style={styles.quickActionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.quickActionHeader}>
                    <Ionicons name={action.icon} size={32} color="#FFFFFF" />
                  </View>
                  <View style={styles.quickActionFooter}>
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                    <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                    {action.credits && (
                      <View style={styles.creditsRequired}>
                        <Ionicons name="star-outline" size={12} color="#FFFFFF" />
                        <Text style={styles.creditsRequiredText}>{action.credits}</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Projects</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {recentProjects.map((project) => (
              <Card
                key={project.id}
                variant="glass"
                pressable
                onPress={() => {
                  if (project.status === 'completed') {
                    navigation.navigate('Results', { projectId: project.id });
                  } else if (project.status === 'processing') {
                    navigation.navigate('ProcessingStatus', { projectId: project.id });
                  }
                }}
                style={styles.projectCard}
              >
                <View style={styles.projectThumbnail}>
                  <Ionicons name="videocam" size={24} color={colors.textSecondary} />
                </View>
                
                <View style={styles.projectInfo}>
                  <Text style={[styles.projectName, { color: colors.text }]}>
                    {project.filename}
                  </Text>
                  <Text style={[styles.projectPlatforms, { color: colors.textSecondary }]}>
                    {project.platforms.join(', ')}
                  </Text>
                  <Text style={[styles.projectStatus, { 
                    color: project.status === 'completed' ? colors.success : 
                           project.status === 'processing' ? colors.warning : colors.textSecondary 
                  }]}>
                    {project.status === 'completed' ? 'Completed' :
                     project.status === 'processing' ? 'Processing...' :
                     project.status === 'failed' ? 'Failed' : 'Pending'}
                  </Text>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </Card>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>
            Your Stats
          </Text>
          
          <View style={styles.statsGrid}>
            <Card variant="glass" style={styles.statCard}>
              <Ionicons name="videocam" size={24} color={colors.primary} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{projects.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Videos</Text>
            </Card>
            
            <Card variant="glass" style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {projects.filter(p => p.status === 'completed').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            </Card>
            
            <Card variant="glass" style={styles.statCard}>
              <Ionicons name="phone-portrait" size={24} color={colors.secondary} />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {projects.reduce((total, project) => total + project.platforms.length, 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Platforms</Text>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    ...typography.subheadline,
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.largeTitle,
    fontWeight: '700',
  },
  creditsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  creditsText: {
    ...typography.callout,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    ...typography.title3,
  },
  viewAllText: {
    ...typography.callout,
    fontWeight: '600',
  },
  processingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  processingInfo: {
    flex: 1,
  },
  processingName: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  processingPlatforms: {
    ...typography.caption1,
  },
  processingStatus: {
    alignItems: 'center',
  },
  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickActionsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - (spacing.lg * 2) - spacing.md) / 2,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  quickActionGradient: {
    padding: spacing.lg,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  quickActionHeader: {
    alignItems: 'flex-start',
  },
  quickActionFooter: {
    alignItems: 'flex-start',
  },
  quickActionTitle: {
    ...typography.headline,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  quickActionSubtitle: {
    ...typography.caption1,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
  },
  creditsRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'flex-start',
  },
  creditsRequiredText: {
    ...typography.caption2,
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 2,
  },
  recentSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  projectThumbnail: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    ...typography.callout,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  projectPlatforms: {
    ...typography.caption1,
    marginBottom: spacing.xs,
  },
  projectStatus: {
    ...typography.caption2,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  statNumber: {
    ...typography.title1,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.caption1,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

export default HomeScreen;