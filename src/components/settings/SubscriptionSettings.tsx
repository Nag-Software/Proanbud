'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import * as Icons from 'lucide-react';
import { BusinessSettings } from '@/lib/types';
import { useSubscription } from '@/contexts/SubscriptionContextNew';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { getSubscriptionPlans, formatPrice, getDaysRemaining } from '@/lib/stripe-client';

export const SubscriptionSettings = ({ businessSettings }: { businessSettings: BusinessSettings | null }) => {
  const { subscription, usage, createCheckoutSession, createCustomerPortalSession, cancelSubscription, resumeSubscription, syncSubscriptions, debugTimeOffset: contextDebugTimeOffset } = useSubscription();
  const { isLimited } = useSubscriptionAccess();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Local state to ensure re-renders when debug offset changes
  const [localDebugOffset, setLocalDebugOffset] = useState(contextDebugTimeOffset);

  // Load plans from Stripe on component mount
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const stripePlans = await getSubscriptionPlans();
        setPlans(stripePlans);
      } catch (error) {
        console.error('Failed to load plans:', error);
        // Fallback to hardcoded plans if API fails
        setPlans([
          {
            id: 'free',
            name: 'Gratis',
            price: { monthly: 0, yearly: 0 },
            features: ['Inntil 3 tilbud', 'Inntil 1 kunder']
          },
          {
            id: 'standard',
            name: 'Standard',
            price: { monthly: 699, yearly: 6990 },
            features: ['Inntil 15 tilbud per måned', 'Inntil 10 kunder']
          },
          {
            id: 'proff',
            name: 'Proff',
            price: { monthly: 1999, yearly: 19990 },
            features: ['Ubegrenset tilbud', 'Ubegrenset kunder']
          },
          {
            id: 'trial',
            name: 'Prøveperiode',
            price: { monthly: 0, yearly: 0 },
            features: ['14 dager gratis']
          }
        ]);
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, []);

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
    return '17%'; // (699*12 - 6990) / (699*12) * 100 ≈ 17%
  };

  const currentPlan = (subscription?.plan === 'free' && subscription?.status === 'active' && !!subscription?.trialEnd)
    ? plans.find((p: any) => p.id === 'trial')
    : subscription 
      ? plans.find((p: any) => p.id === subscription.plan) 
      : plans[0];
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
            </div>
          )}

          {/* Subscription Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {/* Manage Subscription Button - Show for active subscriptions only */}
            {subscription?.status === 'active' && subscription.stripeCustomerId && (
              <button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Icons.Settings className="h-4 w-4" />
                Administrer abonnement
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Velg faktureringsperiode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="inline-flex items-center gap-4 bg-gray-100 p-2 rounded-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md transition-all font-medium ${
                billingPeriod === 'monthly'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Månedlig
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md transition-all font-medium flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Årlig
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Spar {getSavingsPercentage()}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div id="/innstillinger#plans" hidden></div>
      <Card>
        <CardHeader>
          <CardTitle>Oppgrader abonnement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.filter((plan: any) => plan.id !== 'free' && plan.id !== 'trial').map((plan: any) => {
              const isCurrentPlan = subscription?.plan === plan.id && subscription?.status === 'active';
              const canUpgrade = !isLoading && plan.stripePriceId?.[billingPeriod] && (subscription?.status !== 'active' || subscription?.plan !== plan.id);
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                    plan.popular ? 'ring-2 ring-primary' : 'border border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="bg-primary text-white text-center py-2 text-sm font-medium">
                      Mest populær
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">
                          {formatPrice(plan.price[billingPeriod])}
                        </span>
                        <span className="text-gray-600">/{getPeriodText()}</span>
                      </div>
                      {billingPeriod === 'yearly' && plan.price.yearly > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          {formatPrice(Math.round(plan.price.yearly / 12))}/mnd
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const priceId = plan.stripePriceId?.[billingPeriod];
                        if (priceId) {
                          handleUpgrade(priceId);
                        } else {
                          alert(`Pris-ID for ${plan.name} (${billingPeriod}) er ikke konfigurert. Kontakt support.`);
                        }
                      }}
                      disabled={!canUpgrade}
                      className={`w-full text-center py-2.5 px-4 rounded-lg font-medium transition-colors mb-4 ${
                        plan.popular
                          ? 'bg-primary text-white hover:bg-primary/90'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      } disabled:opacity-50`}
                    >
                      {isCurrentPlan ? 'Plan aktivert' : isLoading ? 'Laster...' : plan.cta}
                    </button>

                    <ul className="space-y-2">
                      {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Icons.Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
