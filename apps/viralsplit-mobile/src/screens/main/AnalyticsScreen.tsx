import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSelector } from '@/store';

const { width } = Dimensions.get('window');

interface MetricCard {
  title: string;
  value: string;
  change: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const AnalyticsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { projects } = useAppSelector(state => state.projects);

  const completedProjects = projects.filter(p => p.status === 'completed');
  const totalPlatforms = projects.reduce((total, project) => total + project.platforms.length, 0);

  const metrics: MetricCard[] = [
    {
      title: 'Total Views',
      value: '125.4K',
      change: '+23%',
      icon: 'eye',
      color: '#3B82F6',
    },
    {
      title: 'Viral Score Avg',
      value: '87%',
      change: '+12%',
      icon: 'trending-up',
      color: '#10B981',
    },
    {
      title: 'Videos Created',
      value: completedProjects.length.toString(),
      change: '+8',
      icon: 'videocam',
      color: '#8B5CF6',
    },
    {
      title: 'Platforms',
      value: totalPlatforms.toString(),
      change: '+5',
      icon: 'phone-portrait',
      color: '#F59E0B',
    },
  ];

  const platformData = [
    { name: 'TikTok', percentage: 35, color: '#FF0050' },
    { name: 'Instagram', percentage: 28, color: '#E4405F' },
    { name: 'YouTube', percentage: 22, color: '#FF0000' },
    { name: 'Twitter', percentage: 15, color: '#1DA1F2' },
  ];

  const recentActivity = [
    { action: 'Video processed', video: 'My Latest Creation.mp4', time: '2 hours ago', status: 'success' },
    { action: 'Magic Edit completed', video: 'Tutorial Video.mp4', time: '5 hours ago', status: 'success' },
    { action: 'Content remixed', video: 'Product Demo.mp4', time: '1 day ago', status: 'success' },
    { action: 'Script generated', video: 'New Video Idea', time: '2 days ago', status: 'pending' },
  ];

  const renderMetricCard = (metric: MetricCard, index: number) => (
    <View key={index} style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
          <Ionicons name={metric.icon} size={20} color={metric.color} />
        </View>
        <Text style={[styles.metricChange, { color: colors.success }]}>{metric.change}</Text>
      </View>
      <Text style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text>
      <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{metric.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={[styles.filterText, { color: colors.primary }]}>This Month</Text>
            <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => renderMetricCard(metric, index))}
        </View>

        {/* Platform Performance */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Performance</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.platformList}>
            {platformData.map((platform, index) => (
              <View key={index} style={styles.platformItem}>
                <View style={styles.platformInfo}>
                  <View style={[styles.platformDot, { backgroundColor: platform.color }]} />
                  <Text style={[styles.platformName, { color: colors.text }]}>{platform.name}</Text>
                </View>
                <View style={styles.platformProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { backgroundColor: platform.color, width: `${platform.percentage}%` }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.platformPercentage, { color: colors.textSecondary }]}>
                    {platform.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Viral Score Trend */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Viral Score Trend</Text>
            <TouchableOpacity>
              <Ionicons name="trending-up" size={20} color={colors.success} />
            </TouchableOpacity>
          </View>
          
          <LinearGradient
            colors={[colors.primary + '20', 'transparent']}
            style={styles.chartPlaceholder}
          >
            <Text style={[styles.chartText, { color: colors.textSecondary }]}>
              Chart visualization coming soon
            </Text>
            <Text style={[styles.trendValue, { color: colors.success }]}>↗ +23% this month</Text>
          </LinearGradient>
        </View>

        {/* Recent Activity */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          </View>
          
          <View style={styles.activityList}>
            {recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[
                  styles.activityIcon, 
                  { backgroundColor: activity.status === 'success' ? colors.success + '20' : colors.warning + '20' }
                ]}>
                  <Ionicons 
                    name={activity.status === 'success' ? 'checkmark' : 'hourglass'} 
                    size={16} 
                    color={activity.status === 'success' ? colors.success : colors.warning} 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityAction, { color: colors.text }]}>{activity.action}</Text>
                  <Text style={[styles.activityVideo, { color: colors.textSecondary }]}>
                    {activity.video}
                  </Text>
                </View>
                <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                  {activity.time}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Insights */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Insights</Text>
            <Ionicons name="bulb" size={20} color={colors.warning} />
          </View>
          
          <View style={styles.insightsList}>
            <View style={styles.insightItem}>
              <Text style={[styles.insightText, { color: colors.text }]}>
                Your videos perform 45% better on weekends
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={[styles.insightText, { color: colors.text }]}>
                Educational content has your highest viral score (89%)
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={[styles.insightText, { color: colors.text }]}>
                Videos with AI-generated hooks get 3x more engagement
              </Text>
            </View>
          </View>
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  platformList: {
    gap: 16,
  },
  platformItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '500',
  },
  platformProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    width: 80,
    height: 6,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  platformPercentage: {
    fontSize: 14,
    fontWeight: '600',
    width: 35,
    textAlign: 'right',
  },
  chartPlaceholder: {
    height: 120,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartText: {
    fontSize: 14,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 16,
    fontWeight: '500',
  },
  activityVideo: {
    fontSize: 14,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    padding: 12,
    backgroundColor: 'rgba(147, 51, 234, 0.05)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#9333EA',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AnalyticsScreen;