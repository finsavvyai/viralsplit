'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoUploader } from '../components/VideoUploader';
import { PlatformSelector } from '../components/PlatformSelector';
import { Download, ExternalLink, RotateCcw } from 'lucide-react';

interface TransformationResult {
  platform: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  thumbnail?: string;
}

export default function Home() {
  const [step, setStep] = useState<'upload' | 'configure' | 'processing' | 'complete'>('upload');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [transformationStatus, setTransformationStatus] = useState<Record<string, 'pending' | 'processing' | 'completed' | 'failed'>>({});
  const [results, setResults] = useState<TransformationResult[]>([]);
  const [isTransforming, setIsTransforming] = useState(false);
  
  const handleUploadComplete = (newProjectId: string) => {
    setProjectId(newProjectId);
    setStep('configure');
  };
  
  const startTransformation = async (platforms: string[]) => {
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
        headers: { 'Content-Type': 'application/json' },
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
                setResults(platforms.map(p => ({
                  platform: p,
                  status: 'completed' as const,
                  url: `https://cdn.viralsplit.io/outputs/${p}/video.mp4`,
                  thumbnail: `https://cdn.viralsplit.io/thumbnails/${p}/thumb.jpg`
                })));
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
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Split Your Content
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-2">
            Go viral on every platform with one upload
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className={`w-2 h-2 rounded-full ${step === 'upload' ? 'bg-purple-400' : 'bg-gray-600'}`} />
            <span className={`w-2 h-2 rounded-full ${step === 'configure' ? 'bg-purple-400' : 'bg-gray-600'}`} />
            <span className={`w-2 h-2 rounded-full ${step === 'processing' ? 'bg-purple-400' : 'bg-gray-600'}`} />
            <span className={`w-2 h-2 rounded-full ${step === 'complete' ? 'bg-green-400' : 'bg-gray-600'}`} />
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
                <VideoUploader onUploadComplete={handleUploadComplete} />
                
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
                  <h2 className="text-3xl font-bold mb-2">Choose Your Platforms</h2>
                  <p className="text-gray-400">Select where you want to go viral</p>
                </div>
                
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
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}