
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { FeatureSection } from '@/components/shared/Features';
import {NewHero} from '@/components/NewHero';
import { 
  Zap, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  FileText, 
  Smartphone,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Facebook,
  ArrowRight,
  Check,
  BarChart3,
  Users,
  Shield,
  Brain
} from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { FaqSection } from '@/components/shared/FaqSection';
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';
import { client, allPostsQuery, formatDate, urlForImage } from '@/lib/sanity';
import { BlogSection1 } from '@/components/pro-blocks/landing-page/blog-sections/blog-section-1';
import { ShowcaseFeature } from '@/components/shared/ShowcaseFeature';
import { SavingsCalculator } from '@/components/SavingsCalculator';


interface SanityPost {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  excerpt?: string;
  publishedAt: string;
  mainImage?: {
    asset: any;
    alt?: string;
  };
  author?: {
    name: string;
    slug: {
      current: string;
    };
  };
  categories?: Array<{
    title: string;
    slug: {
      current: string;
    };
  }>;
}

function HomeContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [blogPosts, setBlogPosts] = useState<SanityPost[]>([]);

  // Check if this is a password reset or email verification request and redirect
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (mode === 'resetPassword' && oobCode) {
      // Redirect to the reset-password page with all parameters
      const params = new URLSearchParams(searchParams.toString());
      router.replace(`/reset-password?${params.toString()}`);
    } else if (mode === 'verifyEmail' && oobCode) {
      // Redirect to the verify-email page with all parameters
      const params = new URLSearchParams(searchParams.toString());
      router.replace(`/verify-email?${params.toString()}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Fetch latest blog posts from Sanity
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const posts = await client.fetch<SanityPost[]>(allPostsQuery, {}, {
          next: { revalidate: 60 }
        });
        // Get only the latest 3 posts
        setBlogPosts(posts.slice(0, 3));
      } catch (error) {
        console.error('Feil ved henting av blogginnlegg:', error);
        setBlogPosts([]);
      }
    };
    fetchPosts();
  }, []);

  // Handle hash scrolling
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        // Small delay to ensure the page has rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#82ffb2] mx-auto"></div>
          <p className="mt-4 text-muted-text">Laster...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-text mb-4">Omdirigerer til dashbordet...</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-[#82ffb2] text-gray-900 rounded-md hover:bg-[#6ee69f] transition-colors font-medium"
          >
            Gå til dashbordet
          </Link>
        </div>
      </div>
    );
  }

  const faqs = [
    {
      question: "Hvordan fungerer AI-prissettingen?",
      answer: "Vår AI analyserer historiske prosjektdata, materialpriser og markedstrender for å foreslå konkurransedyktige priser tilpasset ditt prosjekt. Du har alltid full kontroll og kan justere prisene manuelt."
    },
    {
      question: "Kan jeg bruke Proanbud på mobilen?",
      answer: "Ja! Proanbud er fullt responsiv og fungerer perfekt på både mobil, nettbrett og PC. Send tilbud direkte fra byggeplassen."
    },
    {
      question: "Hvor lang tid tar det å sende et tilbud?",
      answer: "Med våre forhåndslagde maler og AI-assistanse kan du sende et profesjonelt tilbud på under 5 minutter."
    },
    {
      question: "Kan jeg tilpasse tilbudsmaler?",
      answer: "Absolutt! Du kan lage egne maler med din bedrifts profil, eller bruke våre profesjonelle standardmaler som utgangspunkt."
    },
    {
      question: "Hva koster Proanbud?",
      answer: "Vi tilbyr fleksible abonnementsplaner tilpasset bedriftens størrelse. Start med en gratis prøveperiode på 14 dager - ingen kredittkort påkrevd."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="home" />

      <NewHero />

      {/* Before/After Section */}
      <section className="py-40 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-normal text-gray-900 tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-lora), serif' }}
            >
              Fra kaos til kontroll
            </h2>
            <p className="text-gray-600 text-lg md:text-xl font-light max-w-2xl mx-auto">
              Se forskjellen Proanbud gjør i din arbeidshverdag
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* BEFORE */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 bg-red-400 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg z-10">
                ❌ Før Proanbud
              </div>
              <div className="bg-white border-2 border-red-200 rounded-2xl p-8 pt-12 shadow-sm">
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Clock className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">1-3 timer per tilbud</h4>
                      <p className="text-gray-600 text-sm">Manuell kalkulering, Excel-ark og formattering tar lang tid</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <FileText className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Uprofesjonelle tilbud</h4>
                      <p className="text-gray-600 text-sm">Word-dokumenter som ser hjemmelagde ut</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <TrendingUp className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Usikker prissetting</h4>
                      <p className="text-gray-600 text-sm">Gjetting på priser - taper oppdrag eller tjener for lite</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Kaotisk kundeoppfølging</h4>
                      <p className="text-gray-600 text-sm">Mister oversikten over hvem du har sendt til og når</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AFTER */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 text-primary bg-[#82ffb2] text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm shadow-lg z-10">
                ✅ Med Proanbud
              </div>
              <div className="bg-white border-2 border-[#82ffb2] rounded-2xl p-8 pt-12 shadow-lg">
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#82ffb2] flex items-center justify-center flex-shrink-0 mt-1">
                      <Zap className="w-4 h-4 text-gray-900" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">5 minutter per tilbud</h4>
                      <p className="text-gray-600 text-sm">AI kalkulerer automatisk - du godkjenner og sender</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#82ffb2] flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-gray-900" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Interaktive tilbud</h4>
                      <p className="text-gray-600 text-sm">Polerte, oversiktlige tilbud som imponerer kunder</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#82ffb2] flex items-center justify-center flex-shrink-0 mt-1">
                      <Brain className="w-4 h-4 text-gray-900" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">AI-drevet prissetting</h4>
                      <p className="text-gray-600 text-sm">Konkurransedyktige priser basert på markedsdata og dine leverandører</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#82ffb2] flex items-center justify-center flex-shrink-0 mt-1">
                      <BarChart3 className="w-4 h-4 text-gray-900" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Full kontroll & oversikt</h4>
                      <p className="text-gray-600 text-sm">Se alle tilbud, kunder og konverteringsrate på ett sted</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Below */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-lora), serif' }}>
                96%
              </div>
              <div className="text-sm text-gray-600">Mindre tid brukt</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-lora), serif' }}>
                5 min
              </div>
              <div className="text-sm text-gray-600">Per tilbud</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-lora), serif' }}>
                21x
              </div>
              <div className="text-sm text-gray-600">Flere tilbud sendt</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-lora), serif' }}>
                100%
              </div>
              <div className="text-sm text-gray-600">Mer profesjonelt</div>
            </div>
          </div>
        </div>
      </section>

      {/* Savings Calculator Section */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 
              className="text-4xl md:text-5xl font-normal text-gray-900 tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-lora), serif' }}
            >
              Sjekk hvor mye du kan spare
            </h2>
            <p className="text-gray-600 text-lg md:text-xl font-light max-w-2xl mx-auto">
              Se hvor mye tid og penger du kan spare ved å bytte til Proanbud
            </p>
          </div>
          <SavingsCalculator variant="full" />
        </div>
      </section>

      <ShowcaseFeature />

      {/* Features Section
      <FeatureSection />
      */}

      {/* FAQ Section */}
      <FaqSection faqs={faqs} />


      {/* Blog Section */}
      <BlogSection1 />

      {/* CTA Section */}
      <section className="py-28 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center space-y-10 relative z-10">
          <h2 
            className="text-4xl md:text-6xl font-normal text-white tracking-tight"
            style={{ fontFamily: 'var(--font-lora), serif' }}
          >
            Klar til å effektivisere tilbudsprosessen?
          </h2>
          <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">
            Bli med tusenvis av håndverkere som allerede bruker Proanbud
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
              href="/login"
              className="bg-transparent text-white px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all font-semibold text-md border-2 border-white/20 hover:border-white/40 flex items-center justify-center gap-2"
            >
              Logg inn
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 pt-2 text-sm text-gray-300 font-light">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#82ffb2]" />
              <span>14 dagers gratis prøveperiode</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#82ffb2]" />
              <span>Ingen binding</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

