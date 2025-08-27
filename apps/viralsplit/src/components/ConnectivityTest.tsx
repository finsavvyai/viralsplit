'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConnectivityStatus {
  api: 'testing' | 'success' | 'error';
  websocket: 'testing' | 'success' | 'error';
  cdn: 'testing' | 'success' | 'error';
  dns: 'testing' | 'success' | 'error';
}

interface TestResult {
  status: 'success' | 'error';
  message: string;
  latency?: number;
  details?: any;
}

export const ConnectivityTest: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<ConnectivityStatus>({
    api: 'testing',
    websocket: 'testing',
    cdn: 'testing',
    dns: 'testing'
  });
  const [results, setResults] = useState<Record<keyof ConnectivityStatus, TestResult>>({
    api: { status: 'success', message: 'Not tested' },
    websocket: { status: 'success', message: 'Not tested' },
    cdn: { status: 'success', message: 'Not tested' },
    dns: { status: 'success', message: 'Not tested' }
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.viralsplit.io';
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.viralsplit.io';
  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.viralsplit.io';

  const testAPI = async (): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          status: 'success',
          message: `API is responding (${response.status})`,
          latency,
          details: data
        };
      } else {
        return {
          status: 'error',
          message: `API returned ${response.status}: ${response.statusText}`,
          latency
        };
      }
    } catch (error: any) {
      const latency = Date.now() - startTime;
      return {
        status: 'error',
        message: error.name === 'TimeoutError' ? 'API timeout' : `API error: ${error.message}`,
        latency
      };
    }
  };

  const testWebSocket = async (): Promise<TestResult> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const timeout = setTimeout(() => {
        resolve({
          status: 'error',
          message: 'WebSocket connection timeout',
          latency: Date.now() - startTime
        });
      }, 10000);

      try {
        const ws = new WebSocket(`${WS_URL}/ws`);
        
        ws.onopen = () => {
          const latency = Date.now() - startTime;
          clearTimeout(timeout);
          ws.close();
          resolve({
            status: 'success',
            message: 'WebSocket connected successfully',
            latency
          });
        };

        ws.onerror = (error) => {
          const latency = Date.now() - startTime;
          clearTimeout(timeout);
          resolve({
            status: 'error',
            message: 'WebSocket connection failed',
            latency
          });
        };

        ws.onclose = (event) => {
          if (event.code !== 1000) { // Not a normal close
            const latency = Date.now() - startTime;
            clearTimeout(timeout);
            resolve({
              status: 'error',
              message: `WebSocket closed with code ${event.code}`,
              latency
            });
          }
        };
      } catch (error: any) {
        const latency = Date.now() - startTime;
        clearTimeout(timeout);
        resolve({
          status: 'error',
          message: `WebSocket error: ${error.message}`,
          latency
        });
      }
    });
  };

  const testCDN = async (): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      // Test CDN by fetching a small test file
      const response = await fetch(`${CDN_URL}/test.json`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          status: 'success',
          message: 'CDN is accessible',
          latency,
          details: {
            headers: Object.fromEntries(response.headers.entries())
          }
        };
      } else {
        return {
          status: 'error',
          message: `CDN returned ${response.status}`,
          latency
        };
      }
    } catch (error: any) {
      const latency = Date.now() - startTime;
      return {
        status: 'error',
        message: error.name === 'TimeoutError' ? 'CDN timeout' : `CDN error: ${error.message}`,
        latency
      };
    }
  };

  const testDNS = async (): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      // Test DNS resolution by checking multiple endpoints
      const domains = [
        new URL(API_URL).hostname,
        new URL(WS_URL).hostname,
        new URL(CDN_URL).hostname
      ];

      const results = await Promise.all(
        domains.map(async (domain) => {
          try {
            const response = await fetch(`https://${domain}`, {
              method: 'HEAD',
              signal: AbortSignal.timeout(5000)
            });
            return { domain, success: true };
          } catch {
            return { domain, success: false };
          }
        })
      );

      const latency = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;

      if (successCount === domains.length) {
        return {
          status: 'success',
          message: 'All DNS lookups successful',
          latency,
          details: results
        };
      } else {
        return {
          status: 'error',
          message: `${domains.length - successCount} DNS lookups failed`,
          latency,
          details: results
        };
      }
    } catch (error: any) {
      const latency = Date.now() - startTime;
      return {
        status: 'error',
        message: `DNS test error: ${error.message}`,
        latency
      };
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setStatus({
      api: 'testing',
      websocket: 'testing',
      cdn: 'testing',
      dns: 'testing'
    });

    // Run tests concurrently for better performance
    const testPromises = [
      { key: 'api' as const, test: testAPI },
      { key: 'websocket' as const, test: testWebSocket },
      { key: 'cdn' as const, test: testCDN },
      { key: 'dns' as const, test: testDNS }
    ];

    // Update status as each test completes
    const testResults: Record<string, TestResult> = {};
    
    await Promise.allSettled(
      testPromises.map(async ({ key, test }) => {
        try {
          const result = await test();
          testResults[key] = result;
          setStatus(prev => ({ ...prev, [key]: result.status }));
          setResults(prev => ({ ...prev, [key]: result }));
        } catch (error: any) {
          const result: TestResult = {
            status: 'error',
            message: `Test failed: ${error.message}`
          };
          testResults[key] = result;
          setStatus(prev => ({ ...prev, [key]: 'error' }));
          setResults(prev => ({ ...prev, [key]: result }));
        }
      })
    );

    setTesting(false);
  };

  const getStatusIcon = (testStatus: 'testing' | 'success' | 'error') => {
    switch (testStatus) {
      case 'testing':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getOverallStatus = () => {
    const statuses = Object.values(status);
    if (statuses.some(s => s === 'testing')) return 'testing';
    if (statuses.every(s => s === 'success')) return 'success';
    return 'error';
  };

  return (
    <>
      {/* Floating Test Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Test Connectivity"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </motion.button>

      {/* Connectivity Test Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-white p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Connectivity Test</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Test your connection to ViralSplit services</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Test Items */}
                <div className="space-y-4">
                  {/* API Test */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(status.api)}
                      <div>
                        <div className="font-medium text-gray-900">API Connection</div>
                        <div className="text-sm text-gray-500">{results.api.message}</div>
                        {results.api.latency && (
                          <div className="text-xs text-gray-400">{results.api.latency}ms</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* WebSocket Test */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(status.websocket)}
                      <div>
                        <div className="font-medium text-gray-900">WebSocket Connection</div>
                        <div className="text-sm text-gray-500">{results.websocket.message}</div>
                        {results.websocket.latency && (
                          <div className="text-xs text-gray-400">{results.websocket.latency}ms</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CDN Test */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(status.cdn)}
                      <div>
                        <div className="font-medium text-gray-900">CDN/Storage Access</div>
                        <div className="text-sm text-gray-500">{results.cdn.message}</div>
                        {results.cdn.latency && (
                          <div className="text-xs text-gray-400">{results.cdn.latency}ms</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DNS Test */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(status.dns)}
                      <div>
                        <div className="font-medium text-gray-900">DNS Resolution</div>
                        <div className="text-sm text-gray-500">{results.dns.message}</div>
                        {results.dns.latency && (
                          <div className="text-xs text-gray-400">{results.dns.latency}ms</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overall Status */}
                <div className="mt-6 p-4 rounded-xl bg-gray-100">
                  <div className="flex items-center justify-center space-x-2">
                    {getStatusIcon(getOverallStatus())}
                    <span className="font-medium text-gray-900">
                      {getOverallStatus() === 'testing' && 'Testing connections...'}
                      {getOverallStatus() === 'success' && 'All systems operational'}
                      {getOverallStatus() === 'error' && 'Some issues detected'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <motion.button
                    onClick={runAllTests}
                    disabled={testing}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    whileHover={{ scale: testing ? 1 : 1.02 }}
                    whileTap={{ scale: testing ? 1 : 0.98 }}
                  >
                    {testing ? 'Testing...' : 'Run Tests'}
                  </motion.button>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};