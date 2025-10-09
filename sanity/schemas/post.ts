import { defineField, defineType } from 'sanity'

/**
 * Sanity-skjema for blogginnlegg
 * Inneholder alle nødvendige felter for et komplett blogginnlegg
 */
export default defineType({
  name: 'post',
  title: 'Blogginnlegg',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Tittel',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
      description: 'Tittelen på blogginnlegget (maks 100 tegn)',
    }),
    defineField({
      name: 'slug',
      title: 'URL-slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      description: 'Genereres automatisk fra tittelen. Brukes i URL-en.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Sammendrag',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.max(200),
      description: 'Kort beskrivelse av innlegget (vises i oversikten og SEO)',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publiseringsdato',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      description: 'Dato og tidspunkt for publisering',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'author',
      title: 'Forfatter',
      type: 'reference',
      to: [{ type: 'author' }],
      description: 'Hvem skrev dette innlegget?',
    }),
    defineField({
      name: 'mainImage',
      title: 'Hovedbilde',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt-tekst',
          description: 'Viktig for SEO og tilgjengelighet',
        },
      ],
    }),
    defineField({
      name: 'categories',
      title: 'Kategorier',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
      description: 'Velg relevante kategorier for innlegget',
    }),
    defineField({
      name: 'body',
      title: 'Innhold',
      type: 'blockContent',
      validation: (Rule) => Rule.required(),
      description: 'Hovedinnholdet i blogginnlegget',
    }),
    defineField({
      name: 'seo',
      title: 'SEO-innstillinger',
      type: 'object',
      options: {
        collapsed: true,
      },
      fields: [
        {
          name: 'metaTitle',
          type: 'string',
          title: 'Meta-tittel',
          description: 'Overstyr standard tittel for søkemotorer (60-70 tegn)',
          validation: (Rule) => Rule.max(70),
        },
        {
          name: 'metaDescription',
          type: 'text',
          title: 'Meta-beskrivelse',
          rows: 3,
          description: 'Beskrivelse for søkemotorer (150-160 tegn)',
          validation: (Rule) => Rule.max(160),
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
      publishedAt: 'publishedAt',
    },
    prepare(selection) {
      const { title, author, media, publishedAt } = selection
      const date = publishedAt ? new Date(publishedAt).toLocaleDateString('nb-NO') : 'Ikke publisert'
      return {
        title: title,
        subtitle: `${author ? `${author} - ` : ''}${date}`,
        media: media,
      }
    },
  },
  orderings: [
    {
      title: 'Publiseringsdato (nyeste først)',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Publiseringsdato (eldste først)',
      name: 'publishedAtAsc',
      by: [{ field: 'publishedAt', direction: 'asc' }],
    },
    {
      title: 'Tittel (A-Å)',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
})
