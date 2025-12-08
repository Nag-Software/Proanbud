'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface HeaderProps {
  currentPage?: 'home' | 'priser' | 'blogg' | 'pilot';
}

export const NAV_ITEMS: any[] = [
  {
    title: "Hjem",
    href: "/",
    description: "Din komplette AI-tilbudsplattform for håndverkere som verdsetter effektivitet.",
    children: [
      {
        title: "Introduksjon",
        href: "/docs/introduksjon",
        description: "Lær hva Proanbud gjør og hvordan løsningen hjelper deg."
      },
      {
        title: "Sparekalkulator",
        href: "/kalkulator",
        description: "Sjekk hvor mye tid og penger du kan spare med Proanbud.",
      },
      {
        title: "Pilotprogram",
        href: "/pilot",
        description: "Bli pilotkunde — prøv full funksjonalitet i en periode. Begrensede plasser.",
      }
    ],
  },
  {
    title: "Funksjoner",
    href: "/funksjoner",
    description: "AI-genererte tilbud, kalkulasjon, maler og integrasjoner",
    children: [
      {
        title: "AI-prissetting",
        href: "/docs/funksjoner/ai-prissetting",
        description:
          "La kunstig intelligens foreslå konkurransedyktige priser basert på materialpriser, historisk data og dine leverandørpriser.",
        tag: "Beta",
      },
      {
        title: "Lynrask tilbudssending",
        href: "/docs/funksjoner/lynrask-tilbudssending",
        description:
          "Send profesjonelle tilbud på under 5 minutter med autogenererte mengdeberegninger og AI-prisestimat.",
      },
      {
        title: "Nettbrettvennlig",
        href: "/docs/funksjoner/nettbrettvennlig",
        description:
          "Full funksjonalitet på nettbrett og PC — send tilbud direkte fra befaring.",
      },
      {
        title: "Profesjonell kundehåndtering",
        href: "/docs/funksjoner/kundehandtering",
        description:
          "Ha full oversikt over kundesamtaler og hendelser, samt automatisert oppfølging via e‑post.",
        tag: "Ny",
      },
      {
        title: "Analyse & rapporter",
        href: "/docs/funksjoner/analyse-rapporter",
        description:
          "Følg konverteringsrate, omsetning, profitt og andre nøkkeltall i sanntid for bedre beslutninger.",
      },
      {
        title: "Spar 80% tid",
        href: "/docs/funksjoner/effektivisering",
        description:
          "Automatiser tunge og repetitive oppgaver — frigjør tid til det som skaper verdi.",
      },
    ],
  },
  {
    title: "Priser",
    href: "/priser",
    description: "Planer for bedrifter og håndverkere — fleksible avtaler.",
  },
  {
    title: "Blogg",
    href: "/blogg",
    description: "Tips, guider og bransjenyheter for håndverkere.",
  },
  {
    title: "Ressurser",
    href: "/docs",
    description: "",
    children: [
      {
        title: "Ressurssenter",
        href: "/docs/",
        description:
          "Automatiser tunge og repetitive oppgaver — frigjør tid til det som skaper verdi.",
      },
    ],
  },
  {
    title: "Om oss",
    href: "/om-oss",
    description: "Møt teamet og historien bak Proanbud.",
  },
  // interne/bruker-relaterte linker (eksempel)
  {
    title: "Dashbord",
    href: "/app",
    protected: true,
  },
]

