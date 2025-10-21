'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clock, BarChart3, Shield } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';
import PilotHero from '../../components/PilotHeroSanity';
import SignupForm from '../../components/SignupForm';
import PilotAgreementPreview from '../../components/PilotAgreementPreview';
import { FaqSection } from '../../components/shared/FaqSection';
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

      {/* Hvorfor Proanbud */}

      <section className="py-20 px-4 sm:px-6 lg:px-8">

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Hvorfor Proanbud
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI-drevet tilbudsplattform som sparer deg tid og øker lønnsomheten
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#82ffb2]/10 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-[#82ffb2]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Rask</h3>
              <p className="text-gray-600 leading-relaxed">Generer ferdig tilbud på minutter med AI-assistanse og smarte maler.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#82ffb2]/10 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-[#82ffb2]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Konsistent</h3>
              <p className="text-gray-600 leading-relaxed">Standardiserte maler og AI-prissetting sikrer profesjonelle tilbud hver gang.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#82ffb2]/10 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-[#82ffb2]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Spar tid</h3>
              <p className="text-gray-600 leading-relaxed">Mindre copy-paste, færre feil, og mer tid til å drive bedriften din.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Konkrete tall */}

      <section className="py-20 px-4">

        <div className="max-w-4xl mx-auto">

          <h2 className="text-3xl font-bold text-center mb-12">Konkrete tall</h2>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-white shadow-md p-6 rounded-lg text-center">

              <h3 className="text-2xl font-bold text-primary mb-2">{SUGGESTED_METRICS.time_saved}</h3>

              <p>Gjennomslittlig tid spart per tilbud</p>

            </div>

            <div className="bg-white shadow-md p-6 rounded-lg text-center">

              <h3 className="text-2xl font-bold text-primary mb-2">{SUGGESTED_METRICS.win_rate}</h3>

              <p>Økt vinnerandel</p>

            </div>

            <div className="bg-white shadow-md p-6 rounded-lg text-center">

              <h3 className="text-2xl font-bold text-primary mb-2">{SUGGESTED_METRICS.hours_saved}</h3>

              <p>Potensielle timer spart per måned</p>

            </div>

          </div>

          <p className="text-center text-gray-600 mt-8">(Bygger på tidlige pilotmålinger.) </p>

        </div>

      </section>

      {/* Hvordan pilotprogrammet fungerer */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Hvordan pilotprogrammet fungerer
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              En enkel prosess fra første kontakt til full implementasjon
            </p>
          </div>
          {/* Tab Bar */}
          <div className="bg-secondary-foreground/80 rounded-2xl p-2 mb-12 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              {pilotData?.processSteps?.map((step, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all ${
                    activeTab === index
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'text-gray-700 hover:bg-white/50'
                  }`}
                >
                  {index + 1}. {step.shortTitle}
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
                    <div className="w-16 h-16 bg-[#82ffb2] text-gray-900 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
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

      <PilotAgreementPreview />

      <FaqSection
        title="Ofte stilte spørsmål om pilotprogrammet"
        subtitle="Alt du trenger å vite før du blir pilotkunde"
        faqs={pilotData?.faq || []}
      />

      <Footer />

    </div>

  );

}