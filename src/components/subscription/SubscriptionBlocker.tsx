'use client';

import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContextNew';
import { SubscriptionGuard } from '@/components/subscription/SubscriptionGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';

interface SubscriptionBlockerProps {
  children: React.ReactNode;
}

export const SubscriptionBlocker: React.FC<SubscriptionBlockerProps> = ({ children }) => {
  const { subscription, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Block access if subscription is expired or has payment issues
  const isBlocked = shouldBlockAccess(subscription);

  if (isBlocked) {
    return <SubscriptionExpiredPrompt subscription={subscription} />;
  }

  return <>{children}</>;
};

function shouldBlockAccess(subscription: any): boolean {
  // Never completely block access - allow read-only navigation
  // Individual components will handle their own restrictions
  return false;
}

interface SubscriptionExpiredPromptProps {
  subscription: any;
}

const SubscriptionExpiredPrompt: React.FC<SubscriptionExpiredPromptProps> = ({ subscription }) => {
  const { createCheckoutSession } = useSubscription();
  const [upgrading, setUpgrading] = React.useState(false);

  const getPromptConfig = () => {
    if (!subscription) {
      return {
        icon: XCircle,
        title: 'Abonnement påkrevd',
        description: 'Du trenger et aktivt abonnement for å bruke Proanbud.',
        buttonText: 'Start abonnement',
        buttonVariant: 'default' as const
      };
    }

    if (subscription.plan === 'free' && subscription.status === 'active') {
      return {
        icon: Clock,
        title: 'Prøveperioden er utløpt',
        description: 'Din gratis prøveperiode på 14 dager er over. Oppgrader for å fortsette å bruke alle funksjonene.',
        buttonText: 'Oppgrader nå',
        buttonVariant: 'default' as const
      };
    }

    if (subscription.status === 'past_due') {
      return {
        icon: AlertTriangle,
        title: 'Betalingsproblem',
        description: 'Vi kunne ikke behandle din siste betaling. Oppdater betalingsinformasjonen din for å fortsette.',
        buttonText: 'Oppdater betaling',
        buttonVariant: 'destructive' as const
      };
    }

    return {
      icon: XCircle,
      title: 'Abonnement inaktivt',
      description: 'Ditt abonnement er ikke aktivt. Reaktiver for å fortsette å bruke Proanbud.',
      buttonText: 'Reaktiver abonnement',
      buttonVariant: 'default' as const
    };
  };

  const config = getPromptConfig();
  const IconComponent = config.icon;

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      // Default to standard plan if no preference
      const priceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID;
      if (!priceId) {
        console.error('No price ID configured');
        return;
      }
      
      const session = await createCheckoutSession(priceId);
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <IconComponent className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{config.title}</CardTitle>
          <CardDescription className="text-center">
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleUpgrade}
            disabled={upgrading}
            variant={config.buttonVariant}
            className="w-full"
          >
            {upgrading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Behandler...
              </>
            ) : (
              config.buttonText
            )}
          </Button>
          
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/innstillinger'}>
              Gå til innstillinger
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};