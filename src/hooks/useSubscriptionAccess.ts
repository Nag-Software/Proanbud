'use client';

import { useSubscription } from '@/contexts/SubscriptionContextNew';

export const useSubscriptionAccess = () => {
  const { subscription, loading } = useSubscription();

  const isTrialing = subscription?.plan === 'free' && subscription?.status === 'active' && !!subscription?.trialEnd;
  const hasActiveSubscription = subscription?.status === 'active' && subscription?.plan !== 'free';
  const isFree = subscription?.plan === 'free' && subscription?.status === 'active' && !subscription?.trialEnd;
  const isExpired = subscription?.status === 'canceled' || subscription?.status === 'past_due';

  // User has access only if they have an active paid subscription
  // Trialing users are limited (can read but not create)
  const hasAccess = hasActiveSubscription;
  
  // Trial-accessible content is available to active free plan users (trials)
  const hasTrialAccess = hasActiveSubscription || isTrialing;
  
  // User is limited if they don't have an active paid subscription
  const isLimited = !hasActiveSubscription;  return {
    hasAccess,
    hasTrialAccess,
    isLimited,
    hasActiveSubscription,
    isTrialing,
    isFree,
    isExpired,
    loading,
    subscription
  };
};

export default useSubscriptionAccess;