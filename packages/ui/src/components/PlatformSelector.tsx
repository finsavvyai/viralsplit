import React, { useState } from 'react';
import { Check } from 'lucide-react';

const PLATFORMS = [
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    aspect: '9:16',
    duration: '60s',
    popular: true
  },
  {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    icon: '📱',
    aspect: '9:16',
    duration: '90s',
    popular: true
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    icon: '📺',
    aspect: '9:16',
    duration: '60s',
    popular: true
  },
  {
    id: 'instagram_feed',
    name: 'Instagram Feed',
    icon: '📷',
    aspect: '1:1',
    duration: '60s'
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: '🐦',
    aspect: '16:9',
    duration: '2:20'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    aspect: '16:9',
    duration: '10m'
  }
];

interface PlatformSelectorProps {
  selected: string[];
  onChange: (platforms: string[]) => void;
  brand: 'viralsplit' | 'contentmulti';
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selected,
  onChange,
  brand
}) => {
  const togglePlatform = (platformId: string) => {
    if (selected.includes(platformId)) {
      onChange(selected.filter(id => id !== platformId));
    } else {
      onChange([...selected, platformId]);
    }
  };
  
  const selectAll = () => onChange(PLATFORMS.map(p => p.id));
  const selectPopular = () => onChange(PLATFORMS.filter(p => p.popular).map(p => p.id));
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={selectPopular}
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          Select Popular
        </button>
        <button
          onClick={selectAll}
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          Select All
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PLATFORMS.map(platform => (
          <div
            key={platform.id}
            onClick={() => togglePlatform(platform.id)}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer
              transition-all duration-200
              ${selected.includes(platform.id) 
                ? brand === 'viralsplit'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600'
              }
            `}
          >
            {selected.includes(platform.id) && (
              <Check className="absolute top-2 right-2 w-5 h-5" />
            )}
            
            <div className="text-2xl mb-2">{platform.icon}</div>
            <div className="font-semibold">{platform.name}</div>
            <div className="text-xs text-gray-400 mt-1">
              {platform.aspect} • {platform.duration}
            </div>
            
            {platform.popular && (
              <div className="absolute top-2 left-2">
                <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                  Popular
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};