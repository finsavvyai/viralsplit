'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Copy, Check, Lightbulb, RefreshCw } from 'lucide-react';

interface HookData {
  hooks: {
    [platform: string]: string[];
  };
  generated_at: string;
}

interface HookSuggestionsProps {
  projectId: string;
  platforms: string[];
}

export function HookSuggestions({ projectId, platforms }: HookSuggestionsProps) {
  const [hooks, setHooks] = useState<HookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedHook, setCopiedHook] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  useEffect(() => {
    if (platforms.length > 0) {
      setSelectedPlatform(platforms[0]);
      fetchHooks();
    }
  }, [projectId, platforms]);

  const fetchHooks = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('auth_token');
      
      const response = await fetch(`/api/projects/${projectId}/generate-hooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate hooks');
      }

      const data = await response.json();
      setHooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const copyHook = async (hook: string, hookId: string) => {
    try {
      await navigator.clipboard.writeText(hook);
      setCopiedHook(hookId);
      setTimeout(() => setCopiedHook(null), 2000);
    } catch (err) {
      console.error('Failed to copy hook:', err);
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      tiktok: 'from-pink-500 to-red-500',
      instagram_reels: 'from-purple-500 to-pink-500',
      youtube_shorts: 'from-red-500 to-red-600',
      instagram_feed: 'from-blue-500 to-purple-500',
      twitter: 'from-blue-400 to-blue-600',
      linkedin: 'from-blue-600 to-indigo-700'
    };
    return colors[platform] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-6 rounded-xl border border-blue-500/10">
        <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          AI Hook Generator
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 p-4 rounded-lg animate-pulse">
              <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/5 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500/20 p-6 rounded-xl">
        <h3 className="text-red-400 text-lg font-bold mb-2 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Hook Generation Error
        </h3>
        <p className="text-red-300/80 text-sm mb-4">{error}</p>
        <button
          onClick={fetchHooks}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (!hooks) return null;

  const selectedHooks = hooks.hooks[selectedPlatform] || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-6 rounded-xl border border-blue-500/10"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-bold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          AI Hook Generator
        </h3>
        <button
          onClick={fetchHooks}
          className="flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white/80 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerate
        </button>
      </div>

      {/* Platform Tabs */}
      {platforms.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {platforms.map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedPlatform === platform
                  ? `bg-gradient-to-r ${getPlatformColor(platform)} text-white`
                  : 'bg-white/10 text-white/60 hover:text-white/80'
              }`}
            >
              {platform.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Hook Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {selectedHooks.map((hook, index) => {
            const hookId = `${selectedPlatform}-${index}`;
            return (
              <motion.div
                key={hookId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white/5 hover:bg-white/10 p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                onClick={() => copyHook(hook, hookId)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-white/90 text-sm leading-relaxed">
                      "{hook}"
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                      <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${getPlatformColor(selectedPlatform)}`}></span>
                      Optimized for {selectedPlatform.replace('_', ' ')}
                    </div>
                  </div>
                  <button
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyHook(hook, hookId);
                    }}
                  >
                    {copiedHook === hookId ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
        <div className="flex items-center gap-2 text-blue-300 text-sm">
          <Zap className="w-4 h-4" />
          <span>Pro Tip: Use these hooks in your first 3 seconds to maximize engagement</span>
        </div>
      </div>
    </motion.div>
  );
}