'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe-client';
import { db } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

interface UsageOverride {
  quotesUsed?: number;
  customersUsed?: number;
  storageUsed?: number;
}

export const UsageLimitsDebugger: React.FC = () => {
  const { user } = useAuth();
  const { subscription, usage, refetch } = useSubscription();
  const [usageOverride, setUsageOverride] = useState<UsageOverride>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculations, setCalculations] = useState<any>({});

  const recalculateUsage = async () => {
    if (!user?.uid) return;

    try {
      setIsCalculating(true);
      
      // Get quotes count
      const quotesRef = ref(db, `users/${user.uid}/tilbud`);
      const quotesSnapshot = await get(quotesRef);
      const quotesData = quotesSnapshot.exists() ? quotesSnapshot.val() : {};
      const quotesCount = Object.keys(quotesData).length;

      // Get customers count
      const customersRef = ref(db, `users/${user.uid}/kunder`);
      const customersSnapshot = await get(customersRef);
      const customersData = customersSnapshot.exists() ? customersSnapshot.val() : {};
      const customersCount = Object.keys(customersData).length;

      // Calculate storage usage (simplified)
      const storageUsed = JSON.stringify({ ...quotesData, ...customersData }).length;

      // Get current plan limits
      const currentPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === subscription?.plan);
      const limits = currentPlan?.limits || { quotes: 5, customers: 3, storage: 1024 * 1024 }; // Default to free plan

      const calculations = {
        rawCounts: {
          quotes: quotesCount,
          customers: customersCount,
          storage: storageUsed
        },
        limits: {
          quotes: limits.quotes,
          customers: limits.customers,
          storage: limits.storage * 1024 * 1024 // Convert GB to bytes
        },
        percentages: {
          quotes: limits.quotes === -1 ? 0 : (quotesCount / limits.quotes) * 100,
          customers: limits.customers === -1 ? 0 : (customersCount / limits.customers) * 100,
          storage: limits.storage === -1 ? 0 : (storageUsed / (limits.storage * 1024 * 1024)) * 100
        },
        exceeded: {
          quotes: limits.quotes !== -1 && quotesCount > limits.quotes,
          customers: limits.customers !== -1 && customersCount > limits.customers,
          storage: limits.storage !== -1 && storageUsed > (limits.storage * 1024 * 1024)
        }
      };

      setCalculations(calculations);

    } catch (error) {
      console.error('Error recalculating usage:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const applyUsageOverride = async () => {
    if (!user?.uid) return;

    try {
      const overrideRef = ref(db, `users/${user.uid}/usage_override`);
      await set(overrideRef, {
        ...usageOverride,
        appliedAt: Date.now(),
        appliedBy: 'debug-tool'
      });
      
      alert('Usage override applied successfully');
      refetch();
    } catch (error) {
      console.error('Error applying usage override:', error);
      alert('Failed to apply usage override');
    }
  };

  const resetUsage = async () => {
    if (!user?.uid || !window.confirm('Are you sure you want to reset all usage counters to 0?')) return;

    try {
      const overrideRef = ref(db, `users/${user.uid}/usage_override`);
      await set(overrideRef, {
        quotesUsed: 0,
        customersUsed: 0,
        storageUsed: 0,
        appliedAt: Date.now(),
        appliedBy: 'debug-tool-reset'
      });
      
      alert('Usage counters reset successfully');
      refetch();
    } catch (error) {
      console.error('Error resetting usage:', error);
      alert('Failed to reset usage counters');
    }
  };

  const simulateUsage = async (type: 'quotes' | 'customers', amount: number) => {
    if (!user?.uid) return;

    try {
      const currentUsage = usage || { quotesUsed: 0, customersUsed: 0, storageUsed: 0 };
      const newUsage = {
        ...currentUsage,
        [`${type}Used`]: Math.max(0, currentUsage[`${type}Used` as keyof typeof currentUsage] + amount)
      };

      const overrideRef = ref(db, `users/${user.uid}/usage_override`);
      await set(overrideRef, {
        quotesUsed: newUsage.quotesUsed,
        customersUsed: newUsage.customersUsed,
        storageUsed: newUsage.storageUsed,
        appliedAt: Date.now(),
        appliedBy: 'debug-tool-simulate'
      });
      
      alert(`Simulated ${amount > 0 ? 'increase' : 'decrease'} of ${Math.abs(amount)} ${type}`);
      refetch();
    } catch (error) {
      console.error('Error simulating usage:', error);
      alert('Failed to simulate usage change');
    }
  };

  useEffect(() => {
    recalculateUsage();
  }, [user?.uid, subscription?.plan]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsageColor = (percentage: number, exceeded: boolean) => {
    if (exceeded) return 'text-red-600';
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const currentPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === subscription?.plan);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Usage & Limits Debugger</h2>
        <div className="flex space-x-2">
          <button
            onClick={recalculateUsage}
            disabled={isCalculating}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isCalculating ? 'Calculating...' : 'Recalculate'}
          </button>
          <button
            onClick={resetUsage}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reset Usage
          </button>
        </div>
      </div>

      {/* Current Plan Info */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Current Plan: {currentPlan?.name || 'Unknown'}</h3>
        {currentPlan && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quotes Limit</p>
              <p className="font-medium">
                {currentPlan.limits.quotes === -1 ? 'Unlimited' : currentPlan.limits.quotes}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customers Limit</p>
              <p className="font-medium">
                {currentPlan.limits.customers === -1 ? 'Unlimited' : currentPlan.limits.customers}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Storage Limit</p>
              <p className="font-medium">
                {currentPlan.limits.storage === -1 ? 'Unlimited' : `${currentPlan.limits.storage} GB`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Usage Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium">Current Usage</h3>
        </div>
        <div className="p-4">
          {usage ? (
            <div className="space-y-4">
              {/* Quotes */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Quotes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.quotesUsed} / {usage.quotesLimit === -1 ? '∞' : usage.quotesLimit}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={getUsageColor(
                    usage.quotesLimit === -1 ? 0 : (usage.quotesUsed / usage.quotesLimit) * 100,
                    usage.quotesLimit !== -1 && usage.quotesUsed > usage.quotesLimit
                  )}>
                    {usage.quotesLimit === -1 ? '∞' : 
                      `${Math.round((usage.quotesUsed / usage.quotesLimit) * 100)}%`
                    }
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => simulateUsage('quotes', 1)}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => simulateUsage('quotes', -1)}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>

              {/* Customers */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Customers</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.customersUsed} / {usage.customersLimit === -1 ? '∞' : usage.customersLimit}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={getUsageColor(
                    usage.customersLimit === -1 ? 0 : (usage.customersUsed / usage.customersLimit) * 100,
                    usage.customersLimit !== -1 && usage.customersUsed > usage.customersLimit
                  )}>
                    {usage.customersLimit === -1 ? '∞' : 
                      `${Math.round((usage.customersUsed / usage.customersLimit) * 100)}%`
                    }
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => simulateUsage('customers', 1)}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => simulateUsage('customers', -1)}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>

              {/* Storage */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Storage</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatBytes(usage.storageUsed)} / {usage.storageLimit === -1 ? '∞' : formatBytes(usage.storageLimit)}
                  </p>
                </div>
                <div>
                  <span className={getUsageColor(
                    usage.storageLimit === -1 ? 0 : (usage.storageUsed / usage.storageLimit) * 100,
                    usage.storageLimit !== -1 && usage.storageUsed > usage.storageLimit
                  )}>
                    {usage.storageLimit === -1 ? '∞' : 
                      `${Math.round((usage.storageUsed / usage.storageLimit) * 100)}%`
                    }
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No usage data available</p>
          )}
        </div>
      </div>

      {/* Detailed Calculations */}
      {Object.keys(calculations).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium">Detailed Calculations</h3>
          </div>
          <div className="p-4">
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-64">
              <pre className="text-xs">
                {JSON.stringify(calculations, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Usage Override Tool */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="font-medium mb-3 text-yellow-800 dark:text-yellow-200">⚠️ Usage Override Tool</h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
          Manually override usage counters for testing purposes. Use with caution in production.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quotes Used
            </label>
            <input
              type="number"
              value={usageOverride.quotesUsed || ''}
              onChange={(e) => setUsageOverride(prev => ({ 
                ...prev, 
                quotesUsed: parseInt(e.target.value) || 0 
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              placeholder={usage?.quotesUsed?.toString() || '0'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Customers Used
            </label>
            <input
              type="number"
              value={usageOverride.customersUsed || ''}
              onChange={(e) => setUsageOverride(prev => ({ 
                ...prev, 
                customersUsed: parseInt(e.target.value) || 0 
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              placeholder={usage?.customersUsed?.toString() || '0'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Storage Used (bytes)
            </label>
            <input
              type="number"
              value={usageOverride.storageUsed || ''}
              onChange={(e) => setUsageOverride(prev => ({ 
                ...prev, 
                storageUsed: parseInt(e.target.value) || 0 
              }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              placeholder={usage?.storageUsed?.toString() || '0'}
            />
          </div>
        </div>
        
        <button
          onClick={applyUsageOverride}
          className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
        >
          Apply Override
        </button>
      </div>
    </div>
  );
};