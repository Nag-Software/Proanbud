import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import { client, singlePostQuery, allPostSlugsQuery, formatDate, urlForImage, calculateReadingTime } from '@/lib/sanity'
import * as Icons from 'lucide-react'
import Logo from '@/components/shared/Logo'

/**
 * TypeScript-grensesnitt for blogginnlegg
 */
interface Post {
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
    image?: {
      asset: any
    }
    bio?: string
  }
  categories?: Array<{
    title: string
    slug: {
      current: string
    }
  }>
  body: any[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
}

/**
 * Genererer metadata dynamisk basert på blogginnlegg
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await client.fetch<Post>(singlePostQuery, { slug })

  if (!post) {
    return {
      title: 'Innlegg ikke funnet | Proanbud',
    }
  }

  const imageUrl = post.mainImage?.asset 
    ? urlForImage(post.mainImage.asset).width(1200).height(630).url()
    : undefined

  return {
    title: post.seo?.metaTitle || `${post.title} | Proanbud Blogg`,
    description: post.seo?.metaDescription || post.excerpt || 'Les mer på Proanbud Blogg',
    openGraph: {
      title: post.title,
      description: post.excerpt || 'Les mer på Proanbud Blogg',
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || 'Les mer på Proanbud Blogg',
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

/**
 * Generer statiske paths for alle blogginnlegg (SSG)
 */
export async function generateStaticParams() {
  const slugs = await client.fetch<Array<{ slug: string }>>(allPostSlugsQuery)
  return slugs.map((item) => ({
    slug: item.slug,
  }))
}

/**
 * Custom components for Portable Text rendering
 */
const portableTextComponents = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset) return null
      
      const imageUrl = urlForImage(value.asset).width(1200).url()
      
      return (
        <figure className="my-8">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt={value.alt || 'Bloggbilde'}
              fill
              className="object-cover"
            />
          </div>
          {value.caption && (
            <figcaption className="text-center text-sm text-gray-600 mt-2">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
    codeBlock: ({ value }: any) => {
      return (
        <div className="my-6">
          {value.filename && (
            <div className="bg-gray-800 text-gray-300 px-4 py-2 text-sm font-mono rounded-t-lg">
              {value.filename}
            </div>
          )}
          <pre className={`bg-gray-900 text-gray-100 p-4 overflow-x-auto ${!value.filename ? 'rounded-lg' : 'rounded-b-lg'}`}>
            <code className={`language-${value.language || 'text'}`}>{value.code}</code>
          </pre>
        </div>
      )
    },
  },
  marks: {
    link: ({ children, value }: any) => {
      const rel = value.blank ? 'noopener noreferrer' : undefined
      const target = value.blank ? '_blank' : undefined
      
      return (
        <a
          href={value.href}
          rel={rel}
          target={target}
          className="text-[#00b85b] hover:text-[#00854a] underline"
        >
          {children}
        </a>
      )
    },
  },
  block: {
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-3">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-xl font-bold text-gray-900 mt-6 mb-2">{children}</h4>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-[#00b85b] pl-4 py-2 my-6 italic text-gray-700 bg-gray-50 rounded-r">
        {children}
      </blockquote>
    ),
    normal: ({ children }: any) => (
      <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-2 my-4 text-gray-700">{children}</ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal list-inside space-y-2 my-4 text-gray-700">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => <li className="ml-4">{children}</li>,
    number: ({ children }: any) => <li className="ml-4">{children}</li>,
  },
}

/**
 * Blogginnlegg-side
 */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await client.fetch<Post>(singlePostQuery, { slug })

  if (!post) {
    notFound()
  }

  const imageUrl = post.mainImage?.asset 
    ? urlForImage(post.mainImage.asset).width(1200).height(600).url()
    : null

  const authorImageUrl = post.author?.image?.asset
    ? urlForImage(post.author.image.asset).width(100).height(100).url()
    : null

  const readingTime = post.body ? calculateReadingTime(post.body) : 5

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Logo size="lg" />
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                Hjem
              </Link>
              <Link href="/blogg" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                Blogg
              </Link>
            </nav>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                Logg inn
              </Link>
              <Link href="/signup" className="bg-[#82ffb2] text-gray-900 px-6 py-2.5 rounded-xl font-semibold">
                Kom igang
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Back to blog link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          href="/blogg"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#00b85b] transition-colors"
        >
          <Icons.ArrowLeft className="h-4 w-4" />
          Tilbake til blogg
        </Link>
      </div>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category badges */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.categories.map((category) => (
              <span
                key={category.slug.current}
                className="bg-[#00b85b]/10 text-[#00b85b] px-3 py-1 rounded-full text-sm font-medium"
              >
                {category.title}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {authorImageUrl ? (
              <Image
                src={authorImageUrl}
                alt={post.author?.name || 'Forfatter'}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-[#00b85b]/10 flex items-center justify-center">
                <Icons.User className="h-5 w-5 text-[#00b85b]" />
              </div>
            )}
            <span className="font-medium text-gray-900">{post.author?.name || 'Proanbud'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.Calendar className="h-4 w-4" />
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icons.Clock className="h-4 w-4" />
            <span>{readingTime} min lesing</span>
          </div>
        </div>

        {/* Featured image */}
        {imageUrl && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-12">
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#00b85b] prose-strong:text-gray-900">
          <PortableText value={post.body} components={portableTextComponents} />
        </div>

        {/* Author bio */}
        {post.author && post.author.bio && (
          <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-start gap-4">
              {authorImageUrl ? (
                <Image
                  src={authorImageUrl}
                  alt={post.author.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-[#00b85b]/10 flex items-center justify-center flex-shrink-0">
                  <Icons.User className="h-8 w-8 text-[#00b85b]" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Om {post.author.name}</h3>
                <p className="text-gray-700">{post.author.bio}</p>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#00b85b] to-[#00854a] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Klar til å komme i gang?</h2>
          <p className="text-xl text-white/90 mb-8">
            Lag profesjonelle tilbud på minutter med Proanbud
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-white text-[#00b85b] px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Start gratis prøveperiode
            </Link>
            <Link
              href="/blogg"
              className="bg-white/10 backdrop-blur text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              Les flere artikler
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <Logo size="lg" />
          <p className="text-gray-400 mt-4">© 2025 Proanbud. Alle rettigheter reservert.</p>
        </div>
      </footer>
    </div>
  )
}
