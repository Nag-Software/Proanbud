'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SubscriptionDebugger } from '@/components/stripe-debug/SubscriptionDebugger';
import { WebhookDebugger } from '@/components/stripe-debug/WebhookDebugger';
import { FirebaseExtensionDebugger } from '@/components/stripe-debug/FirebaseExtensionDebugger';
import { StripeConfigDebugger } from '@/components/stripe-debug/StripeConfigDebugger';
import { UsageLimitsDebugger } from '@/components/stripe-debug/UsageLimitsDebugger';
import { PaymentHistoryDebugger } from '@/components/stripe-debug/PaymentHistoryDebugger';
import { AdminGuard } from '@/components/stripe-debug/AdminGuard';

export default function StripeDebugPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('subscription');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const tabs = [
    { id: 'subscription', label: 'Subscription Status', icon: '📊' },
    { id: 'webhooks', label: 'Webhooks', icon: '🔗' },
    { id: 'firebase', label: 'Firebase Extension', icon: '🔥' },
    { id: 'config', label: 'Stripe Config', icon: '⚙️' },
    { id: 'limits', label: 'Usage & Limits', icon: '📈' },
    { id: 'payments', label: 'Payment History', icon: '💳' },
  ];

  return (
    <AdminGuard onAuthorized={() => setIsAuthorized(true)}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🔧 Stripe & Subscription Debugger
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Advanced debugging tools for Stripe Firebase Extension and subscription management
            </p>
            {user && (
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Debug User:</strong> {user.email} (UID: {user.uid})
                </p>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'subscription' && <SubscriptionDebugger />}
              {activeTab === 'webhooks' && <WebhookDebugger />}
              {activeTab === 'firebase' && <FirebaseExtensionDebugger />}
              {activeTab === 'config' && <StripeConfigDebugger />}
              {activeTab === 'limits' && <UsageLimitsDebugger />}
              {activeTab === 'payments' && <PaymentHistoryDebugger />}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">🚨 Quick Diagnostics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Run comprehensive health checks
              </p>
              <button className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
                Run Full Diagnostic
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">🔄 Sync Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Force synchronization with Stripe
              </p>
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                Sync Now
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">📋 Export Logs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Download debugging information
              </p>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                Export Debug Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}