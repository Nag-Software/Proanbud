export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookie-policy</h1>
        
        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Hva er cookies?</h2>
            <p className="text-gray-600 leading-relaxed">
              Cookies er små tekstfiler som lagres på enheten din når du besøker et nettsted. De brukes til å gjenkjenne enheten din 
              og huske informasjon om ditt besøk, som dine preferanser og tidligere handlinger. Cookies gjør det mulig for nettsteder 
              å fungere mer effektivt og forbedre brukeropplevelsen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Hvordan bruker vi cookies?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Proanbud bruker cookies for å:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Holde deg innlogget mens du navigerer på nettstedet</li>
              <li>Huske dine preferanser og innstillinger</li>
              <li>Analysere hvordan du bruker tjenesten vår</li>
              <li>Forbedre ytelsen og funksjonaliteten til nettstedet</li>
              <li>Forstå brukeratferd og forbedre brukeropplevelsen</li>
              <li>Levere relevant innhold og funksjoner</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Typer cookies vi bruker</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Strengt nødvendige cookies</h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Disse cookies er essensielle for at nettstedet skal fungere. De gjør det mulig for deg å navigere på nettstedet 
                  og bruke funksjonene.
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                  <li><strong>Autentisering:</strong> Holder deg innlogget på kontoen din</li>
                  <li><strong>Sikkerhet:</strong> Beskytter mot uautorisert tilgang</li>
                  <li><strong>Preferanser:</strong> Husker dine valg og innstillinger</li>
                </ul>
                <p className="text-sm text-gray-500 mt-3">
                  <strong>Varighet:</strong> Sesjon eller opptil 1 år
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Ytelse-cookies</h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Disse cookies samler inn informasjon om hvordan besøkende bruker nettstedet, for eksempel hvilke sider som besøkes mest.
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                  <li><strong>Sidevisninger:</strong> Sporer hvilke sider som besøkes</li>
                  <li><strong>Feilmeldinger:</strong> Hjelper oss å identifisere og fikse problemer</li>
                  <li><strong>Lastetid:</strong> Måler hvor raskt sidene lastes</li>
                </ul>
                <p className="text-sm text-gray-500 mt-3">
                  <strong>Varighet:</strong> Opptil 2 år
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Funksjonelle cookies</h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Disse cookies lar nettstedet huske valg du gjør og tilby forbedrede funksjoner.
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                  <li><strong>Språkpreferanser:</strong> Husker ditt foretrukne språk</li>
                  <li><strong>UI-innstillinger:</strong> Husker hvordan du foretrekker å se grensesnittet</li>
                  <li><strong>Regionale innstillinger:</strong> Tilpasser innhold basert på lokasjon</li>
                </ul>
                <p className="text-sm text-gray-500 mt-3">
                  <strong>Varighet:</strong> Opptil 1 år
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Analyse-cookies</h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                  Vi bruker Google Analytics til å samle anonymisert informasjon om hvordan nettstedet brukes.
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                  <li><strong>Besøksstatistikk:</strong> Antall besøk og unike besøkende</li>
                  <li><strong>Brukeratferd:</strong> Hvilke funksjoner som brukes mest</li>
                  <li><strong>Demografisk data:</strong> Generell informasjon om besøkende</li>
                </ul>
                <p className="text-sm text-gray-500 mt-3">
                  <strong>Varighet:</strong> Opptil 2 år
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Tredjepartscookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Noen cookies settes av tredjepartstjenester som vises på våre sider:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>Google Analytics:</strong> For å analysere nettsidetrafikk</li>
              <li><strong>Google Fonts:</strong> For å laste inn skrifttyper</li>
              <li><strong>Betalingsleverandører:</strong> For sikker betalingsprosessering</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Disse tjenestene kan sette sine egne cookies. Vi har ikke kontroll over disse cookies, og du bør sjekke deres 
              respektive personvernerklæringer for mer informasjon.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Hvordan administrere cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Du har full kontroll over cookies og kan administrere dem på flere måter:
            </p>

            <div className="bg-[#82ffb2]/10 border border-[#82ffb2]/20 p-6 rounded-xl mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Nettleserinnstillinger</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                De fleste nettlesere lar deg:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Se hvilke cookies som er lagret</li>
                <li>Slette alle eller spesifikke cookies</li>
                <li>Blokkere tredjepartscookies</li>
                <li>Blokkere cookies fra bestemte nettsteder</li>
                <li>Slette alle cookies når du lukker nettleseren</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Google Chrome</h4>
                <p className="text-sm text-gray-600">
                  Innstillinger → Personvern og sikkerhet → Cookies og andre nettstedsdata
                </p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Firefox</h4>
                <p className="text-sm text-gray-600">
                  Innstillinger → Personvern og sikkerhet → Cookies og nettstedsdata
                </p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Safari</h4>
                <p className="text-sm text-gray-600">
                  Innstillinger → Personvern → Administrer nettstedsdata
                </p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Microsoft Edge</h4>
                <p className="text-sm text-gray-600">
                  Innstillinger → Cookies og nettstedstillatelser → Administrer og slett cookies
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl mt-6">
              <p className="text-yellow-800 leading-relaxed">
                <strong>Merk:</strong> Hvis du blokkerer eller sletter cookies, kan noen funksjoner på nettstedet slutte å fungere 
                som forventet. Du kan bli logget ut, og innstillinger kan gå tapt.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Google Analytics opt-out</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Hvis du ikke ønsker at Google Analytics skal samle data om ditt besøk, kan du:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Installere{' '}
                <a 
                  href="https://tools.google.com/dlpage/gaoptout" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#82ffb2] hover:text-[#6ee69f] font-semibold"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
              </li>
              <li>Blokkere Google Analytics i nettleserens innstillinger</li>
              <li>Bruke nettlesere eller utvidelser med innebygd sporingsbeskyttelse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Do Not Track (DNT)</h2>
            <p className="text-gray-600 leading-relaxed">
              Noen nettlesere har en "Do Not Track"-funksjon som sender et signal til nettsteder om at du ikke ønsker å bli sporet. 
              Det finnes for øyeblikket ingen bransjestandard for hvordan DNT-signaler skal håndteres, men vi respekterer brukernes 
              personvernvalg og arbeider kontinuerlig med å forbedre vår praksis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Endringer i cookie-policy</h2>
            <p className="text-gray-600 leading-relaxed">
              Vi kan oppdatere denne cookie-policyen fra tid til annen for å gjenspeile endringer i teknologi, lovgivning eller 
              forretningspraksis. Vi vil varsle deg om vesentlige endringer ved å publisere den oppdaterte policyen på vår nettside 
              og oppdatere datoen nederst på siden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Kontakt oss</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Hvis du har spørsmål om vår bruk av cookies, kan du kontakte oss:
            </p>
            <div className="bg-gray-50 p-6 rounded-xl">
              <p className="text-gray-600"><strong>E-post:</strong> post@proanbud.no</p>
              <p className="text-gray-600"><strong>Telefon:</strong> +47 (utilgjengelig)</p>
              <p className="text-gray-600"><strong>Adresse:</strong> Bergen, Norge</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Mer informasjon</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              For mer informasjon om cookies og hvordan de fungerer, kan du besøke:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>
                <a 
                  href="https://www.datatilsynet.no" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#82ffb2] hover:text-[#6ee69f] font-semibold"
                >
                  Datatilsynet
                </a>
              </li>
              <li>
                <a 
                  href="https://www.allaboutcookies.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#82ffb2] hover:text-[#6ee69f] font-semibold"
                >
                  All About Cookies
                </a>
              </li>
            </ul>
          </section>

          <section className="border-t border-gray-200 pt-8 mt-12">
            <p className="text-sm text-gray-500">
              Sist oppdatert: 2. oktober 2025
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
