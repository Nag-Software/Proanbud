import React from 'react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import type { Metadata } from 'next';
import { FaqSection } from '@/components/shared/FaqSection';

export const metadata: Metadata = {
  title: 'Sparekalkulator - Se hvor mye du kan spare med Proanbud',
  description: 'Kalkuler hvor mye tid og penger du kan spare ved å bruke Proanbud for tilbudshåndtering. Få konkrete tall på din besparelse.',
};

const FAQ_ITEMS = [
    {
        question: "Er kalkulatoren nøyaktig?",
        answer: "Kalkulatoren er basert på faktiske tall fra norske håndverkere som bruker Proanbud, samt dine egne rabatterte priser fra din byggevareleverandør. Gjennomsnittstiden for å lage et tilbud med Proanbud er 5-7 minutter, sammenlignet med 1-3 timer manuelt."
    },
    {
        question: "Hva inkluderer 5 minutter?",
        answer: "5 minutter inkluderer kunderegistrering, AI-prissetting, validering av prisforslaget, og sending av tilbud. Dette er med erfaring - nye brukere bruker typisk 10-15 minutter i starten. Ved komplekse prosjekter kan det ta lengre tid."
    },
    {
        question: "Kan jeg teste før jeg bestemmer meg?",
        answer: "Ja! Du får 14 dagers gratis prøveperiode med full tilgang til alle funksjoner. Ingen kredittkort påkrevd for å starte."
    },
    {
        question: "Hva skjer hvis jeg ikke sparer tid?",
        answer: "Hvis du ikke ser verdi innen prøveperioden, kan du enkelt forlate Proanbud. Vi krever ingen kort-informasjon før prøveperioden er over. Vi er overbevist om at du vil spare tid, men det er ingen risiko å prøve."
    }
];

export default function KalkulatorPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-16 pb-10 sm:py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-normal text-gray-900 tracking-tight leading-[1.1] mb-4"
            style={{ fontFamily: 'var(--font-lora), serif' }}
          >
            Se hvor mye du kan spare
          </h1>
          <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-light">
            Kalkuler din potensielle besparelse ved å bytte til Proanbud. Basert på faktiske tall fra norske håndverkere.
          </p>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-6 sm:py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <SavingsCalculator variant="full" />
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-lora), serif' }}
            >
              Hvorfor Proanbud?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lynrask</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Send profesjonelle tilbud på under 5 minutter med AI-assistanse og automatisk kalkulering.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Presise priser</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                AI analyserer markedspriser og dine egne rabatterte priser for å foreslå konkurransedyktige priser.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nettbrettvennlig</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Send tilbud direkte fra befaring. Full funksjonalitet på mobil, nettbrett og PC.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection faqs={FAQ_ITEMS} />

      <Footer />
    </div>
  );
}
