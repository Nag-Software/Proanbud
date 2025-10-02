export default function TilgjengelighetPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Tilgjengelighetserklæring</h1>
        
        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Vår forpliktelse</h2>
            <p className="text-gray-600 leading-relaxed">
              Proanbud AS er forpliktet til å gjøre vår nettside og tjenester tilgjengelige for alle brukere, uavhengig av eventuelle 
              funksjonsnedsettelser. Vi jobber kontinuerlig for å forbedre tilgjengeligheten og brukeropplevelsen for alle våre brukere, 
              i tråd med Web Content Accessibility Guidelines (WCAG) 2.1 nivå AA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Standarder vi følger</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vår nettside streber etter å oppfylle:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>WCAG 2.1 nivå AA:</strong> Web Content Accessibility Guidelines</li>
              <li><strong>Forskrift om universell utforming av IKT-løsninger:</strong> Norsk lovgivning</li>
              <li><strong>EN 301 549:</strong> Europeisk standard for tilgjengelighet</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Tilgjengelighetsfunksjoner</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vi har implementert følgende funksjoner for å forbedre tilgjengeligheten:
            </p>

            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Tastaturnavigasjon</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Full tastaturnavigasjon uten behov for mus</li>
                  <li>Tydelig fokusindikatorer på interaktive elementer</li>
                  <li>Logisk tab-rekkefølge gjennom hele nettstedet</li>
                  <li>Tastatursnarvei for å hoppe til hovedinnhold</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Skjermleserkompatibilitet</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>ARIA-etiketter på alle interaktive elementer</li>
                  <li>Semantisk HTML-struktur</li>
                  <li>Beskrivende lenketekster</li>
                  <li>Alternative tekster for alle bilder og ikoner</li>
                  <li>Kompatibel med NVDA, JAWS og VoiceOver</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Visuelt design</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Høy kontrastforhold mellom tekst og bakgrunn (minimum 4.5:1)</li>
                  <li>Lesbar skriftstørrelse med mulighet for zooming opptil 200%</li>
                  <li>Fargeblind-vennlige fargekombinasjoner</li>
                  <li>Ingen informasjon formidlet kun gjennom farge</li>
                  <li>Responsivt design som fungerer på alle skjermstørrelser</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Innhold og struktur</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Klar og enkel språkbruk</li>
                  <li>Overskrifter i logisk hierarkisk struktur</li>
                  <li>Beskrivende lenketekster som gir mening utenfor kontekst</li>
                  <li>Tydelige feilmeldinger og veiledning</li>
                  <li>Konsistent navigasjon og layout</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Multimedieinnhold</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  <li>Tekstalternativer for bilder og grafikk</li>
                  <li>Bildetekster for videoer (der relevant)</li>
                  <li>Ingen automatisk avspilling av lyd eller video</li>
                  <li>Kontroller for å pause, stoppe og justere volum</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Testmetoder</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vi benytter flere metoder for å sikre tilgjengelighet:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Automatiserte verktøy som Lighthouse og axe DevTools</li>
              <li>Manuell testing med tastaturnavigasjon</li>
              <li>Testing med skjermlesere (NVDA, JAWS, VoiceOver)</li>
              <li>Kontrastsjekk av alle fargekombinasjoner</li>
              <li>Brukertest med personer med funksjonsnedsettelser</li>
              <li>Regelmessige tilgjengeligetsrevisjoner</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Kjente begrensninger</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Til tross for våre beste anstrengelser, kan det være noen begrensninger:
            </p>
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
              <ul className="list-disc list-inside space-y-2 text-yellow-800">
                <li>Eldre PDF-dokumenter kan mangle tilgjengelighetsfunksjoner</li>
                <li>Noen tredjepartstjenester har kanskje ikke optimal tilgjengelighet</li>
                <li>Komplekse datavisualiseringer kan være utfordrende for skjermlesere</li>
              </ul>
            </div>
            <p className="text-gray-600 leading-relaxed mt-4">
              Vi jobber kontinuerlig med å forbedre disse områdene.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Nettleser- og teknologikompatibilitet</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vår nettside er designet for å fungere med:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>De to siste versjonene av Chrome, Firefox, Safari og Edge</li>
              <li>Mobile nettlesere på iOS og Android</li>
              <li>Skjermlesere: NVDA, JAWS, VoiceOver, TalkBack</li>
              <li>Talegjenkjenningsprogramvare</li>
              <li>Forstørrelsesprogram for svaksynte</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Tilpassningsmuligheter</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Du kan tilpasse opplevelsen ved å:
            </p>
            <div className="bg-[#82ffb2]/10 border border-[#82ffb2]/20 p-6 rounded-xl">
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li><strong>Zoome:</strong> Bruk Ctrl/Cmd + eller - for å justere tekststørrelse</li>
                <li><strong>Høykontrast:</strong> Bruk nettleserens innstillinger for høykontrast</li>
                <li><strong>Tekstspråk:</strong> Nettleseren kan oversette innhold automatisk</li>
                <li><strong>Redusert bevegelse:</strong> Vi respekterer prefers-reduced-motion</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Rapporter tilgjengelighetsproblemer</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vi ønsker kontinuerlig tilbakemelding om tilgjengelighet. Hvis du opplever problemer med å få tilgang til noe innhold 
              eller funksjoner på vår nettside, vennligst kontakt oss:
            </p>
            <div className="bg-gray-50 p-6 rounded-xl">
              <p className="text-gray-600"><strong>E-post:</strong> post@proanbud.no</p>
              <p className="text-gray-600"><strong>Telefon:</strong> +47 (utilgjengelig)</p>
              <p className="text-gray-600"><strong>Adresse:</strong> Bergen, Norge</p>
            </div>
            <p className="text-gray-600 leading-relaxed mt-4">
              Når du rapporterer et problem, vennligst inkluder:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Beskrivelse av problemet</li>
              <li>Hvilken side eller funksjon det gjelder</li>
              <li>Hvilken nettleser og hjelpeteknologi du bruker</li>
              <li>Skjermbilder hvis mulig</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Responstid</h2>
            <p className="text-gray-600 leading-relaxed">
              Vi tar tilgjengelighetsproblemer på alvor og vil gjøre vårt beste for å svare på henvendelser innen 5 virkedager. 
              Avhengig av problemets art og kompleksitet, kan det ta lengre tid å implementere en løsning, men vi vil holde deg 
              informert om fremdriften.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Klageadgang</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Hvis du ikke er fornøyd med hvordan vi har håndtert dine tilgjengelighetsbehov, har du rett til å klage:
            </p>
            <div className="bg-gray-50 p-6 rounded-xl">
              <p className="text-gray-600 mb-2"><strong>Diskrimineringsnemnda</strong></p>
              <p className="text-gray-600">Nettside: <a href="https://www.diskrimineringsnemnda.no" target="_blank" rel="noopener noreferrer" className="text-[#82ffb2] hover:text-[#6ee69f] font-semibold">diskrimineringsnemnda.no</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Kontinuerlig forbedring</h2>
            <p className="text-gray-600 leading-relaxed">
              Tilgjengelighet er en kontinuerlig prosess. Vi gjennomgår og oppdaterer regelmessig vår nettside og tjenester for å 
              sikre at de forblir tilgjengelige. Vi:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mt-4">
              <li>Gjennomfører kvartalsvise tilgjengelighetsrevisjoner</li>
              <li>Tester nye funksjoner for tilgjengelighet før lansering</li>
              <li>Lærer av brukertilbakemeldinger og forskningsresultater</li>
              <li>Holder oss oppdatert på beste praksis og nye standarder</li>
              <li>Utdanner våre ansatte om tilgjengelighet</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Ressurser for brukere</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              For mer informasjon om tilgjengelighet og hjelpeteknologi:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>
                <a href="https://www.uutilsynet.no" target="_blank" rel="noopener noreferrer" className="text-[#82ffb2] hover:text-[#6ee69f] font-semibold">
                  Uutilsynet
                </a> - Tilsyn med universell utforming av IKT
              </li>
              <li>
                <a href="https://www.w3.org/WAI/" target="_blank" rel="noopener noreferrer" className="text-[#82ffb2] hover:text-[#6ee69f] font-semibold">
                  W3C Web Accessibility Initiative
                </a>
              </li>
              <li>
                <a href="https://www.difi.no/fagomrader-og-tjenester/universell-utforming" target="_blank" rel="noopener noreferrer" className="text-[#82ffb2] hover:text-[#6ee69f] font-semibold">
                  Digdir - Universell utforming
                </a>
              </li>
            </ul>
          </section>

          <section className="border-t border-gray-200 pt-8 mt-12">
            <p className="text-sm text-gray-500">
              Sist oppdatert: 2. oktober 2025
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Denne erklæringen gjennomgås og oppdateres minst én gang per år.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
