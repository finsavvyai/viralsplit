'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { MFAModal } from './MFAModal';
import { PasswordResetModal } from './PasswordResetModal';

export const SecuritySettings: React.FC = () => {
  const { user, token } = useAuth();
  const [mfaModalMode, setMfaModalMode] = useState<'setup' | 'verify' | 'login' | null>(null);
  const [passwordResetMode, setPasswordResetMode] = useState<'request' | 'reset' | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.viralsplit.io';

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      // This would need a change password endpoint in the backend
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowChangePassword(false);
      } else {
        setError(data.detail || 'Failed to change password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!currentPassword) {
      setError('Please enter your current password to disable MFA');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/mfa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: currentPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('MFA disabled successfully');
        setCurrentPassword('');
        // Refresh user data
        window.location.reload();
      } else {
        setError(data.detail || 'Failed to disable MFA');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
          <p className="text-gray-600">Manage your account security and authentication preferences</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Status Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
              {success}
            </div>
          )}

          {/* Account Status */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Email Verification</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.email_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.email_verified ? '✅ Verified' : '❌ Unverified'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Two-Factor Authentication</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.mfa_enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.mfa_enabled ? '🔐 Enabled' : '🔓 Disabled'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-700">Account Type</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.is_admin 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.is_admin ? '👑 Admin' : '👤 User'}
                </span>
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
            <p className="text-gray-600 mb-6">
              Add an extra layer of security to your account with two-factor authentication.
            </p>
            
            {!user.mfa_enabled ? (
              <button
                onClick={() => setMfaModalMode('setup')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Enable Two-Factor Authentication
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Two-Factor Authentication is active</p>
                    <p className="text-sm text-green-700">Your account is protected with 2FA</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password (required to disable MFA)
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your current password"
                  />
                </div>
                
                <button
                  onClick={handleDisableMFA}
                  disabled={!currentPassword}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Disable Two-Factor Authentication
                </button>
              </div>
            )}
          </div>

          {/* Password Management */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Password</h3>
            <p className="text-gray-600 mb-6">
              Change your password or reset it if you've forgotten it.
            </p>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
                >
                  {showChangePassword ? 'Cancel' : 'Change Password'}
                </button>
                
                <button
                  onClick={() => setPasswordResetMode('request')}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Reset Password via Email
                </button>
              </div>

              {showChangePassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-4 border-t border-gray-200"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your new password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm your new password"
                    />
                    {newPassword !== confirmPassword && confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Email Verification */}
          {!user.email_verified && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">Email Verification Required</h3>
              <p className="text-yellow-700 mb-4">
                Please verify your email address to enable all security features and ensure account recovery options.
              </p>
              <button
                onClick={() => {
                  // Send verification email
                  fetch(`${API_URL}/api/auth/send-verification`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email }),
                  }).then(() => {
                    setSuccess('Verification email sent! Check your inbox.');
                  }).catch(() => {
                    setError('Failed to send verification email. Please try again.');
                  });
                }}
                className="bg-yellow-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-yellow-700 transition-colors"
              >
                Resend Verification Email
              </button>
            </div>
          )}

          {/* Account Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Account Created</label>
                <p className="text-gray-900">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Platform</label>
                <p className="text-gray-900 capitalize">{user.brand}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Subscription</label>
                <p className="text-gray-900 capitalize">{user.subscription_tier}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MFAModal
        isOpen={mfaModalMode !== null}
        onClose={() => {
          setMfaModalMode(null);
          setCurrentPassword('');
          setError('');
          setSuccess('');
        }}
        mode={mfaModalMode!}
      />

      <PasswordResetModal
        isOpen={passwordResetMode !== null}
        onClose={() => {
          setPasswordResetMode(null);
          setError('');
          setSuccess('');
        }}
        mode={passwordResetMode!}
      />
    </div>
  );
};