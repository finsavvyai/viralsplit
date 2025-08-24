'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Play, 
  Download, 
  Sparkles, 
  Zap, 
  Target,
  Globe,
  Palette,
  Scissors,
  TrendingUp,
  Users,
  Smile,
  Fish,
  Megaphone,
  Smartphone,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Linkedin,
  Camera,
  Clock,
  DollarSign,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Plus,
  Settings,
  Eye,
  Repeat,
  Layers
} from 'lucide-react';

interface RemixVariation {
  id: string;
  name: string;
  platform: string;
  style: string;
  duration: string;
  format: string;
  viral_score: number;
  preview_url: string;
  download_url?: string;
  tags: string[];
  trending_elements: string[];
  engagement_prediction: {
    views: string;
    likes: string;
    shares: string;
    comments: string;
  };
}

interface RemixOptions {
  variations: string[];
  platforms: string[];
  remix_count: number;
}

interface RemixResult {
  success: boolean;
  remix_results: RemixVariation[];
  total_variations: number;
  platforms_covered: string[];
  processing_time: string;
  variation_breakdown: Record<string, number>;
  viral_scores: Record<string, number>;
  trending_analysis: Record<string, any>;
  credits_used: number;
  credits_remaining: number;
  message: string;
}

interface RemixOptionsData {
  variation_types: Record<string, {
    name: string;
    description: string;
    icon: string;
    credits: number;
    processing_time: string;
    premium: boolean;
  }>;
  platforms: Record<string, {
    name: string;
    format: string;
    optimal_length: string;
    features: string[];
  }>;
}

