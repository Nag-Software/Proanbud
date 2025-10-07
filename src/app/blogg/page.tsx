'use client';

import React from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { Menu, X } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image?: string;
}

export default function BlogPage() {
  // Sample blog posts - later this can be fetched from a CMS or database
  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Hvordan lage profesjonelle tilbud på under 5 minutter',
      excerpt: 'Lær hvordan du kan effektivisere tilbudsprosessen din med AI-drevet automatisering og spare verdifull tid.',
      author: 'Proanbud Team',
      date: '2. oktober 2025',
      category: 'Tips & Triks',
      readTime: '5 min',
      image: '/assets/hero/nice.png'
    },
    {
      id: '2',
      title: 'De 10 vanligste feilene ved prising av renoveringsprosjekter',
      excerpt: 'Unngå disse vanlige fallgruvene når du priser dine neste renoveringsprosjekter. Basert på data fra over 1000 tilbud.',
      author: 'Proanbud Team',
      date: '28. september 2025',
      category: 'Beste praksis',
      readTime: '8 min',
      image: '/assets/hero/nice2.png'
    },
    {
      id: '3',
      title: 'Hvordan AI kan transformere din tilbudsvirksomhet',
      excerpt: 'Utforsk hvordan kunstig intelligens kan hjelpe deg med å lage bedre tilbud, spare tid og øke gevinstprosenten din.',
      author: 'Proanbud Team',
      date: '25. september 2025',
      category: 'Teknologi',
      readTime: '6 min',
      image: '/assets/hero/nice3.png'
    },
    {
      id: '4',
      title: 'Slik øker du gevinstprosenten på dine tilbud med 30%',
      excerpt: 'Data-drevne strategier for å forbedre tilbudene dine og vinne flere prosjekter. Inkluderer case studies fra virkelige kunder.',
      author: 'Proanbud Team',
      date: '20. september 2025',
      category: 'Strategi',
      readTime: '10 min'
    },
    {
      id: '5',
      title: 'Nye funksjoner i Proanbud: Automatisk katalogsynkronisering',
      excerpt: 'Vi introduserer automatisk synkronisering av produktkataloger, slik at prisene dine alltid er oppdaterte.',
      author: 'Proanbud Team',
      date: '15. september 2025',
      category: 'Produktnyheter',
      readTime: '4 min'
    },
    {
      id: '6',
      title: 'Kundecase: Hvordan Nag Snekkeri AS økte omsetningen med 45%',
      excerpt: 'Les hvordan en av våre kunder brukte Proanbud til å transformere sin virksomhet og oppnå betydelig vekst.',
      author: 'Proanbud Team',
      date: '10. september 2025',
      category: 'Kundecase',
      readTime: '7 min'
    }
  ];

  const categories = ['Alle', 'Tips & Triks', 'Beste praksis', 'Teknologi', 'Strategi', 'Produktnyheter', 'Kundecase'];
  const [selectedCategory, setSelectedCategory] = React.useState('Alle');

  const filteredPosts = selectedCategory === 'Alle' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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

      {/* Hero Section */}
      <section className="py-16 px-4 bg-gradient-to-t from-primary to-blue-600 text-white">
        {/* Grainy texture overlay */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '400px 400px'
          }}
        />
            <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Blogg
            </h1>
            <p className="text-xl text-white/90 mb-8">
                Tips, innsikt og nyheter om tilbudsgivning, prising og hvordan du kan vokse din virksomhet
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
                <input
                type="text"
                placeholder="Søk etter artikler..."
                className="w-full px-6 py-4 rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <Icons.Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-4 border-b border-gray-200 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition-all ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Ingen artikler funnet i denne kategorien.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-primary to-blue-600 overflow-hidden">
                    {post.image ? (
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icons.FileText className="h-16 w-16 text-white/50" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Icons.Calendar className="h-4 w-4" />
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icons.Clock className="h-4 w-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icons.User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-gray-700">{post.author}</span>
                      </div>

                      <Link
                        href={`/blogg/${post.id}`}
                        className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium"
                      >
                        Les mer
                        <Icons.ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 bg-white border-t border-gray-200">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-12 text-white">
            <Icons.Mail className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Få de nyeste artiklene direkte i innboksen</h2>
            <p className="text-xl mb-8 text-white/90">
              Meld deg på vårt nyhetsbrev for tips, innsikt og nyheter om tilbudsgivning
            </p>
            <div className="max-w-md mx-auto flex gap-2">
              <input
                type="email"
                placeholder="Din e-postadresse"
                className="flex-1 px-4 py-3 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-white"
              />
              <button className="bg-white text-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors whitespace-nowrap">
                Abonner
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4">
        <div className="container mx-auto text-center text-gray-600">
          <p>&copy; 2025 Proanbud AI. Alle rettigheter reservert.</p>
        </div>
      </footer>
    </div>
  );
}
