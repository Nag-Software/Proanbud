import Logo from "@/components/shared/Logo";

export default function VilkarPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Vilkår og betingelser</h1>
        
        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aksept av vilkår</h2>
            <p className="text-gray-600 leading-relaxed">
              Ved å registrere deg som bruker eller benytte Proanbud-tjenesten, aksepterer du disse vilkårene og betingelsene i sin helhet. 
              Dersom du ikke aksepterer vilkårene, skal du ikke bruke tjenesten.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Tjenestebeskrivelse</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Proanbud er en SaaS-plattform (Software as a Service) som tilbyr:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Verktøy for å lage og sende tilbud</li>
              <li>AI-assistert prissetting</li>
              <li>Kundehåndtering</li>
              <li>Prosjektoppfølging</li>
              <li>Analyse og rapportering</li>
              <li>Andre relaterte funksjoner beskrevet på vår nettside</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Brukerkonto</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              For å bruke tjenesten må du opprette en brukerkonto. Du er ansvarlig for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Å oppgi korrekt og oppdatert informasjon</li>
              <li>Å holde ditt passord sikkert og konfidensielt</li>
              <li>All aktivitet som skjer under din brukerkonto</li>
              <li>Å varsle oss umiddelbart ved mistanke om uautorisert bruk</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mtntkat-4">
              Du må være minst 18 år for å opprette en konto. Dersom du representerer en bedrift, må du ha fullmakt til å inngå avtaler på vegne av bedriften.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Abonnement og betaling</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Proanbud tilbys som en abonnementsbasert tjeneste med ulike prisplaner:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Priser er oppgitt på vår nettside og kan endres med 30 dagers varsel</li>
              <li>Betaling skjer månedlig eller årlig, avhengig av valgt plan</li>
              <li>Alle priser er oppgitt eksklusiv merverdiavgift (mva.)</li>
              <li>Betalingsinformasjon behandles av vår tredjepartsbetalingsleverandør</li>
              <li>Ved manglende betaling kan vi suspendere eller avslutte din tilgang</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Gratis prøveperiode</h2>
            <p className="text-gray-600 leading-relaxed">
              Vi tilbyr en gratis prøveperiode på 14 dager. Ingen kredittkort kreves for å starte prøveperioden. 
              Etter prøveperiodens utløp må du velge et betalingsabonnement for å fortsette å bruke tjenesten. 
              Data fra prøveperioden vil bli bevart i 30 dager.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Oppsigelse og refusjon</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Du kan si opp abonnementet når som helst fra din kontoadministrasjon:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Oppsigelsen trer i kraft ved slutten av gjeldende faktureringsperiode</li>
              <li>Du har tilgang til tjenesten frem til periodens utløp</li>
              <li>Ingen refusjon for ubrukt tid i abonnementsperioden</li>
              <li>Data vil bli slettet 90 dager etter oppsigelse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Bruksrettigheter og -restriksjoner</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vi gir deg en begrenset, ikke-eksklusiv, ikke-overførbar rett til å bruke tjenesten. Du godtar å ikke:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Kopiere, modifisere eller distribuere tjenesten</li>
              <li>Reverse engineere eller forsøke å utlede kildekoden</li>
              <li>Bruke tjenesten til ulovlige formål</li>
              <li>Laste opp virus, malware eller skadelig kode</li>
              <li>Forsøke å få uautorisert tilgang til systemene våre</li>
              <li>Bruke tjenesten på en måte som kan skade, deaktivere eller overbelaste systemet</li>
              <li>Viderelisensiere eller selge tilgang til tjenesten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Ditt innhold og data</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Du beholder alle rettigheter til innholdet og dataene du laster opp til tjenesten. Ved å bruke tjenesten gir du oss en lisens til:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Lagre og behandle ditt innhold for å levere tjenesten</li>
              <li>Lage sikkerhetskopier av dine data</li>
              <li>Bruke anonymiserte data til å forbedre tjenesten</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Du er ansvarlig for å sikkerhetskopiere dine egne data. Vi anbefaler jevnlige eksporter av viktig informasjon.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Immaterielle rettigheter</h2>
            <p className="text-gray-600 leading-relaxed">
              Alle rettigheter til Proanbud-plattformen, inkludert men ikke begrenset til kildekode, design, logoer, varemerker 
              og dokumentasjon, tilhører Proanbud AS. Disse vilkårene gir deg ingen rettigheter til våre immaterielle rettigheter, 
              utover det som er nødvendig for å bruke tjenesten.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Tjenestens tilgjengelighet</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vi streber etter høy tilgjengelighet, men kan ikke garantere at tjenesten er tilgjengelig til enhver tid:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Vi kan utføre planlagt vedlikehold med forhåndsvarsel</li>
              <li>Uforutsette driftsproblemer kan oppstå</li>
              <li>Vi forbeholder oss retten til å endre eller oppdatere tjenesten</li>
              <li>Vi er ikke ansvarlige for tap som følge av nedetid</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Ansvarsfraskrivelse</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Tjenesten leveres "som den er" og "som tilgjengelig". Vi fraskriver oss alle garantier, inkludert:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>At tjenesten vil møte dine spesifikke behov</li>
              <li>At tjenesten vil være uavbrutt, sikker eller feilfri</li>
              <li>At resultater oppnådd ved bruk av tjenesten vil være nøyaktige</li>
              <li>At AI-genererte priser eller anbefalinger er korrekte</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Du er selv ansvarlig for å verifisere all informasjon og prising før du sender tilbud til kunder.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Ansvarsbegrensning</h2>
            <p className="text-gray-600 leading-relaxed">
              I den grad loven tillater det, skal Proanbud AS, våre ansatte, partnere eller leverandører ikke holdes ansvarlige for 
              indirekte, tilfeldige, spesielle eller følgeskader som følge av bruken eller manglende evne til å bruke tjenesten. 
              Vårt totale ansvar skal ikke overstige beløpet du har betalt for tjenesten de siste 12 månedene.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Skadesløsholdelse</h2>
            <p className="text-gray-600 leading-relaxed">
              Du godtar å holde Proanbud skadesløs for alle krav, tap, skader og utgifter som oppstår som følge av din bruk av 
              tjenesten, brudd på disse vilkårene, eller krenkelse av tredjeparters rettigheter.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Endringer i vilkårene</h2>
            <p className="text-gray-600 leading-relaxed">
              Vi kan oppdatere disse vilkårene fra tid til annen. Vesentlige endringer vil bli varslet via e-post eller på vår nettside 
              minst 30 dager før de trer i kraft. Din fortsatte bruk av tjenesten etter at endringene trer i kraft, innebærer at du aksepterer de nye vilkårene.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Gjeldende lov og verneting</h2>
            <p className="text-gray-600 leading-relaxed">
              Disse vilkårene skal reguleres av og tolkes i samsvar med norsk lov. Eventuelle tvister skal søkes løst i minnelighet. 
              Dersom dette ikke er mulig, skal tvisten avgjøres av de ordinære domstoler i Norge, med Oslo tingrett som verneting.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Kontaktinformasjon</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Hvis du har spørsmål om disse vilkårene, kan du kontakte oss:
            </p>
            <div className="bg-gray-50 p-6 rounded-xl">
              <Logo size="md"/>
              <p className="text-gray-600 mt-3"><strong>E-post:</strong> post@proanbud.no</p>
              <p className="text-gray-600"><strong>Telefon:</strong> +47 (utilgjengelig)</p>
              <p className="text-gray-600"><strong>Adresse:</strong> Bergen, Norge</p>
            </div>
          </section>

          <section className="border-t border-gray-200 pt-8 mt-12">
            <p className="text-sm text-gray-500">
              Sist oppdatert: 18. november 2025
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
