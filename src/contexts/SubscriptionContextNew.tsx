'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firestore, db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs 
} from 'firebase/firestore';
import { ref, get } from 'firebase/database';
import { UserSubscription, SubscriptionUsage, UserSubscriptionContext, SubscriptionPlan } from '@/lib/subscription-types';
import { SUBSCRIPTION_PLANS, calculateTrialEndDate, FREE_TRIAL_DAYS } from '@/lib/stripe';
import { stripePayments } from '@/lib/stripe';

const SubscriptionContext = createContext<UserSubscriptionContext | null>(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    // Return default values when context is not available
    return {
      subscription: null,
      usage: null,
      loading: true,
      error: null,
      refetch: async () => {},
      refreshUsage: async () => {},
      createCheckoutSession: async () => ({ id: '', url: '' }),
      createCustomerPortalSession: async () => '',
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

  // Fetch usage data from Realtime Database (existing data structure)
  const fetchUsage = useCallback(async () => {
    if (!user?.uid) return;

    try {
      // Get quotes count from Realtime Database
      const quotesRef = ref(db, `users/${user.uid}/tilbud`);
      const quotesSnapshot = await get(quotesRef);
      const quotesCount = quotesSnapshot.exists() ? Object.keys(quotesSnapshot.val()).length : 0;

      // Get customers count from Realtime Database
      const customersRef = ref(db, `users/${user.uid}/kunder`);
      const customersSnapshot = await get(customersRef);
      const customersCount = customersSnapshot.exists() ? Object.keys(customersSnapshot.val()).length : 0;

      // Determine correct plan based on expiration
      let currentPlan = subscription?.status === 'trialing' ? 'trial' : (subscription?.plan || 'free');
      let planDetails = SUBSCRIPTION_PLANS.find(p => p.id === currentPlan);
      const now = Math.floor(Date.now() / 1000);

      // If subscription is basic/pro and expired, downgrade to free
      if ((currentPlan === 'basic' || currentPlan === 'pro') && subscription) {
        if (subscription.currentPeriodEnd < now || subscription.status === 'canceled' || subscription.status === 'unpaid') {
          currentPlan = 'free';
          planDetails = SUBSCRIPTION_PLANS.find(p => p.id === currentPlan);
        }
      }

      // If trial has expired, set limits to zero
      let quotesLimit = planDetails?.limits.quotes || 5;
      let customersLimit = planDetails?.limits.customers || 3;
      let storageLimit = (planDetails?.limits.storage || 1) * 1024;
      if (currentPlan === 'trial' && typeof subscription?.currentPeriodEnd === 'number' && subscription.currentPeriodEnd < now) {
        quotesLimit = 0;
        customersLimit = 0;
        storageLimit = 0;
      }

      const usageData: SubscriptionUsage = {
        quotesUsed: quotesCount,
        customersUsed: customersCount,
        storageUsed: 0, // TODO: Calculate actual storage usage
        quotesLimit,
        customersLimit,
        storageLimit,
      };

      setUsage(usageData);
    } catch (err) {
      console.error('Error fetching usage:', err);
    }
  }, [user?.uid, subscription]);

    // Listen to subscription changes from Firestore (Stripe extension)
    const setupSubscriptionListener = useCallback(() => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Listen to all subscriptions from Firestore, sorted by createdAt
      const subscriptionsRef = collection(firestore, `users/${user.uid}/subscriptions`);
      const subscriptionsQuery = query(
        subscriptionsRef,
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(
        subscriptionsQuery,
        (snapshot) => {
          // Find the most recent active/trialing/past_due subscription
          let selectedDoc = null;
          for (const doc of snapshot.docs) {
            const data = doc.data();
            if (['active', 'trialing', 'past_due'].includes(data.status)) {
              selectedDoc = doc;
              break;
            }
          }

          if (selectedDoc) {
            const subscriptionData = selectedDoc.data();
            let mappedSubscription: UserSubscription = {
              plan: mapStripePriceToPlan(subscriptionData.price?.id),
              status: subscriptionData.status,
              currentPeriodStart: subscriptionData.current_period_start?.seconds || Math.floor(Date.now() / 1000),
              currentPeriodEnd: subscriptionData.current_period_end?.seconds || Math.floor(Date.now() / 1000),
              cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
              stripeSubscriptionId: subscriptionData.id,
              stripePriceId: subscriptionData.price?.id,
              stripeCustomerId: subscriptionData.customer,
              createdAt: subscriptionData.created?.seconds || Math.floor(Date.now() / 1000),
              updatedAt: Math.floor(Date.now() / 1000),
            };

            // Only downgrade if truly expired/canceled/unpaid
            const now = Math.floor(Date.now() / 1000);
            if ((mappedSubscription.plan === 'basic' || mappedSubscription.plan === 'pro')) {
              if (mappedSubscription.status === 'canceled' || mappedSubscription.status === 'unpaid' || mappedSubscription.currentPeriodEnd < now) {
                mappedSubscription = {
                  ...mappedSubscription,
                  plan: 'free',
                  status: 'trialing',
                };
              }
            }
            setSubscription(mappedSubscription);
          } else {
            // No active subscription - create trial in memory only
            console.log('setupSubscriptionListener - no active subscription, creating trial in memory');
            createTrialInMemory();
          }
          setLoading(false);
      },
      (error) => {
        console.error('Error listening to subscriptions:', error);
        setError('Failed to load subscription data');
        setLoading(false);
        
        // Fallback to trial in memory for new users
        createTrialInMemory();
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // Map Stripe price ID to our plan names
  const mapStripePriceToPlan = (priceId?: string): SubscriptionPlan => {
    if (!priceId) return 'free';
    
    const planMapping: Record<string, SubscriptionPlan> = {
      [process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || '']: 'basic',
      [process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID || '']: 'basic',
      [process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '']: 'pro',
      [process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || '']: 'pro',
    };
    
    return planMapping[priceId] || 'free';
  };

  // Create trial subscription in memory only (not persisted)
  const createTrialInMemory = useCallback(() => {
    if (!user?.uid) return;

    console.log('createTrialInMemory - creating trial subscription in memory for user:', user.uid);

    const trialEnd = calculateTrialEndDate();
    const now = Math.floor(Date.now() / 1000);
    const trialSubscription: UserSubscription = {
      plan: 'free',
      status: 'trialing',
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      trialEnd: trialEnd, // Also set trialEnd for consistency
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };

    console.log('createTrialInMemory - setting trial subscription:', trialSubscription);
    setSubscription(trialSubscription);
  }, [user?.uid]);

  // Create checkout session using Firestore (with fallback to direct API)
  const createCheckoutSession = useCallback(async (priceId: string) => {
    if (!user?.uid || !priceId) {
      throw new Error('User not authenticated or price ID missing');
    }

    console.log('Creating checkout session for user:', user.uid, 'with price:', priceId);

    // First, try the Firebase extension approach
    try {
      const checkoutSessionsRef = collection(firestore, `customers/${user.uid}/checkout_sessions`);
      
      // Create the checkout session document with the required structure
      const sessionData = {
        price: priceId,
        success_url: `${window.location.origin}/innstillinger?success=true`,
        cancel_url: `${window.location.origin}/innstillinger?canceled=true`,
        allow_promotion_codes: true,
        mode: 'subscription',
        metadata: {
          created_by: 'proanbud_app'
        }
      };

      console.log('Creating checkout session with data:', sessionData);
      const docRef = await addDoc(checkoutSessionsRef, sessionData);
      console.log('Checkout session document created:', docRef.id);

      // Wait for the session to be created by the extension (with shorter timeout)
      return new Promise<{ id: string; url: string }>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 10; // 10 seconds total
        
        const unsubscribe = onSnapshot(docRef, (doc) => {
          attempts++;
          const data = doc.data();
          console.log(`Checkout session attempt ${attempts}:`, data);
          
          if (data?.url) {
            console.log('Checkout session URL received:', data.url);
            unsubscribe();
            resolve({ id: doc.id, url: data.url });
          } else if (data?.error) {
            console.error('Checkout session error:', data.error);
            unsubscribe();
            reject(new Error(data.error.message || 'Checkout session failed'));
          }
        }, (error) => {
          console.error('Firestore snapshot error:', error);
          unsubscribe();
          reject(new Error('Failed to listen to checkout session changes'));
        });

        // Timeout after 10 seconds, then try fallback
        setTimeout(() => {
          unsubscribe();
          console.log('Firebase extension timeout, trying fallback API...');
          
          // Fallback to direct Stripe API
          createCheckoutSessionFallback(priceId)
            .then(resolve)
            .catch(reject);
        }, 10000);
      });
    } catch (error) {
      console.error('Error with Firebase extension, trying fallback:', error);
      // If extension fails, try fallback
      return createCheckoutSessionFallback(priceId);
    }
  }, [user?.uid]);

  // Fallback method using direct Stripe API
  const createCheckoutSessionFallback = async (priceId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const result = await response.json();
      console.log('Fallback checkout session created:', result);
      return result;
    } catch (error) {
      console.error('Fallback checkout session failed:', error);
      throw error;
    }
  };

  // Create customer portal session
  const createCustomerPortalSession = useCallback(async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer portal session');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw error;
    }
  }, [user]);

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    // This would typically be handled by calling your backend API
    // that uses Stripe's API to cancel the subscription
    console.log('Cancel subscription - implement backend API call');
  }, []);

  // Resume subscription
  const resumeSubscription = useCallback(async () => {
    // This would typically be handled by calling your backend API
    // that uses Stripe's API to resume the subscription
    console.log('Resume subscription - implement backend API call');
  }, []);

  // Set up subscription listener when user changes
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = setupSubscriptionListener();
      return unsubscribe;
    } else {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
    }
  }, [user?.uid, setupSubscriptionListener]);

  // Fetch usage when subscription changes
  useEffect(() => {
    if (subscription) {
      fetchUsage();
    }
  }, [subscription, fetchUsage]);

  const refetch = useCallback(async () => {
    if (user?.uid) {
      setupSubscriptionListener();
    }
  }, [user?.uid, setupSubscriptionListener]);

  const value: UserSubscriptionContext = {
    subscription,
    usage,
    loading,
    error,
    refetch,
    refreshUsage: fetchUsage,
    createCheckoutSession,
    createCustomerPortalSession,
    cancelSubscription,
    resumeSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};