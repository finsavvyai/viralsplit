'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';

const PLATFORMS = [
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    aspect: '9:16',
    duration: '60s',
    popular: true,
    description: 'Viral short-form content'
  },
  {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    icon: '📱',
    aspect: '9:16',
    duration: '90s',
    popular: true,
    description: 'Engaging vertical videos'
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    icon: '📺',
    aspect: '9:16',
    duration: '60s',
    popular: true,
    description: 'YouTube short content'
  },
  {
    id: 'instagram_feed',
    name: 'Instagram Feed',
    icon: '📷',
    aspect: '1:1',
    duration: '60s',
    description: 'Square format posts'
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: '🐦',
    aspect: '16:9',
    duration: '2:20',
    description: 'Horizontal video content'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    aspect: '16:9',
    duration: '10m',
    description: 'Professional content'
  }
];

interface PlatformSelectorProps {
  selected: string[];
  onChange: (platforms: string[]) => void;
  onTransform: (platforms: string[]) => void;
  isTransforming?: boolean;
  transformationStatus?: Record<string, 'pending' | 'processing' | 'completed' | 'failed'>;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selected,
  onChange,
  onTransform,
  isTransforming = false,
  transformationStatus = {}
}) => {
  const togglePlatform = (platformId: string) => {
    if (isTransforming) return; // Disable during transformation
    
    if (selected.includes(platformId)) {
      onChange(selected.filter(id => id !== platformId));
    } else {
      onChange([...selected, platformId]);
    }
  };
  
  const selectAll = () => {
    if (isTransforming) return;
    onChange(PLATFORMS.map(p => p.id));
  };
  
  const selectPopular = () => {
    if (isTransforming) return;
    onChange(PLATFORMS.filter(p => p.popular).map(p => p.id));
  };

  const clearAll = () => {
    if (isTransforming) return;
    onChange([]);
  };

  const handleTransform = () => {
    if (selected.length > 0 && !isTransforming) {
      onTransform(selected);
    }
  };

  const getStatusIcon = (platformId: string) => {
    const status = transformationStatus[platformId];
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <span className="w-4 h-4 text-red-400">✗</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={selectPopular}
          disabled={isTransforming}
          className="px-4 py-2 bg-purple-600/20 text-purple-300 border border-purple-600/30 rounded-lg hover:bg-purple-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select Popular
        </button>
        <button
          onClick={selectAll}
          disabled={isTransforming}
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select All
        </button>
        <button
          onClick={clearAll}
          disabled={isTransforming}
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
      </div>
      
      {/* Platform Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map(platform => {
          const isSelected = selected.includes(platform.id);
          const status = transformationStatus[platform.id];
          
          return (
            <div
              key={platform.id}
              onClick={() => togglePlatform(platform.id)}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600'
                }
                ${isTransforming ? 'cursor-not-allowed opacity-75' : 'hover:scale-[1.02]'}
                ${status === 'completed' ? 'ring-2 ring-green-400/50' : ''}
                ${status === 'failed' ? 'ring-2 ring-red-400/50' : ''}
              `}
            >
              {/* Status indicator */}
              <div className="absolute top-2 right-2">
                {isSelected && !status && (
                  <Check className="w-5 h-5 text-purple-400" />
                )}
                {status && getStatusIcon(platform.id)}
              </div>
              
              {/* Popular badge */}
              {platform.popular && (
                <div className="absolute top-2 left-2">
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full font-medium">
                    Popular
                  </span>
                </div>
              )}
              
              {/* Platform info */}
              <div className="mt-2">
                <div className="text-3xl mb-3">{platform.icon}</div>
                <div className="font-semibold text-lg mb-1">{platform.name}</div>
                <div className="text-sm text-gray-400 mb-2">
                  {platform.description}
                </div>
                <div className="text-xs text-gray-500">
                  {platform.aspect} • {platform.duration}
                </div>
              </div>

              {/* Processing overlay */}
              {status === 'processing' && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto mb-2" />
                    <span className="text-xs text-gray-300">Processing...</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transform Button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={handleTransform}
          disabled={selected.length === 0 || isTransforming}
          className={`
            w-full py-4 rounded-lg font-bold text-lg transition-all
            ${selected.length > 0 && !isTransforming
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 hover:scale-[1.02]'
              : 'bg-gray-700 cursor-not-allowed opacity-50'
            }
          `}
        >
          {isTransforming ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Transforming...
            </div>
          ) : (
            `Transform for ${selected.length} Platform${selected.length !== 1 ? 's' : ''}`
          )}
        </button>
        
        {selected.length > 0 && !isTransforming && (
          <p className="text-center text-sm text-gray-400 mt-2">
            Estimated time: {Math.ceil(selected.length * 1.5)} minutes
          </p>
        )}
      </div>
    </div>
  );
};