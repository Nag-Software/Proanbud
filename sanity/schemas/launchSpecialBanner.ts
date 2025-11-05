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
    })
  ]
})
