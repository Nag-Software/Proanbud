'use client';

import React from 'react';
import { usePilotData } from '@/hooks/usePilotData';
import {BrainCircuit} from 'lucide-react';

const PilotHeroSanity = () => {
  const { pilotData, loading, error } = usePilotData();

  // Fallback data hvis Sanity ikke er tilgjengelig
  const fallbackData = {
    title: 'Bli vår nye Pilotkunde',
    badgeText: 'Begrenset Pilotprogram',
    availableSpots: 15,
    usedSpots: 11,
    spotsText: 'plasser igjen',
    pricing: { amount: 99, currency: 'kr', period: 'måned' },
    heroDescription: 'Få eksklusiv tilgang til vår revolusjonerende AI-drevne tilbudsplattform. Kun 99 kr/måned i 3 måneder.',
    metrics: [
      { label: 'Gj.sn. tid spart per tilbud', value: '30–60%', description: 'Gj.sn. tid spart per tilbud' },
      { label: 'Økt vinnerandel', value: '+8–15%', description: 'Økt vinnerandel' },
      { label: 'Potensielle timer spart per måned', value: '20–120 h', description: 'Potensielle timer spart per måned' }
    ],
    aiCard: {
      title: 'AI-drevet presisjon',
      description: 'Vår avanserte AI analyserer markedet og lager profesjonelle tilbud som øker dine sjanser for å vinne oppdrag.',
      spotsFilled: 73,
      spotsRemaining: 4
    },
    trustIndicators: [
      { text: 'Ingen binding' },
      { text: '14 dager oppsigelse' },
      { text: 'GDPR compliant' }
    ],
    secondaryCTA: {
      text: 'Last ned pilotavtale (PDF)',
      url: '/pilotavtale'
    }
  };

  const data = pilotData || fallbackData;

  if (loading) {
    return (
      <section className="relative overflow-hidden bg-slate-50 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#82ffb2] mx-auto"></div>
            <p className="mt-4 text-gray-600">Laster pilot-side...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    console.warn('Using fallback data due to Sanity error:', error);
  }

  return (
    <section className="relative overflow-hidden bg-slate-50 min-h-screen flex items-center">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#82ffb2]/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#82b2ff]/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-15 items-center min-h-[500px]">
          {/* Left Column - Simplified Content */}
          <div className="space-y-8 order-2 lg:order-1">
            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {data.title.split(' ').slice(0, -1).join(' ')}{' '}
                <span className="bg-gradient-to-r from-[#82ffb2] to-[#82b2ff] bg-clip-text text-transparent">
                  {data.title.split(' ').slice(-1)}
                </span>
              </h1>
            </div>

            {/* Simplified Description */}
            <div className="space-y-6">
              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                {data.heroDescription || fallbackData.heroDescription}
              </p>

              {/* Single Key Metric */}
              <div className="bg-white/90 backdrop-blur-xl px-6 py-5 rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-900/5 max-w-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#82ffb2] to-[#82b2ff] rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{data.metrics[0]?.value || '30–45%'}</div>
                    <div className="text-sm text-gray-600 font-medium">raskere tilbudsopprettelse</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simplified CTA */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                className="group cursor-pointer bg-[#82ffb2] text-gray-900 px-8 py-4 rounded-xl transition-all font-bold text-base shadow-xl shadow-[#82ffb2]/30 hover:shadow-2xl hover:shadow-[#82ffb2]/50 transform hover:scale-[1.01] flex items-center justify-center gap-3"
                onClick={() => {
                  const signupElement = document.getElementById('signup');
                  if (signupElement) {
                    signupElement.scrollIntoView({ behavior: 'smooth' });
                  }
                  if ((window as any).posthog) {
                    (window as any).posthog.capture('pilot_cta_clicked');
                  }
                }}
              >
                <span>Bli pilotkunde nå</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <a
                href={data.secondaryCTA?.url || '/pilotavtale'}
                className="group cursor-pointer border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl transition-all font-semibold text-base hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-3"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if ((window as any).posthog) {
                    (window as any).posthog.capture('pilot_pdf_download_clicked');
                  }
                }}
              >
                <span>{data.secondaryCTA?.text || 'Last ned pilotavtale (PDF)'}</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column - Clean Visual Element */}
          <div className="relative order-1 lg:order-2">
            <div className="relative bg-white/95 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-gray-200/20 max-w-sm mx-auto">
              {/* Clean Neural Network Background */}
              <div className="absolute inset-0 opacity-5">
                <svg className="w-full h-full" viewBox="0 0 400 400">
                  <defs>
                    <pattern id="neural-sanity" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <circle cx="20" cy="20" r="2" fill="#82ffb2"/>
                      <circle cx="20" cy="20" r="8" fill="none" stroke="#82ffb2" strokeWidth="0.5" opacity="0.3"/>
                    </pattern>
                  </defs>
                  <rect width="400" height="400" fill="url(#neural-sanity)"/>
                </svg>
              </div>

              {/* Main AI Visual */}
              <div className="relative text-center space-y-6">
                {/* AI Brain Icon with Glow */}
                <div className="relative">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#82ffb2] via-[#82b2ff] to-[#82ffb2] rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden animate-pulse">
                    <BrainCircuit className="w-12 h-12 text-white relative z-10" />
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#82ffb2]/30 to-[#82b2ff]/30 rounded-2xl blur-xl animate-pulse"></div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-900">{data.aiCard.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {data.aiCard.description}
                  </p>
                </div>

                {/* Simple Progress Indicator */}
                <div className="bg-gray-50/80 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Pilotplasser fylt</span>
                    <span className="font-bold text-gray-900">{data.aiCard.spotsFilled}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary/80 h-3 relative bottom-0.5 rounded-full transition-all duration-1000" style={{ width: `${data.aiCard.spotsFilled}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Kun {data.aiCard.spotsRemaining} plasser igjen!</p>
                </div>

                {/* Additional Widgets */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Graph Widget */}
                  <div className="bg-gray-50/80 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600 font-medium">Effektivitet</span>
                      <svg className="w-4 h-4 text-[#82ffb2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="h-8 flex items-end justify-between">
                      <div className="w-1 bg-[#82ffb2] rounded-full" style={{ height: '60%' }}></div>
                      <div className="w-1 bg-[#82ffb2] rounded-full" style={{ height: '80%' }}></div>
                      <div className="w-1 bg-[#82ffb2] rounded-full" style={{ height: '40%' }}></div>
                      <div className="w-1 bg-[#82ffb2] rounded-full" style={{ height: '90%' }}></div>
                      <div className="w-1 bg-[#82ffb2] rounded-full" style={{ height: '70%' }}></div>
                    </div>
                  </div>

                  {/* Stat Widget */}
                  <div className="bg-gray-50/80 rounded-xl p-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">+127%</div>
                      <div className="text-xs text-gray-600">gj.sn. forbedring</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Single decorative element */}
            <div className="hidden lg:block absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-[#82ffb2]/20 to-[#82b2ff]/20 rounded-full blur-xl"></div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200/50">
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            *Resultater basert på tidlige pilotkunder. Individuelle resultater kan variere.
            Alle data behandles i henhold til norsk personvernlovgivning.
          </p>
        </div>
      </div>

      <style jsx>{``}</style>
    </section>
  );
};

export default PilotHeroSanity;