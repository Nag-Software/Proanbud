'use client';

import React from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import Logo from '@/components/shared/Logo';
import { Menu, X, ArrowLeft, Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image?: string;
}

// Sample blog post data - later this can be fetched from a CMS or database
const blogPostsData: BlogPost[] = [
  {
    id: '1',
    title: 'Hvordan lage profesjonelle tilbud på under 5 minutter',
    excerpt: 'Lær hvordan du kan effektivisere tilbudsprosessen din med AI-drevet automatisering og spare verdifull tid.',
    author: 'Proanbud Team',
    date: '2. oktober 2025',
    category: 'Tips & Triks',
    readTime: '5 min',
    image: '/assets/hero/nice.png',
    content: `
      <h2>Tiden er din mest verdifulle ressurs</h2>
      <p>Som profesjonell tilbudsgiver vet du at tiden brukt på hver tilbudsforespørsel er kritisk. Hvert minutt teller, og evnen til å levere raske, nøyaktige tilbud kan være forskjellen mellom å vinne eller tape et prosjekt.</p>
      
      <p>I denne artikkelen deler vi konkrete strategier for hvordan du kan redusere tiden det tar å lage profesjonelle tilbud fra timer til kun noen få minutter.</p>

      <h2>1. Automatiser de repeterende oppgavene</h2>
      <p>Den største tidstyven i tilbudsprosessen er ofte de repeterende oppgavene - oppslag av priser, beregninger, formatering og kvalitetskontroll. Med moderne AI-verktøy kan disse oppgavene automatiseres:</p>
      
      <ul>
        <li><strong>Automatisk prisoppslag:</strong> Integrer direkte med leverandører og produktkataloger for sanntidspriser</li>
        <li><strong>Smart kalkulator:</strong> La AI beregne materialer, arbeidstimer og marginer automatisk</li>
        <li><strong>Profesjonell formatering:</strong> Generer pene, merkevarebyggende dokumenter med ett klikk</li>
      </ul>

      <h2>2. Bygg et smart produktbibliotek</h2>
      <p>Et godt organisert produktbibliotek er gull verdt. Sørg for at du har:</p>
      
      <ul>
        <li>Forhåndsdefinerte pakker for vanlige jobber</li>
        <li>Standardpriser med automatisk påslag</li>
        <li>Ofte brukte beskrivelser og spesifikasjoner</li>
        <li>Bilder og tekniske tegninger klare til bruk</li>
      </ul>

      <h2>3. Bruk maler - men gjør dem smarte</h2>
      <p>Maler er bra, men statiske maler kan bli begrensende. De beste løsningene bruker dynamiske maler som tilpasser seg automatisk basert på prosjekttype, kunde og omfang.</p>

      <blockquote>
        "Siden vi begynte å bruke Proanbud har vi redusert tiden på tilbud fra 2-3 timer til under 10 minutter, samtidig som kvaliteten har økt betydelig."
        <footer>- Per Hansen, Snekkerservice AS</footer>
      </blockquote>

      <h2>4. AI som kvalitetssikrer</h2>
      <p>En av de største fordelene med AI er evnen til å fange opp feil og mangler før tilbudet sendes:</p>
      
      <ul>
        <li>Fanger opp manglende produkter eller tjenester</li>
        <li>Sjekker at priser og marginer er konkurransedyktige</li>
        <li>Foreslår forbedringer i tekst og presentasjon</li>
        <li>Sørger for at alle nødvendige detaljer er inkludert</li>
      </ul>

      <h2>5. Integrer med dine eksisterende verktøy</h2>
      <p>De beste tidsbesparelsene kommer når alt fungerer sømløst sammen. Se etter løsninger som integrerer med:</p>
      
      <ul>
        <li>CRM-systemet ditt</li>
        <li>Regnskapsprogram</li>
        <li>Prosjektstyringsverktøy</li>
        <li>E-postsystemer</li>
      </ul>

      <h2>Konklusjon</h2>
      <p>Med de riktige verktøyene og strategiene er det fullt mulig å lage profesjonelle, konkurransedyktige tilbud på under 5 minutter. Nøkkelen er å automatisere det som kan automatiseres, samtidig som du beholder den personlige touchen som kundene setter pris på.</p>

      <p>Start i dag med å identifisere de mest tidkrevende delene av din tilbudsprosess, og se hvordan moderne verktøy kan hjelpe deg å jobbe smartere, ikke hardere.</p>
    `
  },
  {
    id: '2',
    title: 'De 10 vanligste feilene ved prising av renoveringsprosjekter',
    excerpt: 'Unngå disse vanlige fallgruvene når du priser dine neste renoveringsprosjekter. Basert på data fra over 1000 tilbud.',
    author: 'Proanbud Team',
    date: '28. september 2025',
    category: 'Beste praksis',
    readTime: '8 min',
    image: '/assets/hero/nice2.png',
    content: `
      <h2>Prising kan være en kunst - men den trenger ikke være gjettverk</h2>
      <p>Gjennom analyse av over 1000 tilbud har vi identifisert de vanligste feilene som renoveringsfirmaer gjør når de priser prosjekter. Disse feilene kan koste deg både penger og prosjekter.</p>

      <h2>1. Undervurdere arbeidstid</h2>
      <p>Dette er kanskje den vanligste feilen. Mange håndverkere anslår arbeidstid basert på ideelle forhold, men glemmer å ta høyde for:</p>
      <ul>
        <li>Uforutsette problemer (finnes nesten alltid)</li>
        <li>Tid til opprydding</li>
        <li>Materialtransport og forberedelser</li>
        <li>Koordinering med andre fagfolk</li>
      </ul>
      <p><strong>Tips:</strong> Legg til minimum 15-20% buffer på arbeidstimer for renoveringsprosjekter.</p>

      <h2>2. Glemme indirekte kostnader</h2>
      <p>Mange tilbud dekker kun materialer og direkte arbeidstid, men hva med:</p>
      <ul>
        <li>Verktøy og maskiner</li>
        <li>Transport og drivstoff</li>
        <li>Forsikring</li>
        <li>Administrasjon</li>
        <li>Faglig oppdatering og sertifiseringer</li>
      </ul>

      <h2>3. Ikke ta høyde for risiko</h2>
      <p>Gamle bygninger skjuler ofte overraskelser. Råteskader, asbest, eller utdatert elektrisitet kan raskt spise opp marginen din hvis du ikke har tatt høyde for risiko.</p>

      <h2>4. Konkurransedyktige priser ≠ laveste pris</h2>
      <p>Mange tror at de må ha laveste pris for å vinne jobben. Men studier viser at kun 23% av kundene velger basert på laveste pris alene. Kvalitet, troverdighet og profesjonalitet veier også tungt.</p>

      <blockquote>
        "Vi sluttet å være billigst og begynte å være best. Resultatet? 40% høyere marginer og mer fornøyde kunder."
        <footer>- Linda Johansen, Renova Bygg</footer>
      </blockquote>

      <h2>5. Mangelfull kartlegging av omfang</h2>
      <p>Et godt tilbud starter med grundig kartlegging. Mange hopper over viktige spørsmål om:</p>
      <ul>
        <li>Nøyaktig omfang av arbeidet</li>
        <li>Kundens forventninger til kvalitet</li>
        <li>Tidsramme og fleksibilitet</li>
        <li>Eksisterende forhold på stedet</li>
      </ul>

      <h2>6. Uklare beskrivelser</h2>
      <p>Vage formuleringer som "nødvendige arbeider" eller "etter behov" kan føre til konflikter senere. Vær konkret om:</p>
      <ul>
        <li>Eksakt hvilke arbeider som inkluderes</li>
        <li>Kvalitet på materialer (type, merke, klasse)</li>
        <li>Hva som IKKE inngår</li>
        <li>Eventuelle forutsetninger</li>
      </ul>

      <h2>7. Glemme påslagskalkyle</h2>
      <p>Husk at påslag ikke bare er profitt - det dekker også:</p>
      <ul>
        <li>Risiko</li>
        <li>Kapitalbinding</li>
        <li>Garantiforpliktelser</li>
        <li>Videre utvikling av bedriften</li>
      </ul>
      <p>En sunn påslagsmargin for renoveringsprosjekter ligger typisk på 30-50% avhengig av kompleksitet.</p>

      <h2>8. Ikke verifisere leverandørpriser</h2>
      <p>Priser på materialer kan endre seg raskt. Alltid:</p>
      <ul>
        <li>Sjekk aktuelle priser før du sender tilbud</li>
        <li>Ta høyde for prisøkninger hvis prosjektstart er langt frem</li>
        <li>Ha alternative leverandører som backup</li>
      </ul>

      <h2>9. Ignorere sesongvariasjoner</h2>
      <p>Tidspunkt på året påvirker både etterspørsel og tilgjengelighet. Vurder å:</p>
      <ul>
        <li>Justere priser i høysesongen</li>
        <li>Tilby rabatter i lavsesong for å jevne ut arbeidsmengden</li>
        <li>Ta høyde for vær og værrelaterte forsinkelser</li>
      </ul>

      <h2>10. Ikke lære av tidligere prosjekter</h2>
      <p>Den beste måten å forbedre prising på er å lære av hvert prosjekt:</p>
      <ul>
        <li>Dokumenter faktisk tid brukt vs estimert</li>
        <li>Noter uforutsette kostnader</li>
        <li>Analyser hva som gikk bra og mindre bra</li>
        <li>Juster fremtidige estimater basert på erfaring</li>
      </ul>

      <h2>Konklusjon</h2>
      <p>God prising handler om å balansere konkurransedyktighet med lønnsomhet. Ved å unngå disse vanlige feilene, og kontinuerlig forbedre din prisingsmetodikk, vil du både vinne flere jobber og øke lønnsomheten.</p>

      <p>Husk: Et godt priset prosjekt er grunnlaget for fornøyde kunder, motiverte ansatte og en sunn forretning.</p>
    `
  },
  {
    id: '3',
    title: 'Hvordan AI kan transformere din tilbudsvirksomhet',
    excerpt: 'Utforsk hvordan kunstig intelligens kan hjelpe deg med å lage bedre tilbud, spare tid og øke gevinstprosenten din.',
    author: 'Proanbud Team',
    date: '25. september 2025',
    category: 'Teknologi',
    readTime: '6 min',
    image: '/assets/hero/nice3.png',
    content: `
      <h2>AI - ikke science fiction, men hverdagsverktøy</h2>
      <p>Kunstig intelligens har gått fra å være science fiction til å bli et praktisk verktøy som kan revolusjonere måten du lager tilbud på. La oss se på de konkrete måtene AI kan hjelpe din virksomhet.</p>

      <h2>Automatisk prisberegning</h2>
      <p>AI kan analysere tusenvis av produkter, priser og kombinasjoner på sekunder. Dette betyr:</p>
      <ul>
        <li>Raskere tilbud med færre feil</li>
        <li>Alltid oppdaterte priser fra leverandører</li>
        <li>Smart forslag til alternative produkter</li>
        <li>Automatisk beregning av optimal margin</li>
      </ul>

      <h2>Intelligent tekstgenerering</h2>
      <p>AI kan hjelpe med å skrive:</p>
      <ul>
        <li>Produktbeskrivelser som selger</li>
        <li>Personlige følgebrev</li>
        <li>Detaljerte arbeidsomfang</li>
        <li>Profesjonelle vilkår og betingelser</li>
      </ul>
      <p>Alt tilpasset din tone og stil, men på en brøkdel av tiden.</p>

      <blockquote>
        "AI har gjort at vi kan konkurrere med de store aktørene. Vi leverer like profesjonelle tilbud, men mye raskere."
        <footer>- Knut Berg, Berg & Sønn Tømrer</footer>
      </blockquote>

      <h2>Prediktiv analyse</h2>
      <p>AI kan lære av dine tidligere tilbud og hjelpe deg med å:</p>
      <ul>
        <li>Forutsi hvilke tilbud du har størst sjanse til å vinne</li>
        <li>Optimalisere prising basert på kundehistorikk</li>
        <li>Identifisere mønstre i tap og gevinst</li>
        <li>Foreslå forbedringer for fremtidige tilbud</li>
      </ul>

      <h2>Kvalitetssikring på autopilot</h2>
      <p>AI kan sjekke tilbudet ditt for:</p>
      <ul>
        <li>Manglende informasjon</li>
        <li>Uvanlige prisavvik</li>
        <li>Skrivefeil og grammatikk</li>
        <li>Konsistens i beregninger</li>
      </ul>

      <h2>24/7 tilgjengelighet</h2>
      <p>Med AI-drevne verktøy kan du:</p>
      <ul>
        <li>Jobbe når det passer deg</li>
        <li>Svare raskt på forespørsler, selv utenfor arbeidstid</li>
        <li>Automatisere oppfølging</li>
        <li>Aldri gå glipp av en mulighet</li>
      </ul>

      <h2>Læring og forbedring</h2>
      <p>Jo mer du bruker AI, jo bedre blir det:</p>
      <ul>
        <li>Lærer av dine preferanser</li>
        <li>Tilpasser seg dine arbeidsmønstre</li>
        <li>Forbedrer nøyaktigheten over tid</li>
        <li>Gir deg innsikt i din egen virksomhet</li>
      </ul>

      <h2>Er AI trygt?</h2>
      <p>Mange bekymrer seg om datasikkerhet. Moderne AI-løsninger:</p>
      <ul>
        <li>Krypterer all data</li>
        <li>Overholder GDPR</li>
        <li>Lar deg beholde full kontroll</li>
        <li>Bruker data kun for å hjelpe DIG</li>
      </ul>

      <h2>Kommer AI til å erstatte deg?</h2>
      <p>Nei - AI er et verktøy som gjør deg bedre, ikke en erstatning. Tenk på det som en super-assistent som:</p>
      <ul>
        <li>Tar seg av det kjedelige</li>
        <li>Gir deg mer tid til kundene</li>
        <li>Lar deg fokusere på det du er best på</li>
        <li>Gjør at du kan vokse uten å ansette mer folk</li>
      </ul>

      <h2>Kom i gang med AI</h2>
      <p>Å starte med AI er enklere enn du tror:</p>
      <ol>
        <li>Velg én prosess å forbedre først</li>
        <li>Test et AI-verktøy designet for din bransje</li>
        <li>Begynn enkelt og utvid gradvis</li>
        <li>Gi det tid - verktøyet blir bedre jo mer du bruker det</li>
      </ol>

      <h2>Konklusjon</h2>
      <p>AI er ikke fremtiden - det er nåtiden. Virksomheter som tar i bruk AI nå posisjonerer seg for suksess, mens de som venter risikerer å bli hengende etter.</p>

      <p>Den gode nyheten? Det har aldri vært enklere å komme i gang. Moderne AI-verktøy er intuitive, rimelige og tilpasset små og mellomstore bedrifter.</p>
    `
  },
  {
    id: '4',
    title: 'Slik øker du gevinstprosenten på dine tilbud med 30%',
    excerpt: 'Data-drevne strategier for å forbedre tilbudene dine og vinne flere prosjekter. Inkluderer case studies fra virkelige kunder.',
    author: 'Proanbud Team',
    date: '20. september 2025',
    category: 'Strategi',
    readTime: '10 min',
    image: '/assets/1.jpg',
    content: `
      <h2>Gevinst handler om mer enn bare pris</h2>
      <p>Mange tror at den eneste måten å vinne flere jobber på er å senke prisene. Men våre data viser noe helt annet - de mest vellykkede tilbudsgiverne vinner ikke fordi de er billigst, men fordi de er best.</p>

      <h2>1. Profesjonell presentasjon</h2>
      <p>Første inntrykk teller. Et tilbud som ser profesjonelt ut signaliserer:</p>
      <ul>
        <li>Kvalitet i arbeidet</li>
        <li>Oppmerksomhet på detaljer</li>
        <li>Seriøsitet</li>
        <li>Moderne tilnærming</li>
      </ul>
      <p>Kunder er villige til å betale mer for å jobbe med profesjonelle aktører.</p>

      <h2>2. Rask respons er gull verdt</h2>
      <p>Vår data viser at sannsynligheten for å vinne et prosjekt synker med 50% for hver dag du venter med å sende tilbud. Hvorfor?</p>
      <ul>
        <li>Kunden er i "kjøpsmodus" nå</li>
        <li>Konkurrentene dine sender allerede</li>
        <li>Du viser at du ønsker jobben</li>
        <li>Kunden husker deg bedre</li>
      </ul>
      <p><strong>Tips:</strong> Sikt mot å sende tilbud innen 24 timer.</p>

      <h2>3. Personalisering skaper tillit</h2>
      <p>Generiske tilbud vinner sjelden. Inkluder:</p>
      <ul>
        <li>Kundens navn og spesifikke behov</li>
        <li>Referanse til deres situasjon</li>
        <li>Skreddersydde løsninger</li>
        <li>Personlige anbefalinger</li>
      </ul>

      <blockquote>
        "Da vi begynte å personalisere hvert tilbud økte gevinstprosenten vår fra 18% til 32% på seks måneder."
        <footer>- Thomas Olsen, TO Bygg AS</footer>
      </blockquote>

      <h2>4. Transparens bygger tillit</h2>
      <p>Vis gjerne hvordan prisen er bygget opp:</p>
      <ul>
        <li>Materialkostnader</li>
        <li>Arbeidstimer</li>
        <li>Utstyr og verktøy</li>
        <li>Påslag og hvorfor</li>
      </ul>
      <p>Kunder setter pris på ærlighet og forståelse for hva de betaler for.</p>

      <h2>5. Alternativer gir fleksibilitet</h2>
      <p>Gi kunden valgmuligheter:</p>
      <ul>
        <li>Basis-løsning</li>
        <li>Standard-løsning</li>
        <li>Premium-løsning</li>
      </ul>
      <p>Dette øker sjansen for at de velger deg, og ofte for en høyere pakke enn de opprinnelig tenkte.</p>

      <h2>6. Sosial bevis virker</h2>
      <p>Inkluder:</p>
      <ul>
        <li>Tidligere kundeprosjekter (med bilder)</li>
        <li>Anbefalinger</li>
        <li>Sertifiseringer</li>
        <li>Garantier</li>
      </ul>

      <h2>7. Følg opp strategisk</h2>
      <p>Et tilbud er starten på en samtale, ikke slutten:</p>
      <ul>
        <li>Ring etter 2-3 dager</li>
        <li>Spør om de har spørsmål</li>
        <li>Tilby møte for gjennomgang</li>
        <li>Vær tilgjengelig og imøtekommende</li>
      </ul>

      <h2>8. Timing er alt</h2>
      <p>Send tilbud når sannsynligheten for å bli lest er høyest:</p>
      <ul>
        <li>Tirsdager og onsdager er best</li>
        <li>Mellom 09:00 og 11:00 er optimal tid</li>
        <li>Unngå fredager og mandag morgen</li>
      </ul>

      <h2>9. Håndter innvendinger proaktivt</h2>
      <p>Adresser vanlige bekymringer før de nevnes:</p>
      <ul>
        <li>"Er dette for dyrt?" - Vis verdi, ikke bare pris</li>
        <li>"Tar det lang tid?" - Vær konkret om tidslinjer</li>
        <li>"Kan jeg stole på dere?" - Vis troverdighet</li>
      </ul>

      <h2>10. Mål og forbedre kontinuerlig</h2>
      <p>Hold oversikt over:</p>
      <ul>
        <li>Antall tilbud sendt</li>
        <li>Antall vunnet</li>
        <li>Gjennomsnittlig tilbudsverdi</li>
        <li>Tid fra forespørsel til tilbud</li>
        <li>Vanligste grunner til tap</li>
      </ul>

      <h2>Case Study: Hvordan TRE Bygg AS økte gevinst med 35%</h2>
      <p>TRE Bygg AS implementerte disse strategiene over 6 måneder:</p>
      
      <h3>Utgangspunkt:</h3>
      <ul>
        <li>Gevinstprosent: 15%</li>
        <li>Gjennomsnittlig responstid: 5 dager</li>
        <li>Tilbudspresentasjon: Grunnleggende Word-dokument</li>
      </ul>

      <h3>Endringer:</h3>
      <ul>
        <li>Innførte profesjonelle maler</li>
        <li>Reduserte responstid til 24 timer</li>
        <li>Personaliserte hvert tilbud</li>
        <li>La til 3 alternative løsninger</li>
        <li>Implementerte systematisk oppfølging</li>
      </ul>

      <h3>Resultater etter 6 måneder:</h3>
      <ul>
        <li>Gevinstprosent: 50% (økning på 35 prosentpoeng)</li>
        <li>Gjennomsnittlig prosjektverdi: 22% høyere</li>
        <li>Kundetilfredshet: Økt fra 7.2 til 9.1</li>
        <li>Tid spart: 60% reduksjon i tilbudstid</li>
      </ul>

      <blockquote>
        "Vi tenkte at vi måtte kutte priser for å konkurrere, men det motsatte viste seg å være sant. Ved å bli mer profesjonelle kunne vi faktisk øke prisene OG vinne flere jobber."
        <footer>- Tom Eriksen, TRE Bygg AS</footer>
      </blockquote>

      <h2>Konklusjon</h2>
      <p>Å øke gevinstprosenten handler om å bli bedre, ikke billigere. Ved å fokusere på profesjonalitet, responstid, personalisering og systematisk oppfølging, kan de fleste virksomheter øke sin gevinstprosent betydelig.</p>

      <p>Start med én endring i gangen, mål resultatet, og bygg videre på det som fungerer. De beste resultatene kommer fra konsistent innsats over tid.</p>
    `
  },
  {
    id: '5',
    title: 'Nye funksjoner i Proanbud: Automatisk katalogsynkronisering',
    excerpt: 'Vi introduserer automatisk synkronisering av produktkataloger, slik at prisene dine alltid er oppdaterte.',
    author: 'Proanbud Team',
    date: '15. september 2025',
    category: 'Produktnyheter',
    readTime: '4 min',
    image: '/assets/2.jpg',
    content: `
      <h2>Hold prisene oppdaterte - automatisk</h2>
      <p>Vi er stolte av å presentere en av de mest etterspurte funksjonene: Automatisk katalogsynkronisering. Nå slipper du å bekymre deg for utdaterte priser eller manuelle oppdateringer.</p>

      <h2>Hva er automatisk katalogsynkronisering?</h2>
      <p>Denne funksjonen holder ditt produktbibliotek automatisk oppdatert med de nyeste prisene fra dine leverandører. Det betyr:</p>
      <ul>
        <li>Alltid korrekte priser i tilbudene dine</li>
        <li>Ingen manuelle oppdateringer nødvendig</li>
        <li>Redusert risiko for feilprising</li>
        <li>Spar timer hver uke</li>
      </ul>

      <h2>Hvordan fungerer det?</h2>
      <p>Vi har integrert direkte med de største leverandørene i bransjen:</p>
      <ul>
        <li>Byggmakker</li>
        <li>Maxbo</li>
        <li>Optimera</li>
        <li>Og mange flere kommer snart!</li>
      </ul>
      <p>Prisene oppdateres automatisk hver natt, så du starter alltid dagen med de nyeste prisene.</p>

      <h2>Smart prishistorikk</h2>
      <p>En bonus-funksjon: Vi lagrer prishistorikk for alle produkter. Dette gir deg:</p>
      <ul>
        <li>Innsikt i pristrender</li>
        <li>Mulighet til å planlegge innkjøp smartere</li>
        <li>Varsler når priser endrer seg betydelig</li>
        <li>Bedre grunnlag for langsiktige tilbud</li>
      </ul>

      <h2>Kom i gang på 5 minutter</h2>
      <p>Det er enkelt å aktivere:</p>
      <ol>
        <li>Gå til Innstillinger → Integrasjoner</li>
        <li>Velg dine leverandører</li>
        <li>Koble til med dine kundekontoer</li>
        <li>Ferdig! Synkroniseringen starter automatisk</li>
      </ol>

      <blockquote>
        "Vi har testet denne funksjonen i beta, og den har allerede spart oss flere timer hver uke. Og enda viktigere - vi har unngått flere kostbare feilpriseringer."
        <footer>- Beta-kunde</footer>
      </blockquote>

      <h2>Sikkerhet og personvern</h2>
      <p>Vi tar datasikkerhet på alvor:</p>
      <ul>
        <li>All data er kryptert</li>
        <li>Vi deler aldri dine leverandøravtaler med andre</li>
        <li>Full GDPR-overholdelse</li>
        <li>Du har full kontroll og kan når som helst koble fra</li>
      </ul>

      <h2>Hva kommer neste?</h2>
      <p>Dette er bare starten. Vi jobber med:</p>
      <ul>
        <li>Integrasjoner med flere leverandører</li>
        <li>Automatisk tilgjengelighetssjekk</li>
        <li>Smart forslag til alternative produkter</li>
        <li>Volumrabatter og kampanjepriser</li>
      </ul>

      <h2>Prøv det i dag</h2>
      <p>Funksjonen er tilgjengelig for alle Pro og Enterprise kunder. Starter du i dag? Du får første måned gratis når du oppgraderer til Pro!</p>

      <p>Har du spørsmål? Vårt supportteam står klare til å hjelpe deg i gang.</p>
    `
  },
  {
    id: '6',
    title: 'Kundecase: Hvordan Nag Snekkeri AS økte omsetningen med 45%',
    excerpt: 'Les hvordan en av våre kunder brukte Proanbud til å transformere sin virksomhet og oppnå betydelig vekst.',
    author: 'Proanbud Team',
    date: '10. september 2025',
    category: 'Kundecase',
    readTime: '7 min',
    image: '/assets/3.png',
    content: `
      <h2>Fra overarbeidet til oversikt - på 6 måneder</h2>
      <p>Møt Ole fra Nag Snekkeri AS, et lite familieeid snekkerverksted som hadde store ambisjoner men slet med å skalere. Her er deres historie.</p>

      <h2>Utfordringen</h2>
      <p>Ole startet Nag Snekkeri AS for 8 år siden. Virksomheten vokste jevnt og trutt, men de siste årene hadde veksten stoppet opp. Problemene var mange:</p>
      
      <ul>
        <li>Brukte 3-4 timer på hvert tilbud</li>
        <li>Mistet ofte jobber til raskere konkurrenter</li>
        <li>Prisingen var inkonsistent og ofte for lav</li>
        <li>Ingen oversikt over gevinstprosent eller lønnsomhet</li>
        <li>Ole brukte kvelder og helger på tilbud</li>
      </ul>

      <blockquote>
        "Jeg var på vei til utbrenthet. Vi hadde nok forespørsler, men jeg rakk ikke å svare på alle. Og når jeg endelig sendte tilbud, var de ofte for billige fordi jeg hadde glemt noe."
        <footer>- Ole Hansen, Nag Snekkeri AS</footer>
      </blockquote>

      <h2>Løsningen</h2>
      <p>I mars 2025 bestemte Ole seg for å teste Proanbud. Målet var enkelt: Lage tilbud raskere uten å gå på kompromiss med kvalitet.</p>

      <h3>Første måned - Grunnarbeidet</h3>
      <p>Ole brukte den første måneden på å:</p>
      <ul>
        <li>Bygge opp sitt produktbibliotek</li>
        <li>Lage maler for vanlige jobber</li>
        <li>Sette opp standardpriser og marginer</li>
        <li>Lære systemet</li>
      </ul>

      <h3>Måned 2-3 - Tilvenning</h3>
      <p>De neste to månedene handlet om å:</p>
      <ul>
        <li>Finpusse arbeidsflyten</li>
        <li>Justere maler basert på erfaring</li>
        <li>Begynne å bruke AI-funksjoner</li>
        <li>Eksperimentere med forskjellige tilnærminger</li>
      </ul>

      <h3>Måned 4-6 - Vekstfasen</h3>
      <p>Nå begynte den virkelige forandringen:</p>
      <ul>
        <li>Tilbudstid redusert fra 3-4 timer til 15-20 minutter</li>
        <li>Kunne svare på 3x flere forespørsler</li>
        <li>Gevinstprosent økte fra 12% til 28%</li>
        <li>Gjennomsnittlig tilbudsverdi økte med 18%</li>
      </ul>

      <h2>Resultatene</h2>
      <p>Etter 6 måneder med Proanbud:</p>
      
      <h3>Tid spart</h3>
      <ul>
        <li>15-20 timer per uke frigjort</li>
        <li>Brukt på salg, kundekontakt og utvikling</li>
        <li>Ole hadde tid til å ansette sin første lærling</li>
      </ul>

      <h3>Økt omsetning</h3>
      <ul>
        <li>45% økning i omsetning</li>
        <li>Fra 6 til 17 vunne prosjekter per måned</li>
        <li>28% høyere gjennomsnittlig prosjektverdi</li>
      </ul>

      <h3>Bedre lønnsomhet</h3>
      <ul>
        <li>Gevinstprosent økt fra 12% til 28%</li>
        <li>Margin økt fra 15% til 32%</li>
        <li>Færre feilpriseringer</li>
      </ul>

      <h3>Livskvalitet</h3>
      <ul>
        <li>Ole jobber ikke lenger kvelder</li>
        <li>Kan ta fri i helgene</li>
        <li>Mindre stress</li>
        <li>Mer fornøyde kunder</li>
      </ul>

      <blockquote>
        "Proanbud ga meg tilbake livet mitt. Jeg elsker jobben min igjen. Og det beste? Kundene er mer fornøyde enn noen gang fordi jeg har tid til å gi dem den oppmerksomheten de fortjener."
        <footer>- Ole Hansen, Nag Snekkeri AS</footer>
      </blockquote>

      <h2>De viktigste lærdommene</h2>
      <p>Ole deler sine råd til andre som vurderer å ta steget:</p>

      <h3>1. Invester tid i starten</h3>
      <p>"Jeg brukte nesten en måned på å sette opp alt ordentlig. Det føltes som bortkastet tid, men det var den beste investeringen jeg har gjort."</p>

      <h3>2. Start enkelt</h3>
      <p>"Ikke prøv å lage det perfekte oppsettet fra dag én. Start med det grunnleggende og bygg videre."</p>

      <h3>3. Bruk AI-funksjoner</h3>
      <p>"Jeg var skeptisk først, men AI har blitt min beste assistent. Den fanger opp feil jeg aldri ville sett."</p>

      <h3>4. Følg med på tallene</h3>
      <p>"Nå har jeg oversikt over alt - gevinstprosent, gjennomsnittlig margin, hvilke jobber som er mest lønnsomme. Det har endret måten jeg driver virksomhet på."</p>

      <h2>Neste steg for Nag Snekkeri AS</h2>
      <p>Med ny tid og økt lønnsomhet planlegger Ole å:</p>
      <ul>
        <li>Ansette en svenn til</li>
        <li>Utvide til et større verksted</li>
        <li>Spesialisere seg mer på høyverdi-prosjekter</li>
        <li>Kanskje åpne en filial i nabobyen</li>
      </ul>

      <h2>Vil du oppnå lignende resultater?</h2>
      <p>Nag Snekkeri AS er ikke alene. Gjennomsnittlig opplever våre kunder:</p>
      <ul>
        <li>67% reduksjon i tid brukt på tilbud</li>
        <li>35% økning i gevinstprosent</li>
        <li>24% økning i gjennomsnittlig prosjektverdi</li>
        <li>3x flere tilbud sendt per måned</li>
      </ul>

      <p>Klar for å transformere din virksomhet? Prøv Proanbud gratis i 14 dager - ingen kredittkort nødvendig.</p>

      <blockquote>
        "Hvis jeg kunne gå tilbake til meg selv for ett år siden, ville jeg si: Gjør det nå. Ikke vent. Hver dag du venter er en dag du taper penger og brenner deg selv ut."
        <footer>- Ole Hansen, Nag Snekkeri AS</footer>
      </blockquote>
    `
  }
];

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showShareMenu, setShowShareMenu] = React.useState(false);
  
  const blogPost = blogPostsData.find(post => post.id === params.id);

  // If blog post not found, show 404
  if (!blogPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Icons.FileX className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Blogginnlegg ikke funnet</h1>
          <p className="text-gray-600 mb-6">Beklager, vi fant ikke blogginnlegget du leter etter.</p>
          <Link
            href="/blogg"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Tilbake til blogg
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const shareOnFacebook = () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const url = window.location.href;
    const text = blogPost.title;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Logo size="lg" />
            <nav className="hidden md:flex items-center gap-8">
              <a href="/#features" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                Funksjoner
              </a>
              <a href="/#showcase" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                Plattform
              </a>
              <a href="/priser" className='text-gray-700 hover:text-[#00b85b] transition-colors font-medium'>
                Priser
              </a>
              <a href="/#faq" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                FAQ
              </a>
              <a href="/blogg" className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium">
                Blogg
              </a>
            </nav>
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-[#00b85b] transition-colors font-medium"
              >
                Logg inn
              </Link>
              <Link
                href="/signup"
                className="bg-[#82ffb2] text-gray-900 px-6 py-2.5 rounded-xl transition-all font-semibold shadow-lg shadow-[#82ffb2]/20 hover:shadow-xl hover:shadow-[#82ffb2]/30"
              >
                Kom igang
              </Link>
            </div>
            
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-[#00b85b] transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-4">
              <a 
                href="/#features" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
              >
                Funksjoner
              </a>
              <a 
                href="/#showcase" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
              >
                Plattform
              </a>
              <a 
                href="/#faq" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
              >
                FAQ
              </a>
              <a 
                href="/blogg" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-2"
              >
                Blogg
              </a>
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center text-gray-700 hover:text-[#00b85b] transition-colors font-medium py-3 border-2 border-gray-200 rounded-xl hover:border-[#00b85b]"
                >
                  Logg inn
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center bg-[#82ffb2] text-gray-900 px-6 py-3 rounded-xl transition-all font-semibold shadow-lg shadow-[#82ffb2]/20 hover:shadow-xl hover:shadow-[#82ffb2]/30"
                >
                  Kom igang
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          href="/blogg"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Tilbake til blogg
        </Link>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-block bg-primary text-white px-4 py-1.5 rounded-full text-sm font-medium">
            {blogPost.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {blogPost.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span className="font-medium">{blogPost.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>{blogPost.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>{blogPost.readTime} lesing</span>
          </div>
          
          {/* Share Button */}
          <div className="ml-auto relative">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              aria-label="Del artikkel"
            >
              <Share2 className="h-5 w-5" />
              <span className="hidden sm:inline">Del</span>
            </button>
            
            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                <button
                  onClick={shareOnFacebook}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <span>Facebook</span>
                </button>
                <button
                  onClick={shareOnTwitter}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Twitter className="h-5 w-5 text-sky-500" />
                  <span>Twitter</span>
                </button>
                <button
                  onClick={shareOnLinkedIn}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Linkedin className="h-5 w-5 text-blue-700" />
                  <span>LinkedIn</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Featured Image */}
        {blogPost.image && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src={blogPost.image} 
              alt={blogPost.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <div 
          className="prose prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
            prose-li:text-gray-700 prose-li:mb-2
            prose-blockquote:border-l-4 prose-blockquote:border-primary 
            prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-8
            prose-blockquote:bg-gray-50 prose-blockquote:rounded-r-lg
            prose-blockquote:text-gray-800 prose-blockquote:italic
            prose-blockquote:not-italic
            prose-code:text-primary prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-gray-900 prose-pre:text-gray-100"
          dangerouslySetInnerHTML={{ __html: blogPost.content }}
        />
      </article>

      {/* Related Articles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Les også</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPostsData
            .filter(post => post.id !== blogPost.id)
            .slice(0, 3)
            .map((post) => (
              <Link
                key={post.id}
                href={`/blogg/${post.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
              >
                <div className="relative h-48 bg-gradient-to-br from-primary to-blue-600 overflow-hidden">
                  {post.image ? (
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icons.FileText className="h-16 w-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-white border-t border-gray-200">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-12 text-white">
            <Icons.Sparkles className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Klar for å komme i gang?</h2>
            <p className="text-xl mb-8 text-white/90">
              Lag profesjonelle tilbud på minutter med Proanbud AI
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors text-lg shadow-xl"
              >
                Prøv gratis i 14 dager
              </Link>
              <Link
                href="/priser"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-colors text-lg"
              >
                Se priser
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4">
        <div className="container mx-auto text-center text-gray-600">
          <p>&copy; 2025 Proanbud AI. Alle rettigheter reservert.</p>
        </div>
      </footer>
    </div>
  );
}
