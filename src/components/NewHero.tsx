'use client';

import Link from "next/link";
import dashboardImage from "../../public/assets/4.jpg";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getLaunchSpecialBanner, getDiscountTypeLabel, LaunchSpecialBanner } from "@/lib/sanity/launchBanner";
import white from "../../public/logo/light/icon-muted.svg";

export function NewHero() {
  const [banner, setBanner] = useState<LaunchSpecialBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const data = await getLaunchSpecialBanner();
        setBanner(data);
      } catch (error) {
        console.error('Failed to fetch banner:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (logoRef.current) {
      observer.observe(logoRef.current);
    }

    return () => {
      if (logoRef.current) {
        observer.unobserve(logoRef.current);
      }
    };
  }, []);
  return (
    <section className="w-full py-16 md:py-20 bg-white">
      <div 
        ref={logoRef}
        className="absolute top-130 h-full left-1/10 overflow-hidden z-[0] pointer-events-none scale-130"
      >
        <Link href="/">
          <Image 
            src={white}
            alt="Proanbud Logo"
            className={`w-0 md:w-100 lg:w-130 rotate-[-35deg] transition-all duration-1000 ease-in ${
              isVisible ? 'opacity-7' : 'opacity-0'
            }`}
          />
        </Link>
      </div>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Launch Special Banner */}
        <div className="mb-6 mx-auto max-w-2xl">
          {banner && banner.isActive && (
            <div className="bg-gradient-to-r from-[#82ffb2] via-[#82ffb2] to-[#66ff9f] rounded-2xl p-[1px] shadow-lg">
              <div className="bg-white rounded-xl px-6 py-3">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center sm:text-left">
                  <span className="text-2xl">🎉</span>
                  <div className="flex-1">
                    <p className="text-gray-900 font-semibold text-md">
                      Lanseringstilbud
                    </p>
                    <p className="text-gray-600 text-xs">
                      De første {banner.totalPlaces} kundene får <span className="font-bold text-gray-900">{banner.discountPercentage}% rabatt {getDiscountTypeLabel(banner.discountType)}!</span>
                    </p>
                    <p className="text-gray-600 text-xs">
                      Rabattkode: <span className="font-bold text-gray-900">LANS25</span>
                    </p>
                  </div>
                  <div className="bg-[#82ffb2] text-primary px-4 py-2 rounded-lg font-semibold text-xs whitespace-nowrap">
                    Kun {banner.availablePlaces} plasser igjen
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center max-w-4xl mx-auto mb-10 space-y-6">
          <h1 
            className="text-3xl md:text-5xl lg:text-6xl font-normal text-gray-900 tracking-tight leading-[1.1]"
            style={{ fontFamily: 'var(--font-lora), serif' }}
          >
            Norges første AI-drevne tilbudsplattform
          </h1>
          
          <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-light">
            Din komplette tilbudsplattform for håndverkere. Bruk AI til å prissete riktig, send profesjonelle tilbud fra nettbrett eller PC, og vinn flere oppdrag.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="group bg-primary text-primary-foreground px-8 py-2.5 rounded-xl hover:bg-primary/90 transition-all font-semibold text-md hover:shadow-md flex items-center justify-center gap-2"
            >
              Kom i gang gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/kalkulator"
              className="bg-white text-gray-900 px-8 py-2.5 rounded-xl hover:bg-gray-50 transition-all font-semibold text-md border-2 border-gray-200 flex items-center justify-center gap-2"
            >
              Se din besparelse
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-8 pt-1">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#82ffb2]" />
              <span className="text-sm text-gray-600 font-light">Gratis i 14 dager</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#82ffb2]" />
              <span className="text-sm text-gray-600 font-light">Ingen kredittkort</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto relative px-4">
          {/* Main dashboard container - Ultra clean and premium */}
          <div className="relative">
            {/* Outer frame - adds depth without blur */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-[20px] transform translate-y-2 -z-10 opacity-60"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-white to-gray-100 rounded-[18px] transform translate-y-1 -z-20 opacity-40"></div>
            
            <div className="relative bg-white rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200/80 overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_rgb(0,0,0,0.12)]">
              {/* Premium browser chrome */}
              <div className="bg-gradient-to-b from-gray-50 to-white border-none border-gray-200/60 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {/* macOS traffic lights - precise sizing */}
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-[#28CA42] border border-[#1AAB29] shadow-sm"></div>
                  </div>
                  
                  {/* URL bar - ultra clean */}
                  <div className="flex-1 max-w-md mx-auto">
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm text-gray-600 font-medium">proanbud.no</span>
                      <span className="text-sm text-gray-400">/dashboard</span>
                    </div>
                  </div>
                  
                  {/* Browser controls */}
                  <div className="flex items-center gap-1.5 border-none">
                    <div className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dashboard image - pristine presentation */}
              <div className="relative bg-gradient-to-br from-gray-50 to-white overflow-hidden">
                <Image
                  src={dashboardImage} 
                  alt="Proanbud Dashboard" 
                  className="w-full h-auto"
                  priority
                  style={{
                    marginTop: "-1px",
                    marginLeft: "3px"
                  }}
                />
              </div>
              
              {/* Bottom status bar - adds realism */}
              <div className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-100 px-5 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Synkronisert</span>
                  </div>
                  <span>•</span>
                  <span>Sist oppdatert: Akkurat nå</span>
                </div>
                <div className="text-xs text-gray-400">
                  v2.0.1
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
