import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Progress from 'react-native-progress';

import { useTheme } from '@/contexts/ThemeContext';
import { useAppSelector } from '@/store';
import { realTimeService } from '@/services/realTimeService';
import { videoService } from '@/services/videoService';

interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  duration?: number;
}

interface ProjectStatus {
  id: string;
  name: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  stages: ProcessingStage[];
  viral_score?: number;
  transformations?: Record<string, string>;
  created_at: string;
  estimated_completion?: string;
}

const { width } = Dimensions.get('window');

const ProcessingStatusScreen: React.FC = () => {
  const { colors } = useTheme();
  const [projects, setProjects] = useState<ProjectStatus[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate entry
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Setup real-time connection
    setupRealTimeConnection();
    
    // Load initial project data
    loadProjects();

    return () => {
      realTimeService.off('processing_update');
      realTimeService.off('viral_score_update');
    };
  }, []);

  useEffect(() => {
    // Pulse animation for active processing
    const hasActiveProjects = projects.some(p => p.status === 'processing' || p.status === 'uploading');
    
    if (hasActiveProjects) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [projects]);

  const setupRealTimeConnection = async () => {
    try {
      await realTimeService.connect();
      setIsConnected(true);

      // Listen for processing updates
      realTimeService.on('processing_update', (data: any) => {
        updateProjectProgress(data);
      });

      // Listen for viral score updates
      realTimeService.on('viral_score_update', (data: any) => {
        updateViralScore(data);
      });

    } catch (error) {
      console.error('Failed to setup real-time connection:', error);
      setIsConnected(false);
    }
  };

  const loadProjects = async () => {
    try {
      // This would normally load from API
      // For now, we'll simulate some data
      const mockProjects: ProjectStatus[] = [
        {
          id: '1',
          name: 'My Viral Video',
          status: 'processing',
          progress: 65,
          created_at: new Date(Date.now() - 300000).toISOString(),
          estimated_completion: new Date(Date.now() + 120000).toISOString(),
          viral_score: 78,
          stages: [
            { id: '1', name: 'Upload', description: 'Uploading video file', progress: 100, status: 'completed' },
            { id: '2', name: 'Analysis', description: 'AI analyzing content', progress: 100, status: 'completed' },
            { id: '3', name: 'Enhancement', description: 'Applying AI enhancements', progress: 80, status: 'active' },
            { id: '4', name: 'Platform Optimization', description: 'Creating platform variants', progress: 0, status: 'pending' },
            { id: '5', name: 'Final Processing', description: 'Finalizing outputs', progress: 0, status: 'pending' },
          ],
        },
      ];
      setProjects(mockProjects);
      
      // Subscribe to updates for each project
      mockProjects.forEach(project => {
        realTimeService.subscribeToProcessing(project.id);
      });
      
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const updateProjectProgress = (data: any) => {
    setProjects(prevProjects => 
      prevProjects.map(project => {
        if (project.id === data.project_id) {
          return {
            ...project,
            progress: data.progress,
            status: data.status,
            stages: project.stages.map(stage => {
              if (stage.id === data.stage_id) {
                return {
                  ...stage,
                  progress: data.stage_progress || stage.progress,
                  status: data.stage_status || stage.status,
                };
              }
              return stage;
            }),
          };
        }
        return project;
      })
    );
  };

  const updateViralScore = (data: any) => {
    setProjects(prevProjects => 
      prevProjects.map(project => {
        if (project.id === data.project_id) {
          return {
            ...project,
            viral_score: data.viral_score,
          };
        }
        return project;
      })
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'failed': return '#EF4444';
      case 'processing': return '#F59E0B';
      case 'uploading': return '#3B82F6';
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'failed': return 'close-circle';
      case 'processing': return 'sync';
      case 'uploading': return 'cloud-upload';
      default: return 'time';
    }
  };

  const formatTimeRemaining = (isoString?: string) => {
    if (!isoString) return null;
    const remaining = new Date(isoString).getTime() - Date.now();
    if (remaining <= 0) return 'Almost done!';
    
    const minutes = Math.ceil(remaining / 60000);
    return `~${minutes}m remaining`;
  };

  const renderProject = (project: ProjectStatus) => {
    const isSelected = selectedProject === project.id;
    const isActive = project.status === 'processing' || project.status === 'uploading';
    
    return (
      <TouchableOpacity
        key={project.id}
        style={[styles.projectCard, isSelected && styles.selectedCard]}
        onPress={() => setSelectedProject(isSelected ? null : project.id)}
      >
        <LinearGradient
          colors={isActive ? [colors.primary + '20', colors.secondary + '20'] : ['transparent', 'transparent']}
          style={styles.projectCardGradient}
        >
          <View style={styles.projectHeader}>
            <View style={styles.projectInfo}>
              <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
              <Text style={[styles.projectTime, { color: colors.textSecondary }]}>
                {formatTimeRemaining(project.estimated_completion) || 'Processing...'}
              </Text>
            </View>
            
            <View style={styles.projectStatus}>
              <Animated.View style={isActive ? { transform: [{ scale: pulseAnim }] } : {}}>
                <Ionicons 
                  name={getStatusIcon(project.status) as any} 
                  size={24} 
                  color={getStatusColor(project.status)} 
                />
              </Animated.View>
              {project.viral_score && (
                <Text style={[styles.viralScore, { color: getStatusColor('completed') }]}>
                  {project.viral_score}%
                </Text>
              )}
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <Progress.Bar 
              progress={project.progress / 100} 
              width={width - 60} 
              height={8}
              color={getStatusColor(project.status)}
              unfilledColor={colors.textSecondary + '30'}
              borderWidth={0}
              borderRadius={4}
            />
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {project.progress}% complete
            </Text>
          </View>
          
          {isSelected && (
            <Animated.View style={[styles.stagesContainer, {
              opacity: fadeAnim,
            }]}>
              {project.stages.map((stage, index) => (
                <View key={stage.id} style={styles.stageItem}>
                  <View style={styles.stageIcon}>
                    <Ionicons 
                      name={getStatusIcon(stage.status) as any} 
                      size={16} 
                      color={getStatusColor(stage.status)} 
                    />
                  </View>
                  <View style={styles.stageContent}>
                    <Text style={[styles.stageName, { color: colors.text }]}>{stage.name}</Text>
                    <Text style={[styles.stageDescription, { color: colors.textSecondary }]}>
                      {stage.description}
                    </Text>
                    {stage.status === 'active' && (
                      <Progress.Bar 
                        progress={stage.progress / 100} 
                        width={200} 
                        height={4}
                        color={getStatusColor('processing')}
                        unfilledColor={colors.textSecondary + '30'}
                        borderWidth={0}
                        borderRadius={2}
                      />
                    )}
                  </View>
                </View>
              ))}
            </Animated.View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const activeProjects = projects.filter(p => p.status === 'processing' || p.status === 'uploading');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const failedProjects = projects.filter(p => p.status === 'failed');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Processing Status</Text>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionDot, 
              { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
            ]} />
            <Text style={[styles.connectionText, { color: colors.textSecondary }]}>
              {isConnected ? 'Live updates' : 'Offline'}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Active Projects */}
          {activeProjects.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Processing</Text>
              {activeProjects.map(renderProject)}
            </View>
          )}

          {/* Completed Projects */}
          {completedProjects.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Completed</Text>
              {completedProjects.map(renderProject)}
            </View>
          )}

          {/* Failed Projects */}
          {failedProjects.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Failed</Text>
              {failedProjects.map(renderProject)}
            </View>
          )}

          {/* Empty State */}
          {projects.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="videocam-outline" size={80} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No projects yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Start recording to see your processing status here</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  content: { 
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  projectCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedCard: {
    borderColor: '#9333EA',
    backgroundColor: 'rgba(147,51,234,0.1)',
  },
  projectCardGradient: {
    padding: 16,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  projectTime: {
    fontSize: 14,
  },
  projectStatus: {
    alignItems: 'center',
    gap: 4,
  },
  viralScore: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    gap: 8,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  stagesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stageIcon: {
    width: 24,
    alignItems: 'center',
    paddingTop: 2,
  },
  stageContent: {
    flex: 1,
    gap: 4,
  },
  stageName: {
    fontSize: 14,
    fontWeight: '600',
  },
  stageDescription: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProcessingStatusScreen;