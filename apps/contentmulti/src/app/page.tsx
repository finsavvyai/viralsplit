'use client';

import { useState } from 'react';

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  
  const startDemo = () => {
    setShowDemo(true);
    // Simulate demo flow
    setTimeout(() => {
      alert('Demo: Video uploaded and processing started for LinkedIn, Twitter, and YouTube!');
    }, 1000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              ContentMulti
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Professional multi-platform content optimization
          </p>
          <p className="text-gray-400">
            Scale your brand across all social platforms with enterprise-grade tools
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-colors">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Brand Consistency</h3>
            <p className="text-gray-400">Maintain your brand identity across every platform with automated guidelines and templates</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-colors">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-gray-400">Track performance metrics and ROI across all your content channels in real-time</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-blue-500/50 transition-colors">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Batch Processing</h3>
            <p className="text-gray-400">Process hundreds of videos simultaneously with enterprise-grade infrastructure</p>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-700">
            <div className="relative border-2 border-dashed rounded-xl p-12 border-slate-600 cursor-pointer transition-all duration-200 hover:border-blue-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-xl mb-2">
                  Upload your content for optimization
                </p>
                <p className="text-sm text-gray-400">Enterprise-grade processing for professional teams</p>
                <p className="text-xs text-gray-500 mt-4">
                  Supports bulk uploads • SOC 2 compliant • 99.9% uptime SLA
                </p>
                
                {showDemo && (
                  <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      🎉 Demo active! Your content is being optimized for professional platforms...
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              <button 
                onClick={startDemo}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-medium hover:opacity-90 transition"
              >
                {showDemo ? 'Demo Running...' : 'Start Free Trial'}
              </button>
              <button className="px-8 py-3 border border-slate-600 rounded-lg font-medium hover:border-slate-500 transition">
                Book Demo
              </button>
            </div>
            
            {/* Enterprise Features */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="flex items-center gap-3 text-gray-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>White-label solutions available</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Advanced team collaboration</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Custom API integration</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span>Priority support & training</span>
              </div>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="mt-16 grid md:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-blue-400">99.9%</div>
              <div className="text-sm text-gray-400">Uptime SLA</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-cyan-400">50M+</div>
              <div className="text-sm text-gray-400">Assets Processed</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-blue-400">10K+</div>
              <div className="text-sm text-gray-400">Enterprise Users</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-cyan-400">24/7</div>
              <div className="text-sm text-gray-400">Premium Support</div>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500 mb-4">Trusted by leading brands worldwide</p>
            <div className="flex justify-center items-center gap-8 text-gray-600">
              <span className="text-2xl font-bold">ACME</span>
              <span className="text-2xl font-bold">TechCorp</span>
              <span className="text-2xl font-bold">GlobalBrand</span>
              <span className="text-2xl font-bold">MediaCo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
