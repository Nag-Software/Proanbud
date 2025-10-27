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
      className="bg-background section-padding-y"
      aria-labelledby="faq-heading"
    >
      <div className="container-padding-x mx-auto flex max-w-3xl flex-col gap-10 md:gap-12">
        {/* Section Header */}
        <div className="section-title-gap-lg flex flex-col items-center text-center">
          {/* Category Tag */}
          <Tagline>FAQ seksjon</Tagline>
          {/* Main Title */}
          <h1 id="faq-heading" className="heading-lg text-foreground">
            {title}
          </h1>
          {/* Section Description */}
          <p className="text-muted-foreground max-w-lg">
            {subtitle}{"  "}
            <Link href="mailto:post@proanbud.no" className="text-primary underline">
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
        <div className="bg-muted/60 flex w-full flex-col items-center gap-6 rounded-xl p-6 md:p-8">
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-foreground text-2xl font-bold">
              Fant du ikke svaret du lette etter?
            </h2>
            <p className="text-muted-foreground text-base">
              Har du spørsmål eller trenger hjelp? Teamet vårt er her for å hjelpe!
            </p>
          </div>
          <Button
            variant="default"
            aria-label="Contact our support team">
              <Link href="mailto:post@proanbud.no">
                Kontakt oss
              </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
