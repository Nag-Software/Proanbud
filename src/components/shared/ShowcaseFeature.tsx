"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from 'framer-motion';

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

  const shouldReduceMotion = useReducedMotion();
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={shouldReduceMotion ? undefined : { visible: { transition: { staggerChildren: 0.06 } } }} className="py-16 xs:py-20 bg-gray-50/50" id="showcase">
      <div className="container mx-auto max-w-6xl px-6">
        <motion.h1 variants={fadeUp}
          id="showcase-heading" 
          className="text-3xl md:text-4xl lg:text-5xl font-normal mx-auto text-center mb-4 text-gray-900 tracking-tight"
          style={{ fontFamily: 'var(--font-lora), serif' }}
        >
          Alt du trenger i én plattform
        </motion.h1>
        <motion.p variants={fadeUp} className="text-gray-600 text-center text-base md:text-lg mb-12 font-light max-w-2xl mx-auto">
          Effektiviser anbudsprosessen: intuitivt, kraftig og designet for å gjøre håndverkerens hverdag enklere med smarte verktøy.
        </motion.p>
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
          <motion.div variants={fadeUp} className="bg-muted relative m-auto hidden w-1/2 overflow-hidden rounded-xl md:block">
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <Image
                  src="/assets/hero/smiler.png"
                  alt="Platform dashboard"
                  className="w-full h-auto max-h-[400px] object-cover"
                  width={1280}
                  height={720}
                  loading="lazy"
                />
                {/* Floating cards */}
                <motion.div whileHover={shouldReduceMotion ? undefined : { y: -4 }} className="absolute top-4 right-4 bg-white rounded-xl p-3 shadow-xl animate-float">
                  <div className="flex items-center justify-around gap-3">
                    <div className="w-3 h-3 bg-[#82ffb2] rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold">Jeg sparer 12 375 kr/mnd.</span>
                  </div>
                  <span className="ml-6 text-xs font-normal text-gray-500">Nag Snekkerservice</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};  

export { Feature197 as ShowcaseFeature };