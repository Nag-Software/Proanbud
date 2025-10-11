'use client';

import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContextNew';
import { SubscriptionPlan } from '@/lib/subscription-types';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard, Zap } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredPlan?: SubscriptionPlan;
  feature?: string;
  fallback?: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  requiredPlan = 'basic',
  feature,
  fallback
}) => {
  const { subscription, loading, createCheckoutSession } = useSubscription();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has required access
  const hasAccess = checkSubscriptionAccess(subscription, requiredPlan);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt
  return <UpgradePrompt requiredPlan={requiredPlan} feature={feature} />;
};

// Helper function to check subscription access
function checkSubscriptionAccess(
  subscription: any,
  requiredPlan: SubscriptionPlan
): boolean {
  if (!subscription) return false;

  // Always allow access during trial
  if (subscription.status === 'trialing' && 
      subscription.currentPeriodEnd > Math.floor(Date.now() / 1000)) {
    return true;
  }

  // Check if subscription is active
  if (subscription.status !== 'active') return false;

  // Check plan hierarchy: free < basic < pro
  const planHierarchy: Record<SubscriptionPlan, number> = {
    free: 0,
    basic: 1,
    pro: 2
  };

  const userPlanLevel = planHierarchy[subscription.plan as SubscriptionPlan] || 0;
  const requiredPlanLevel = planHierarchy[requiredPlan] || 1;

  return userPlanLevel >= requiredPlanLevel;
}

interface UpgradePromptProps {
  requiredPlan: SubscriptionPlan;
  feature?: string;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ requiredPlan, feature }) => {
  const { createCheckoutSession } = useSubscription();
  const [upgrading, setUpgrading] = React.useState(false);

  const planDetails = SUBSCRIPTION_PLANS.find(plan => plan.id === requiredPlan);
  
  const handleUpgrade = async () => {
    if (!planDetails?.stripePriceId?.monthly) return;
    
    setUpgrading(true);
    try {
      const session = await createCheckoutSession(planDetails.stripePriceId.monthly);
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setUpgrading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Oppgrader for å få tilgang</CardTitle>
        <CardDescription>
          {feature 
            ? `${feature} krever ${planDetails?.name || requiredPlan} abonnement`
            : `Denne funksjonen krever ${planDetails?.name || requiredPlan} abonnement`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {planDetails && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">
              {planDetails.name}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-bold">
                {planDetails.price.monthly === 0 ? 'Gratis' : `${planDetails.price.monthly} kr`}
              </span>
              {planDetails.price.monthly > 0 && (
                <span className="text-sm text-muted-foreground">/måned</span>
              )}
            </div>
            <ul className="space-y-1">
              {planDetails.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                  <Zap className="w-3 h-3 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={handleUpgrade}
            disabled={upgrading || !planDetails?.stripePriceId?.monthly}
            className="flex-1"
          >
            {upgrading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Oppgraderer...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Oppgrader nå
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for checking subscription access in components
export const useSubscriptionAccess = (requiredPlan: SubscriptionPlan = 'basic') => {
  const { subscription, loading } = useSubscription();
  
  return {
    hasAccess: !loading && checkSubscriptionAccess(subscription, requiredPlan),
    loading,
    subscription
  };
};