'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Video, 
  Zap, 
  Clock,
  Target,
  Users,
  Award,
  Activity,
  Calendar
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    total_videos_processed: number;
    completed_videos: number;
    success_rate: number;
    total_platforms: number;
    credits_used: number;
    credits_remaining: number;
  };
  platform_breakdown: {
    [platform: string]: {
      count: number;
      success_rate: number;
      avg_viral_score: number;
    };
  };
  recent_activity: Array<{
    project_id: string;
    filename: string;
    status: string;
    platforms: string[];
    created_at: number;
    completed_at?: number;
  }>;
  performance_metrics: {
    avg_processing_time: string;
    most_used_platform: string;
    optimal_posting_time: string;
    viral_score_avg: number;
  };
}

interface AnalyticsDashboardProps {
  userId: string;
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/analytics/${userId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, icon: Icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <TrendingUp className="w-5 h-5 text-green-400" />
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-white/60">{title}</p>
        {subtitle && (
          <p className="text-xs text-white/40">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      tiktok: '📱',
      instagram_reels: '📸',
      youtube_shorts: '🎥',
      instagram_feed: '📷',
      twitter: '🐦',
      linkedin: '💼'
    };
    return icons[platform] || '🎬';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      completed: 'text-green-400',
      processing: 'text-yellow-400',
      failed: 'text-red-400',
      pending: 'text-blue-400'
    };
    return colors[status] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 rounded-xl p-6 animate-pulse">
              <div className="w-12 h-12 bg-white/10 rounded-lg mb-4"></div>
              <div className="h-8 bg-white/10 rounded w-20 mb-2"></div>
              <div className="h-4 bg-white/5 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500/20 p-6 rounded-xl">
        <h3 className="text-red-400 text-lg font-bold mb-2">Analytics Error</h3>
        <p className="text-red-300/80 text-sm">{error}</p>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-8">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Videos Processed"
          value={analytics.overview.total_videos_processed}
          icon={Video}
          color="from-purple-500 to-pink-600"
          subtitle={`${analytics.overview.completed_videos} completed`}
        />
        <MetricCard
          title="Success Rate"
          value={`${Math.round(analytics.overview.success_rate)}%`}
          icon={Target}
          color="from-green-500 to-emerald-600"
        />
        <MetricCard
          title="Platforms Used"
          value={analytics.overview.total_platforms}
          icon={Zap}
          color="from-blue-500 to-cyan-600"
        />
        <MetricCard
          title="Credits Remaining"
          value={analytics.overview.credits_remaining}
          icon={Award}
          color="from-yellow-500 to-orange-600"
          subtitle={`${analytics.overview.credits_used} used`}
        />
      </div>

      {/* Platform Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          Platform Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(analytics.platform_breakdown).map(([platform, stats]) => (
            <div key={platform} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{getPlatformIcon(platform)}</span>
                <span className="text-white font-medium capitalize">
                  {platform.replace('_', ' ')}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Videos</span>
                  <span className="text-white">{stats.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Success</span>
                  <span className="text-green-400">{stats.success_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Avg Score</span>
                  <span className="text-purple-400">{Math.round(stats.avg_viral_score * 100)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-green-400" />
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {analytics.performance_metrics.avg_processing_time}
            </div>
            <div className="text-sm text-white/60 flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" />
              Avg Processing Time
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1 capitalize">
              {analytics.performance_metrics.most_used_platform.replace('_', ' ')}
            </div>
            <div className="text-sm text-white/60 flex items-center justify-center gap-1">
              <Target className="w-4 h-4" />
              Most Used Platform
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {analytics.performance_metrics.optimal_posting_time}
            </div>
            <div className="text-sm text-white/60 flex items-center justify-center gap-1">
              <Calendar className="w-4 h-4" />
              Optimal Posting Time
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {Math.round(analytics.performance_metrics.viral_score_avg * 100)}
            </div>
            <div className="text-sm text-white/60 flex items-center justify-center gap-1">
              <Zap className="w-4 h-4" />
              Avg Viral Score
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-400" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {analytics.recent_activity.slice(0, 5).map((activity) => (
            <div key={activity.project_id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{activity.filename}</p>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span>
                      {activity.platforms.map(p => getPlatformIcon(p)).join(' ')}
                    </span>
                    <span>•</span>
                    <span>{new Date(activity.created_at * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}