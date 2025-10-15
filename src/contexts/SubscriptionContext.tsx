'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { ref, get, onValue, off, set } from 'firebase/database';
import { UserSubscription, SubscriptionUsage, UserSubscriptionContext, StripeCheckoutSession } from '@/lib/subscription-types';
import { SUBSCRIPTION_PLANS, calculateTrialEndDate } from '@/lib/stripe-client';

const SubscriptionContext = createContext<UserSubscriptionContext | null>(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    // Return default values when context is not available (e.g., for non-authenticated users)
    return {
      subscription: null,
      usage: null,
      loading: true,
      error: null,
      refetch: async () => {},
      refreshUsage: async () => {},
      createCheckoutSession: async () => ({ id: '', url: '' }),
      cancelSubscription: async () => {},
      resumeSubscription: async () => {},
    };
  }
  return context;
};

interface SubscriptionProviderProps {
  children: React.ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!user?.uid) return;

    try {
      // Get quotes count
      const quotesRef = ref(db, `users/${user.uid}/tilbud`);
      const quotesSnapshot = await get(quotesRef);
      const quotesCount = quotesSnapshot.exists() ? Object.keys(quotesSnapshot.val()).length : 0;

      // Get customers count
      const customersRef = ref(db, `users/${user.uid}/kunder`);
      const customersSnapshot = await get(customersRef);
      const customersCount = customersSnapshot.exists() ? Object.keys(customersSnapshot.val()).length : 0;

      const currentPlan = subscription?.plan || 'free';
      const planDetails = SUBSCRIPTION_PLANS.find(p => p.id === currentPlan);

      const usageData: SubscriptionUsage = {
        quotesUsed: quotesCount,
        customersUsed: customersCount,
        storageUsed: 0, // TODO: Calculate actual storage usage
        quotesLimit: planDetails?.limits.quotes || 5,
        customersLimit: planDetails?.limits.customers || 3,
        storageLimit: (planDetails?.limits.storage || 1) * 1024, // Convert GB to MB
      };

      setUsage(usageData);
    } catch (err) {
      console.error('Error fetching usage:', err);
    }
  }, [user?.uid, subscription?.plan]);

  const fetchSubscription = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch subscription data from Firebase
      const subscriptionRef = ref(db, `users/${user.uid}/subscription`);
      const subscriptionSnapshot = await get(subscriptionRef);

      if (subscriptionSnapshot.exists()) {
        const subscriptionData = subscriptionSnapshot.val() as UserSubscription;
        setSubscription(subscriptionData);
      } else {
        // Check if user has already used their trial
        const trialUsedRef = ref(db, `users/${user.uid}/trialUsed`);
        const trialUsedSnapshot = await get(trialUsedRef);
        const hasUsedTrial = trialUsedSnapshot.exists() && trialUsedSnapshot.val() === true;

        if (hasUsedTrial) {
          console.log('fetchSubscription - user has already used trial, setting free plan');
          // Set to free plan without trial
          const freeSubscription: UserSubscription = {
            plan: 'free',
            status: 'active',
            currentPeriodStart: Math.floor(Date.now() / 1000),
            currentPeriodEnd: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // Far future
            cancelAtPeriodEnd: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setSubscription(freeSubscription);
        } else {
          // Initialize free trial for new users
          const trialEndDate = calculateTrialEndDate();
          const trialEnd = Math.floor(trialEndDate.getTime() / 1000);
          const newSubscription: UserSubscription = {
            plan: 'free',
            status: 'trialing',
            currentPeriodStart: Math.floor(Date.now() / 1000),
            currentPeriodEnd: trialEnd,
            cancelAtPeriodEnd: false,
            trialEnd: trialEnd,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          // Note: Database write removed to comply with read-only subscription rules
          // Subscription initialization should be handled server-side
          setSubscription(newSubscription);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const createCheckoutSession = useCallback(async (priceId: string): Promise<StripeCheckoutSession> => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, uid: user.uid }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return {
        id: data.sessionId,
        url: data.url || '',
      };
    } catch (err) {
      console.error('Error creating checkout session:', err);
      throw new Error('Failed to create checkout session');
    }
  }, [user?.uid]);

  const cancelSubscription = useCallback(async () => {
    if (!user?.uid || !subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription to cancel');
    }

    try {
      // For now, we'll update the local state
      // In a real implementation, this would be handled by Stripe webhooks
      const updatedSubscription = {
        ...subscription,
        cancelAtPeriodEnd: true,
        updatedAt: Date.now(),
      };
      
      // Note: Database write removed to comply with read-only subscription rules
      // Subscription updates should be handled server-side via Stripe webhooks
      setSubscription(updatedSubscription);
    } catch (err) {
      console.error('Error canceling subscription:', err);
      throw new Error('Failed to cancel subscription');
    }
  }, [user?.uid, subscription]);

  const resumeSubscription = useCallback(async () => {
    if (!user?.uid || !subscription?.stripeSubscriptionId) {
      throw new Error('No subscription to resume');
    }

    try {
      // For now, we'll update the local state
      // In a real implementation, this would be handled by Stripe webhooks
      const updatedSubscription = {
        ...subscription,
        cancelAtPeriodEnd: false,
        updatedAt: Date.now(),
      };
      
      // Note: Database write removed to comply with read-only subscription rules
      // Subscription updates should be handled server-side via Stripe webhooks
      setSubscription(updatedSubscription);
    } catch (err) {
      console.error('Error resuming subscription:', err);
      throw new Error('Failed to resume subscription');
    }
  }, [user?.uid, subscription]);

  const refetch = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  const refreshUsage = useCallback(async () => {
    await fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    if (user?.uid) {
      fetchSubscription();

      // Set up real-time listener for subscription changes
      const subscriptionRef = ref(db, `users/${user.uid}/subscription`);
      const unsubscribe = onValue(subscriptionRef, (snapshot) => {
        if (snapshot.exists()) {
          const subscriptionData = snapshot.val() as UserSubscription;
          setSubscription(subscriptionData);
        }
      });

      return () => {
        off(subscriptionRef, 'value', unsubscribe);
      };
    } else {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
    }
  }, [user?.uid, fetchSubscription]);

  useEffect(() => {
    if (subscription) {
      fetchUsage();
    }
  }, [subscription, fetchUsage]);

  const value: UserSubscriptionContext = {
    subscription,
    usage,
    loading,
    error,
    refetch,
    refreshUsage,
    createCheckoutSession,
    createCustomerPortalSession: async () => {
      // TODO: Implement customer portal session creation
      throw new Error('Not implemented');
    },
    cancelSubscription,
    resumeSubscription,
    debugTimeOffset: 0,
    timetravelDebugTest: () => {
      // Debug method - not implemented
    },
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};