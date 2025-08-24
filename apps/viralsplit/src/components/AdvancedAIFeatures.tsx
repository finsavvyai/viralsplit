'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Search, 
  Brain, 
  Zap, 
  Target, 
  Eye,
  Users,
  Sparkles,
  BarChart3,
  Clock,
  Trophy,
  Heart,
  MessageCircle,
  Share2,
  Bookmark
} from 'lucide-react';

interface AdvancedAIFeaturesProps {
  projectId: string;
  platforms: string[];
}

export function AdvancedAIFeatures({ projectId, platforms }: AdvancedAIFeaturesProps) {
  const [activeTab, setActiveTab] = useState<'trending' | 'competitor' | 'formats' | 'emotions' | 'hacks' | 'ceiling'>('trending');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'trending', label: 'Trending Predictor', icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
    { id: 'competitor', label: 'Competitor Intel', icon: Search, color: 'from-blue-500 to-cyan-600' },
    { id: 'formats', label: 'Viral Formats', icon: Sparkles, color: 'from-purple-500 to-pink-600' },
    { id: 'emotions', label: 'Emotion Analysis', icon: Heart, color: 'from-red-500 to-rose-600' },
    { id: 'hacks', label: 'Engagement Hacks', icon: Zap, color: 'from-yellow-500 to-orange-600' },
    { id: 'ceiling', label: 'Viral Ceiling', icon: Trophy, color: 'from-indigo-500 to-purple-600' }
  ] as const;

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, projectId]);

  const fetchData = async (tab: string) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      
      let endpoint = '';
      let method = 'GET';
      
      switch (tab) {
        case 'trending':
          endpoint = `/api/trending/predict?platforms=${platforms.join(',')}`;
          break;
        case 'competitor':
          endpoint = `/api/projects/${projectId}/competitor-analysis?niche=general`;
          method = 'POST';
          break;
        case 'formats':
          endpoint = `/api/projects/${projectId}/viral-formats?content_type=educational`;
          method = 'POST';
          break;
        case 'emotions':
          endpoint = `/api/projects/${projectId}/emotional-analysis`;
          method = 'POST';
          break;
        case 'hacks':
          endpoint = `/api/projects/${projectId}/engagement-hacks?content_type=educational`;
          method = 'POST';
          break;
        case 'ceiling':
          endpoint = `/api/projects/${projectId}/viral-ceiling`;
          method = 'POST';
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Advanced AI feature error:', error);
      setData({ error: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const renderTrendingPredictor = () => {
    if (!data?.trending_predictions) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-green-400" />
          <span className="text-sm text-white/60">Predictions for next {data.prediction_window}</span>
        </div>
        
        {Object.entries(data.trending_predictions).map(([platform, topics]: [string, any]) => (
          <div key={platform} className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3 capitalize">{platform.replace('_', ' ')}</h4>
            <div className="space-y-2">
              {topics.map((trend: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span className="text-white/80">{trend.topic}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400">{trend.confidence}%</span>
                    <span className="text-xs text-white/40">{trend.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCompetitorAnalysis = () => {
    if (!data?.competitive_analysis) return null;

    const analysis = data.competitive_analysis;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Oversaturated Topics
            </h4>
            <ul className="space-y-1 text-sm text-white/70">
              {analysis.oversaturated_topics?.map((topic: string, index: number) => (
                <li key={index}>• {topic}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-green-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Content Gaps
            </h4>
            <ul className="space-y-1 text-sm text-white/70">
              {analysis.content_gaps?.map((gap: string, index: number) => (
                <li key={index}>• {gap}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Blue Ocean Opportunities
          </h4>
          <div className="space-y-2">
            {analysis.blue_ocean_opportunities?.map((opp: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-white/80">{opp.opportunity}</span>
                <span className="text-blue-400 font-semibold">{opp.score}/100</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderViralFormats = () => {
    if (!data?.format_suggestions) return null;

    return (
      <div className="space-y-4">
        {Object.entries(data.format_suggestions).map(([platform, formats]: [string, any]) => (
          <div key={platform} className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3 capitalize">{platform.replace('_', ' ')}</h4>
            <div className="space-y-3">
              {formats.map((format: any, index: number) => (
                <div key={index} className="border border-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-purple-400">{format.format_name}</h5>
                  </div>
                  <p className="text-sm text-white/60 mb-2">{format.structure}</p>
                  <p className="text-xs text-white/50 mb-2">{format.why_it_works}</p>
                  {format.hook_examples && (
                    <div className="flex flex-wrap gap-2">
                      {format.hook_examples.map((hook: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-purple-600/20 rounded text-xs text-purple-300">
                          "{hook}"
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEmotionalAnalysis = () => {
    if (!data?.emotional_analysis) return null;

    const analysis = data.emotional_analysis;
    
    return (
      <div className="space-y-6">
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Primary Emotions
          </h4>
          <div className="space-y-2">
            {analysis.primary_emotions?.map((emotion: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-white/80">{emotion.emotion}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${emotion.strength}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white">{emotion.strength}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Psychological Hooks
          </h4>
          <div className="space-y-2">
            {analysis.psychological_hooks?.map((hook: any, index: number) => (
              <div key={index} className="p-2 bg-white/5 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/80">{hook.hook}</span>
                  <span className="text-yellow-400 font-semibold">{hook.strength}/100</span>
                </div>
                <p className="text-xs text-white/50">{hook.implementation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEngagementHacks = () => {
    if (!data?.engagement_hacks) return null;

    return (
      <div className="space-y-4">
        {Object.entries(data.engagement_hacks).map(([platform, hacks]: [string, any]) => (
          <div key={platform} className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3 capitalize flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              {platform.replace('_', ' ')} Hacks
            </h4>
            <div className="space-y-3">
              {hacks.map((hack: any, index: number) => (
                <div key={index} className="border border-yellow-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-yellow-600/20 rounded text-xs text-yellow-300">
                      {hack.category}
                    </span>
                    <h5 className="font-medium text-yellow-400">{hack.hack}</h5>
                  </div>
                  <p className="text-sm text-white/70 mb-2">{hack.description}</p>
                  <p className="text-xs text-white/50">{hack.implementation}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderViralCeiling = () => {
    if (!data?.viral_ceiling) return null;

    return (
      <div className="space-y-4">
        {Object.entries(data.viral_ceiling).map(([platform, ceiling]: [string, any]) => (
          <div key={platform} className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3 capitalize flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-400" />
              {platform.replace('_', ' ')} Potential
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-white/60">View Ranges:</span>
                  <div className="mt-1 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/80">Conservative:</span>
                      <span className="text-green-400">{ceiling.max_views_range?.conservative?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Optimistic:</span>
                      <span className="text-yellow-400">{ceiling.max_views_range?.optimistic?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Viral Breakout:</span>
                      <span className="text-purple-400">{ceiling.max_views_range?.viral_breakout?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">Engagement Rate:</span>
                  <span className="text-blue-400">{ceiling.peak_engagement_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">Time to Peak:</span>
                  <span className="text-green-400">{ceiling.viral_velocity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/60">Spillover Potential:</span>
                  <span className="text-yellow-400">{ceiling.cross_platform_spillover}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="text-center text-sm text-white/50">
          Confidence: {Math.round((data.prediction_confidence || 0.78) * 100)}%
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      );
    }

    if (data?.error) {
      return (
        <div className="text-center py-8 text-red-400">
          <p>{data.error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'trending':
        return renderTrendingPredictor();
      case 'competitor':
        return renderCompetitorAnalysis();
      case 'formats':
        return renderViralFormats();
      case 'emotions':
        return renderEmotionalAnalysis();
      case 'hacks':
        return renderEngagementHacks();
      case 'ceiling':
        return renderViralCeiling();
      default:
        return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6"
    >
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Brain className="w-6 h-6 text-purple-400" />
        Advanced AI Intelligence
      </h3>

      {/* Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white`
                : 'bg-white/5 text-white/60 hover:text-white/80'
            }`}
          >
            <tab.icon className="w-4 h-4 mx-auto mb-1" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}