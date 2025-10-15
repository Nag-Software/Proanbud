'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firestore, db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
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
import { ref, get, set } from 'firebase/database';
import { UserSubscription, SubscriptionUsage, UserSubscriptionContext, SubscriptionPlan } from '@/lib/subscription-types';
import { SUBSCRIPTION_PLANS, calculateTrialEndDate, FREE_TRIAL_DAYS } from '@/lib/stripe-client';

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
      createCheckoutSession: async () => ({ id: '', url: 'https://proanbud.no/' }),
      createCustomerPortalSession: async () => '',
      cancelSubscription: async () => {},
      resumeSubscription: async () => {},
      syncSubscriptions: async () => {},
      autoSyncSubscriptions: async () => {},
      // Debug features (development only)
      debugTimeOffset: 0,
      timetravelDebugTest: () => {},
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
  
  // Track sync operations to prevent concurrent requests
  const syncInProgress = useRef(false);
  
  // Debug time travel state (development only)
  const [debugTimeOffset, setDebugTimeOffset] = useState<number>(0);

  // Get current time with debug offset (for testing)
  const getCurrentTime = useCallback(() => {
    return Math.floor(Date.now() / 1000) + debugTimeOffset;
  }, [debugTimeOffset]);

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
      let currentPlan = subscription?.plan || 'free';
      let planDetails = SUBSCRIPTION_PLANS.find(p => p.id === currentPlan);
      const now = getCurrentTime();

      // If subscription is basic/pro and expired, downgrade to free
      if ((currentPlan === 'basic' || currentPlan === 'pro') && subscription) {
        if (subscription.currentPeriodEnd < now || subscription.status === 'unpaid') {
          currentPlan = 'free';
          planDetails = SUBSCRIPTION_PLANS.find(p => p.id === currentPlan);
        }
      }

      // Set limits based on subscription status
      let quotesLimit = planDetails?.limits.quotes || 5;
      let customersLimit = planDetails?.limits.customers || 3;
      let storageLimit = (planDetails?.limits.storage || 1) * 1024;

      // If subscription is canceled, set limits to zero
      if (subscription?.status === 'canceled') {
        quotesLimit = 0;
        customersLimit = 0;
        storageLimit = 0;
      }
      // If trial has expired, set limits to zero (and mark as canceled)
      else if (currentPlan === 'free' && subscription?.trialEnd && subscription.trialEnd < now) {
        quotesLimit = 0;
        customersLimit = 0;
        storageLimit = 0;
        // Update subscription status to canceled for expired trials
        setSubscription(prev => prev ? { ...prev, status: 'canceled' as const } : null);
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
          console.log('🔥 Firestore subscription snapshot received, docs count:', snapshot.docs.length);
          snapshot.docs.forEach((doc, index) => {
            console.log(`📄 Doc ${index}:`, doc.id, doc.data());
          });
          
          // Find the most recent active/past_due/canceled subscription
          let selectedDoc = null;
          for (const doc of snapshot.docs) {
            const data = doc.data();
            if (['active', 'past_due', 'canceled'].includes(data.status)) {
              selectedDoc = doc;
              break;
            }
          }

          if (selectedDoc) {
            console.log('✅ Selected subscription doc:', selectedDoc.id);
            const subscriptionData = selectedDoc.data();
            console.log('📋 Subscription data:', subscriptionData);
            let mappedSubscription: UserSubscription = {
              plan: mapStripePriceToPlan(subscriptionData.price?.id),
              status: subscriptionData.status,
              currentPeriodStart: subscriptionData.current_period_start?.seconds || Math.floor(Date.now() / 1000),
              currentPeriodEnd: subscriptionData.current_period_end?.seconds || Math.floor(Date.now() / 1000),
              trialEnd: subscriptionData.trial_end?.seconds,
              cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
              stripeSubscriptionId: subscriptionData.id,
              stripePriceId: subscriptionData.price?.id,
              stripeCustomerId: subscriptionData.customer,
              createdAt: subscriptionData.created?.seconds || Math.floor(Date.now() / 1000),
              updatedAt: Math.floor(Date.now() / 1000),
            };

            // Handle canceled subscriptions - keep canceled status
            const now = getCurrentTime();
            if ((mappedSubscription.plan === 'basic' || mappedSubscription.plan === 'pro')) {
              if (mappedSubscription.status === 'canceled' || mappedSubscription.status === 'unpaid' || mappedSubscription.currentPeriodEnd < now) {
                mappedSubscription = {
                  ...mappedSubscription,
                  plan: 'free',
                  // Keep the canceled status instead of changing to active
                  currentPeriodEnd: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // Far future for free plan
                };
              }
            }
            console.log('📋 Mapped subscription:', mappedSubscription);
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

  // Time travel debug function (development only)
  const timetravelDebugTest = useCallback((daysOffset: number) => {
    // Allow in development mode or when explicitly enabled for debugging
    if (process.env.NODE_ENV !== 'development' && !process.env.NEXT_PUBLIC_ENABLE_DEBUG_TIME_TRAVEL) {
      console.warn('timetravelDebugTest is only available in development mode or when NEXT_PUBLIC_ENABLE_DEBUG_TIME_TRAVEL is set');
      return;
    }
    
    console.log('🕐 Time travel function called with offset:', daysOffset, 'days');
    
    // Special case: reset to current time
    if (daysOffset === 0) {
      setDebugTimeOffset(0);
      console.log('🕐 Time reset to current time');
    } else {
      // Convert days to seconds for the debug offset
      const secondsOffset = daysOffset * 24 * 60 * 60;
      
      // Add to current offset instead of setting it
      setDebugTimeOffset((currentOffset) => {
        const newOffset = currentOffset + secondsOffset;
        console.log(`🕐 Time travel: ${currentOffset / (24 * 60 * 60)}d → ${newOffset / (24 * 60 * 60)}d`);
        console.log(`Current simulated time: ${new Date((Math.floor(Date.now() / 1000) + newOffset) * 1000).toISOString()}`);
        return newOffset;
      });
    }
    
    // Force refresh usage data with new time
    if (user?.uid) {
      fetchUsage();
    }
  }, [user?.uid, fetchUsage]);

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

    console.log('createTrialInMemory - checking trial eligibility for user:', user.uid);

    // Check if user has already used their trial
    const trialUsedRef = ref(db, `users/${user.uid}/trialUsed`);
    get(trialUsedRef).then((trialUsedSnapshot) => {
      const hasUsedTrial = trialUsedSnapshot.exists() && trialUsedSnapshot.val() === true;

      if (hasUsedTrial) {
        console.log('createTrialInMemory - user has already used trial, not creating new trial');
        // Set to free plan without trial (trial used up)
        const freeSubscription: UserSubscription = {
          plan: 'free',
          status: 'canceled', // Mark as canceled since trial was used
          currentPeriodStart: Math.floor(Date.now() / 1000),
          currentPeriodEnd: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // Far future
          cancelAtPeriodEnd: false,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        };
        setSubscription(freeSubscription);
        return;
      }

      console.log('createTrialInMemory - user eligible for trial, creating trial subscription');

      // Get user creation time from Firebase Auth metadata
      const userCreatedAt = user.metadata?.creationTime ? Math.floor(new Date(user.metadata.creationTime).getTime() / 1000) : Math.floor(Date.now() / 1000);

      // Calculate trial end as 14 days from user creation
      const trialDays = 14;
      const trialEnd = userCreatedAt + (trialDays * 24 * 60 * 60);
      const now = getCurrentTime();

      // Check if trial has already expired
      if (trialEnd < now) {
        console.log('createTrialInMemory - trial has expired, marking as used and setting free plan');
        // Mark trial as used since it has expired
        set(ref(db, `users/${user.uid}/trialUsed`), true).catch((error: any) => {
          console.error('createTrialInMemory - failed to mark trial as used:', error);
        });
        
        // Set to free plan without trial (expired)
        const freeSubscription: UserSubscription = {
          plan: 'free',
          status: 'canceled', // Mark as canceled since trial expired
          currentPeriodStart: Math.floor(Date.now() / 1000),
          currentPeriodEnd: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // Far future
          cancelAtPeriodEnd: false,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        };
        setSubscription(freeSubscription);
        return;
      }

      const trialSubscription: UserSubscription = {
        plan: 'free',
        status: 'active',
        currentPeriodStart: userCreatedAt,
        currentPeriodEnd: trialEnd,
        trialEnd: trialEnd,
        cancelAtPeriodEnd: false,
        createdAt: userCreatedAt,
        updatedAt: now,
      };

      console.log('createTrialInMemory - setting trial subscription:', trialSubscription);
      setSubscription(trialSubscription);
    }).catch((error) => {
      console.error('createTrialInMemory - error checking trial usage:', error);
      // Fallback to creating trial on error
      const userCreatedAt = user.metadata?.creationTime ? Math.floor(new Date(user.metadata.creationTime).getTime() / 1000) : Math.floor(Date.now() / 1000);
      const trialDays = 14;
      const trialEnd = userCreatedAt + (trialDays * 24 * 60 * 60);
      const now = getCurrentTime();

      const trialSubscription: UserSubscription = {
        plan: 'free',
        status: 'active',
        currentPeriodStart: userCreatedAt,
        currentPeriodEnd: trialEnd,
        trialEnd: trialEnd,
        cancelAtPeriodEnd: false,
        createdAt: userCreatedAt,
        updatedAt: now,
      };
      setSubscription(trialSubscription);
    });
  }, [user?.uid, user?.metadata?.creationTime]);

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
        success_url: `${window.location.origin}/innstillinger?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/innstillinger?canceled=true`,
        allow_promotion_codes: true,
        mode: 'subscription',
        metadata: {
          firebase_uid: user.uid,
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
  }, [subscription]);

  const syncSubscriptions = useCallback(async () => {
    if (!user?.uid || syncInProgress.current) return;

    try {
      syncInProgress.current = true;
      setLoading(true);
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) {
        throw new Error('No auth token available');
      }

      const response = await fetch('/api/stripe/sync-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'NO_SUBSCRIPTION') {
          throw new Error('No active subscription found. Please create a subscription first.');
        }
        throw new Error(error.error || 'Failed to sync subscriptions');
      }

      const result = await response.json();
      console.log('✅ Subscriptions synced:', result);

      // The Firestore listener should automatically update the UI
      console.log('🔄 Firestore listener should update automatically');

    } catch (error) {
      console.error('❌ Failed to sync subscriptions:', error);
      setError('Failed to sync subscription data');
    } finally {
      setLoading(false);
      syncInProgress.current = false;
    }
  }, [user?.uid]);

  // Auto-sync subscription data on load and periodically
  const autoSyncSubscriptions = useCallback(async (force = false) => {
    if (!user?.uid) return;

    // Only auto-sync if we have a subscription and it's been more than 5 minutes since last sync
    // or if force is true
    const lastSyncKey = `lastSubscriptionSync_${user.uid}`;
    const lastSync = localStorage.getItem(lastSyncKey);
    const now = Date.now();
    const oneMinute = 1 * 60 * 1000;

    if (!force && lastSync && (now - parseInt(lastSync)) < oneMinute) {
      console.log('⏰ Skipping auto-sync, last sync was recent');
      return;
    }

    try {
      console.log('🔄 Auto-syncing subscription data...');
      await syncSubscriptions();
      localStorage.setItem(lastSyncKey, now.toString());
      console.log('✅ Auto-sync completed');
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
      // Don't show error to user for auto-sync failures
    }
  }, [user?.uid, syncSubscriptions]);

  // Auto-sync subscription data on user authentication
  useEffect(() => {
    if (user?.uid) {
      console.log('🔄 User authenticated, triggering auto-sync');
      autoSyncSubscriptions();

      // Set up periodic sync every 5 minutes
      const intervalId = setInterval(() => {
        console.log('🔄 Periodic auto-sync check');
        autoSyncSubscriptions();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(intervalId);
    }
  }, [user?.uid]); // Removed autoSyncSubscriptions from dependencies

  const refetch = useCallback(async () => {
    if (user?.uid) {
      // Force a refresh by temporarily clearing and re-setting up the listener
      setSubscription(null);
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
    syncSubscriptions,
    autoSyncSubscriptions,
    // Debug features (development only)
    debugTimeOffset,
    timetravelDebugTest,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};