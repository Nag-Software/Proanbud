'use client';

import React from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Filter posts based on category and search query
  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'Alle' || post.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Logo size="lg" />
            <nav className="hidden md:flex items-center gap-8">
              <a href="/#features" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                Funksjoner
              </a>
              <a href="/#showcase" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                Plattform
              </a>
              <a href="/priser" className='text-gray-700 hover:text-[#00b85b] transition-colors font-medium'>
                Priser
              </a>
              <a href="/#faq" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
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
                href="/#features" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
              >
                Funksjoner
              </a>
              <a 
                href="/#showcase" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
              >
                Plattform
              </a>
              <a 
                href="/#faq" 
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
      <section className="relative py-12 md:py-16 px-4 text-white overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 bg-[url('/assets/sunset.jpg')] bg-cover bg-center opacity-20" />
          {/* Subtle grid pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
          {/* Accent gradient orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00b85b]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#82ffb2]/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-5">
            <Icons.BookOpen className="h-3.5 w-3.5 text-[#82ffb2]" />
            <span className="text-xs font-medium text-white/90">Kunnskap & Innsikt</span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Blogg for profesjonelle
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#82ffb2] to-[#00b85b] bg-clip-text text-transparent">
              tilbudsgivere
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-white/80 mb-6 max-w-3xl mx-auto leading-relaxed">
            Tips, innsikt og beste praksis for å lage bedre tilbud, øke gevinstprosent og vokse din virksomhet
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00b85b]/30 to-[#82ffb2]/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk etter artikler..."
                className="w-full px-5 py-3 md:py-3.5 bg-transparent text-white placeholder:text-white/60 outline-none"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <Icons.X className="h-4 w-4" />
                </button>
              )}
              <button 
                className="absolute right-2 cursor-pointer top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-[#00b85b] to-[#82ffb2] rounded-lg hover:shadow-lg hover:shadow-[#00b85b]/50 transition-all duration-300"
                aria-label="Search"
              >
                <Icons.Search className="h-4 w-4 text-white" onClick={() => {router.push("#to-blogs");}}/>
              </button>
            </div>
          </div>

          {/* Stats or Social Proof */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 md:gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Icons.FileText className="h-4 w-4 text-[#82ffb2]" />
              <span className="text-white/70">{blogPosts.length} artikler</span>
            </div>
            <div className="flex items-center gap-2">
              <Icons.Calendar className="h-4 w-4 text-[#82ffb2]" />
              <span className="text-white/70">Nye artikler månedlig</span>
            </div>
            <div className="flex items-center gap-2">
              <Icons.Clock className="h-4 w-4 text-[#82ffb2]" />
              <span className="text-white/70">4-10 min lesing</span>
            </div>
          </div>
        </div>
      </section>

      <div id="to-blogs" />

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
              <Icons.SearchX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">
                {searchQuery 
                  ? `Ingen artikler funnet for "${searchQuery}"` 
                  : 'Ingen artikler funnet i denne kategorien.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-primary hover:text-primary/80 underline mt-2"
                >
                  Nullstill søk
                </button>
              )}
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
