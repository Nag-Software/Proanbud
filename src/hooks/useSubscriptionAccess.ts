'use client';

import { useSubscription } from '@/contexts/SubscriptionContextNew';

export const useSubscriptionAccess = () => {
  const { subscription, loading } = useSubscription();

  console.log(subscription);

  const hasActiveSubscription = subscription?.status === 'active';
  const isTrialing = subscription?.status === 'trialing';
  const isFree = !subscription || (subscription.plan === 'free' && subscription.status !== 'trialing');
  const isExpired = subscription?.status === 'canceled' || subscription?.status === 'past_due';

  // User has access only if they have an active paid subscription
  // Trialing users are limited (can read but not create)
  const hasAccess = hasActiveSubscription;
  
  // Trial-accessible content is available to active and trialing users
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