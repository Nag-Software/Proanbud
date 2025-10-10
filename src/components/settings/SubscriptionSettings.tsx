'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import * as Icons from 'lucide-react';
import { BusinessSettings } from '@/lib/types';

export const SubscriptionSettings = ({ businessSettings }: { businessSettings: BusinessSettings | null }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Icons.CreditCard className="mr-2 h-5 w-5" />
          Abonnement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center">
              <Icons.Info className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Abonnementsfunksjonalitet er ikke tilgjengelig enda
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Dette funksjonen vil bli implementert snart.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-4">Tilgjengelige planer</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Free Plan */}
              <div className="relative rounded-lg border-2 border-gray-200 p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Gratis</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">0 kr</span>
                    <span className="text-gray-600 ml-1">/ måned</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600 text-left">
                    <li className="flex items-center">
                      <Icons.Check className="h-4 w-4 text-green-500 mr-2" />
                      Inntil 5 tilbud per måned
                    </li>
                    <li className="flex items-center">
                      <Icons.Check className="h-4 w-4 text-green-500 mr-2" />
                      Inntil 3 kunder
                    </li>
                    <li className="flex items-center">
                      <Icons.Check className="h-4 w-4 text-green-500 mr-2" />
                      Grunnleggende maler
                    </li>
                  </ul>
                </div>
                <div className="mt-6">
                  <button 
                    disabled 
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-md font-medium cursor-not-allowed opacity-75"
                  >
                    Nåværende plan
                  </button>
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
                    <span className="text-3xl font-bold text-gray-900">799 kr</span>
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
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start">
              <Icons.Shield className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Sikker betaling</p>
                <p>Alle betalinger vil bli håndtert trygt av Stripe når funksjonen er klar.</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
