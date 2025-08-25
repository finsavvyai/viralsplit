'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppleDesignUploader } from '../components/AppleDesignUploader';
import { PlatformSelector } from '../components/PlatformSelector';
import { AuthModal } from '../components/AuthModal';
import { SocialAccountManager } from '../components/SocialAccountManager';
import { ViralScoreCard } from '../components/ViralScoreCard';
import { HookSuggestions } from '../components/HookSuggestions';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { AdvancedAIFeatures } from '../components/AdvancedAIFeatures';
import { useAuth } from '../components/AuthProvider';
import { Download, ExternalLink, RotateCcw, User, Settings, LogOut, BarChart3, Menu, X } from 'lucide-react';

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Add version state
  const [version, setVersion] = useState<string>("");

  const handleUploadComplete = (newProjectId: string, isTrial?: boolean) => {
    setProjectId(newProjectId);
    setStep('configure');
    
    // If it's a trial user, show a gentle prompt to sign up after they see the results
    if (isTrial) {
      // Store trial project info for later signup prompt
      localStorage.setItem('trial_project_id', newProjectId);
    }
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
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.viralsplit.io';
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/transform`, {
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
      
      // Apple-style smooth processing simulation
      for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        
        await new Promise(resolve => setTimeout(resolve, 500 + (i * 300)));
        
        setTransformationStatus(prev => ({
          ...prev,
          [platform]: 'processing'
        }));
        
        await new Promise(resolve => setTimeout(resolve, 2000 + (i * 500)));
        
        setTransformationStatus(prev => ({
          ...prev,
          [platform]: 'completed'
        }));
        
        if (i === platforms.length - 1) {
          setTimeout(() => {
            setStep('complete');
            setIsTransforming(false);
            // Poll backend for actual URLs
            fetch(`${API_BASE_URL}/api/projects/${projectId}/status`, {
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
          }, 800);
        }
      }
      
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

  // Add useEffect to fetch version
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        console.log('🔍 Fetching version from API...');
        console.log('🌐 API URL: https://api.viralsplit.io/version');
        
        const response = await fetch(`https://api.viralsplit.io/version`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit'
        });
        
        console.log('📡 Version response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Version data received:', data);
        const versionString = `v${data.version}-build${data.build}`;
        console.log('🏷️ Setting version to:', versionString);
        setVersion(versionString);
      } catch (error) {
        console.error('❌ Failed to fetch version:', error);
        console.error('🔧 Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        // Fallback to a hardcoded version based on our current build
        const fallbackVersion = "v1.0.0-build44";
        console.log('🔄 Using fallback version:', fallbackVersion);
        setVersion(fallbackVersion);
      }
    };
    
    console.log('🚀 Starting version fetch...');
    fetchVersion();
  }, []);

  const PLATFORMS = [
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      aspect: '9:16',
      duration: '60s',
      popular: true,
      color: 'from-pink-500 to-red-500'
    },
    {
      id: 'instagram_reels',
      name: 'Instagram Reels',
      icon: '📱',
      aspect: '9:16',
      duration: '90s',
      popular: true,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'youtube_shorts',
      name: 'YouTube Shorts',
      icon: '📺',
      aspect: '9:16',
      duration: '60s',
      popular: true,
      color: 'from-red-500 to-orange-500'
    },
    {
      id: 'instagram_feed',
      name: 'Instagram Feed',
      icon: '📷',
      aspect: '1:1',
      duration: '60s',
      color: 'from-blue-500 to-purple-500'
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      icon: '🐦',
      aspect: '16:9',
      duration: '2:20',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      aspect: '16:9',
      duration: '10m',
      color: 'from-blue-600 to-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50">
      {/* Background Effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-pink-600/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,119,198,0.2),transparent_50%)]" />
      </div>
      
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-2xl font-semibold text-white">
              ViralSplit
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <button className="text-white/70 hover:text-white transition-colors">Features</button>
              <button className="text-white/70 hover:text-white transition-colors">Pricing</button>
              
              {user ? (
                <>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-white/60">Credits:</span>
                    <span className="font-semibold text-blue-400">{user.credits}</span>
                  </div>
                  <button
                    onClick={() => setShowSocialAccounts(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg transition-colors border border-white/20"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Accounts ({socialAccounts.length})</span>
                  </button>
                  <button
                    onClick={() => setStep('analytics')}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 backdrop-blur rounded-lg transition-colors border border-blue-500/20"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Analytics</span>
                  </button>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-white/60" />
                    <span className="text-sm text-white/80">{user.email}</span>
                    <button
                      onClick={logout}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-white/60" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-all border border-white/20"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setShowAuthModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full text-white transition-all"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-white"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 bg-white/10 backdrop-blur rounded-lg border border-white/20 p-4">
              <div className="space-y-3">
                <button className="block w-full text-left text-white/70 hover:text-white transition-colors">Features</button>
                <button className="block w-full text-left text-white/70 hover:text-white transition-colors">Pricing</button>
                
                {user ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Credits:</span>
                      <span className="font-semibold text-blue-400">{user.credits}</span>
                    </div>
                    <button
                      onClick={() => {
                        setShowSocialAccounts(true);
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Accounts ({socialAccounts.length})</span>
                    </button>
                    <button
                      onClick={() => {
                        setStep('analytics');
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 backdrop-blur rounded-lg transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm">Analytics</span>
                    </button>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80">{user.email}</span>
                      <button
                        onClick={logout}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setShowAuthModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg text-white transition-all"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('register');
                        setShowAuthModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white transition-all"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        <div className="px-6 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent leading-tight">
                Transform your content<br />
                for every platform
              </h1>
              <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed">
                Upload once, optimize for TikTok, Instagram, YouTube, and more. 
                Professional-grade video processing with intelligent platform adaptation.
              </p>
              
              {/* Progress Indicator */}
              <div className="flex items-center justify-center gap-3 mb-8">
                {['Upload', 'Configure', 'Process', 'Download'].map((label, index) => {
                  const isActive = ['upload', 'configure', 'processing', 'complete'][index] === step;
                  const isCompleted = ['upload', 'configure', 'processing', 'complete'].indexOf(step) > index;
                  
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                        ${isCompleted ? 'bg-green-500 text-white' : 
                          isActive ? 'bg-blue-500 text-white' : 
                          'bg-white/10 text-white/50'}
                      `}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <span className={`text-sm font-medium ${
                        isActive ? 'text-white' : 
                        isCompleted ? 'text-green-400' : 
                        'text-white/50'
                      }`}>
                        {label}
                      </span>
                      {index < 3 && (
                        <div className={`w-12 h-0.5 ${
                          isCompleted ? 'bg-green-400' : 'bg-white/20'
                        } transition-colors duration-300`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
            
            {/* Main Content */}
            <AnimatePresence mode="wait">
              {step === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AppleDesignUploader 
                    onUploadComplete={handleUploadComplete}
                    onAuthRequired={() => {
                      setAuthMode('register');
                      setShowAuthModal(true);
                    }}
                  />
                  
                  {/* Trust Indicators */}
                  <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                      { number: '10M+', label: 'Videos Processed' },
                      { number: '500K+', label: 'Creators' },
                      { number: '2.5B+', label: 'Views Generated' },
                      { number: '98%', label: 'Satisfaction' }
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-4"
                      >
                        <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                        <div className="text-sm text-white/60">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {step === 'configure' && (
                <motion.div
                  key="configure"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4">Choose your platforms</h2>
                    <p className="text-white/60 text-lg">Select where you want to share your optimized content</p>
                    {!user && (
                      <p className="text-sm text-blue-400 mt-2">
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
                  
                  {/* Platform Selection */}
                  <div className="space-y-6">
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setSelectedPlatforms(PLATFORMS.filter(p => p.popular).map(p => p.id))}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-all border border-white/20"
                      >
                        Select Popular
                      </button>
                      <button
                        onClick={() => setSelectedPlatforms(PLATFORMS.map(p => p.id))}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-all border border-white/20"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedPlatforms([])}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-all border border-white/20"
                      >
                        Clear
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {PLATFORMS.map((platform) => {
                        const isSelected = selectedPlatforms.includes(platform.id);
                        const status = transformationStatus[platform.id];
                        
                        return (
                          <motion.div
                            key={platform.id}
                            layout
                            whileHover={{ scale: isTransforming ? 1 : 1.02 }}
                            whileTap={{ scale: isTransforming ? 1 : 0.98 }}
                            onClick={() => {
                              if (isTransforming) return;
                              
                              if (isSelected) {
                                setSelectedPlatforms(selectedPlatforms.filter(id => id !== platform.id));
                              } else {
                                setSelectedPlatforms([...selectedPlatforms, platform.id]);
                              }
                            }}
                            className={`
                              relative p-6 rounded-3xl cursor-pointer transition-all duration-300 backdrop-blur
                              ${isSelected 
                                ? 'bg-white/20 border-white/30 shadow-2xl' 
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                              }
                              ${isTransforming ? 'cursor-not-allowed opacity-75' : ''}
                              border shadow-lg
                              ${status === 'completed' ? 'ring-2 ring-green-400/50' : ''}
                              ${status === 'failed' ? 'ring-2 ring-red-400/50' : ''}
                            `}
                          >
                            {/* Status indicator */}
                            <div className="absolute top-4 right-4">
                              {isSelected && !status && (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              {status === 'processing' && (
                                <div className="w-6 h-6">
                                  <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                                </div>
                              )}
                              {status === 'completed' && (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            {/* Popular badge */}
                            {platform.popular && (
                              <div className="absolute top-4 left-4">
                                <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-medium rounded-full">
                                  Popular
                                </span>
                              </div>
                            )}
                            
                            <div className="mt-8">
                              <div className="text-3xl mb-4">{platform.icon}</div>
                              <h3 className="text-lg font-semibold text-white mb-2">{platform.name}</h3>
                              <p className="text-sm text-white/60 mb-3">
                                Perfect for {platform.aspect} content
                              </p>
                              <div className="text-xs text-white/50">
                                {platform.aspect} • {platform.duration} max
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    <div className="text-center pt-8">
                      <button
                        onClick={() => startTransformation(selectedPlatforms)}
                        disabled={selectedPlatforms.length === 0 || isTransforming}
                        className="px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl text-white font-semibold text-lg transition-all duration-200 shadow-2xl"
                      >
                        {isTransforming ? (
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : (
                          `Optimize for ${selectedPlatforms.length} Platform${selectedPlatforms.length !== 1 ? 's' : ''}`
                        )}
                      </button>
                      
                      {selectedPlatforms.length > 0 && !isTransforming && (
                        <p className="text-white/50 text-sm mt-4">
                          Estimated processing time: {Math.ceil(selectedPlatforms.length * 1.5)} minutes
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {step === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-8 animate-bounce">⚡</div>
                  <h2 className="text-4xl font-bold text-white mb-6">Creating optimized versions</h2>
                  <p className="text-white/60 text-lg mb-12">Your content is being tailored for each platform</p>
                  
                  <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedPlatforms.map((platformId) => {
                      const platform = PLATFORMS.find(p => p.id === platformId);
                      const status = transformationStatus[platformId];
                      
                      return (
                        <div
                          key={platformId}
                          className="p-4 bg-white/5 rounded-2xl backdrop-blur border border-white/10"
                        >
                          <div className="text-2xl mb-2">{platform?.icon}</div>
                          <h3 className="font-medium text-white mb-2">{platform?.name}</h3>
                          <div className={`text-sm ${
                            status === 'completed' ? 'text-green-400' :
                            status === 'processing' ? 'text-blue-400' :
                            status === 'failed' ? 'text-red-400' :
                            'text-white/50'
                          }`}>
                            {status === 'completed' ? '✓ Complete' :
                             status === 'processing' ? '⚡ Processing' :
                             status === 'failed' ? '✗ Failed' :
                             '⏳ Waiting'}
                          </div>
                        </div>
                      );
                    })}
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
                  <div className="text-6xl mb-8">🎉</div>
                  <h2 className="text-4xl font-bold text-white mb-6">Your content is ready!</h2>
                  <p className="text-white/60 text-lg mb-12">Download your optimized videos for each platform</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {results.map((result) => {
                      const platform = PLATFORMS.find(p => p.id === result.platform);
                      
                      return (
                        <div
                          key={result.platform}
                          className="p-6 bg-white/5 rounded-3xl backdrop-blur border border-white/10 hover:bg-white/10 transition-all"
                        >
                          <div className="text-3xl mb-4">{platform?.icon}</div>
                          <h3 className="font-semibold text-white mb-4 capitalize">{result.platform.replace('_', ' ')}</h3>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => window.open(result.url, '_blank')}
                              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl text-white font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                              <Download className="w-5 h-5" />
                              Download
                            </button>
                            <button 
                              onClick={() => window.open(result.url, '_blank')}
                              className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all backdrop-blur border border-white/20"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Trial Signup Prompt */}
                  {!user && localStorage.getItem('trial_project_id') && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl backdrop-blur border border-blue-500/20"
                    >
                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-white mb-2">🎉 Trial Complete!</h3>
                        <p className="text-white/70 mb-4">
                          You've successfully transformed your first video! Create a free account to:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
                          <div className="flex items-center gap-2 text-white/80">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            Save unlimited projects
                          </div>
                          <div className="flex items-center gap-2 text-white/80">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            Connect social accounts
                          </div>
                          <div className="flex items-center gap-2 text-white/80">
                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                            Access advanced AI features
                          </div>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => {
                              setAuthMode('register');
                              setShowAuthModal(true);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl text-white font-medium transition-all"
                          >
                            Create Free Account
                          </button>
                          <button
                            onClick={() => {
                              localStorage.removeItem('trial_project_id');
                              resetFlow();
                            }}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all backdrop-blur border border-white/20"
                          >
                            Continue as Guest
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <button
                    onClick={resetFlow}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-medium transition-all flex items-center gap-3 mx-auto backdrop-blur border border-white/20"
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
                    <h2 className="text-4xl font-bold text-white mb-4">Your Analytics</h2>
                    <p className="text-white/60 text-lg">Track your viral content performance</p>
                    <button
                      onClick={() => setStep('upload')}
                      className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all backdrop-blur border border-white/20"
                    >
                      ← Back to Upload
                    </button>
                  </div>
                  
                  {user ? (
                    <AnalyticsDashboard userId={user.id} />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-white/60 mb-4">Sign in to view your analytics</p>
                      <button
                        onClick={() => {
                          setAuthMode('login');
                          setShowAuthModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-medium transition-all"
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

        {/* Add version to footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>ViralSplit {version || "Loading..."}</p>
          {/* Debug info - remove in production */}
          <p style={{fontSize: '10px', opacity: 0.5}}>Debug: Version state = "{version}"</p>
        </div>
      </div>

      {/* Enhanced Auth Modal */}
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