
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  Shield
} from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { FaqSection } from '@/components/shared/FaqSection';
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';
import { client, allPostsQuery, formatDate, urlForImage } from '@/lib/sanity';
import { BlogSection1 } from '@/components/pro-blocks/landing-page/blog-sections/blog-section-1';

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

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [blogPosts, setBlogPosts] = useState<SanityPost[]>([]);

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
    <div className="min-h-screen bg-gradient-to-b from-white via-[#82ffb2]/5 to-[#82b2ff]/5">
      <Header currentPage="home" />

      {/* Hero Section with Video */}
      <section className="relative overflow-hidden py-10 lg:py-15 bg-white mt-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-center">
            <div className="text-center lg:text-left space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#82ffb2]/10 rounded-full border border-[#82ffb2]/20">
                <Sparkles className="w-4 h-4 text-[#82ffb2]" />
                <span className="text-sm font-medium text-gray-700">AI-drevet tilbudsplattform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900">
                Send tilbud på
                <span className="bg-gradient-to-r from-[#82ffb2] to-[#82b2ff] bg-clip-text text-transparent"> minutter</span>
                , ikke timer, <span className="italic">med AI</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-5xl px-10 lg:px-0">
                Din komplette tilbudsplattform for håndverkere. Bruk AI til å prissete riktig, send profesjonelle tilbud fra mobil eller PC, og vinn flere oppdrag.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start" id="bli-pilot">
                <Link
                  href="/pilot"
                  className="group bg-primary text-primary-foreground px-8 py-2.5 rounded-xl hover:bg-primary/90 transition-all font-semibold text-md hover:shadow-md flex items-center justify-center gap-2"
                >
                  Bli Pilotkunde
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="bg-white text-gray-900 px-8 py-2.5 rounded-xl hover:bg-gray-50 transition-all font-semibold text-md border-2 border-gray-200 flex items-center justify-center gap-2"
                >
                  Se demo
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 pt-0 justify-center lg:justify-start">
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

            {/* Interactive Platform Showcase */}
            <div className="relative hidden md:block ml-0 lg:ml-10">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 max-h-[28rem] overflow-hidden w-full lg:w-[120%] lg:-ml-[10%]">
                {/* Platform Preview Tabs */}
                <div className="flex space-x-1 mb-4 bg-gray-50 p-1 rounded-xl">
                  <button className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-primary rounded-lg transition-all shadow-sm">
                    Dashboard
                  </button>
                  <button className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 rounded-lg">
                    Tilbud
                  </button>
                  <button className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 rounded-lg">
                    Analyse
                  </button>
                </div>

                {/* Dashboard Preview */}
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Dashboard</h3>
                      <p className="text-xs text-gray-600">Nøkkeltall og aktivitet</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shadow-lg">
                      <Users className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>

                  {/* Stats Cards - Using actual KPI Card design */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="h-full px-2 py-0 border-slate-200/60 flex flex-col max-h-29">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                        <CardTitle className="font-medium text-slate-600 text-xs leading-tight">
                          OMSETNING
                        </CardTitle>
                        <div className="bg-slate-100 rounded-lg flex-shrink-0 p-1.5">
                          <TrendingUp className="w-3 h-3 text-slate-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-1 !px-3 flex-1 flex flex-col justify-between">
                        <div className="font-bold text-slate-800 mb-0.5 ml-2 text-lg leading-tight">
                          +24%
                        </div>
                        <div className="flex items-center gap-1 pt-2 flex-nowrap">
                          <div className="font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 text-xs bg-green-50 text-green-700 border border-green-200">
                            +12%
                          </div>
                          <span className="text-slate-500 text-xs leading-tight whitespace-nowrap">
                            fra forrige måned
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="h-full px-2 py-0 border-slate-200/60 flex flex-col max-h-29">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                        <CardTitle className="font-medium text-slate-600 text-xs leading-tight">
                          TILBUD
                        </CardTitle>
                        <div className="bg-slate-100 rounded-lg flex-shrink-0 p-1.5">
                          <FileText className="w-3 h-3 text-slate-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-1 !px-3 flex-1 flex flex-col justify-between">
                        <div className="font-bold text-slate-800 mb-0.5 ml-2 text-lg leading-tight">
                          12
                        </div>
                        <div className="flex items-center gap-1 pt-2 flex-nowrap">
                          <div className="font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 text-xs bg-green-50 text-green-700 border border-green-200">
                            +3
                          </div>
                          <span className="text-slate-500 text-xs leading-tight whitespace-nowrap">
                            fra forrige måned
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="h-full px-2 py-0 border-slate-200/60 flex flex-col max-h-29">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                        <CardTitle className="font-medium text-slate-600 text-xs leading-tight">
                          VUNNET
                        </CardTitle>
                        <div className="bg-slate-100 rounded-lg flex-shrink-0 p-1.5">
                          <Check className="w-3 h-3 text-slate-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-1 !px-3 flex-1 flex flex-col justify-between">
                        <div className="font-bold text-slate-800 mb-0.5 ml-2 text-lg leading-tight">
                          8
                        </div>
                        <div className="flex items-center pt-2 gap-1 flex-nowrap">
                          <div className="font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 text-xs bg-green-50 text-green-700 border border-green-200">
                            +2
                          </div>
                          <span className="text-slate-500 text-xs leading-tight whitespace-nowrap">
                            fra forrige måned
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity - Using actual ActivityFeed design */}
                  <Card className="h-full flex flex-col max-h-34">
                    <CardHeader className="flex-shrink-0 pb-2">
                      <CardTitle className="text-sm">Siste Aktivitet</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-3">
                      <div className="h-full overflow-y-auto">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 p-2 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                              <Sparkles className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-gray-900 truncate">AI-prissetting fullført</p>
                              <p className="text-xs text-gray-600 line-clamp-1">Kjøkkenrenovering - Prosjekt</p>
                              <p className="text-xs text-gray-500 mt-0.5">2 min siden</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                              <Mail className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-gray-900 truncate">Tilbud sendt</p>
                              <p className="text-xs text-gray-600 line-clamp-1">Badrenovering - Kunde</p>
                              <p className="text-xs text-gray-500 mt-0.5">15 min siden</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                              <Check className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-gray-900 truncate">Tilbud vunnet</p>
                              <p className="text-xs text-gray-600 line-clamp-1">Stueombygging - Bedrift</p>
                              <p className="text-xs text-gray-500 mt-0.5">2 timer siden</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Floating Action Button */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Alt du trenger i én plattform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Effektivisér hele anbudsprosessen med smarte verktøy designet for håndverkere
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:max-w-4xl xl:max-w-6xl mx-auto">
            {[
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
            ].map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-md shadow-xs transition-shadow">
                <div className="flex flex-col space-y-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Showcase - Interactive */}
      <section id="showcase" className="py-24 bg-gradient-to-br from-[#82ffb2]/5 to-[#82b2ff]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-[45px] font-bold text-gray-900">
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
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
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
      <BlogSection1 />

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
          <p className="text-xl text-gray-800 mb-10">
            Bli med tusenvis av håndverkere som allerede bruker Proanbud
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="group bg-gray-900 text-white px-8 py-2 rounded-lg hover:bg-gray-800 transition-all font-semibold text-md shadow-xl flex items-center justify-center gap-2"
            >
              Start gratis i dag
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="mailto:casper@nagsoftware.no"
              className="bg-white text-gray-900 px-8 py-2 rounded-lg hover:bg-gray-50 transition-all font-semibold text-md flex items-center justify-center gap-2"
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
