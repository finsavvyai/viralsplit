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
            <Text style={[styles.greetingText, { color: colors.text }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: colors.primary }]}>
              {user?.username || 'Creator'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.creditsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Credits')}
          >
            <Ionicons name="diamond" size={16} color={colors.primary} />
            <Text style={[styles.creditsText, { color: colors.text }]}>
              {user?.credits || 0}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Processing Status */}
        {processingProjects.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="hourglass" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Processing ({processingProjects.length})
              </Text>
            </View>
            {processingProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={styles.processingItem}
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
                  <View style={styles.quickActionContent}>
                    <Ionicons name={action.icon} size={32} color="#FFFFFF" />
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                    <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                    {action.credits && (
                      <View style={styles.creditsRequired}>
                        <Ionicons name="diamond" size={12} color="#FFFFFF" />
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
              <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Library' })}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {recentProjects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  if (project.status === 'completed') {
                    navigation.navigate('Results', { projectId: project.id });
                  } else if (project.status === 'processing') {
                    navigation.navigate('ProcessingStatus', { projectId: project.id });
                  }
                }}
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
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>
            Your Stats
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="videocam" size={24} color={colors.primary} />
              <Text style={[styles.statNumber, { color: colors.text }]}>{projects.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Videos</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {projects.filter(p => p.status === 'completed').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="phone-portrait" size={24} color={colors.secondary} />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {projects.reduce((total, project) => total + project.platforms.length, 0)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Platforms</Text>
            </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  creditsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  creditsText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  processingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  processingInfo: {
    flex: 1,
  },
  processingName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  processingPlatforms: {
    fontSize: 14,
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 50) / 2,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 16,
    minHeight: 120,
  },
  quickActionContent: {
    alignItems: 'flex-start',
  },
  quickActionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  quickActionSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  creditsRequired: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditsRequiredText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  projectThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  projectPlatforms: {
    fontSize: 14,
    marginBottom: 2,
  },
  projectStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default HomeScreen;