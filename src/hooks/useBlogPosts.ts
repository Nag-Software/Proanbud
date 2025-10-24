import { useState, useEffect } from 'react'
import { client, allPostsQuery } from '@/lib/sanity'

interface BlogPostAuthor {
  name: string
  slug: {
    current: string
  }
  image?: any
}

interface BlogPostCategory {
  title: string
  slug: {
    current: string
  }
}

interface BlogPostMainImage {
  asset: any
  alt?: string
}

export interface BlogPost {
  _id: string
  title: string
  slug: {
    current: string
  }
  excerpt?: string
  publishedAt: string
  mainImage?: BlogPostMainImage
  author?: BlogPostAuthor
  categories?: BlogPostCategory[]
}

export function useBlogPosts(limit?: number) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        setLoading(true)
        let query = allPostsQuery
        if (limit) {
          query = `*[_type == "post" && publishedAt <= now()] | order(publishedAt desc)[0...${limit}] {
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
          }`
        }
        const data = await client.fetch<BlogPost[]>(query)
        setPosts(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching blog posts:', err)
        setError('Kunne ikke laste blogginnlegg')
      } finally {
        setLoading(false)
      }
    }

    fetchBlogPosts()
  }, [limit])

  return { posts, loading, error }
}