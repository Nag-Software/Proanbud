import React from 'react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Linkedin, Mail } from 'lucide-react';
import { client, aboutPageQuery, urlForImage } from '@/lib/sanity';
import { PortableText } from '@portabletext/react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Om Oss - Proanbud',
  description: 'Møt teamet og historien bak Proanbud - Norges første AI-drevne tilbudsplattform for håndverkere.',
};

interface AboutPageData {
  heroTitle: string;
  heroDescription: string;
  founderName: string;
  founderTitle: string;
  founderImage?: {
    asset: any;
    alt?: string;
  };
  founderLinkedin?: string;
  founderEmail?: string;
  founderStoryTitle: string;
  founderStory: any[];
  founderQuote?: string;
  missionTitle: string;
  missionDescription: string;
  visionTitle: string;
  visionDescription: string;
  valuesTitle: string;
  valuesSubtitle?: string;
  values: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  techStackTitle?: string;
  techStackSubtitle?: string;
  technologies?: Array<{
    icon: string;
    name: string;
    description: string;
  }>;
  ctaTitle?: string;
  ctaDescription?: string;
}

async function getAboutPageData(): Promise<AboutPageData | null> {
  try {
    const data = await client.fetch<AboutPageData>(aboutPageQuery, {}, {
      next: { revalidate: 60 }
    });
    return data;
  } catch (error) {
    console.error('Feil ved henting av Om Oss-data:', error);
    return null;
  }
}

