'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import * as Icons from 'lucide-react';
import { BusinessSettings } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSubscription,
  redirectToCheckout,
  createPortalSession,
  cancelSubscription,
  type SubscriptionData,
} from '@/lib/services/stripeService';

export const SubscriptionSettings = ({ businessSettings }: { businessSettings: BusinessSettings | null }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Gratis',
      price: 0,
      period: 'måned',
      features: [
        'Inntil 5 tilbud per måned',
        'Inntil 3 kunder',
        'Grunnleggende maler',
      ],
      color: 'gray',
      stripePriceId: null,
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 299,
      period: 'måned',
      features: [
        'Inntil 15 tilbud per måned',
        'Inntil 10 kunder',
        'Grunnleggende rapporter',
        'E-post support',
        '1GB lagring'
      ],
      color: 'blue',
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 799,
      period: 'måned',
      features: [
        'Ubegrenset tilbud',
        'Ubegrenset kunder',
        'Avanserte rapporter og analyser',
        'Prioritert support',
        '10GB lagring',
        'API-tilgang',
        'Tilpassede maler'
      ],
      color: 'blue',
      popular: true,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    }
  ];

  useEffect(() => {
    loadSubscription();

    // Check for success parameter in URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const sessionId = urlParams.get('session_id');

      if (success === 'true' && sessionId) {
        handleSuccessfulPayment(sessionId);
      }
    }
  }, [user]);

  const handleSuccessfulPayment = async (sessionId: string) => {
    setSuccessMessage('Betaling vellykket! Oppdaterer abonnement...');
    
    try {
      // Verify session and update Firebase directly (fallback if webhook is delayed)
      const response = await fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Session verified:', data);
        setSuccessMessage('Abonnement aktivert! 🎉');
        
        // Reload subscription to show updated data
        await loadSubscription();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        const error = await response.json();
        console.error('Failed to verify session:', error);
        setSuccessMessage('Betaling vellykket! Vent litt mens vi aktiverer abonnementet...');
        
        // Fallback: Wait and reload (in case webhook processes later)
        setTimeout(async () => {
          await loadSubscription();
          setSuccessMessage('Abonnement aktivert! 🎉');
          setTimeout(() => {
            setSuccessMessage(null);
          }, 5000);
        }, 3000);
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      setSuccessMessage('Betaling vellykket! Vent litt mens vi aktiverer abonnementet...');
      
      // Fallback: Wait and reload
      setTimeout(async () => {
        await loadSubscription();
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }, 3000);
    }

    // Clean up URL
    window.history.replaceState({}, '', '/innstillinger');
  };

  const loadSubscription = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const subData = await getSubscription(user.uid);
      setSubscription(subData);
      
      // Check if Stripe is configured
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        setError('Stripe er ikke konfigurert. Vennligst kontakt administrator.');
      }
    } catch (err: any) {
      console.error('Failed to load subscription:', err);
      
      // Don't show error if it's just missing config
      if (!err.message.includes('not configured')) {
        setError(err.message);
      }
      
      // Default to free plan on error
      setSubscription({
        plan: 'free',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (planId: string, stripePriceId: string | null | undefined) => {
    if (!user?.uid || !user?.email) {
      setError('Du må være logget inn for å endre abonnement');
      return;
    }

    if (planId === 'free') {
      setError('Vennligst avbryt ditt nåværende abonnement først');
      return;
    }

    if (!stripePriceId) {
      setError('Ugyldig prisplan');
      return;
    }

    setActionLoading(planId);
    setError(null);

    try {
      await redirectToCheckout({
        priceId: stripePriceId,
        userId: user.uid,
        email: user.email,
      });
    } catch (err: any) {
      console.error('Failed to start checkout:', err);
      setError(err.message || 'Kunne ikke starte betalingsprosessen');
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!subscription?.stripeCustomerId) {
      setError('Ingen aktiv betalingsinformasjon funnet');
      return;
    }

    setActionLoading('portal');
    setError(null);

    try {
      const { url } = await createPortalSession(subscription.stripeCustomerId);
      window.location.href = url;
    } catch (err: any) {
      console.error('Failed to open portal:', err);
      setError(err.message || 'Kunne ikke åpne kundeportalen');
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.uid) return;

    const confirmed = window.confirm(
      'Er du sikker på at du vil avbryte abonnementet ditt? Du vil ha tilgang til slutten av faktureringsperioden.'
    );

    if (!confirmed) return;

    setActionLoading('cancel');
    setError(null);

    try {
      await cancelSubscription(user.uid);
      await loadSubscription(); // Reload subscription data
      alert('Abonnementet er kansellert og vil utløpe ved slutten av faktureringsperioden.');
    } catch (err: any) {
      console.error('Failed to cancel subscription:', err);
      setError(err.message || 'Kunne ikke avbryte abonnement');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icons.CreditCard className="h-5 w-5 text-primary" />
            <CardTitle>Abonnement</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = plans.find(p => p.id === subscription?.plan);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icons.CreditCard className="h-5 w-5 text-primary" />
          <CardTitle>Abonnement</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Icons.CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Configuration Warning */}
        {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Icons.Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Stripe er ikke konfigurert</p>
                <p className="text-xs text-blue-700 mt-1">
                  For å aktivere abonnementsfunksjoner, legg til Stripe-nøkler i .env.local filen.
                  Se STRIPE_QUICKSTART.md for instruksjoner.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && error.includes('konfigurert') && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <Icons.AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}
        
        {error && !error.includes('konfigurert') && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <Icons.AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Current Plan Status */}
        <div className={`p-4 rounded-lg border ${
          subscription?.cancelAtPeriodEnd
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`font-medium ${
                subscription?.cancelAtPeriodEnd ? 'text-yellow-900' : 'text-green-900'
              }`}>
                {subscription?.cancelAtPeriodEnd ? 'Abonnementet utløper' : 'Aktivt abonnement'}
              </h4>
              <p className={`text-sm ${
                subscription?.cancelAtPeriodEnd ? 'text-yellow-700' : 'text-green-700'
              }`}>
                Du har {currentPlan?.name} planen
              </p>
              {subscription?.cancelAtPeriodEnd && (
                <p className="text-xs text-yellow-600 mt-1">
                  Utløper {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className={`font-bold ${
                subscription?.cancelAtPeriodEnd ? 'text-yellow-900' : 'text-green-900'
              }`}>
                {formatPrice(currentPlan?.price || 0)}
              </p>
              <p className={`text-sm ${
                subscription?.cancelAtPeriodEnd ? 'text-yellow-700' : 'text-green-700'
              }`}>
                per måned
              </p>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Velg abonnement</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.plan === plan.id;
              const isPaidPlan = plan.id !== 'free';
              
              return (
                <div
                  key={plan.id}
                  className={`relative p-6 rounded-lg border-2 transition-all ${
                    isCurrentPlan
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Mest populær
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Icons.Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handlePlanChange(plan.id, plan.stripePriceId)}
                    disabled={actionLoading !== null || isCurrentPlan || !isPaidPlan}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : isPaidPlan
                        ? 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {actionLoading === plan.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <Icons.Loader2 className="h-4 w-4 animate-spin" />
                        Behandler...
                      </div>
                    ) : isCurrentPlan ? (
                      'Aktivt abonnement'
                    ) : !isPaidPlan ? (
                      'Gratis plan'
                    ) : (
                      'Velg denne planen'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Billing Information */}
        {subscription?.plan !== 'free' && subscription?.currentPeriodEnd && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Faktureringsinformasjon</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Neste fakturering</p>
                <p className="text-sm text-gray-600">
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <p className="text-sm text-gray-600 capitalize">
                  {subscription.status === 'active' ? 'Aktiv' : 
                   subscription.status === 'canceled' ? 'Kansellert' :
                   subscription.status === 'past_due' ? 'Forfalt' :
                   subscription.status}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
          {subscription?.stripeCustomerId && (
            <button
              onClick={handleManageBilling}
              disabled={actionLoading !== null}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading === 'portal' ? (
                <>
                  <Icons.Loader2 className="h-4 w-4 animate-spin" />
                  Åpner...
                </>
              ) : (
                <>
                  <Icons.CreditCard className="h-4 w-4" />
                  Administrer fakturering
                </>
              )}
            </button>
          )}
          
          {subscription?.plan !== 'free' && !subscription?.cancelAtPeriodEnd && (
            <button
              onClick={handleCancelSubscription}
              disabled={actionLoading !== null}
              className="flex-1 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading === 'cancel' ? (
                <>
                  <Icons.Loader2 className="h-4 w-4 animate-spin" />
                  Kansellerer...
                </>
              ) : (
                <>
                  <Icons.XCircle className="h-4 w-4" />
                  Avbryt abonnement
                </>
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};