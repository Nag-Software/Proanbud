import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

/**
 * Sanity Studio konfigurasjon
 * Dette setter opp Sanity Studio som kan brukes på /studio route
 */
export default defineConfig({
  name: 'proanbud-blog',
  title: 'Proanbud Blogg',

  // Prosjekt-detaljer (fyll inn fra Sanity.io)
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  // Base path for studio (tilgjengelig på /studio)
  basePath: '/studio',

  // Plugins
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Innhold')
          .items([
            // Blogginnlegg
            S.listItem()
              .title('Blogginnlegg')
              .icon(() => '📝')
              .child(
                S.documentTypeList('post')
                  .title('Blogginnlegg')
                  .filter('_type == "post"')
                  .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
              ),
            
            // Forfattere
            S.listItem()
              .title('Forfattere')
              .icon(() => '👤')
              .child(
                S.documentTypeList('author')
                  .title('Forfattere')
              ),
            
            // Kategorier
            S.listItem()
              .title('Kategorier')
              .icon(() => '🏷️')
              .child(
                S.documentTypeList('category')
                  .title('Kategorier')
              ),
            
            // Divider
            S.divider(),
            
            // Alle dokumenttyper
            ...S.documentTypeListItems().filter(
              (listItem) => 
                !['post', 'author', 'category'].includes(listItem.getId() || '')
            ),
          ]),
    }),
    visionTool(), // GROQ playground
  ],

  // Schema types
  schema: {
    types: schemaTypes,
  },
})