export default async function OmOss() {
  const data = await getAboutPageData();

  // Fallback data hvis Sanity ikke er konfigurert ennå
  const pageData = data || {
    heroTitle: "Bygget av håndverkere, for håndverkere",
    heroDescription: "Historien om hvordan frustrasjonen over tungvinte tilbudsprosesser ble til Norges første AI-drevne tilbudsplattform.",
    founderName: "Casper Nilsen",
    founderTitle: "Grunnlegger & CEO",
    founderEmail: "casper@proanbud.no",
    founderStoryTitle: "Hvorfor Proanbud?",
    founderStory: [],
    founderQuote: "Målet mitt er enkelt: Hjelpe norske håndverkere å spare tid, vinne flere oppdrag og tjene det de fortjener.",
    missionTitle: "Vårt oppdrag",
    missionDescription: "Å demokratisere tilgang til profesjonelle tilbudsverktøy for alle håndverkere i Norge, uavhengig av bedriftsstørrelse. Vi tror at AI og teknologi skal gjøre livet enklere, ikke vanskeligere.",
    visionTitle: "Vår visjon",
    visionDescription: "Å bli den mest intuitive og mest brukte tilbudsplattformen i Norden, og hjelpe tusenvis av håndverkere med å vinne flere oppdrag, spare tid og bygge sterkere bedrifter.",
    valuesTitle: "Våre verdier",
    valuesSubtitle: "Dette er prinsippene som styrer alt vi gjør",
    values: [
      {
        icon: "🎨",
        title: "Enkelhet",
        description: "Komplekse problemer krever enkle løsninger. Vi streber etter intuitivt design som alle kan bruke."
      },
      {
        icon: "⚡",
        title: "Effektivitet",
        description: "Tiden din er verdifull. Vi automatiserer det kjedelige så du kan fokusere på det viktige."
      },
      {
        icon: "🤝",
        title: "Transparens",
        description: "Vi bygger i det åpne og deler vår reise. Ingen skjulte agendaer eller overraskelser."
      }
    ],
    techStackTitle: "Bygget med moderne teknologi",
    techStackSubtitle: "Vi bruker de beste verktøyene for å levere en rask, sikker og pålitelig plattform",
    technologies: [
      { icon: "⚛️", name: "Next.js", description: "React Framework" },
      { icon: "🔥", name: "Firebase", description: "Backend & Database" },
      { icon: "🤖", name: "OpenAI", description: "AI-prissetting" },
      { icon: "🎨", name: "Tailwind", description: "Design System" }
    ],
    ctaTitle: "Bli med på reisen",
    ctaDescription: "Vi er bare i starten. Hjelp oss med å forme fremtiden for tilbudshåndtering i Norge."
  };
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-normal text-gray-900 tracking-tight leading-[1.1] mb-6"
            style={{ fontFamily: 'var(--font-lora), serif' }}
          >
            {pageData.heroTitle}
          </h1>
          <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-light">
            {pageData.heroDescription}
          </p>
        </div>
      </section>

      {/* Founder Story */}
      <section className="py-15 bg-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-[300px_1fr] gap-12 items-start">
            <div className="space-y-4">
              <div className="w-full aspect-square bg-gray-200 rounded-2xl overflow-hidden">
                {pageData.founderImage?.asset ? (
                  <Image
                    src={urlForImage(pageData.founderImage.asset).width(300).height(300).url()}
                    alt={pageData.founderImage.alt || pageData.founderName}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#82ffb2] to-[#82b2ff] flex items-center justify-center text-white text-6xl font-bold">
                    {pageData.founderName.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{pageData.founderName}</h3>
                <p className="text-gray-600 text-sm">{pageData.founderTitle}</p>
                <div className="flex gap-3 mt-3">
                  {pageData.founderLinkedin && (
                    <a href={pageData.founderLinkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {pageData.founderEmail && (
                    <a href={`mailto:${pageData.founderEmail}`} className="text-gray-600 hover:text-gray-900 transition-colors">
                      <Mail className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 
                className="text-3xl md:text-4xl font-normal text-gray-900 tracking-tight"
                style={{ fontFamily: 'var(--font-lora), serif' }}
              >
                {pageData.founderStoryTitle}
              </h2>
              
              <div className="prose prose-lg max-w-none">
                {pageData.founderStory && pageData.founderStory.length > 0 ? (
                  <PortableText 
                    value={pageData.founderStory}
                    components={{
                      block: {
                        normal: ({children}) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
                      },
                    }}
                  />
                ) : (
                  <>
                    <p className="text-gray-700 leading-relaxed">
                      Som utvikler med erfaring fra byggebransjen har jeg sett altfor mange dyktige håndverkere tape oppdrag – ikke fordi de mangler kompetanse, men fordi de sliter med prissetting og bruker timer på å lage tilbud manuelt.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Jeg så hvordan Excel-ark, Word-dokumenter og gjetting på priser ikke bare tok tid, men også kostet penger. Mange håndverkere priser seg enten ut av markedet eller taper profitt fordi de ikke har verktøyene til å prissette riktig.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Det var da ideen om Proanbud ble født. En plattform som kombinerer kunstig intelligens med markedsinnsikt for å gi håndverkere superkrefter når det gjelder prissetting og tilbudshåndtering.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      I dag er Proanbud bygget med de beste teknologiene innen AI og skyløsninger, designet for å være intuitivt nok til at alle kan bruke det – men kraftig nok til å håndtere komplekse kalkulasjoner.
                    </p>
                  </>
                )}

                {pageData.founderQuote && (
                  <div className="bg-gray-50 border-l-4 border-[#82ffb2] p-6 my-8 rounded-r-lg">
                    <p className="text-gray-800 italic text-lg">
                      "{pageData.founderQuote}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-[#82ffb2] rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 
                className="text-2xl md:text-3xl font-normal text-gray-900 tracking-tight mb-4"
                style={{ fontFamily: 'var(--font-lora), serif' }}
              >
                {pageData.missionTitle}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {pageData.missionDescription}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-[#82b2ff] rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 
                className="text-2xl md:text-3xl font-normal text-gray-900 tracking-tight mb-4"
                style={{ fontFamily: 'var(--font-lora), serif' }}
              >
                {pageData.visionTitle}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {pageData.visionDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-normal text-gray-900 tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-lora), serif' }}
            >
              {pageData.valuesTitle}
            </h2>
            {pageData.valuesSubtitle && (
              <p className="text-gray-600 text-lg font-light max-w-2xl mx-auto">
                {pageData.valuesSubtitle}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pageData.values.map((value, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">{value.icon}</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900">{value.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      {pageData.technologies && pageData.technologies.length > 0 && (
        <section className="py-20 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="text-center mb-12">
              <h2 
                className="text-4xl md:text-5xl font-normal text-gray-900 tracking-tight mb-4"
                style={{ fontFamily: 'var(--font-lora), serif' }}
              >
                {pageData.techStackTitle || "Bygget med moderne teknologi"}
              </h2>
              {pageData.techStackSubtitle && (
                <p className="text-gray-600 text-lg font-light max-w-2xl mx-auto">
                  {pageData.techStackSubtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {pageData.technologies.map((tech, index) => (
                <div key={index} className="bg-white rounded-xl p-6 text-center border border-gray-200">
                  <div className="text-4xl mb-3">{tech.icon}</div>
                  <h4 className="font-semibold text-gray-900 text-sm">{tech.name}</h4>
                  <p className="text-gray-600 text-xs mt-1">{tech.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center space-y-8">
          <h2 
            className="text-4xl md:text-5xl font-normal text-white tracking-tight"
            style={{ fontFamily: 'var(--font-lora), serif' }}
          >
            {pageData.ctaTitle || "Bli med på reisen"}
          </h2>
          <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">
            {pageData.ctaDescription || "Vi er bare i starten. Hjelp oss med å forme fremtiden for tilbudshåndtering i Norge."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/signup"
              className="group bg-white text-gray-900 px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all font-semibold text-md shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Kom i gang gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="mailto:casper@proanbud.no"
              className="bg-transparent text-white px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all font-semibold text-md border-2 border-white/20 hover:border-white/40 flex items-center justify-center gap-2"
            >
              Kontakt oss
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
