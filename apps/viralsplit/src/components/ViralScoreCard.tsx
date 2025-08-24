'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Target, Clock } from 'lucide-react';

interface ViralScores {
  [platform: string]: number;
}

interface ViralScoreData {
  viral_scores: ViralScores;
  analyzed_at: string;
  confidence: number;
}

interface ViralScoreCardProps {
  projectId: string;
  platforms: string[];
}

export function ViralScoreCard({ projectId, platforms }: ViralScoreCardProps) {
  const [scores, setScores] = useState<ViralScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchViralScores();
  }, [projectId]);

  const fetchViralScores = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/projects/${projectId}/viral-score`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get viral scores');
      }

      const data = await response.json();
      setScores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

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

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'from-green-500 to-emerald-600';
    if (score >= 0.6) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Viral Potential';
    if (score >= 0.6) return 'Good Potential';
    return 'Needs Work';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl animate-pulse">
        <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Viral Analysis
        </h3>
        <div className="space-y-3">
          {platforms.map((platform) => (
            <div key={platform} className="flex justify-between items-center">
              <span className="text-white/80 capitalize">{platform}</span>
              <div className="w-20 bg-white/20 rounded-full h-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500/20 p-6 rounded-xl">
        <h3 className="text-red-400 text-lg font-bold mb-2">Analysis Error</h3>
        <p className="text-red-300/80 text-sm">{error}</p>
      </div>
    );
  }

  if (!scores) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Viral Prediction
        </h3>
        <div className="flex items-center gap-1 text-white/60 text-xs">
          <Target className="w-3 h-3" />
          {Math.round(scores.confidence * 100)}% confidence
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {Object.entries(scores.viral_scores).map(([platform, score]) => (
          <motion.div 
            key={platform} 
            className="space-y-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-white/90 capitalize flex items-center gap-2">
                <span>{getPlatformIcon(platform)}</span>
                {platform.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">
                  {Math.round(score * 100)}
                </span>
                <span className="text-xs text-white/60">
                  {getScoreLabel(score)}
                </span>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div 
                className={`bg-gradient-to-r ${getScoreColor(score)} h-2 rounded-full flex items-center justify-end pr-1`}
                initial={{ width: 0 }}
                animate={{ width: `${score * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {score >= 0.7 && (
                  <TrendingUp className="w-3 h-3 text-white" />
                )}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-xs text-white/50 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Analyzed {new Date(scores.analyzed_at).toLocaleTimeString()}
      </div>
    </motion.div>
  );
}