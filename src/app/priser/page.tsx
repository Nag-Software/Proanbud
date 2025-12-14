'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { FaqSection } from '@/components/shared/FaqSection';
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';
import { getSubscriptionPlans } from '@/lib/stripe-client';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load plans from Stripe on component mount
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const stripePlans = await getSubscriptionPlans();
        console.log(stripePlans);
        setPlans(stripePlans);
      } catch (error) {
        console.error('Failed to load plans:', error);
        // Fallback to hardcoded plans if API fails
        setPlans([
          {
            id: 'free',
            name: 'Gratis',
            description: 'Test alle funksjoner gratis i 14 dager – ingen kredittkort nødvendig',
            price: {
              monthly: 0,
              yearly: 0
            },
            features: [
              'Inntil 10 tilbud',
              'Inntil 10 kunder',
              'Grunnleggende statistikk'
            ],
            color: 'gray',
            cta: 'Start prøveperiode',
            popular: false
          },
          {
            id: 'standard',
            name: 'Standard',
            description: 'For små bedrifter som trenger mer funksjonalitet',
            price: {
              monthly: 699,
              yearly: 6990
            },
            features: [
              'Inntil 15 nye tilbud per måned',
              'Inntil 10 nye kunder per måned',
              'Grunnleggende rapporter',
              'E-post support',
            ],
            color: 'blue',
            cta: 'Velg Standard',
            popular: true
          },
          {
            id: 'proff',
            name: 'Proff',
            description: 'For voksende bedrifter med profesjonelle behov',
            price: {
              monthly: 1999,
              yearly: 19990
            },
            features: [
              'Ubegrenset tilbud',
              'Ubegrenset kunder',
              'Avanserte rapporter og analyser',
              'Prioritert support',
              'Integrasjoner',
            ],
            color: 'purple',
            cta: 'Velg Proff',
            popular: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const faqs = [
    {
      question: 'Kan jeg endre abonnement senere?',
      answer: 'Ja, du kan oppgradere eller nedgradere ditt abonnement når som helst. Endringer trer i kraft umiddelbart, og vi justerer faktureringen automatisk.'
    },
    {
      question: 'Hva skjer hvis jeg overskrider grensene i planen min?',
      answer: 'Vi varsler deg når du nærmer deg grensene. Du kan enkelt oppgradere til en høyere plan for å fortsette uten avbrudd.'
    },
    {
      question: 'Tilbyr dere refusjon?',
      answer: 'Vi tilbyr 30 dagers pengene-tilbake-garanti på alle betalte planer. Ingen spørsmål stilt.'
    },
    {
      question: 'Hvilke betalingsmetoder aksepterer dere?',
      answer: 'Vi aksepterer alle større kredittkort, debetkort, og Vipps. Alle betalinger er sikre og krypterte.'
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPeriodText = () => {
    return billingPeriod === 'monthly' ? 'måned' : 'år';
  };

  const getSavingsPercentage = () => {
    return '17%'; // (699*12 - 6990) / (699*12) * 100 ≈ 17%
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header currentPage="priser" />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Enkel prising for enhver bedrift
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Velg planen som passer ditt behov. Alle planer inkluderer gratis oppgradering og kan avbrytes når som helst.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
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
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-6 w-3/4"></div>
                  <div className="h-12 bg-gray-200 rounded mb-6"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  plan.popular ? 'ring-2 ring-primary scale-105 md:scale-110' : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="bg-primary text-white text-center py-2 text-sm font-medium">
                    Mest populær
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-6 min-h-[40px]">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-gray-900">
                        {formatPrice(plan.price[billingPeriod])}
                      </span>
                      <span className="text-gray-600">/{getPeriodText()}</span>
                    </div>
                    {billingPeriod === 'yearly' && plan.price.yearly > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        {formatPrice(Math.round(plan.price.yearly / 12))}/måned fakturert årlig
                      </p>
                    )}
                  </div>
                  
                  <Link
                    href="/signup"
                    className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition-colors mb-6 ${
                      plan.popular
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <Icons.Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection faqs={faqs} />

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="relative bg-gradient-to-b from-primary shadow-lg to-[#82ffb3] rounded-2xl p-12 text-white overflow-hidden">
            {/* Grainy texture overlay */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '400px 400px'
              }}
            />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4">Klar til å komme i gang?</h2>
              <p className="text-xl mb-8 text-white/90">
                Start din gratis prøveperiode i dag. Ingen kredittkort nødvendig.
              </p>
              <Link
                href="/signup"
                className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Start gratis prøveperiode
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
