'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/shared/Logo';

interface HeaderProps {
  currentPage?: 'home' | 'priser' | 'blogg' | 'pilot';
}

export default function Header({ currentPage }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

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
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href={currentPage === 'home' ? '#features' : '/#features'} 
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(currentPage === 'home' ? '#features' : '/#features');
              }}
              className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium"
            >
              Funksjoner
            </a>
            <a 
              href={currentPage === 'home' ? '#showcase' : '/#showcase'} 
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(currentPage === 'home' ? '#showcase' : '/#showcase');
              }}
              className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium"
            >
              Plattform
            </a>
            <Link
              href="/priser"
              className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium"
            >
              Priser
            </Link>
            <a 
              href={currentPage === 'home' ? '#faq' : '/#faq'} 
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(currentPage === 'home' ? '#faq' : '/#faq');
              }}
              className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium"
            >
              FAQ
            </a>
            <Link
              href="/blogg"
              className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium"
            >
              Blogg
            </Link>
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
              className="bg-[#82ffb2] text-gray-900 px-6 py-2 rounded-xl transition-all font-semibold shadow-lg shadow-[#82ffb2]/20 hover:shadow-xl hover:shadow-[#82ffb2]/30"
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
              href={currentPage === 'home' ? '#features' : '/#features'}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(currentPage === 'home' ? '#features' : '/#features');
              }}
              className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
            >
              Funksjoner
            </a>
            <a
              href={currentPage === 'home' ? '#showcase' : '/#showcase'}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(currentPage === 'home' ? '#showcase' : '/#showcase');
              }}
              className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
            >
              Plattform
            </a>
            <Link
              href="/priser"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
            >
              Priser
            </Link>
            <a
              href={currentPage === 'home' ? '#faq' : '/#faq'}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(currentPage === 'home' ? '#faq' : '/#faq');
              }}
              className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
            >
              FAQ
            </a>
            <Link
              href="/blogg"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
            >
              Blogg
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
                className="block w-full text-center bg-[#82ffb2] text-gray-900 px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-[#82ffb2]/20 hover:shadow-xl hover:shadow-[#82ffb2]/30"
              >
                Kom igang
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}