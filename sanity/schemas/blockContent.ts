import { defineType, defineArrayMember } from 'sanity'

/**
 * Rich text editor konfigurasjon for blogginnlegg
 * Definerer hvilke blokker og formateringer som er tilgjengelige
 */
export default defineType({
  title: 'Innholdsblokk',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'Blokk',
      type: 'block',
      // Stiler som kan brukes i editoren
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Sitat', value: 'blockquote' },
      ],
      lists: [
        { title: 'Punktliste', value: 'bullet' },
        { title: 'Nummerert liste', value: 'number' },
      ],
      // Tekstformatering
      marks: {
        decorators: [
          { title: 'Fet', value: 'strong' },
          { title: 'Kursiv', value: 'em' },
          { title: 'Understreket', value: 'underline' },
          { title: 'Kode', value: 'code' },
        ],
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
                validation: (Rule) =>
                  Rule.uri({
                    scheme: ['http', 'https', 'mailto', 'tel'],
                  }),
              },
              {
                title: 'Åpne i ny fane',
                name: 'blank',
                type: 'boolean',
                initialValue: false, // Changed from true to false to avoid state update
              },
            ],
          },
        ],
      },
    }),
    // Bilde i innholdet
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt-tekst',
          description: 'Viktig for SEO og tilgjengelighet',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Bildetekst',
          description: 'Valgfri tekst som vises under bildet',
        },
      ],
    }),
    // Kodeblokk (custom type siden 'code' ikke er innebygd)
    defineArrayMember({
      type: 'object',
      name: 'codeBlock',
      title: 'Kodeblokk',
      fields: [
        {
          name: 'code',
          title: 'Kode',
          type: 'text',
          rows: 10,
        },
        {
          name: 'language',
          title: 'Språk',
          type: 'string',
          options: {
            list: [
              { title: 'JavaScript', value: 'javascript' },
              { title: 'TypeScript', value: 'typescript' },
              { title: 'HTML', value: 'html' },
              { title: 'CSS', value: 'css' },
              { title: 'JSON', value: 'json' },
              { title: 'Python', value: 'python' },
              { title: 'Bash', value: 'bash' },
            ],
          },
        },
        {
          name: 'filename',
          title: 'Filnavn (valgfritt)',
          type: 'string',
        },
      ],
    }),
  ],
})
