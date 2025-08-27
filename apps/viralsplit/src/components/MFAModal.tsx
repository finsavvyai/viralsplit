'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';

interface MFAModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'setup' | 'verify' | 'login';
}

export const MFAModal: React.FC<MFAModalProps> = ({ 
  isOpen, 
  onClose, 
  mode 
}) => {
  const [mfaCode, setMfaCode] = useState('');
  const [password, setPassword] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { user, token } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.viralsplit.io';

  const handleSetupMFA = async () => {
    if (!password) {
      setError('Please enter your current password');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/mfa/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (response.ok) {
        setQrCode(data.qr_code);
        setBackupCodes(data.backup_codes);
        setSuccess('Scan the QR code with your authenticator app');
      } else {
        setError(data.detail || 'Failed to setup MFA');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: mfaCode }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('MFA enabled successfully!');
        setTimeout(onClose, 2000);
      } else {
        setError(data.detail || 'Invalid MFA code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMfaCode('');
    setPassword('');
    setError('');
    setSuccess('');
    setQrCode('');
    setBackupCodes([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'setup' ? 'Enable Two-Factor Authentication' : 
                 mode === 'verify' ? 'Verify MFA Code' : 
                 'Enter MFA Code'}
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                {success}
              </div>
            )}

            {mode === 'setup' && !qrCode && (
              <div>
                <p className="text-gray-600 mb-4">
                  Enable two-factor authentication to secure your account with an additional layer of security.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your current password"
                  />
                </div>
                <button
                  onClick={handleSetupMFA}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Setting up...' : 'Setup MFA'}
                </button>
              </div>
            )}

            {mode === 'setup' && qrCode && (
              <div>
                <div className="text-center mb-4">
                  <p className="text-gray-600 mb-4">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="MFA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter the 6-digit code from your app:
                  </label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                {backupCodes.length > 0 && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <h3 className="font-medium text-yellow-800 mb-2">Backup Codes</h3>
                    <p className="text-sm text-yellow-700 mb-2">
                      Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="bg-white p-2 rounded border text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleVerifyMFA}
                  disabled={isSubmitting || mfaCode.length !== 6}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Enable MFA'}
                </button>
              </div>
            )}

            {(mode === 'verify' || mode === 'login') && (
              <div>
                <p className="text-gray-600 mb-4">
                  Enter the 6-digit code from your authenticator app:
                </p>
                <div className="mb-4">
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={handleVerifyMFA}
                  disabled={isSubmitting || mfaCode.length !== 6}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};