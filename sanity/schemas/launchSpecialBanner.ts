import { defineField, defineType } from 'sanity'

/**
 * Launch Special Banner schema for Sanity
 * Inneholder konfigurasjon for lanseringstilbudet banner
 */
export default defineType({
  name: 'launchSpecialBanner',
  title: 'Launch Special Banner',
  type: 'document',
  icon: () => '🎉',
  fields: [
    defineField({
      name: 'isActive',
      title: 'Er aktiv',
      type: 'boolean',
      description: 'Aktiverer eller deaktiverer banneret',
      initialValue: true
    }),
    defineField({
      name: 'emoji',
      title: 'Emoji / ikon',
      type: 'string',
      description: 'Valgfritt emoji som vises til venstre',
      initialValue: '🎉'
    }),
    defineField({
      name: 'headline',
      title: 'Overskrift',
      type: 'string',
      description: 'Kort tittel for banneret',
      initialValue: 'Lanseringstilbud'
    }),
    defineField({
      name: 'totalPlaces',
      title: 'Totalt antall plasser',
      type: 'number',
      description: 'Total antall plasser for lanseringstilbudet (f.eks. 25)',
      validation: (Rule) => Rule.required().min(1).integer(),
      initialValue: 25
    }),
    defineField({
      name: 'availablePlaces',
      title: 'Ledige plasser',
      type: 'number',
      description: 'Antall ledige plasser igjen (f.eks. 19)',
      validation: (Rule) => Rule.required().min(0).integer(),
      initialValue: 19
    }),
    defineField({
      name: 'discountPercentage',
      title: 'Rabatt prosent',
      type: 'number',
      description: 'Rabatt prosent på livstid (f.eks. 50)',
      validation: (Rule) => Rule.required().min(0).max(100).integer(),
      initialValue: 50
    }),
    defineField({
      name: 'discountType',
      title: 'Rabatttype',
      type: 'string',
      description: 'Type rabatt (f.eks. "på livstid" eller "første år")',
      options: {
        list: [
          { title: 'På livstid', value: 'lifetime' },
          { title: 'Første år', value: 'firstYear' },
          { title: 'Første 3 måneder', value: 'threeMonths' },
          { title: 'Første måned', value: 'oneMonth' }
        ]
      },
      initialValue: 'lifetime'
    }),
    defineField({
      name: 'discountLabel',
      title: 'Rabattekst',
      type: 'string',
      description: 'Tilpasset tekst for rabatten (f.eks. "på livstid")'
    }),
    defineField({
      name: 'descriptionTemplate',
      title: 'Beskrivelse mal',
      type: 'text',
      description: 'Bruk {{totalPlaces}}, {{discountPercentage}} og {{discountLabel}} for dynamiske verdier',
      initialValue: 'De første {{totalPlaces}} kundene får {{discountPercentage}}% rabatt {{discountLabel}}!'
    }),
    defineField({
      name: 'promoCodeLabel',
      title: 'Rabattkode etikett',
      type: 'string',
      initialValue: 'Rabattkode'
    }),
    defineField({
      name: 'promoCodeValue',
      title: 'Rabattkode verdi',
      type: 'string',
      initialValue: 'LANS25'
    }),
    defineField({
      name: 'availabilityTemplate',
      title: 'Tilgjengelighetstekst',
      type: 'string',
      description: 'Bruk {{availablePlaces}} for dynamisk antall',
      initialValue: 'Kun {{availablePlaces}} plasser igjen'
    })
  ]
})
