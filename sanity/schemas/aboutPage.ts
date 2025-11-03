import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'aboutPage',
  title: 'Om Oss Side',
  type: 'document',
  fields: [
    // Hero Section
    defineField({
      name: 'heroTitle',
      title: 'Hero Tittel',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'heroDescription',
      title: 'Hero Beskrivelse',
      type: 'text',
      validation: Rule => Rule.required(),
    }),

    // Founder Section
    defineField({
      name: 'founderName',
      title: 'Grunnleggers Navn',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'founderTitle',
      title: 'Grunnleggers Tittel',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'founderImage',
      title: 'Grunnleggers Bilde',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'founderLinkedin',
      title: 'LinkedIn URL',
      type: 'url',
    }),
    defineField({
      name: 'founderEmail',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'founderStoryTitle',
      title: 'Founder Story Tittel',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'founderStory',
      title: 'Founder Story',
      type: 'array',
      of: [
        {
          type: 'block',
        },
      ],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'founderQuote',
      title: 'Founder Quote',
      type: 'text',
    }),

    // Mission & Vision
    defineField({
      name: 'missionTitle',
      title: 'Mission Tittel',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'missionDescription',
      title: 'Mission Beskrivelse',
      type: 'text',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'visionTitle',
      title: 'Visjon Tittel',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'visionDescription',
      title: 'Visjon Beskrivelse',
      type: 'text',
      validation: Rule => Rule.required(),
    }),

    // Values
    defineField({
      name: 'valuesTitle',
      title: 'Verdier Tittel',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'valuesSubtitle',
      title: 'Verdier Undertittel',
      type: 'string',
    }),
    defineField({
      name: 'values',
      title: 'Verdier',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'icon',
              title: 'Ikon (Emoji)',
              type: 'string',
            },
            {
              name: 'title',
              title: 'Tittel',
              type: 'string',
            },
            {
              name: 'description',
              title: 'Beskrivelse',
              type: 'text',
            },
          ],
        },
      ],
      validation: Rule => Rule.required().min(3).max(4),
    }),

    // Technology Stack
    defineField({
      name: 'techStackTitle',
      title: 'Teknologi Tittel',
      type: 'string',
    }),
    defineField({
      name: 'techStackSubtitle',
      title: 'Teknologi Undertittel',
      type: 'string',
    }),
    defineField({
      name: 'technologies',
      title: 'Teknologier',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'icon',
              title: 'Ikon (Emoji)',
              type: 'string',
            },
            {
              name: 'name',
              title: 'Navn',
              type: 'string',
            },
            {
              name: 'description',
              title: 'Beskrivelse',
              type: 'string',
            },
          ],
        },
      ],
    }),

    // CTA Section
    defineField({
      name: 'ctaTitle',
      title: 'CTA Tittel',
      type: 'string',
    }),
    defineField({
      name: 'ctaDescription',
      title: 'CTA Beskrivelse',
      type: 'text',
    }),
  ],
  preview: {
    select: {
      title: 'heroTitle',
    },
    prepare(selection) {
      return {
        title: selection.title || 'Om Oss Side',
      }
    },
  },
})