export default function Header({ currentPage }: HeaderProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    
    // If we're not on the homepage and the link goes to a homepage section, navigate to homepage first
    if (currentPage !== 'home' && href.startsWith('/#')) {
      router.push(href);
      return;
    }
    
    // For same-page hash links, scroll to the element
    if (href.startsWith('#')) {
      const element = document.getElementById(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Logo size="lg" />
          <NavigationMenu className="hidden md:flex mx-5 !max-w-xl">
            <NavigationMenuList>
              <NavigationMenuItem>
                {/* HJEM */}
                <NavigationMenuTrigger>{NAV_ITEMS[0].title}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-2 p-3 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="hover:from-muted/50 hover:to-muted flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-4 no-underline outline-hidden transition-all duration-100 select-none active:shadow-md md:p-6"
                          href="/"
                        >
                          <div className="mb-2 text-lg font-medium sm:mt-4">
                            Proanbud x AI
                          </div>
                          <p className="text-muted-foreground text-sm leading-tight">
                            {NAV_ITEMS[0].description}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    {NAV_ITEMS[0].children?.map((item: any) => (
                      <ListItem key={item.href} href={item.href} title={item.title} tag={item.tag? item.tag : undefined}>
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>{NAV_ITEMS[1].title}</NavigationMenuTrigger>
                <NavigationMenuContent data-align="start">
                  <ul className="grid gap-2 p-3 sm:w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {NAV_ITEMS[1].children?.map((item: any) => (
                      <ListItem key={item.href} href={item.href} title={item.title} tag={item.tag? item.tag : undefined}>
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/priser">
                    Priser
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem> 
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/docs">
                    Ressurser
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/blogg">
                    Blogg
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/om-oss">
                    Om oss
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="text-nowrap text-gray-700 text-sm hover:bg-muted px-4 py-2.5 rounded-lg transition-colors font-medium"
            >
              Logg inn
            </Link>
            <Link
              href="/signup"
              className="text-nowrap bg-primary text-primary-foreground text-sm px-4 py-[7px] rounded-lg transition-all font-semibold border-1 border-primary/30 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30"
            >
              Kom igang
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <DrawerTrigger asChild>
                <button className="p-2 text-gray-700 hover:text-[#00b85b] transition-colors">
                  <Menu className="h-6 w-6" />
                </button>
              </DrawerTrigger>
              <DrawerContent showOverlay={false}>
                <div className="px-4 py-4 space-y-4">
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(currentPage === 'home' ? '#features' : '/#features');
                    }}
                    className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
                  >
                    Hjem
                  </a>
                  <a
                    href={currentPage === 'home' ? '#showcase' : '/#showcase'}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(currentPage === 'home' ? '#showcase' : '/#showcase');
                    }}
                    className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
                  >
                    Funksjoner
                  </a>
                  <Link
                    href="/priser"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
                  >
                    Priser
                  </Link>
                  <Link
                    href="/blogg"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
                  >
                    Blogg
                  </Link>
                  <Link
                    href="/docs"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
                  >
                    Ressurser
                  </Link>
                  <Link
                    href="/om-oss"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
                  >
                    Om oss
                  </Link>
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-3 border-2 border-gray-200 rounded-xl hover:border-[#00b85b]"
                    >
                      Logg inn
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center bg-primary text-primary-foreground px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-primary/20 hover:shadow-sm hover:shadow-primary/30"
                    >
                      Kom igang
                    </Link>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </header>
  );
}

function ListItem({
  title,
  children,
  href,
  tag,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string, tag: string | undefined }) {
  return (
    <li {...props} className="p-2 hover:bg-muted/90 rounded-sm transition-all duration-100">
      <NavigationMenuLink asChild>
        <Link href={href} className="flex flex-col gap-1">
          <div className="text-sm leading-none font-medium">
            {title}
            {tag?.toLowerCase() == "ny" && (

              <span className="ml-2 inline-block bg-green-100 text-green-800 text-[10px] font-regular px-2 py-0.5 outline-1 outline-green-200  rounded-full">
                {tag}
              </span>
            )}
            {tag?.toLowerCase() == "beta" && (

              <span className="ml-2 inline-block bg-blue-100 text-blue-800 text-[10px] font-regular px-2 py-0.5 outline-1 outline-blue-200  rounded-full">
                {tag}
              </span> 
            )}
          </div>
          <p className="text-muted-foreground line-clamp-2 text-xs leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}
