'use client';

import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContextNew';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { getDaysRemaining } from '@/lib/stripe';
import { AlertTriangle, X, Lock } from 'lucide-react';
import Link from 'next/link';

export const TrialHeader = () => {
  const { subscription, loading } = useSubscription();
  const { isTrialing, isFree, isExpired, hasActiveSubscription } = useSubscriptionAccess();
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (loading || isDismissed) {
    return null;
  }

  // Check if trial has expired (even if status is still 'trialing')
  const daysRemaining = subscription?.trialEnd ? getDaysRemaining(subscription.trialEnd) : 
                        subscription?.currentPeriodEnd ? getDaysRemaining(subscription.currentPeriodEnd) : 0;
  const isTrialExpired = isTrialing && daysRemaining <= 0;

  // Don't show header if user has active subscription
  if (hasActiveSubscription) {
    return null;
  }

  // Handle expired trial or no subscription
  if (!isTrialing || isExpired || isFree || isTrialExpired) {
    return (
      <div className="bg-red-600 text-white py-3 px-4 text-center relative">
        <div className="flex items-center justify-center gap-2">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isExpired ? 'Abonnementet er utløpt' : 'Ingen aktiv abonnement'}
            {' - Begrenset tilgang'}
          </span>
          <Link 
            href="/innstillinger" 
            className="ml-2 bg-white text-red-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Oppgrader nå
          </Link>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:bg-white/20 rounded p-1"
          aria-label="Lukk varsel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Handle active trial
  console.log('TrialHeader - daysRemaining:', daysRemaining);

  if (daysRemaining <= 0) {
    return (
      <div className="bg-red-600 text-white py-3 px-4 text-center relative">
        <div className="flex items-center justify-center gap-2">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">
            Prøveperioden er utløpt - Begrenset tilgang
          </span>
          <Link 
            href="/innstillinger" 
            className="ml-2 bg-white text-red-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Oppgrader nå
          </Link>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:bg-white/20 rounded p-1"
          aria-label="Lukk varsel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const isExpiringSoon = daysRemaining <= 3;
  const bgColor = isExpiringSoon ? 'bg-red-500' : 'bg-orange-500';
  const textColor = 'text-white';

  return (
    <div className={`${bgColor} ${textColor} py-2 px-4 text-center relative`}>
      <div className="flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          {isExpiringSoon 
            ? `Prøveperioden utløper om ${daysRemaining} dag${daysRemaining !== 1 ? 'er' : ''}!`
            : `${daysRemaining} dager igjen av prøveperioden`
          }
        </span>
        <Link 
          href="/innstillinger" 
          className="ml-2 underline hover:no-underline text-sm"
        >
          Oppgrader nå
        </Link>
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:bg-white/20 rounded p-1"
        aria-label="Lukk varsel"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
