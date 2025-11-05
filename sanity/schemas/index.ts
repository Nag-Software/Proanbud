/**
 * Samler alle Sanity-skjemaer
 * Importeres i sanity.config.ts
 */
import blockContent from './blockContent'
import category from './category'
import post from './post'
import author from './author'
import pilot from './pilot'
import aiConfig from './aiConfig'
import aboutPage from './aboutPage'
import launchSpecialBanner from './launchSpecialBanner'

export const schemaTypes = [post, author, category, blockContent, pilot, aiConfig, aboutPage, launchSpecialBanner]
