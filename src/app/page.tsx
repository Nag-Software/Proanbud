
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
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
  Menu,
  X
} from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { HeroCarousel } from '@/components/ui/hero-carousel';
import { FaqSection } from '@/components/shared/FaqSection';
import Footer from '@/components/shared/Footer';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

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

  const blogPosts = [
    {
      title: "5 tips for å vinne flere anbud i 2025",
      excerpt: "Lær hvordan du kan øke sjansene dine for å vinne anbud med disse beprøvde strategiene.",
      date: "15. sep 2024",
      image: "/assets/1.jpg",
      category: "Strategi"
    },
    {
      title: "Slik prissetter du tjenester riktig",
      excerpt: "En komplett guide til å sette konkurransedyktige priser som sikrer lønnsomhet.",
      date: "8. sep 2024",
      image: "/assets/2.jpg",
      category: "Økonomi"
    },
    {
      title: "Digitalisering i håndverksbransjen",
      excerpt: "Hvorfor digitale verktøy er fremtiden for håndverksbedrifter.",
      date: "1. sep 2024",
      image: "/assets/1.jpg",
      category: "Teknologi"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#82ffb2]/5 to-[#82b2ff]/5">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Logo size="lg" />
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                Funksjoner
              </a>
              <a href="#showcase" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                Plattform
              </a>
              <a href="/priser" className='text-gray-700 hover:text-[#00b85b] transition-colors font-medium'>
                Priser
              </a>
              <a href="#faq" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                FAQ
              </a>
              <a href="/blogg" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                Blogg
              </a>
            </nav>
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium"
              >
                Logg inn
              </Link>
              <Link
                href="/signup"
                className="bg-[#82ffb2] text-gray-900 px-6 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-[#82ffb2]/20 hover:shadow-xl hover:shadow-[#82ffb2]/30"
              >
                Kom igang
              </Link>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-[#00b85b] transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-4">
              <a 
                href="#features" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
              >
                Funksjoner
              </a>
              <a 
                href="#showcase" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
              >
                Plattform
              </a>
              <a 
                href="#faq" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
              >
                FAQ
              </a>
              <a 
                href="/blogg" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
              >
                Blogg
              </a>
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
                  className="block w-full text-center bg-[#82ffb2] text-gray-900 px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-[#82ffb2]/20 hover:shadow-xl hover:shadow-[#82ffb2]/30"
                >
                  Kom igang
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section with Video */}
      <section className="relative overflow-hidden py-15 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#82ffb2]/10 rounded-full border border-[#82ffb2]/20">
                <Sparkles className="w-4 h-4 text-[#82ffb2]" />
                <span className="text-sm font-medium text-gray-700">AI-drevet tilbudsplattform</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-gray-900">
                Send tilbud på
                <span className="bg-gradient-to-r from-[#82ffb2] to-[#82b2ff] bg-clip-text text-transparent"> minutter</span>
                , ikke timer, <span className="italic">med AI</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                Din komplette tilbudsplattform for håndverkere. Bruk AI til å prissette riktig, send profesjonelle tilbud fra mobil eller PC, og vinn flere oppdrag.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="group bg-[#82ffb2] text-gray-900 px-8 py-4 rounded-xl hover:bg-[#6ee69f] transition-all font-semibold text-lg shadow-xl shadow-[#82ffb2]/30 hover:shadow-2xl hover:shadow-[#82ffb2]/40 flex items-center justify-center gap-2"
                >
                  Start gratis i dag
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="bg-white text-gray-900 px-8 py-4 rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg border-2 border-gray-200 flex items-center justify-center gap-2"
                >
                  Se demo
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#82ffb2]" />
                  <span className="text-sm text-gray-600">Gratis i 14 dager</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#82ffb2]" />
                  <span className="text-sm text-gray-600">Ingen kredittkort</span>
                </div>
              </div>
            </div>

            {/* Hero Carousel */}
            <div className="relative">
              <HeroCarousel
                images={[
                  '/assets/hero/Gemini_Generated_Image_6u0ggt6u0ggt6u0g.png',
                  '/assets/hero/nice.png',
                  '/assets/hero/nice2.png',
                  '/assets/hero/nice3.png',
                ]}
                autoPlayInterval={4000}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Alt du trenger i én plattform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Effektivisér hele anbudsprosessen med smarte verktøy designet for håndverkere
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "AI-prissetting",
                description: "La kunstig intelligens foreslå konkurransedyktige priser basert på materialpriser og historisk data",
                color: "#82ffb2"
              },
              {
                icon: Zap,
                title: "Lynrask tilbudssending",
                description: "Send profesjonelle tilbud på under 5 minutter med forhåndslagde maler",
                color: "#ff82d0"
              },
              {
                icon: Smartphone,
                title: "Mobilvennlig",
                description: "Full funksjonalitet på mobil, nettbrett og PC - send tilbud fra byggeplassen",
                color: "#82b2ff"
              },
              {
                icon: FileText,
                title: "Profesjonelle maler",
                description: "Velg blant moderne, tilpassbare maler som gir et profesjonelt førsteinntrykk",
                color: "#82ffb2"
              },
              {
                icon: BarChart3,
                title: "Analyse & rapporter",
                description: "Følg med på konverteringsrate, omsetning og andre nøkkeltall i sanntid",
                color: "#ff82d0"
              },
              {
                icon: Clock,
                title: "Spar 80% tid",
                description: "Automatiser repeterende oppgaver og fokuser på det som gir verdi",
                color: "#82b2ff"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-gray-300 transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Showcase - Interactive */}
      <section id="showcase" className="py-24 bg-gradient-to-br from-[#82ffb2]/5 to-[#82b2ff]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Oppdag plattformen
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Intuitiv, kraftig og designet for å gjøre jobben din enklere
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {[
                {
                  icon: Users,
                  title: "Kundeadministrasjon",
                  description: "Hold oversikt over alle kunder, prosjekter og kommunikasjon på ett sted"
                },
                {
                  icon: FileText,
                  title: "Tilbudshåndtering",
                  description: "Opprett, send og spor tilbud med automatiske påminnelser og oppfølging"
                },
                {
                  icon: BarChart3,
                  title: "Sanntidsanalyse",
                  description: "Visualiser bedriftens ytelse med interaktive dashboards og rapporter"
                },
                {
                  icon: Shield,
                  title: "Sikker & GDPR-compliant",
                  description: "All data krypteres og lagres sikkert i henhold til norske lover"
                }
              ].map((item, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-[#82ffb2]/10 flex items-center justify-center group-hover:bg-[#82ffb2]/20 transition-colors">
                      <item.icon className="w-6 h-6 text-[#00b85b]" />
                    </div>
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-md">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

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
              <div className="absolute -top-8 -left-8 w-32 h-32 bg-[#ff82d0]/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[#82b2ff]/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection faqs={faqs} />

      {/* Blog Section */}
      <section id="blog" className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Siste fra bloggen
              </h2>
              <p className="text-xl text-gray-600">
                Tips, trender og innsikt for håndverkere
              </p>
            </div>
            <Link
              href="/blogg"
              className="hidden md:flex items-center gap-2 text-[#00b85b] hover:text-[#00a050] font-semibold group"
            >
              Se alle artikler
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <article
                key={index}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#82ffb2]/50 hover:shadow-xl transition-all"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-[#82ffb2] text-gray-900 text-xs font-semibold rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="text-sm text-gray-500">{post.date}</div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#00b85b] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{post.excerpt}</p>
                  <Link
                    href={`/blogg/${post.id}`}
                    className="inline-flex items-center gap-2 text-[#00b85b] hover:text-[#00a050] font-semibold group"
                  >
                    Les mer
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#82ffb2] relative overflow-hidden">
        {/* Grainy texture overlay */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px'
          }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Klar til å effektivisere tilbudsprosessen?
          </h2>
          <p className="text-xl text-gray-800">
            Bli med tusenvis av håndverkere som allerede bruker Proanbud
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="group bg-gray-900 text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-all font-semibold text-lg shadow-xl flex items-center justify-center gap-2"
            >
              Start gratis i dag
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="bg-white text-gray-900 px-8 py-4 rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg flex items-center justify-center gap-2"
            >
              Kontakt salg
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 pt-4 text-sm text-gray-800">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span>14 dagers gratis prøveperiode</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
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
