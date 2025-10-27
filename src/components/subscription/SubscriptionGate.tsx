'use client';

import React from 'react';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { Lock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireActiveSubscription?: boolean;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ 
  children, 
  fallback,
  requireActiveSubscription = false 
}) => {
  const { hasAccess, hasActiveSubscription, isLimited, loading } = useSubscriptionAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If requiring active subscription specifically (not trial)
  if (requireActiveSubscription && !hasActiveSubscription) {
    return fallback || (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Krever aktivt abonnement
        </h3>
        <p className="text-gray-600 mb-4">
          Denne funksjonen er kun tilgjengelig for betalende kunder.
        </p>
        <Link 
          href="/innstillinger"
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Oppgrader abonnement
        </Link>
      </div>
    );
  }

  // If no access at all (expired trial, no subscription, etc.)
  if (isLimited) {
    return fallback || (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-900 mb-2">
          Ingen tilgang
        </h3>
        <p className="text-red-700 mb-4">
          Du har ikke lenger tilgang til denne funksjonen. Oppgrader abonnementet for å fortsette.
        </p>
        <Link 
          href="/innstillinger"
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Oppgrader nå
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;