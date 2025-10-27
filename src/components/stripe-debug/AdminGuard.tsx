'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminGuardProps {
  children: React.ReactNode;
  onAuthorized?: () => void;
}

// Admin email list - you can modify this or move to environment variables
const ADMIN_EMAILS = [
  'admin@proanbud.no',
  'casper@proanbud.no',
  'dev@proanbud.no',
  'olaf@outlook.com'
  // Add more admin emails as needed
];

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, onAuthorized }) => {
  const { user, loading } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAccessForm, setShowAccessForm] = useState(false);

  // Debug access code (in production, this should be more secure)
  const DEBUG_ACCESS_CODE = 'wordpass';

  useEffect(() => {
    if (user && !loading) {
      const isAdmin = ADMIN_EMAILS.includes(user.email || '');
      if (isAdmin) {
        setIsAuthorized(true);
        onAuthorized?.();
      } else {
        setShowAccessForm(true);
      }
    }
  }, [user, loading, onAuthorized]);

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === DEBUG_ACCESS_CODE) {
      setIsAuthorized(true);
      setShowAccessForm(false);
      onAuthorized?.();
    } else {
      alert('Invalid access code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              🔒 Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You must be logged in to access the Stripe debugger.
            </p>
            <a
              href="/login"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (showAccessForm && !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              🔐 Access Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Enter the debug access code to continue.
            </p>
          </div>
          
          <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Code
              </label>
              <input
                type="password"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter access code"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Access Debugger
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Logged in as: {user.email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              ❌ Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You don't have permission to access the Stripe debugger.
            </p>
            <a
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};