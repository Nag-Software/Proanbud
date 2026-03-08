'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock, BarChart3, Shield } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';
import PilotHero from '@/components/PilotHeroSanity';
import SignupForm from '@/components/SignupForm';
import PilotAgreementPreview from '@/components/PilotAgreementPreview';
import { FaqSection } from '@/components/shared/FaqSection';
import { usePilotData } from '@/hooks/usePilotData';

const SUGGESTED_METRICS = {
  time_saved: '30–45%',
  win_rate: '+8–15%',
  hours_saved: '20–120 h',
};

export default function PilotPage() {
  const { pilotData, loading, error } = usePilotData();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#82ffb2]/5 to-[#82b2ff]/5">
      <Header currentPage="pilot" />

      <PilotHero />

      {/* Hvordan pilotprogrammet fungerer */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-3xl font-bold text-gray-900 mb-2">
              Hvordan pilotprogrammet fungerer
            </h2>
            <p className="text-md text-muted-foreground max-w-3xl mx-auto">
              En enkel prosess fra første kontakt til full implementasjon
            </p>
          </div>
          {/* Tab Bar */}
          <div className="bg-secondary-foreground/80 rounded-2xl p-2 mb-12 max-w-3xl mx-auto outline outline-1 outline-secondary/50">
            <div className="flex flex-col sm:flex-row gap-2">
              {pilotData?.processSteps?.map((step, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`flex-1 px-6 py-2 rounded-lg font-semibold transition-all ${
                    activeTab === index
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-700 hover:bg-white/50'
                  }`}
                >
                  {index + 1}. {step.shortTitle || step.title}
                </button>
              ))}
            </div>
          </div>
          {/* Tab Content */}
          <div className="max-w-4xl mx-auto">
            {pilotData?.processSteps?.map((step, index) => (
              activeTab === index && (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                      <div className="text-gray-600 space-y-4">
                        {step.description.split('\n\n').map((paragraph, pIndex) => (
                          <p key={pIndex}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      <div id="signup">

        <SignupForm />

      </div>

      <PilotAgreementPreview id="bli-pilot"/>

      <FaqSection
        title="Ofte stilte spørsmål om pilotprogrammet"
        subtitle="Alt du trenger å vite før du blir pilotkunde"
        faqs={pilotData?.faq || []}
      />

      <Footer />

    </div>

  );

}