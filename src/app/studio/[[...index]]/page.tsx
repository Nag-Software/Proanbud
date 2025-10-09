'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

/**
 * Sanity Studio route
 * Tilgjengelig på proanbud.no/studio
 * 
 * Brukes for å administrere blogginnlegg, forfattere og kategorier
 * 
 * CORS-feil? Se CORS_FIX.md for løsning!
 */
export default function StudioPage() {
  // Sjekk om Project ID er satt
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sanity Project ID mangler</h1>
            <p className="text-gray-600 mb-6">
              Du må sette opp Sanity CMS før du kan bruke Studio.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Hurtigstart:</h2>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                <span>Gå til <a href="https://www.sanity.io/manage" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">sanity.io/manage</a> og opprett et nytt prosjekt</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                <span>Kopier Project ID fra Sanity Dashboard</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                <span>Opprett <code className="bg-gray-200 px-2 py-1 rounded">.env.local</code> fil med:</span>
              </li>
            </ol>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mt-3 text-sm overflow-x-auto">
{`NEXT_PUBLIC_SANITY_PROJECT_ID=din_project_id
NEXT_PUBLIC_SANITY_DATASET=production`}
            </pre>
            <ol className="space-y-3 text-sm text-gray-700 mt-3" start={4}>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
                <span>Legg til CORS origin i Sanity: <code className="bg-gray-200 px-2 py-1 rounded">http://localhost:3000</code></span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">5.</span>
                <span>Restart dev server: <code className="bg-gray-200 px-2 py-1 rounded">pnpm dev</code></span>
              </li>
            </ol>
          </div>

          <div className="text-center">
            <a 
              href="/CORS_FIX.md" 
              className="text-blue-600 hover:underline text-sm"
            >
              📖 Les fullstendig guide (CORS_FIX.md)
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <NextStudio config={config} />
}
