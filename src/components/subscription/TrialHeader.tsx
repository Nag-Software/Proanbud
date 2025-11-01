'use client';

import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContextNew';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { getDaysRemaining } from '@/lib/stripe-client';
import { AlertTriangle, X, Lock } from 'lucide-react';
import Link from 'next/link';

export const TrialHeader = () => {
  const { subscription, loading, debugTimeOffset: contextDebugTimeOffset, timetravelDebugTest } = useSubscription();
  const { isTrialing, isFree, isExpired, hasActiveSubscription } = useSubscriptionAccess();
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Local state to ensure re-renders when debug offset changes
  const [localDebugOffset, setLocalDebugOffset] = React.useState(contextDebugTimeOffset);

  // Sync local state with context
  React.useEffect(() => {
    setLocalDebugOffset(contextDebugTimeOffset);
  }, [contextDebugTimeOffset]);

  // Convert seconds back to days for display
  const displayOffsetDays = Math.round(localDebugOffset / (24 * 60 * 60));

  if (loading || isDismissed) {
    return null;
  }

  // Check if trial has expired
  const currentTime = Math.floor(Date.now() / 1000) + localDebugOffset;
  const daysRemaining = subscription?.trialEnd ? getDaysRemaining(subscription.trialEnd, currentTime) :
                        subscription?.currentPeriodEnd ? getDaysRemaining(subscription.currentPeriodEnd, currentTime) : 0;
  const isTrialExpired = isTrialing && daysRemaining <= 0;

  // Don't show header if user has active subscription
  if (hasActiveSubscription) {
    return null;
  }

  // Handle expired trial or no subscription
  if (!isTrialing || isExpired || isFree || isTrialExpired) {
    return (
      <div className="bg-red-600 text-white py-2 m-3 text-center relative rounded-lg">
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
          disabled
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
    <div className={`${bgColor} ${textColor} py-2 px-4 text-center relative rounded-lg m-3`}>
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
      {/* Debug controls (development only) */}
      {/*}
      {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_DEBUG_TIME_TRAVEL) && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex gap-1">
          <button
            onClick={() => timetravelDebugTest(-7)}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded"
            title="Subtract 7 days"
          >
            -7d
          </button>
          <button
            onClick={() => timetravelDebugTest(-1)}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded"
            title="Subtract 1 day"
          >
            -1d
          </button>
          <button
            onClick={() => timetravelDebugTest(0)}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded"
            title="Reset to current time"
          >
            Now
          </button>
          <button
            onClick={() => timetravelDebugTest(1)}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded"
            title="Add 1 day"
          >
            +1d
          </button>
          <button
            onClick={() => timetravelDebugTest(7)}
            className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded"
            title="Add 7 days"
          >
            +7d
          </button>
          {displayOffsetDays !== 0 && (
            <span className="text-white text-xs px-2 py-1 bg-white/20 rounded">
              {displayOffsetDays > 0 ? '+' : ''}{displayOffsetDays}d
            </span>
          )}
        </div>
      )}
        */}
      {/* Close button only for expired trials, not for active trials */}
      {(!isTrialing || isTrialExpired) && (
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:bg-white/20 rounded p-1"
          aria-label="Lukk varsel"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
