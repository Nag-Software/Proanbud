'use client';

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Sparkles,
  Clock,
  Smartphone,
  ArrowRight,
  Check,
  Star,
  CreditCard,
} from "lucide-react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { SavingsCalculator } from "@/components/SavingsCalculator";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "fumadocs-ui/components/card";

const FEATURES = [
  {
    title: "Send tilbud på befaring",
    body: "Legg inn kunde, beskriv prosjekt, Proanbud beregner og utformer tilbudsforslag, send interaktivt tilbud til kunden.",
    icon: Smartphone,
  },
  {
    title: "Proanbud KI-Smartsystemer",
    body: "Vårt system er basert på avanserte KI-modeller som er trent på hundretusenvis av norske anbud, alt for å gi deg presise og pålitelige tilbud.",
    icon: Sparkles,
  },
  {
    title: "Trygg utsendelse",
    body: "Interaktivt tilbud som kan oppdateres i sanntid. Du har alltid full kontroll. Ingen PDF-rot eller usikkerhet.",
    icon: Shield,
  },
];

const PROOF_POINTS = [
  "Opptil 80% tidsbesparelse fra befaring → tilbud",
  "Interaktive tilbud med din logo og informasjon",
  "Fungerer på mobil, nettbrett og PC",
];

export default function MobileHomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        Laster...
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <Header currentPage="home" />
      <main className="px-4 pb-16 pt-6 space-y-10 max-w-xl mx-auto">
        <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg shadow-gray-100 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-semibold">
            <Clock className="h-4 w-4" />
            Mobilvisning
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl leading-tight font-semibold">
              Send tilbud fra mobilen på under 5 minutter
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
            Proanbud er Norges første KI-drevne tilbudsplattform laget for norske håndverkere. Vi gir deg trygghet, våre modeller er trent på hundretusenvis av norske anbud.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-4 py-3 rounded-2xl shadow-md shadow-emerald-300 hover:bg-emerald-600 transition-colors"
            >
              Kom i gang gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/kalkulator"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-200 font-semibold px-4 py-3 rounded-2xl hover:border-gray-300 transition-colors"
            >
              Se hvor mye du kan spare
            </Link>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Star className="h-4 w-4 text-amber-500" />
              <span>Bygget med håndverkere – testet i felt</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <span>Ingen kredittkort for å prøve</span>
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="flex gap-3 items-start bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <feature.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.body}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="bg-white border border-gray-200 rounded-3xl p-5 shadow-lg shadow-gray-100 space-y-4">
          <SavingsCalculator variant="compact" />
        </section>

        <section className="bg-gray-50 border border-gray-200 rounded-3xl p-5 space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Konverter flere kunder</p>
            <h2 className="text-2xl font-semibold">Send tilbud på minutter - mens du er på befaring</h2>
            <p className="text-sm text-gray-600">
              Legg til kunde, Proanbud KI-Smartsystemer beregner materialer og priser, send enkelt tilbud, alt fra mobil, nettbrett eller PC.
            </p>
          </div>
          <div className="space-y-2">
            {PROOF_POINTS.map((item) => (
              <div key={item} className="inline-flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold px-4 py-3 rounded-2xl hover:bg-black transition-colors"
            >
              Prøv gratis nå
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 text-gray-900 border border-gray-200 font-semibold px-4 py-3 rounded-2xl bg-white hover:border-gray-300 transition-colors"
            >
              Logg inn
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
