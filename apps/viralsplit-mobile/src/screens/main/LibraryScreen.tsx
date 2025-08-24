import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useTheme } from '@/contexts/ThemeContext';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchUserProjects } from '@/store/slices/projectsSlice';
import { RootStackParamList, Project } from '@/types';

type LibraryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const LibraryScreen: React.FC = () => {
  const navigation = useNavigation<LibraryScreenNavigationProp>();
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { projects, isLoading } = useAppSelector(state => state.projects);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');

  useEffect(() => {
    dispatch(fetchUserProjects());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchUserProjects());
    setRefreshing(false);
  };

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'processing':
        return colors.warning;
      case 'failed':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'processing':
        return 'hourglass';
      case 'failed':
        return 'alert-circle';
      default:
        return 'ellipse';
    }
  };

  const handleProjectPress = (project: Project) => {
    if (project.status === 'completed') {
      navigation.navigate('Results', { projectId: project.id });
    } else if (project.status === 'processing') {
      navigation.navigate('ProcessingStatus', { projectId: project.id });
    } else if (project.status === 'failed') {
      Alert.alert(
        'Processing Failed',
        'This video failed to process. Would you like to try again?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => console.log('Retry processing') },
        ]
      );
    }
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleProjectPress(item)}
    >
      <View style={styles.projectThumbnail}>
        <Ionicons name="videocam" size={24} color={colors.textSecondary} />
      </View>
      
      <View style={styles.projectInfo}>
        <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
          {item.filename}
        </Text>
        
        <Text style={[styles.projectPlatforms, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.platforms.join(', ')}
        </Text>
        
        <View style={styles.projectMeta}>
          <View style={styles.statusContainer}>
            <Ionicons 
              name={getStatusIcon(item.status) as any} 
              size={14} 
              color={getStatusColor(item.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
          
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {new Date(item.created_at * 1000).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.projectActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType: typeof filter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { borderColor: colors.border },
        filter === filterType && [styles.filterButtonActive, { backgroundColor: colors.primary }]
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        { color: filter === filterType ? '#FFFFFF' : colors.textSecondary }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-outline" size={80} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Videos Yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Start creating viral content by recording your first video
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Camera')}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create Video</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Video Library</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {projects.length > 0 && (
        <View style={styles.filtersContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { key: 'all', label: 'All' },
              { key: 'completed', label: 'Completed' },
              { key: 'processing', label: 'Processing' },
              { key: 'failed', label: 'Failed' },
            ]}
            renderItem={({ item }) => renderFilterButton(item.key as any, item.label)}
            ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
            contentContainerStyle={styles.filtersContent}
          />
        </View>
      )}

      {/* Stats */}
      {projects.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{projects.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {projects.filter(p => p.status === 'completed').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>
              {projects.filter(p => p.status === 'processing').length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Processing</Text>
          </View>
        </View>
      )}

      {/* Projects List */}
      <FlatList
        data={filteredProjects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 8,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonActive: {
    borderColor: 'transparent',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  projectThumbnail: {
    width: 60,
    height: 60,
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
    marginBottom: 4,
  },
  projectPlatforms: {
    fontSize: 14,
    marginBottom: 6,
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
  },
  projectActions: {
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default LibraryScreen;