"use client";

import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FeatureItem {
  id: number;
  title: string;
  image: string;
  description: string;
}

interface Feature197Props {
  features?: FeatureItem[];
}

const Feature197 = ({
  features = [
    {
      id: 1,
      title: "Intelligent prissetting",
      image: "assets/ai-1.png",
      description:
        "Få intelligente prisforslag med integrert mengdeberegning og markedsanalyse. Du kan legge inn dine egne priser fra din byggevareleverandør for enda mer nøyaktige forslag.",
    },
    {
      id: 0,
      title: "Kundeadministrasjon",
      image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-1.svg",
      description:
        "Administrer alle kundene dine på ett sted med enkel tilgang til kontaktinformasjon, prosjekter, tilbud og kommunikasjonshistorikk.",
    },
    {
      id: 2,
      title: "Tilbudshåndtering",
      image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-2.svg",
      description:
        "Opprett, send og spor tilbud med vår brukervennlige tilbudshåndteringsmodul. Få varsler når tilbud blir akseptert eller krever oppfølging.",
    },
    {
      id: 3,
      title: "Sanntidsanalyse og statistikk",
      image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-3.svg",
      description:
        "Få innsikt i sanntid med omfattende analyser og rapporter. Spor ytelse, identifiser trender og ta informerte beslutninger for prosjektet ditt.",
    },
    {
      id: 4,
      title: "Sikker & GDPR-compliant",
      image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-5.svg",
      description:
        "All data krypteres og lagres sikkert i henhold til norske lover og GDPR-standarder. Vi prioriterer personvern og datasikkerhet for å beskytte informasjonen din.",
    },
  ],
}: Feature197Props) => {
  const [activeTabId, setActiveTabId] = useState<number | null>(1);
  const [activeImage, setActiveImage] = useState<string>(features[0].image);

  return (
    <section className="py-20 xs:py-32 bg-gray-50/50" id="showcase">
      <div className="container mx-auto max-w-7xl px-6">
        <h1 
          id="showcase-heading" 
          className="text-4xl md:text-5xl lg:text-6xl font-normal mx-auto text-center mb-6 text-gray-900 tracking-tight"
          style={{ fontFamily: 'var(--font-lora), serif' }}
        >
          Alt du trenger i én plattform
        </h1>
        <p className="text-gray-600 text-center text-lg md:text-xl mb-16 font-light max-w-2xl mx-auto">
          Effektiviser anbudsprosessen: intuitivt, kraftig og designet for å gjøre håndverkerens hverdag enklere med smarte verktøy.
        </p>
        <div className="mb-12 flex w-full items-start justify-between gap-12">
          <div className="w-full md:w-1/2">
            <Accordion type="single" className="w-full" defaultValue="item-1">
              {features.map((tab) => (
                <AccordionItem
                  key={tab.id}
                  value={`item-${tab.id}`}
                  className="transition-opacity hover:opacity-80"
                >
                  <AccordionTrigger
                    onClick={() => {
                      setActiveImage(tab.image);
                      setActiveTabId(tab.id);
                    }}
                    className="no-underline! cursor-pointer py-5 transition"
                  >
                    <h4
                      className={`text-xl font-semibold ${tab.id === activeTabId ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {tab.title}
                    </h4>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground text-base">
                      {tab.description}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="bg-muted relative m-auto hidden w-1/2 overflow-hidden rounded-xl md:block">
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="/assets/3.png"
                  alt="Platform dashboard"
                  className="w-full h-auto"
                />
                {/* Floating cards */}
                <div className="absolute top-8 right-8 bg-white rounded-xl p-4 shadow-xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-[#82ffb2] rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold">+23% konvertering</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#ff82d0]/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[#82b2ff]/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};  

export { Feature197 as ShowcaseFeature };