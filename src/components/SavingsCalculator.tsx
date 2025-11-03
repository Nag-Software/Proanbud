'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { fetchStripePrices } from '@/lib/stripe-client';

interface CalculatorProps {
  variant?: 'full' | 'compact';
  showEmailCapture?: boolean;
}

type ScenarioType = 'minimum' | 'maximum';

export function SavingsCalculator({ variant = 'full', showEmailCapture = false }: CalculatorProps) {
  const [quotesPerMonth, setQuotesPerMonth] = useState(10);
  const [currentTimePerQuote, setCurrentTimePerQuote] = useState(2);
  const [hourlyRate, setHourlyRate] = useState(900);
  const [scenario, setScenario] = useState<ScenarioType>('minimum');
  const [prices, setPrices] = useState({
    basic: { monthly: 699, yearly: 6990 },
    pro: { monthly: 1999, yearly: 19990 }
  });
  
  const [savings, setSavings] = useState({
    hoursPerMonth: 0,
    valuePerMonth: 0,
    valuePerYear: 0,
    timeReduction: 0,
  });

  const PROANBUD_TIMES = {
    minimum: 5 / 60,
    maximum: 15 / 60
  };

  const proanbudTimePerQuote = PROANBUD_TIMES[scenario];

  // Fetch prices from Stripe on mount
  useEffect(() => {
    const loadPrices = async () => {
      try {
        const stripePrices = await fetchStripePrices();
        setPrices(stripePrices);
      } catch (error) {
        console.error('Failed to load prices:', error);
        // Keep fallback prices
      }
    };
    loadPrices();
  }, []);

  useEffect(() => {
    const currentTotalTime = quotesPerMonth * currentTimePerQuote;
    const proanbudTotalTime = quotesPerMonth * proanbudTimePerQuote;
    const hoursSaved = currentTotalTime - proanbudTotalTime;
    
    const monthlySavings = hoursSaved * hourlyRate;
    const yearlySavings = monthlySavings * 12;
    
    const reductionPercent = ((currentTimePerQuote - proanbudTimePerQuote) / currentTimePerQuote) * 100;
    
    setSavings({
      hoursPerMonth: Math.round(hoursSaved * 10) / 10,
      valuePerMonth: Math.round(monthlySavings),
      valuePerYear: Math.round(yearlySavings),
      timeReduction: Math.round(reductionPercent),
    });
  }, [quotesPerMonth, currentTimePerQuote, hourlyRate, scenario, proanbudTimePerQuote]);

  if (variant === 'compact') {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5 text-gray-700" />
            Se hvor mye du kan spare
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Kalkuler din potensielle besparelse med Proanbud
          </p>
          <Link
            href="/kalkulator"
            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all font-medium w-full"
          >
            Åpne kalkulator
            <ArrowRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Scenario Tabs */}
      <div className="border-b border-gray-200 bg-gray-50/50">
        <div className="flex">
          <button
            onClick={() => setScenario('minimum')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
              scenario === 'minimum'
                ? 'text-gray-900 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {scenario === 'minimum' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
            Minimum (5 min/tilbud)
          </button>
          <button
            onClick={() => setScenario('maximum')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
              scenario === 'maximum'
                ? 'text-gray-900 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {scenario === 'maximum' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
            )}
            Maksimum (15 min/tilbud)
          </button>
        </div>
      </div>

      <div className="p-6 md:p-7 space-y-6">
        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-medium text-gray-700">
                Antall tilbud per måned
              </label>
              <span className="text-lg font-semibold text-gray-900">{quotesPerMonth}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={quotesPerMonth}
              onChange={(e) => setQuotesPerMonth(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span>100</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-medium text-gray-700">
                Nåværende tid per tilbud
              </label>
              <span className="text-lg font-semibold text-gray-900">{currentTimePerQuote}t</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={currentTimePerQuote}
              onChange={(e) => setCurrentTimePerQuote(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>30 min</span>
              <span>8 timer</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Din timepris (kr) <span className="text-xs text-gray-500 font-normal">• Snitt: 850-1200 kr/t</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="50"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-colors text-base"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                kr/t
              </span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="border-t border-gray-200 pt-6">
          <div className="text-center mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Din potensielle besparelse
            </p>
            <p 
              className="text-5xl md:text-6xl font-normal text-gray-900"
              style={{ fontFamily: 'var(--font-lora), serif' }}
            >
              {savings.valuePerMonth.toLocaleString('nb-NO')} kr
            </p>
            <p className="text-gray-600 text-sm mt-1">per måned</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-semibold text-gray-900">{savings.hoursPerMonth}t</p>
              <p className="text-xs text-gray-600 mt-0.5">Timer spart</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-semibold text-gray-900">{savings.valuePerYear.toLocaleString('nb-NO')} kr</p>
              <p className="text-xs text-gray-600 mt-0.5">Årlig besparelse</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-semibold text-gray-900">{savings.timeReduction}%</p>
              <p className="text-xs text-gray-600 mt-0.5">Tidsreduksjon</p>
            </div>
          </div>

          {/* Plan Recommendation */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs">💡</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-0.5">
                  Anbefalt plan for deg
                </p>
                <p className="text-sm text-gray-700 leading-snug">
                  {quotesPerMonth <= 15 ? (
                    <>
                      <span className="font-semibold text-blue-900">Basic plan</span> ({prices.basic.monthly.toLocaleString('nb-NO')} kr/mnd) passer perfekt for ditt behov ({quotesPerMonth} tilbud/mnd)
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-blue-900">Pro plan</span> ({prices.pro.monthly.toLocaleString('nb-NO')} kr/mnd) anbefales for ditt volum ({quotesPerMonth} tilbud/mnd)
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/signup"
            className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-all font-medium"
          >
            Kom i gang og spar {savings.valuePerMonth.toLocaleString('nb-NO')} kr/mnd
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: #111827;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #111827;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}
