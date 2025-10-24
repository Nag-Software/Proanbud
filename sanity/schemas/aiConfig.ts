import { defineField, defineType } from 'sanity'

/**
 * AI-config schema for Sanity
 * Inneholder konfigurasjon for AI-funksjonalitet
 */
export default defineType({
  name: 'aiConfig',
  title: 'AI-config',
  type: 'document',
  icon: () => '🤖',
  fields: [
    defineField({
      name: 'model',
      title: 'Model',
      type: 'string',
      description: 'AI-modell som brukes'
    }),
    defineField({
      name: 'reasoningeffort',
      title: 'Reasoning Effort',
      type: 'string',
      description: 'Reasoning effort for AI',
      options: {
        list: [
          { title: 'Minimal', value: 'minimal' },
          { title: 'Low', value: 'low' },
          { title: 'Medium', value: 'medium' },
          { title: 'High', value: 'high' }
        ]
      }
    }),
    defineField({
      name: 'allowWebsearch',
      title: 'Allow Websearch',
      type: 'boolean',
      description: 'Whether to allow web search functionality',
      initialValue: true
    })
  ]
})