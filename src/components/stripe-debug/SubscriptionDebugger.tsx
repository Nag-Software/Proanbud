'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { UserSubscription } from '@/lib/subscription-types';

interface SubscriptionData {
  firebaseData?: any;
  stripeData?: any;
  calculatedData?: any;
}

export const SubscriptionDebugger: React.FC = () => {
  const { user } = useAuth();
  const { subscription, usage, loading, error, refetch } = useSubscription();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const fetchSubscriptionData = async () => {
    if (!user?.uid) return;

    try {
      setIsRefreshing(true);
      addLog('Fetching subscription data from Firebase...');

      // Get subscription data from Firebase
      const subscriptionRef = ref(db, `users/${user.uid}/subscription`);
      const subscriptionSnapshot = await get(subscriptionRef);
      const firebaseSubscription = subscriptionSnapshot.exists() ? subscriptionSnapshot.val() : null;

      // Get Stripe customer data
      const customerRef = ref(db, `stripe_customers/${user.uid}`);
      const customerSnapshot = await get(customerRef);
      const stripeCustomer = customerSnapshot.exists() ? customerSnapshot.val() : null;

      // Get Stripe subscriptions
      const subscriptionsRef = ref(db, `stripe_customers/${user.uid}/subscriptions`);
      const subscriptionsSnapshot = await get(subscriptionsRef);
      const stripeSubscriptions = subscriptionsSnapshot.exists() ? subscriptionsSnapshot.val() : null;

      // Get payment methods
      const paymentMethodsRef = ref(db, `stripe_customers/${user.uid}/payment_methods`);
      const paymentMethodsSnapshot = await get(paymentMethodsRef);
      const paymentMethods = paymentMethodsSnapshot.exists() ? paymentMethodsSnapshot.val() : null;

      setSubscriptionData({
        firebaseData: {
          subscription: firebaseSubscription,
          customer: stripeCustomer,
          subscriptions: stripeSubscriptions,
          paymentMethods: paymentMethods,
        },
        stripeData: stripeSubscriptions,
        calculatedData: {
          currentPlan: subscription?.plan,
          status: subscription?.status,
          usage: usage,
        }
      });

      addLog('Successfully fetched subscription data');
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      addLog(`Error: ${error}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user?.uid]);

  const handleRefresh = async () => {
    addLog('Manual refresh triggered');
    await refetch();
    await fetchSubscriptionData();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const StatusBadge = ({ status, label }: { status: string; label: string }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'trialing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'past_due': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'canceled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      }
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {label}: {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading subscription data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Subscription Status</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Current Subscription Overview */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Current Subscription</h3>
        {subscription ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
              <p className="font-medium">{subscription.plan}</p>
            </div>
            <div>
              <StatusBadge status={subscription.status} label="Status" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Period</p>
              <p className="text-sm">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cancel at Period End</p>
              <p className="text-sm">{subscription.cancelAtPeriodEnd ? 'Yes' : 'No'}</p>
            </div>
            {subscription.stripeCustomerId && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stripe Customer ID</p>
                <p className="text-sm font-mono">{subscription.stripeCustomerId}</p>
              </div>
            )}
            {subscription.stripeSubscriptionId && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stripe Subscription ID</p>
                <p className="text-sm font-mono">{subscription.stripeSubscriptionId}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No subscription found</p>
        )}
      </div>

      {/* Usage Information */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Usage & Limits</h3>
        {usage ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Quotes</p>
              <p className="font-medium">
                {usage.quotesUsed} / {usage.quotesLimit === -1 ? '∞' : usage.quotesLimit}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customers</p>
              <p className="font-medium">
                {usage.customersUsed} / {usage.customersLimit === -1 ? '∞' : usage.customersLimit}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Storage</p>
              <p className="font-medium">
                {(usage.storageUsed / 1024).toFixed(2)} MB / {usage.storageLimit === -1 ? '∞' : `${usage.storageLimit} MB`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No usage data found</p>
        )}
      </div>

      {/* Raw Firebase Data */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Raw Firebase Data</h3>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-xs overflow-auto max-h-64">
          <pre>{JSON.stringify(subscriptionData.firebaseData, null, 2)}</pre>
        </div>
      </div>

      {/* Available Plans */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Available Plans</h3>
        <div className="space-y-2">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div key={plan.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded">
              <div>
                <span className="font-medium">{plan.name}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({plan.id})</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">Monthly:</span> {plan.price.monthly} NOK
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Logs */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Debug Logs</h3>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-xs overflow-auto max-h-64">
          {debugLogs.length > 0 ? (
            debugLogs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          ) : (
            <div>No logs yet...</div>
          )}
        </div>
      </div>
    </div>
  );
};