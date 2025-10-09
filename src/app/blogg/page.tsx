"use client";

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { client, allPostsQuery, formatDate, urlForImage } from '@/lib/sanity'
import * as Icons from 'lucide-react'
import Logo from '@/components/shared/Logo'
import Footer from '@/components/shared/Footer'



interface SanityPost {
  _id: string
  title: string
  slug: {
    current: string
  }
  excerpt?: string
  publishedAt: string
  mainImage?: {
    asset: any
    alt?: string
  }
  author?: {
    name: string
    slug: {
      current: string
    }
  }
  categories?: Array<{
    title: string
    slug: {
      current: string
    }
  }>
}

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<SanityPost[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const posts = await client.fetch<SanityPost[]>(allPostsQuery, {}, {
          next: { revalidate: 60 }
        })
        setBlogPosts(posts)
      } catch (error) {
        console.error('Feil ved henting av blogginnlegg:', error)
        setBlogPosts([])
      }
    }
    fetchPosts()
  }, [])

  const displayPosts: SanityPost[] = blogPosts.length === 0 ? [
    {
      _id: 'mock-1',
      title: 'Hvordan lage profesjonelle tilbud på under 5 minutter',
      slug: { current: 'profesjonelle-tilbud-5-minutter' },
      excerpt: 'Lær hvordan du kan effektivisere tilbudsprosessen din med AI-drevet automatisering.',
      publishedAt: '2025-10-02T10:00:00Z',
      author: { name: 'Proanbud Team', slug: { current: 'proanbud-team' } },
      categories: [{ title: 'Tips & Triks', slug: { current: 'tips-og-triks' } }],
    },
  ] : blogPosts

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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
              <a href="/blogg" className="text-[#00b85b] font-semibold">
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
              {isMobileMenuOpen ? <Icons.X className="h-6 w-6" /> : <Icons.Menu className="h-6 w-6" />}
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
              <a href="/priser"
              className='block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2'
              onClick={() => setIsMobileMenuOpen(false)}
              >
                Priser
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
                className="block text-[#00b85b] font-semibold py-2"
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

      <section className="relative py-20 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900">
        <div className="relative container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-900 tracking-tight">Blogg</h1>
          <p className="text-lg text-gray-600 font-medium">
        Faglig innsikt, inspirasjon og de siste trendene innen tilbudsprosesser og digitalisering.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayPosts.map((post) => {
              const imageUrl = post.mainImage?.asset ? urlForImage(post.mainImage.asset).width(600).height(400).url() : null
              const categoryName = post.categories?.[0]?.title || 'Generelt'
              
              return (
                <Link href={`/blogg/${post.slug.current}`} key={post._id} className="group">
                  <article className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all h-full flex flex-col">
                    <div className="relative h-48 bg-gradient-to-br from-[#00b85b] to-[#00854a]">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={post.mainImage?.alt || post.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icons.FileText className="h-16 w-16 text-white/50" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-white text-[#00b85b] px-3 py-1 rounded-full text-sm font-medium">
                          {categoryName}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                        <Icons.Calendar className="h-4 w-4" />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#00b85b] line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
                        {post.excerpt || 'Les mer om dette spennende temaet...'}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-[#00b85b]/10 flex items-center justify-center">
                            <Icons.User className="h-4 w-4 text-[#00b85b]" />
                          </div>
                          <span className="text-sm text-gray-700">{post.author?.name || 'Proanbud'}</span>
                        </div>
                        <span className="text-[#00b85b] flex items-center gap-1 font-medium">
                          Les mer
                          <Icons.ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
