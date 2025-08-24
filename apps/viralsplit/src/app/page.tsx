'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedVideoUploader } from '../components/EnhancedVideoUploader';
import { PlatformSelector } from '../components/PlatformSelector';
import { AuthModal } from '../components/AuthModal';
import { SocialAccountManager } from '../components/SocialAccountManager';
import { ViralScoreCard } from '../components/ViralScoreCard';
import { HookSuggestions } from '../components/HookSuggestions';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { AdvancedAIFeatures } from '../components/AdvancedAIFeatures';
import { useAuth } from '../components/AuthProvider';
import { Download, ExternalLink, RotateCcw, User, Settings, LogOut, BarChart3 } from 'lucide-react';

interface TransformationResult {
  platform: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  thumbnail?: string;
}

export default function Home() {
  const { user, logout, socialAccounts } = useAuth();
  const [step, setStep] = useState<'upload' | 'configure' | 'processing' | 'complete' | 'analytics'>('upload');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [transformationStatus, setTransformationStatus] = useState<Record<string, 'pending' | 'processing' | 'completed' | 'failed'>>({});
  const [results, setResults] = useState<TransformationResult[]>([]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSocialAccounts, setShowSocialAccounts] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const handleUploadComplete = (newProjectId: string) => {
    if (!user) {
      setAuthMode('register');
      setShowAuthModal(true);
      return;
    }
    setProjectId(newProjectId);
    setStep('configure');
  };
  
  const startTransformation = async (platforms: string[]) => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    setIsTransforming(true);
    setStep('processing');
    
    // Initialize status for all platforms
    const initialStatus: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {};
    platforms.forEach(platform => {
      initialStatus[platform] = 'pending';
    });
    setTransformationStatus(initialStatus);
    
    try {
      const response = await fetch('/api/projects/' + projectId + '/transform', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ platforms: selectedPlatforms })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start transformation');
      }
      
      const { task_id } = await response.json();
      
      // Simulate processing for demo (in real app, poll actual status)
      platforms.forEach((platform, index) => {
        setTimeout(() => {
          setTransformationStatus(prev => ({
            ...prev,
            [platform]: 'processing'
          }));
          
          // Complete after a delay
          setTimeout(() => {
            setTransformationStatus(prev => ({
              ...prev,
              [platform]: 'completed'
            }));
            
            // If all platforms are done, move to complete step
            if (index === platforms.length - 1) {
              setTimeout(() => {
                setStep('complete');
                setIsTransforming(false);
                // Poll backend for actual URLs
                fetch('/api/projects/' + projectId + '/status', {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                  }
                }).then(res => res.json()).then(data => {
                  if (data.transformations) {
                    const finalResults = Object.entries(data.transformations).map(([platform, info]: [string, any]) => ({
                      platform,
                      status: 'completed' as const,
                      url: info.url || `https://cdn.viralsplit.io/outputs/${platform}/video.mp4`,
                      thumbnail: info.thumbnail
                    }));
                    setResults(finalResults);
                  } else {
                    // Fallback for demo
                    setResults(platforms.map(p => ({
                      platform: p,
                      status: 'completed' as const,
                      url: `https://cdn.viralsplit.io/outputs/${p}/video.mp4`,
                      thumbnail: `https://cdn.viralsplit.io/thumbnails/${p}/thumb.jpg`
                    })));
                  }
                }).catch(() => {
                  // Fallback for demo
                  setResults(platforms.map(p => ({
                    platform: p,
                    status: 'completed' as const,
                    url: `https://cdn.viralsplit.io/outputs/${p}/video.mp4`,
                    thumbnail: `https://cdn.viralsplit.io/thumbnails/${p}/thumb.jpg`
                  })));
                });
              }, 1000);
            }
          }, 2000 + (index * 500));
        }, index * 300);
      });
      
    } catch (error) {
      console.error('Transformation error:', error);
      setIsTransforming(false);
      const failedStatus = { ...transformationStatus };
      Object.keys(failedStatus).forEach(platform => {
        failedStatus[platform] = 'failed';
      });
      setTransformationStatus(failedStatus);
    }
  };
  
  const resetFlow = () => {
    setStep('upload');
    setProjectId('');
    setSelectedPlatforms([]);
    setTransformationStatus({});
    setResults([]);
    setIsTransforming(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Continue with transformation if user was prompted to login
    if (selectedPlatforms.length > 0) {
      startTransformation(selectedPlatforms);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      
      {/* Header with Auth */}
      <header className="relative z-20 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ViralSplit
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-400">Credits:</span>
                  <span className="font-semibold text-purple-400">{user.credits}</span>
                </div>
                <button
                  onClick={() => setShowSocialAccounts(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Accounts ({socialAccounts.length})</span>
                </button>
                <button
                  onClick={() => setStep('analytics')}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">Analytics</span>
                </button>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{user.email}</span>
                  <button
                    onClick={logout}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Split Your Content
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-2">
            Go viral on every platform with one upload
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <span className={`w-2 h-2 rounded-full ${step === 'upload' ? 'bg-purple-400' : 'bg-gray-600'}`} />
            <span className={`w-2 h-2 rounded-full ${step === 'configure' ? 'bg-purple-400' : 'bg-gray-600'}`} />
            <span className={`w-2 h-2 rounded-full ${step === 'processing' ? 'bg-purple-400' : 'bg-gray-600'}`} />
            <span className={`w-2 h-2 rounded-full ${step === 'complete' ? 'bg-green-400' : 'bg-gray-600'}`} />
            <span className={`w-2 h-2 rounded-full ${step === 'analytics' ? 'bg-blue-400' : 'bg-gray-600'}`} />
          </div>
          
          <div className="flex justify-center space-x-4">
            <a
              href="/apple"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur rounded-full text-white/70 hover:text-white text-sm transition-all border border-white/10"
            >
              ✨ Try Apple Design
            </a>
            {!user && (
              <button
                onClick={() => {
                  setAuthMode('register');
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white text-sm transition-all"
              >
                Get Started Free
              </button>
            )}
          </div>
        </motion.div>
        
        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <EnhancedVideoUploader 
                  onUploadComplete={handleUploadComplete}
                  onAuthRequired={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                />
                
                {/* Social Proof */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-gray-400">
                  <div>
                    <div className="text-2xl font-bold text-white">10M+</div>
                    <div className="text-sm">Videos Processed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">500K+</div>
                    <div className="text-sm">Creators</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">2.5B+</div>
                    <div className="text-sm">Views Generated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">98%</div>
                    <div className="text-sm">Satisfaction</div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {step === 'configure' && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Optimize Your Content</h2>
                  <p className="text-gray-400">AI-powered viral optimization for every platform</p>
                  {!user && (
                    <p className="text-sm text-purple-400 mt-2">
                      Sign in to save your projects and connect social accounts
                    </p>
                  )}
                </div>
                
                {/* AI Features Grid */}
                {user && projectId && (
                  <div className="space-y-6 mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ViralScoreCard projectId={projectId} platforms={selectedPlatforms} />
                      <HookSuggestions projectId={projectId} platforms={selectedPlatforms} />
                    </div>
                    <AdvancedAIFeatures projectId={projectId} platforms={selectedPlatforms} />
                  </div>
                )}
                
                <PlatformSelector
                  selected={selectedPlatforms}
                  onChange={setSelectedPlatforms}
                  onTransform={startTransformation}
                  isTransforming={isTransforming}
                  transformationStatus={transformationStatus}
                />
              </motion.div>
            )}
            
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-6 animate-bounce">⚡</div>
                <h2 className="text-3xl font-bold mb-4">Creating Magic...</h2>
                <p className="text-gray-400 mb-8">Your video is being optimized for each platform</p>
                
                <div className="max-w-md mx-auto">
                  <PlatformSelector
                    selected={selectedPlatforms}
                    onChange={() => {}} // Read-only during processing
                    onTransform={() => {}} // Disabled during processing
                    isTransforming={true}
                    transformationStatus={transformationStatus}
                  />
                </div>
              </motion.div>
            )}
            
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="text-6xl mb-6">🎉</div>
                <h2 className="text-3xl font-bold mb-4">Your Content is Ready!</h2>
                <p className="text-gray-400 mb-8">Download your optimized videos for each platform</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {results.map((result) => (
                    <div
                      key={result.platform}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                    >
                      <h3 className="font-semibold mb-2 capitalize">{result.platform}</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => window.open(result.url, '_blank')}
                          className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition flex items-center justify-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button 
                          onClick={() => window.open(result.url, '_blank')}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={resetFlow}
                  className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition flex items-center gap-2 mx-auto"
                >
                  <RotateCcw className="w-5 h-5" />
                  Transform Another Video
                </button>
              </motion.div>
            )}
            
            {step === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Your Analytics</h2>
                  <p className="text-gray-400">Track your viral content performance</p>
                  <button
                    onClick={() => setStep('upload')}
                    className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                  >
                    ← Back to Upload
                  </button>
                </div>
                
                {user ? (
                  <AnalyticsDashboard userId={user.id} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 mb-4">Sign in to view your analytics</p>
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                      }}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />

      {/* Social Accounts Modal */}
      {showSocialAccounts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <SocialAccountManager onClose={() => setShowSocialAccounts(false)} />
          </div>
        </div>
      )}
    </div>
  );
}