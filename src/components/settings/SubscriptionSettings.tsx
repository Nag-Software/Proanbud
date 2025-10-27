'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import * as Icons from 'lucide-react';
import { BusinessSettings } from '@/lib/types';
import { useSubscription } from '@/contexts/SubscriptionContextNew';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { SUBSCRIPTION_PLANS, formatPrice, getDaysRemaining } from '@/lib/stripe-client';

export const SubscriptionSettings = ({ businessSettings }: { businessSettings: BusinessSettings | null }) => {
  const { subscription, usage, createCheckoutSession, createCustomerPortalSession, cancelSubscription, resumeSubscription, syncSubscriptions, debugTimeOffset: contextDebugTimeOffset } = useSubscription();
  const { isLimited } = useSubscriptionAccess();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  // Local state to ensure re-renders when debug offset changes
  const [localDebugOffset, setLocalDebugOffset] = useState(contextDebugTimeOffset);

  // Sync local state with context
  React.useEffect(() => {
    setLocalDebugOffset(contextDebugTimeOffset);
  }, [contextDebugTimeOffset]);

  const handleUpgrade = async (priceId: string) => {
    if (!priceId) {
      console.error('No price ID provided');
      alert('Pris-ID er ikke konfigurert. Kontakt support.');
      return;
    }
    
    console.log('Attempting to create checkout session with price ID:', priceId);
    
    setIsLoading(true);
    try {
      const { url } = await createCheckoutSession(priceId);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Feil ved opprettelse av checkout session. Sjekk at Stripe er konfigurert riktig.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Er du sikker på at du vil avbryte abonnementet?')) return;
    
    setIsLoading(true);
    try {
      await cancelSubscription();
      alert('Abonnement avbrutt. Du kan fortsette å bruke tjenesten til slutten av faktureringsperioden.');
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Feil ved avbrytelse av abonnement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsLoading(true);
    try {
      await resumeSubscription();
      alert('Abonnement gjenopptatt.');
    } catch (error) {
      console.error('Error resuming subscription:', error);
      alert('Feil ved gjenopptakelse av abonnement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const portalUrl = await createCustomerPortalSession();
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      alert('Feil ved opprettelse av abonnementshåndtering. Sjekk at du har et aktivt abonnement.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodText = () => {
    return billingPeriod === 'monthly' ? 'måned' : 'år';
  };

  const getSavingsPercentage = () => {
    return '17%'; // (299*12 - 2990) / (299*12) * 100 ≈ 17%
  };

  const currentPlan = (subscription?.plan === 'free' && subscription?.status === 'active' && !!subscription?.trialEnd)
    ? SUBSCRIPTION_PLANS.find(p => p.id === 'trial')
    : subscription 
      ? SUBSCRIPTION_PLANS.find(p => p.id === subscription.plan) 
      : SUBSCRIPTION_PLANS[0];
  const isTrial = subscription?.plan === 'free' && subscription?.status === 'active' && !!subscription?.trialEnd;
  const currentTime = Math.floor(Date.now() / 1000) + localDebugOffset;
  const daysRemaining = subscription?.trialEnd ? getDaysRemaining(subscription.trialEnd, currentTime) : 0;

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.CreditCard className="h-5 w-5" />
            Abonnement Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {subscription?.status === 'canceled' ? (
                <>
                  <h3 className="font-semibold text-lg text-red-600">Ingen aktiv abonnoment</h3>
                  <p className="text-sm text-muted-foreground">
                    Ditt abonnement er avsluttet
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-lg">{currentPlan?.name}
                    {isTrial && `Gratis Prøveperiode`}
                    </h3> 
                  <p className="text-sm text-muted-foreground">
                    {subscription?.status === 'active' && subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd && (
                      `Avbrytes om ${getDaysRemaining(subscription.currentPeriodEnd, currentTime)} dager`
                    )}
                    {subscription?.status === 'active' && !subscription?.cancelAtPeriodEnd && 'Aktivt abonnement'}
                    {subscription?.status === 'past_due' && 'Betaling forsinket'}
                  </p>
                </>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {subscription?.status === 'canceled' ? '0' : formatPrice(currentPlan?.price[billingPeriod] || 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                {subscription?.status === 'canceled' ? '' : `/${getPeriodText()}`}
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          {usage && subscription?.status !== 'canceled' && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <div className="text-sm text-muted-foreground">Tilbud brukt</div>
                <div className="font-semibold">
                  {subscription?.status === 'active'
                    ? `${usage.quotesUsed} / ${usage.quotesLimit === -1 ? '∞' : usage.quotesLimit}`
                    : '0 / 0'
                  }
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Kunder</div>
                <div className="font-semibold">
                  {subscription?.status === 'active'
                    ? `${usage.customersUsed} / ${usage.customersLimit === -1 ? '∞' : usage.customersLimit}`
                    : '0 / 0'
                  }
                </div>
              </div>

              {/* Basic Plan */}
              <div className="relative rounded-lg border-2 border-gray-200 p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Basic</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">299 kr</span>
                    <span className="text-gray-600 ml-1">/ måned</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600 text-left">
                    <li className="flex items-center">
                      <Icons.Check className="h-4 w-4 text-green-500 mr-2" />
                      Ubegrensede tilbud
                    </li>
                    <li className="flex items-center">
                      <Icons.Check className="h-4 w-4 text-green-500 mr-2" />
                      Ubegrensede kunder
                    </li>
                    <li className="flex items-center">
                      <Icons.Check className="h-4 w-4 text-green-500 mr-2" />
                      Alle maler
                    </li>
                    <li className="flex items-center">
                      <Icons.Check className="h-4 w-4 text-green-500 mr-2" />
                      E-poststøtte
                    </li>
                  </ul>
                </div>
                <div className="mt-6">
                  <button 
                    disabled
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium opacity-50 cursor-not-allowed"
                  >
                    Kommer snart
                  </button>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="relative rounded-lg border-2 border-gray-200 p-6">
                <div className="absolute -top-2 right-4">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Populær
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">599 kr</span>
                    <span className="text-gray-600 ml-1">/ måned</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600 text-left">
                    <li className="flex items-center">
                      <Icons.Check className="h-4 w-4 text-green-500 mr-2" />
                      Alt i Basic
                    </li>
                    <li className="flex items-center">
                      <Icons.Check className="h-4 w-4 text-green-500 mr-2" />
                      Prioritert støtte
                    </li>
                    <li className="flex items-center">
                      <Icons.Check className="h-4 w-4 text-green-500 mr-2" />
                      Egendefinerte maler
                    </li>
                    <li className="flex items-center">
                      <Icons.Check className="h-4 w-4 text-green-500 mr-2" />
                      API-tilgang
                    </li>
                  </ul>
                </div>
                <div className="mt-6">
                  <button 
                    disabled
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md font-medium opacity-50 cursor-not-allowed"
                  >
                    Kommer snart
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sync Subscription Data */}
      <Card>
        <CardHeader>
          <CardTitle>Synkroniser abonnement data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Abonnementsdata synkroniseres automatisk hver minutt. Bruk denne knappen for å tvinge en umiddelbar synkronisering hvis du opplever problemer.
          </p>
          <button
            onClick={async () => {
              try {
                await syncSubscriptions();
              } catch (error) {
                console.error('Sync failed:', error);
                alert('Kunne ikke synkronisere abonnement data. Prøv igjen senere.');
              }
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {isLoading ? 'Synkroniserer...' : 'Synkroniser abonnement data'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};
