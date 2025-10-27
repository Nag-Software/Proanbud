"use client";

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { client, allPostsQuery, formatDate, urlForImage } from '@/lib/sanity'
import * as Icons from 'lucide-react'
import Logo from '@/components/shared/Logo'
import Footer from '@/components/shared/Footer'
import Header from '@/components/shared/Header'



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
      <Header currentPage="blogg" />

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
                    <div className="relative h-48 bg-gradient-to-br from-secondary to-cyan-100">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={post.mainImage?.alt || post.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icons.FileText className="h-16 w-16 text-white/80" />
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
