import Logo from "@/components/shared/Logo";

export default function PersonvernPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Personvernerklæring</h1>
        
        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Innledning</h2>
            <p className="text-gray-600 leading-relaxed">
              Proanbud ("vi", "oss" eller "vår") respekterer ditt personvern og er forpliktet til å beskytte dine personopplysninger. 
              Denne personvernerklæringen beskriver hvordan vi samler inn, bruker, deler og beskytter dine personopplysninger når du bruker vår tjeneste.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Dataansvarlig</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Proanbud er dataansvarlig for behandlingen av dine personopplysninger.
            </p>
            <div className="bg-gray-50 p-6 rounded-xl">
              <p className="text-gray-600"><strong>Organisasjonsnummer:</strong> XXX XXX XXX</p>
              <p className="text-gray-600"><strong>Adresse:</strong> Bergen, Norge</p>
              <p className="text-gray-600"><strong>E-post:</strong> post@proanbud.no</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Hvilke personopplysninger samler vi inn?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vi kan samle inn følgende typer personopplysninger:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Kontaktinformasjon (navn, e-postadresse, telefonnummer)</li>
              <li>Bedriftsinformasjon (firmanavn, organisasjonsnummer, adresse)</li>
              <li>Brukerkontoinformasjon (brukernavn, passord)</li>
              <li>Prosjektdata og tilbudsinformasjon</li>
              <li>Kundeinformasjon som lagres i systemet</li>
              <li>Teknisk informasjon (IP-adresse, nettlesertype, enhetstype)</li>
              <li>Bruksdata og analyseinformasjon</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Hvordan bruker vi dine personopplysninger?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vi bruker dine personopplysninger til følgende formål:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Å levere og administrere tjenesten</li>
              <li>Å behandle og håndtere din brukerkonto</li>
              <li>Å kommunisere med deg om tjenesten</li>
              <li>Å forbedre og utvikle våre tjenester</li>
              <li>Å gi kundesupport</li>
              <li>Å sende deg nyhetsbrev og markedsføring (med ditt samtykke)</li>
              <li>Å overholde juridiske forpliktelser</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Rettslig grunnlag for behandling</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vi behandler dine personopplysninger basert på:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>Avtale:</strong> For å oppfylle vår avtale med deg</li>
              <li><strong>Samtykke:</strong> Der du har gitt ditt samtykke</li>
              <li><strong>Legitime interesser:</strong> For å forbedre våre tjenester og sikkerheten</li>
              <li><strong>Juridisk forpliktelse:</strong> Der det kreves av lov</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Deling av personopplysninger</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vi deler ikke dine personopplysninger med tredjeparter, med mindre:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Du har gitt ditt samtykke</li>
              <li>Det er nødvendig for å levere tjenesten (f.eks. skylagring)</li>
              <li>Det kreves av lov eller myndighetspålegg</li>
              <li>Det er nødvendig for å beskytte våre rettigheter</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Lagring av personopplysninger</h2>
            <p className="text-gray-600 leading-relaxed">
              Vi lagrer dine personopplysninger så lenge som nødvendig for å oppfylle formålene beskrevet i denne erklæringen, 
              eller så lenge det kreves av lov. Når personopplysningene ikke lenger er nødvendige, vil de bli slettet eller anonymisert.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Dine rettigheter</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Du har følgende rettigheter i henhold til personvernlovgivningen:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>Rett til innsyn:</strong> Du kan be om en kopi av dine personopplysninger</li>
              <li><strong>Rett til retting:</strong> Du kan be oss rette uriktige opplysninger</li>
              <li><strong>Rett til sletting:</strong> Du kan be om at vi sletter dine opplysninger</li>
              <li><strong>Rett til begrensning:</strong> Du kan be om at behandlingen begrenses</li>
              <li><strong>Rett til dataportabilitet:</strong> Du kan be om å få dine data i et strukturert format</li>
              <li><strong>Rett til å protestere:</strong> Du kan protestere mot behandlingen av dine data</li>
              <li><strong>Rett til å trekke tilbake samtykke:</strong> Der behandlingen er basert på samtykke</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Sikkerhet</h2>
            <p className="text-gray-600 leading-relaxed">
              Vi tar sikkerheten til dine personopplysninger på alvor og bruker tekniske og organisatoriske tiltak for å beskytte 
              dataene mot uautorisert tilgang, tap, misbruk eller endring. Dette inkluderer kryptering, brannmurer og regelmessige 
              sikkerhetsgjennomganger.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies og sporingsteknologi</h2>
            <p className="text-gray-600 leading-relaxed">
              Vi bruker cookies og lignende teknologier for å forbedre brukeropplevelsen. Les mer i vår{' '}
              <a href="/cookies" className="text-[#82ffb2] hover:text-[#6ee69f] font-semibold">Cookie-policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Endringer i personvernerklæringen</h2>
            <p className="text-gray-600 leading-relaxed">
              Vi kan oppdatere denne personvernerklæringen fra tid til annen. Vesentlige endringer vil bli kommunisert via e-post 
              eller på vår nettside. Vi anbefaler deg å gjennomgå denne erklæringen regelmessig.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Kontakt oss</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Hvis du har spørsmål om denne personvernerklæringen eller ønsker å utøve dine rettigheter, kan du kontakte oss:
            </p>
            <div className="bg-gray-50 p-6 rounded-xl">
              <Logo size="md" />
              <p className="text-gray-600 mt-3"><strong>E-post:</strong> post@proanbud.no</p>
              <p className="text-gray-600"><strong>Telefon:</strong> +47 (utilgjengelig)</p>
              <p className="text-gray-600"><strong>Adresse:</strong> Bergen, Norge</p>
            </div>
            <p className="text-gray-600 leading-relaxed mt-4">
              Du har også rett til å klage til Datatilsynet dersom du mener vi ikke overholder personvernreglene.
            </p>
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
