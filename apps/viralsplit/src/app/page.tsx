'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  const [step, setStep] = useState<'upload' | 'configure' | 'processing' | 'complete'>('upload');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  const handleUpload = async (file: File) => {
    setStep('configure');
    // Project ID is already set from upload response
  };
  
  const startTransformation = async () => {
    setStep('processing');
    
    // TODO: Implement actual API call
    const response = await fetch(`/api/projects/${projectId}/transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platforms: selectedPlatforms })
    });
    
    // Poll for completion
    // pollForCompletion(projectId);
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Split Your Content
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Go viral on every platform with one upload
          </p>
        </motion.div>
        
        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {step === 'upload' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="relative border-2 border-dashed rounded-xl p-12 border-gray-600 cursor-pointer transition-all duration-200 hover:border-white">
                <div className="text-center">
                  <div className="text-6xl mb-4">📹</div>
                  <p className="text-xl mb-2">
                    Drag & drop your video
                  </p>
                  <p className="text-sm text-gray-400">or click to browse</p>
                  <p className="text-xs text-gray-500 mt-4">
                    MP4, MOV, AVI, WEBM • Max 500MB
                  </p>
                </div>
              </div>
              
              {/* Social Proof */}
              <div className="mt-8 flex items-center justify-center gap-8 text-gray-400">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10M+</div>
                  <div className="text-sm">Videos Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">500K+</div>
                  <div className="text-sm">Creators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">2.5B+</div>
                  <div className="text-sm">Views Generated</div>
                </div>
              </div>
            </motion.div>
          )}
          
          {step === 'configure' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-bold">Choose Your Platforms</h2>
              
              {/* Platform Selection */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { id: 'tiktok', name: 'TikTok', icon: '🎵', aspect: '9:16', duration: '60s', popular: true },
                  { id: 'instagram_reels', name: 'Instagram Reels', icon: '📱', aspect: '9:16', duration: '90s', popular: true },
                  { id: 'youtube_shorts', name: 'YouTube Shorts', icon: '📺', aspect: '9:16', duration: '60s', popular: true },
                ].map(platform => (
                  <div
                    key={platform.id}
                    onClick={() => {
                      if (selectedPlatforms.includes(platform.id)) {
                        setSelectedPlatforms(selectedPlatforms.filter(id => id !== platform.id));
                      } else {
                        setSelectedPlatforms([...selectedPlatforms, platform.id]);
                      }
                    }}
                    className={`
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${selectedPlatforms.includes(platform.id) 
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="text-2xl mb-2">{platform.icon}</div>
                    <div className="font-semibold">{platform.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {platform.aspect} • {platform.duration}
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={startTransformation}
                disabled={selectedPlatforms.length === 0}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
              >
                Transform My Video ({selectedPlatforms.length} platforms)
              </button>
            </motion.div>
          )}
          
          {step === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">⚡</div>
              <h2 className="text-3xl font-bold mb-4">Creating Magic...</h2>
              <p className="text-gray-400">Your video is being optimized for each platform</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-8">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full animate-pulse" style={{ width: '45%' }} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
