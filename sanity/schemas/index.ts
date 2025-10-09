/**
 * Samler alle Sanity-skjemaer
 * Importeres i sanity.config.ts
 */
import blockContent from './blockContent'
import category from './category'
import post from './post'
import author from './author'

export const schemaTypes = [post, author, category, blockContent]
