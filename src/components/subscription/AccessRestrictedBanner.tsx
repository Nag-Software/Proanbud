'use client';

import React from 'react';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { Lock, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';

interface AccessRestrictedBannerProps {
  title?: string;
  message?: string;
  className?: string;
}

export const AccessRestrictedBanner: React.FC<AccessRestrictedBannerProps> = ({ 
  title = "Begrenset tilgang",
  message = "Du har ikke lenger tilgang til denne funksjonen. Oppgrader abonnementet for å fortsette.",
  className = "mb-6"
}) => {
  const { isLimited, hasTrialAccess, subscription } = useSubscriptionAccess();

  // Don't show banner for users with trial access
  if (!isLimited || hasTrialAccess) {
    return null;
  }

  const getIcon = () => {
    if (!subscription || subscription.plan === 'free') return Lock;
    if (subscription.status === 'trialing') return Clock;
    return AlertTriangle;
  };

  const getStatusMessage = () => {
    if (!subscription || subscription.plan === 'free') {
      return "Ingen aktiv abonnement";
    }
    if (subscription.status === 'trialing') {
      return "Prøveperioden er utløpt";
    }
    if (subscription.status === 'past_due') {
      return "Betalingsproblem";
    }
    return "Abonnement inaktivt";
  };

  const Icon = getIcon();

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Icon className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">{title}</h3>
            <p className="text-sm text-red-700 mb-1">{getStatusMessage()}</p>
            <p className="text-sm text-red-600 mb-4">{message}</p>
            <Link 
              href="/innstillinger"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Oppgrader abonnement
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessRestrictedBanner;