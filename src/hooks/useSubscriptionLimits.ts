import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContextNew';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';

export const useSubscriptionLimits = () => {
  const { subscription, usage, loading } = useSubscription();

  const getCurrentPlan = () => {
    if (!subscription) return SUBSCRIPTION_PLANS[0]; // Default to free
    if (subscription.status === 'trialing') return SUBSCRIPTION_PLANS.find(plan => plan.id === 'trial') || SUBSCRIPTION_PLANS[0];
    return SUBSCRIPTION_PLANS.find(plan => plan.id === subscription.plan) || SUBSCRIPTION_PLANS[0];
  };

  const checkQuoteLimit = () => {
    if (loading || !usage) {
      return { canProceed: true, message: null, upgradeRequired: false };
    }

    const currentPlan = getCurrentPlan();
    const { quotesUsed, quotesLimit } = usage;

    if (quotesLimit === -1) {
      return { canProceed: true, message: null, upgradeRequired: false };
    }

    if (quotesUsed >= quotesLimit) {
      return {
        canProceed: false,
        message: `Du har nådd grensen på ${quotesLimit} tilbud for din ${currentPlan.name.toLowerCase()} plan. Oppgrader for å opprette flere tilbud.`,
        upgradeRequired: true
      };
    }

    return { canProceed: true, message: null, upgradeRequired: false };
  };

  const checkCustomerLimit = () => {
    if (loading || !usage) {
      return { canProceed: true, message: null, upgradeRequired: false };
    }

    const currentPlan = getCurrentPlan();
    const { customersUsed, customersLimit } = usage;

    if (customersLimit === -1) {
      return { canProceed: true, message: null, upgradeRequired: false };
    }

    if (customersUsed >= customersLimit) {
      return {
        canProceed: false,
        message: `Du har nådd grensen på ${customersLimit} kunder for din ${currentPlan.name.toLowerCase()} plan. Oppgrader for å legge til flere kunder.`,
        upgradeRequired: true
      };
    }

    return { canProceed: true, message: null, upgradeRequired: false };
  };

  const showUpgradeDialog = (message: string) => {
    // This would typically show a modal or redirect to pricing
    alert(message);
  };

  return {
    subscription,
    usage,
    loading,
    getCurrentPlan,
    checkQuoteLimit,
    checkCustomerLimit,
    showUpgradeDialog,
  };
};

export const useAutoSubscriptionInit = () => {
  const { refetch, loading } = useSubscription();

  React.useEffect(() => {
    if (!loading) {
      refetch();
    }
  }, [loading, refetch]);
};
