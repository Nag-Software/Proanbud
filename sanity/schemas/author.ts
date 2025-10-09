import { defineField, defineType } from 'sanity'

/**
 * Sanity-skjema for forfattere
 */
export default defineType({
  name: 'author',
  title: 'Forfatter',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Navn',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL-slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Bilde',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt-tekst',
        },
      ],
    }),
    defineField({
      name: 'bio',
      title: 'Biografi',
      type: 'text',
      rows: 4,
      description: 'Kort beskrivelse av forfatteren',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
})
