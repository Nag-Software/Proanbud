import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { SanityImageSource } from '@sanity/image-url/lib/types/types'

/**
 * Sanity-konfigurasjon
 * Legg til dine verdier i .env.local
 */
export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-03-01', // Bruk gjeldende dato
  useCdn: process.env.NODE_ENV === 'production', // Kun CDN i produksjon for bedre ytelse
}

/**
 * Sanity-klient for å hente data
 */
export const client = createClient(sanityConfig)

/**
 * Helper for å bygge bilde-URLer
 */
const builder = imageUrlBuilder(client)

export function urlForImage(source: SanityImageSource) {
  return builder.image(source)
}

/**
 * GROQ-queries for blogginnlegg
 */

// Hent alle publiserte blogginnlegg, sortert etter dato
export const allPostsQuery = `
  *[_type == "post" && publishedAt <= now()] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage {
      asset,
      alt
    },
    author->{
      name,
      slug,
      image
    },
    categories[]->{
      title,
      slug
    }
  }
`

// Hent et enkelt blogginnlegg basert på slug
export const singlePostQuery = `
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage {
      asset,
      alt
    },
    author->{
      name,
      slug,
      image,
      bio
    },
    categories[]->{
      title,
      slug
    },
    body,
    seo {
      metaTitle,
      metaDescription
    }
  }
`

// Hent alle slugs for statisk generering
export const allPostSlugsQuery = `
  *[_type == "post" && publishedAt <= now()] {
    "slug": slug.current
  }
`

// Hent antall blogginnlegg (for paginering)
export const postCountQuery = `
  count(*[_type == "post" && publishedAt <= now()])
`

// Hent blogginnlegg per kategori
export const postsByCategoryQuery = `
  *[_type == "post" && publishedAt <= now() && $categorySlug in categories[]->slug.current] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage {
      asset,
      alt
    },
    author->{
      name,
      slug
    }
  }
`

/**
 * Helper-funksjoner
 */

// Formater dato til norsk format
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('nb-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Beregn lesetid basert på ordantall
export function calculateReadingTime(blocks: any[]): number {
  const wordsPerMinute = 200
  const words = blocks
    .filter((block) => block._type === 'block')
    .map((block) => block.children.map((child: any) => child.text).join(' '))
    .join(' ')
    .split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}
