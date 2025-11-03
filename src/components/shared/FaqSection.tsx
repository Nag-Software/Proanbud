'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tagline } from "@/components/pro-blocks/landing-page/tagline";

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  title?: string;
  subtitle?: string;
  faqs: FaqItem[];
  className?: string;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  title = 'Ofte stilte spørsmål',
  subtitle = 'Vi har samlet den viktigste informasjonen for å hjelpe deg med å få mest mulig ut av opplevelsen din.',
  faqs,
  className = ''
}) => {

  return (
    <section
      className="bg-gray-50/50 py-32"
      aria-labelledby="faq-heading"
    >
      <div className="container-padding-x mx-auto flex max-w-3xl flex-col gap-10 md:gap-12 px-6">
        {/* Section Header */}
        <div className="section-title-gap-lg flex flex-col items-center text-center">
          {/* Category Tag */}
          <Tagline>FAQ seksjon</Tagline>
          {/* Main Title */}
          <h1 
            id="faq-heading" 
            className="text-4xl md:text-5xl lg:text-6xl font-normal text-gray-900 tracking-tight"
            style={{ fontFamily: 'var(--font-lora), serif' }}
          >
            {title}
          </h1>
          {/* Section Description */}
          <p className="text-gray-600 text-lg md:text-xl font-light max-w-lg">
            {subtitle}{"  "}
            <Link href="mailto:post@proanbud.no" className="text-primary underline hover:no-underline transition-all">
              Kontakt oss.
            </Link>
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" defaultValue="item-1" aria-label="FAQ items">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index + 1}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
          ))}
        </Accordion>

        {/* CTA Card */}
        <div className="bg-white border border-gray-200 flex w-full flex-col items-center gap-6 rounded-2xl p-8 md:p-10 shadow-sm">
          <div className="flex flex-col gap-3 text-center">
            <h2 
              className="text-gray-900 text-3xl md:text-4xl font-normal tracking-tight"
              style={{ fontFamily: 'var(--font-lora), serif' }}
            >
              Fant du ikke svaret du lette etter?
            </h2>
            <p className="text-gray-600 text-base md:text-lg font-light">
              Har du spørsmål eller trenger hjelp? Teamet vårt er her for å hjelpe!
            </p>
          </div>
          <Link href="mailto:post@proanbud.no">
            <Button
              variant="default"
              className="px-8 py-2.5 rounded-xl"
              aria-label="Contact our support team">
                Kontakt oss
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