const ContentRemixer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [remixOptions, setRemixOptions] = useState<RemixOptions>({
    variations: ['platform', 'style', 'length'],
    platforms: ['tiktok', 'instagram_reels', 'youtube_shorts'],
    remix_count: 10
  });
  const [optionsData, setOptionsData] = useState<RemixOptionsData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<RemixResult | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<RemixVariation | null>(null);
  const [creditCost, setCreditCost] = useState(30);
  const [userCredits] = useState(150); // Mock user credits
  const [activeTab, setActiveTab] = useState<'upload' | 'options' | 'results' | 'analytics'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Platform icons mapping
  const platformIcons: Record<string, React.ReactNode> = {
    tiktok: <Camera className="w-4 h-4" />,
    instagram_reels: <Instagram className="w-4 h-4" />,
    youtube_shorts: <Youtube className="w-4 h-4" />,
    twitter: <Twitter className="w-4 h-4" />,
    facebook: <Facebook className="w-4 h-4" />,
    linkedin: <Linkedin className="w-4 h-4" />,
    snapchat: <Smartphone className="w-4 h-4" />
  };

  // Variation icons mapping
  const variationIcons: Record<string, React.ReactNode> = {
    platform: <Smartphone className="w-4 h-4" />,
    style: <Palette className="w-4 h-4" />,
    length: <Scissors className="w-4 h-4" />,
    format: <Layers className="w-4 h-4" />,
    trending: <TrendingUp className="w-4 h-4" />,
    language: <Globe className="w-4 h-4" />,
    audience: <Users className="w-4 h-4" />,
    mood: <Smile className="w-4 h-4" />,
    hook: <Fish className="w-4 h-4" />,
    cta: <Megaphone className="w-4 h-4" />
  };

  // Load remix options on component mount
  React.useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await fetch('/api/remix/options', {
          headers: {
            'Authorization': `Bearer mock-token`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setOptionsData(data);
        }
      } catch (error) {
        console.error('Failed to load remix options:', error);
      }
    };
    
    loadOptions();
  }, []);

  // Calculate credit cost based on selected options
  React.useEffect(() => {
    if (!optionsData) return;
    
    const baseCost = 30;
    const variationCosts = remixOptions.variations.reduce((total, variation) => {
      return total + (optionsData.variation_types[variation]?.credits || 0);
    }, 0);
    
    const platformMultiplier = remixOptions.platforms.length;
    const countMultiplier = Math.ceil(remixOptions.remix_count / 5); // 2 credits per 5 variations
    
    const totalCost = baseCost + (variationCosts * platformMultiplier) + (countMultiplier * 2);
    setCreditCost(totalCost);
  }, [remixOptions, optionsData]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        setActiveTab('options');
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        setActiveTab('options');
      }
    }
  };

  const toggleVariation = (variation: string) => {
    setRemixOptions(prev => ({
      ...prev,
      variations: prev.variations.includes(variation)
        ? prev.variations.filter(v => v !== variation)
        : [...prev.variations, variation]
    }));
  };

  const togglePlatform = (platform: string) => {
    setRemixOptions(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    
    setPreviewMode(true);
    
    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('variation_type', remixOptions.variations[0] || 'style');
      formData.append('target_platform', remixOptions.platforms[0] || 'tiktok');
      
      const response = await fetch('/api/remix/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer mock-token`,
        },
        body: formData,
      });
      
      if (response.ok) {
        const previewData = await response.json();
        // Handle preview results
        console.log('Preview data:', previewData);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setPreviewMode(false);
    }
  };

  const handleRemixStart = async () => {
    if (!selectedFile || userCredits < creditCost) return;
    
    setProcessing(true);
    setActiveTab('results');
    
    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('variations', JSON.stringify(remixOptions.variations));
      formData.append('target_platforms', JSON.stringify(remixOptions.platforms));
      formData.append('remix_count', remixOptions.remix_count.toString());
      
      const response = await fetch('/api/remix/multiply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer mock-token`,
        },
        body: formData,
      });
      
      if (response.ok) {
        const remixData = await response.json();
        setResult(remixData);
      } else {
        const errorData = await response.json();
        setResult({
          success: false,
          remix_results: [],
          total_variations: 0,
          platforms_covered: [],
          processing_time: '0s',
          variation_breakdown: {},
          viral_scores: {},
          trending_analysis: {},
          credits_used: 0,
          credits_remaining: userCredits,
          message: errorData.detail || 'Remixing failed'
        });
      }
    } catch (error) {
      console.error('Remix failed:', error);
      setResult({
        success: false,
        remix_results: [],
        total_variations: 0,
        platforms_covered: [],
        processing_time: '0s',
        variation_breakdown: {},
        viral_scores: {},
        trending_analysis: {},
        credits_used: 0,
        credits_remaining: userCredits,
        message: 'Network error occurred'
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderUploadTab = () => (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div 
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Repeat className="w-4 h-4" />
          <span>Content Multiplier Engine</span>
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Transform 1 Video into 20+ Viral Variations</h2>
        <p className="text-gray-600 mb-8">AI-powered content multiplication across all social media platforms</p>
      </div>

      <motion.div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
          dragActive 
            ? 'border-purple-500 bg-purple-50' 
            : selectedFile 
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <motion.div 
            className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
            animate={{ rotate: selectedFile ? 0 : [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: selectedFile ? 0 : Infinity }}
          >
            {selectedFile ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : (
              <Upload className="w-8 h-8 text-white" />
            )}
          </motion.div>
          
          {selectedFile ? (
            <div>
              <p className="text-lg font-medium text-green-700 mb-2">✅ {selectedFile.name}</p>
              <p className="text-sm text-green-600">
                Size: {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
              <button
                onClick={() => setActiveTab('options')}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Configure Remix Options →
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your video here or click to upload
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports MP4, MOV, AVI • Max 500MB
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Choose Video File
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Stats Preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">20+</div>
          <div className="text-sm text-gray-600">Variations Created</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-pink-600">7</div>
          <div className="text-sm text-gray-600">Platforms Covered</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">2-5min</div>
          <div className="text-sm text-gray-600">Processing Time</div>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">95%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
      </div>
    </div>
  );

  const renderOptionsTab = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Your Content Remix</h2>
        <p className="text-gray-600">Choose variations and platforms for maximum viral potential</p>
      </div>

      {/* Variation Types */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Remix Variations</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {optionsData?.variation_types && Object.entries(optionsData.variation_types).map(([key, variation]) => (
            <motion.div
              key={key}
              className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                remixOptions.variations.includes(key)
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
              }`}
              onClick={() => toggleVariation(key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {remixOptions.variations.includes(key) && (
                <motion.div
                  className="absolute top-2 right-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </motion.div>
              )}
              
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{variation.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{variation.name}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <DollarSign className="w-3 h-3" />
                    <span>{variation.credits} credits</span>
                    {variation.premium && (
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-full text-xs">
                        Premium
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{variation.description}</p>
              <p className="text-xs text-gray-500">⏱️ {variation.processing_time}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Target Platforms */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-5 h-5 text-pink-600" />
          <h3 className="text-lg font-semibold">Target Platforms</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {optionsData?.platforms && Object.entries(optionsData.platforms).map(([key, platform]) => (
            <motion.div
              key={key}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                remixOptions.platforms.includes(key)
                  ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200'
                  : 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'
              }`}
              onClick={() => togglePlatform(key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {remixOptions.platforms.includes(key) && (
                <motion.div
                  className="absolute"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <CheckCircle className="w-5 h-5 text-pink-600" />
                </motion.div>
              )}
              
              <div className="flex items-center space-x-3 mb-2">
                {platformIcons[key]}
                <div>
                  <h4 className="font-medium text-gray-900">{platform.name}</h4>
                  <p className="text-sm text-gray-500">{platform.format}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">⏱️ {platform.optimal_length}</p>
              <div className="flex flex-wrap gap-1">
                {platform.features.slice(0, 2).map((feature, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    {feature}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Remix Count */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Number of Variations</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Count:</label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={remixOptions.remix_count}
            onChange={(e) => setRemixOptions(prev => ({ ...prev, remix_count: parseInt(e.target.value) }))}
            className="flex-1"
          />
          <span className="text-lg font-bold text-indigo-600 min-w-[3rem]">
            {remixOptions.remix_count}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          More variations = higher viral potential but more processing time
        </p>
      </div>

      {/* Credit Cost & Actions */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Processing Cost</h3>
            <p className="text-sm text-gray-600">Based on selected variations and platforms</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">{creditCost} Credits</div>
            <p className="text-sm text-gray-500">You have: {userCredits} credits</p>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handlePreview}
            disabled={!selectedFile || previewMode}
            className="flex-1 bg-white border border-purple-300 text-purple-700 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {previewMode ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Preview...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Preview (2 credits)</span>
              </div>
            )}
          </button>
          
          <button
            onClick={handleRemixStart}
            disabled={!selectedFile || userCredits < creditCost || processing}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Variations...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Start Remix Engine</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderResultsTab = () => (
    <div className="space-y-6">
      {processing ? (
        <div className="text-center py-12">
          <motion.div 
            className="inline-flex items-center space-x-3 bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-4 rounded-full mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span className="text-lg font-medium text-gray-700">Creating viral variations...</span>
          </motion.div>
          <p className="text-gray-600">This may take 2-5 minutes depending on selected options</p>
        </div>
      ) : result ? (
        <div className="space-y-6">
          {/* Results Summary */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
                <h2 className="text-xl font-bold text-gray-900">
                  {result.success ? 'Remix Complete!' : 'Remix Failed'}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Credits Used</p>
                <p className="text-lg font-bold text-purple-600">{result.credits_used}</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">{result.message}</p>
            
            {result.success && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{result.total_variations}</div>
                  <div className="text-sm text-gray-600">Total Variations</div>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">{result.platforms_covered.length}</div>
                  <div className="text-sm text-gray-600">Platforms</div>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{result.processing_time}</div>
                  <div className="text-sm text-gray-600">Processing Time</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(Object.values(result.viral_scores).reduce((a, b) => a + b, 0) / Object.values(result.viral_scores).length * 100) || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Viral Score</div>
                </div>
              </div>
            )}
          </div>

          {/* Variation Results */}
          {result.success && result.remix_results && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4">Generated Variations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.remix_results.map((variation) => (
                  <motion.div
                    key={variation.id}
                    className="border rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => setSelectedVariation(variation)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 truncate">{variation.name}</h4>
                        <span className="text-sm text-gray-500">{variation.duration}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {platformIcons[variation.platform]}
                        <span className="text-sm text-gray-600 capitalize">{variation.platform.replace('_', ' ')}</span>
                        <span className="text-sm text-purple-600 font-medium">
                          {Math.round(variation.viral_score * 100)}% viral
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {variation.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <button className="flex-1 bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700 transition-colors">
                          Preview
                        </button>
                        <button className="flex-1 border border-purple-300 text-purple-600 px-3 py-1.5 rounded text-sm hover:bg-purple-50 transition-colors">
                          Download
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No results yet. Start remixing to see your variations here.</p>
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Remix Analytics</h2>
        <p className="text-gray-600">Performance insights and viral potential analysis</p>
      </div>

      {result && result.success ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Viral Score Breakdown */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Viral Score Analysis</h3>
            <div className="space-y-4">
              {Object.entries(result.viral_scores).map(([platform, score]) => (
                <div key={platform} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {platformIcons[platform]}
                    <span className="capitalize font-medium">{platform.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{Math.round(score * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variation Breakdown */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Variation Distribution</h3>
            <div className="space-y-4">
              {Object.entries(result.variation_breakdown).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {variationIcons[type]}
                    <span className="capitalize font-medium">{type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(count / result.total_variations) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Predictions */}
          <div className="bg-white rounded-xl border p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Engagement Predictions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">125K+</div>
                <div className="text-sm text-gray-600">Predicted Views</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Users className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">8.5K+</div>
                <div className="text-sm text-gray-600">Expected Likes</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Repeat className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">2.1K+</div>
                <div className="text-sm text-gray-600">Potential Shares</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Megaphone className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">450+</div>
                <div className="text-sm text-gray-600">Comments</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Analytics will appear here after successful remixing</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border mb-8 p-2">
          <div className="flex space-x-2">
            {[
              { id: 'upload', label: 'Upload', icon: Upload },
              { id: 'options', label: 'Configure', icon: Settings },
              { id: 'results', label: 'Results', icon: Sparkles },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'upload' && renderUploadTab()}
            {activeTab === 'options' && renderOptionsTab()}
            {activeTab === 'results' && renderResultsTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
          </motion.div>
        </AnimatePresence>

        {/* Selected Variation Modal */}
        <AnimatePresence>
          {selectedVariation && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{selectedVariation.name}</h3>
                    <button
                      onClick={() => setSelectedVariation(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <Play className="w-12 h-12 text-gray-400" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Platform</p>
                        <p className="font-medium capitalize">{selectedVariation.platform.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-medium">{selectedVariation.duration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Viral Score</p>
                        <p className="font-medium text-purple-600">{Math.round(selectedVariation.viral_score * 100)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Format</p>
                        <p className="font-medium">{selectedVariation.format}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedVariation.tags.map((tag, idx) => (
                          <span key={idx} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Trending Elements</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedVariation.trending_elements.map((element, idx) => (
                          <span key={idx} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                            {element}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{selectedVariation.engagement_prediction.views}</p>
                        <p className="text-xs text-gray-600">Expected Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-600">{selectedVariation.engagement_prediction.likes}</p>
                        <p className="text-xs text-gray-600">Expected Likes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{selectedVariation.engagement_prediction.shares}</p>
                        <p className="text-xs text-gray-600">Expected Shares</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-orange-600">{selectedVariation.engagement_prediction.comments}</p>
                        <p className="text-xs text-gray-600">Expected Comments</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all">
                        Download Video
                      </button>
                      <button className="flex-1 border border-purple-300 text-purple-700 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-all">
                        Share Preview
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContentRemixer;