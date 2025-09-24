'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import * as Icons from 'lucide-react';

export const SubscriptionSettings = () => {
  const [currentPlan, setCurrentPlan] = useState('basic');
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 199,
      period: 'måned',
      features: [
        'Inntil 50 tilbud per måned',
        'Inntil 100 kunder',
        'Grunnleggende rapporter',
        'E-post support',
        '1GB lagring'
      ],
      color: 'gray'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 499,
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
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 999,
      period: 'måned',
      features: [
        'Alt i Pro',
        'Ubegrenset lagring',
        'Dedikert kundeansvarlig',
        'SLA-garanti',
        'Tilpassede integrasjoner',
        'Brukerhåndtering (teams)',
        'Backup og disaster recovery'
      ],
      color: 'purple'
    }
  ];

  const handlePlanChange = async (planId: string) => {
    setLoading(true);
    try {
      // TODO: Implement subscription change logic
      console.log('Changing plan to:', planId);
      setCurrentPlan(planId);
      // Here you would typically call your payment processor (Stripe, etc.)
    } catch (error) {
      console.error('Failed to change plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icons.CreditCard className="h-5 w-5 text-primary" />
          <CardTitle>Abonnement</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Status */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-green-900">Aktivt abonnement</h4>
              <p className="text-sm text-green-700">
                Du har {plans.find(p => p.id === currentPlan)?.name} planen
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-900">
                {formatPrice(plans.find(p => p.id === currentPlan)?.price || 0)}
              </p>
              <p className="text-sm text-green-700">per måned</p>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Velg abonnement</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 rounded-lg border-2 transition-all ${
                  currentPlan === plan.id
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
                  onClick={() => handlePlanChange(plan.id)}
                  disabled={loading || currentPlan === plan.id}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    currentPlan === plan.id
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Icons.Loader2 className="h-4 w-4 animate-spin" />
                      Behandler...
                    </div>
                  ) : currentPlan === plan.id ? (
                    'Aktivt abonnement'
                  ) : (
                    'Velg denne planen'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Faktureringsinformasjon</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Neste fakturering</p>
              <p className="text-sm text-gray-600">25. oktober 2025</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Betalingsmåte</p>
              <p className="text-sm text-gray-600">**** **** **** 1234</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
          <button className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Icons.FileText className="h-4 w-4" />
            Se fakturahistorikk
          </button>
          
          <button className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Icons.CreditCard className="h-4 w-4" />
            Oppdater betalingsinfo
          </button>
          
          <button className="flex-1 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
            <Icons.XCircle className="h-4 w-4" />
            Avbryt abonnement
          </button>
        </div>
      </CardContent>
    </Card>
  );
};