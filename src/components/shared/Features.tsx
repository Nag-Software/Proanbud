import {
  Sparkles,
  Zap,
  Smartphone,
  FileText,
  BarChart3,
  Clock,
  LucideProps,
  LucideIcon,
  Image
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tagline } from "../pro-blocks/landing-page/tagline";

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

interface Feature43Props {
  title?: string;
  subtitle?: string;
  features?: Feature[];
  buttonText?: string;
  buttonUrl?: string;
}



const FeatureSection = ({
  title = "Alt du trenger i én plattform",
  subtitle = "Effektivisér hele anbudsprosessen med smarte verktøy designet for håndverkere",
  features = [
              {
                icon: Sparkles,
                title: "AI-prissetting",
                description: "La kunstig intelligens foreslå konkurransedyktige priser basert på materialpriser, historisk data og dine pristilbud hos leverandører",
                color: "#82ffb2"
              },
              {
                icon: Zap,
                title: "Lynrask tilbudssending",
                description: "Send profesjonelle tilbud på under 5 minutter med autogenererte mengdeberegninger og AI-prisestimat",
                color: "#ff82d0"
              },
              {
                icon: Smartphone,
                title: "Mobilvennlig",
                description: "Full funksjonalitet på mobil, nettbrett og PC - send tilbud direkte på befaring",
                color: "#82b2ff"
              },
              {
                icon: FileText,
                title: "Profesjonell kundehåndtering",
                description: "Ha full oversikt over kundesamtaler og hendelser, samt automatisert kundeoppfølging via mail.",
                color: "#ff82d0"
              },
              {
                icon: BarChart3,
                title: "Analyse & rapporter",
                description: "Følg med på konverteringsrate, omsetning, profitt og andre nøkkeltall i sanntid",
                color: "#82b2ff"
              },
              {
                icon: Clock,
                title: "Spar 80% tid",
                description: "Automatiser tunge og repetitive oppgaver og fokuser på det som gir verdi",
                color: "#82ffb2"
              }
  ],
  buttonText = "Undersøk funksjoner",
  buttonUrl = "/docs/funksjoner",
}: Feature43Props) => {
  return (
    <section className="px-10 lg:px-0 py-32">
      <div className="container mx-auto max-w-3xl lg:max-w-4xl">
        {title && (
          <div className="container-padding-x mb-15 mx-auto flex max-w-2xl flex-col gap-8 md:gap-10">
            {/* Section Header */}
            <div className="section-title-gap-lg flex flex-col items-center text-center">
              {/* Category Tag */}
              <Tagline>Funksjoner</Tagline>
              {/* Main Title */}
              <h1 id="features-heading" className="heading-lg text-foreground">
                {title}
              </h1>
              {/* Section Description */}
              <p className="text-muted-foreground max-w-lg">
                {subtitle}{"  "}
              </p>
            </div>
        </div>
        )}
        <div className="grid gap-10 space-y-2 md:space-y-2 mx-auto w-full sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="flex flex-col justify-center !max-w-[350px] md:max-w-none">
              <div 
              className="bg-accent mb-5 flex size-12 items-center flex justify-center rounded-md"
              style={{ backgroundColor: `${feature.color}20` }}>
                    <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
        {buttonUrl && (
          <div className="mt-16 flex justify-center">
            <Button size="lg" asChild>
              <a href={buttonUrl}>{buttonText}</a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export { FeatureSection };
