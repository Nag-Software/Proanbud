'use client';

import React from 'react';
import { usePilotData } from '@/hooks/usePilotData';
import {BrainCircuit} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Tagline } from "@/components/pro-blocks/landing-page/tagline";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import { useRouter } from 'next/navigation';

const PilotHeroSanity = () => {
  const { pilotData, loading, error } = usePilotData();

  const router = useRouter();

  // Fallback data hvis Sanity ikke er tilgjengelig
  const fallbackData = {
    title: 'Bli vår nye Pilotkunde',
    badgeText: 'Begrenset Pilotprogram',
    heroDescription: 'Få eksklusiv tilgang til innovative funksjoner – prøv Proanbud før alle andre, bidra med verdifulle innspill, og vær med på å forme morgendagens løsning for smartere anbudsprosesser!',
    trustIndicators: [
      { text: 'Ingen binding' },
      { text: '14 dager oppsigelse' },
      { text: 'Følger GDPR' }
    ]
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
    <section
      className="bg-background section-padding-y"
      aria-labelledby="hero-heading"
    >
      <div className="container-padding-x max-w-7xl mx-auto container mx-auto flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
        {/* Left Column */}
        <div className="flex flex-1 flex-col gap-6 lg:gap-8 mx-auto">
          {/* Section Title */}
          <div className="section-title-gap-xl flex flex-col max-w-4xl mx-auto">
            {/* Tagline */}
            <Tagline variant="default" className="mx-auto text-center">{data.badgeText}</Tagline>
            {/* Main Heading */}
            <h1 id="hero-heading" className="heading-xl mx-auto text-center">
              {data.title.split(' ').map((word, index) => 
                index === data.title.split(" ").length - 1 ? (
                  <span key={index} className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {word}{' '}
                  </span>
                ) : (
                  <span key={index}>{word} </span>
                )
              )}
            </h1>
            {/* Description */}
            <p className="text-muted-foreground text-base lg:text-lg mx-auto max-w-3xl text-center">
              {data.heroDescription}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row max-w-4xl mx-auto">
            <Button onClick={() => {
              const element = document.getElementById('bli-pilot');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
              className="group bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all font-semibold text-sm hover:shadow-md flex items-center justify-center gap-2"
              >Send Forespørsel</Button>
            <Button onClick={() => {router.push("/pilotavtale")}} variant="ghost">
              Les avtale
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
};

export default PilotHeroSanity;