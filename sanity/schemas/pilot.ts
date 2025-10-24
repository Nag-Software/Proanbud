/**
 * Pilot-side schema for Sanity
 * Inneholder all data som kan redigeres for pilot-landingssiden
 */

export default {
  name: 'pilot',
  title: 'Pilot-side',
  type: 'document',
  icon: () => '👨‍✈️',
  actions: [
    'update',
    'publish',
    'delete'
  ],
  fields: [
    {
      name: 'title',
      title: 'Tittel',
      type: 'string',
      description: 'Hovedtittel på pilot-siden',
      initialValue: 'Bli en av 15 utvalgte pilotkunder'
    },
    {
      name: 'heroDescription',
      title: 'Hero-beskrivelse',
      type: 'text',
      rows: 4,
      description: 'Beskrivelse i hero-seksjonen',
      initialValue: 'Proanbud er en AI-drevet anbudsplatform som revolusjonerer måten entreprenører lager og sender tilbud på. Med avansert AI-teknologi automatiserer vi tidkrevende oppgaver, slik at du kan fokusere på det som betyr mest - å vinne flere oppdrag.'
    },
    {
      name: 'badgeText',
      title: 'Badge-tekst',
      type: 'string',
      description: 'Tekst i badge over tittelen',
      initialValue: 'Begrensede plasser'
    },
    {
      name: 'processSteps',
      title: 'Prosess-steg',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Tittel',
              type: 'string'
            },
            {
              name: 'shortTitle',
              title: 'Kort tittel',
              type: 'string',
              description: 'Valgfri kort versjon av tittelen for bruk i tabs'
            },
            {
              name: 'description',
              title: 'Beskrivelse',
              type: 'text',
              rows: 4
            }
          ]
        }
      ],
      initialValue: [
        {
          title: 'Onboarding & Demo',
          shortTitle: 'Onboarding',
          description: 'Vi starter med en personlig demo hvor vi lærer deg å kjenne og forstår dine spesifikke behov. Demo-en tar ca. 30 minutter og gjennomføres digitalt via Teams eller Zoom.\n\nUnder demoen viser vi hvordan Proanbud fungerer, hvordan AI-en hjelper med prissetting, og hvordan du enkelt kan lage profesjonelle tilbud på få minutter.\n\nEtter demoen setter vi opp din konto og gir deg tilgang til testmiljøet så du kan prøve systemet selv før pilotperioden starter.'
        },
        {
          title: 'Pilotperiode',
          shortTitle: 'Pilotperiode - 3 måneder',
          description: 'I pilotperioden får du full tilgang til alle Proanbud-funksjoner. Du betaler kun 99 kr/måned (i stedet for normalpris på 299 kr/måned) for å dekke våre server- og AI-kostnader.\n\nUnder piloten bruker du systemet i din daglige drift. Vi følger opp med jevnlige sjekker for å sikre at alt fungerer som det skal og for å samle tilbakemeldinger.\n\nMot slutten av pilotperioden gjennomfører vi en evaluering sammen hvor vi måler resultater som tidsbesparelser, økt vinnerate og brukeropplevelse.'
        },
        {
          title: 'Implementasjon',
          shortTitle: 'Implementasjon & oppfølging',
          description: 'Etter vellykket pilotperiode hjelper vi deg med full implementasjon i din organisasjon. Dette inkluderer opplæring av flere brukere, tilpasning av maler og integrasjoner.\n\nVi sørger for at alle i teamet ditt er komfortable med systemet og at arbeidsflytene er optimalisert. Du får også tilgang til vår support og dokumentasjon for løpende bruk.'
        }
      ]
    },
    {
      name: 'faq',
      title: 'FAQ',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'question',
              title: 'Spørsmål',
              type: 'string'
            },
            {
              name: 'answer',
              title: 'Svar',
              type: 'text',
              rows: 4
            }
          ]
        }
      ],
      initialValue: [
        {
          question: 'Hva koster det etter pilotperioden?',
          answer: 'Etter pilotperioden på 99 kr/måned, tilpasses prisen basert på din bruk og behov. Vi starter vanligvis fra 299 kr/måned for full tilgang, men vi diskuterer individuelle løsninger etter piloten.'
        },
        {
          question: 'Hvordan håndteres data og GDPR?',
          answer: 'Vi behandler alle data i henhold til norsk personvernlovgivning (GDPR). Dine data lagres sikkert og deles aldri uten ditt samtykke. Vi bruker anonymiserte data kun for å forbedre tjenesten.'
        },
        {
          question: 'Kan jeg si opp pilotprogrammet?',
          answer: 'Ja, du kan si opp med 14 dagers varsel når som helst under eller etter pilotperioden. Det er bindingstid eller skjulte kostnader.'
        },
        {
          question: 'Støtter dere integrasjoner med andre systemer?',
          answer: 'Ja, vi støtter API-integrasjoner med de fleste CRM og ERP-systemer. Under piloten kan vi også hjelpe med å sette opp integrasjoner du trenger.'
        },
        {
          question: 'Hva skjer hvis jeg ikke blir fornøyd med piloten?',
          answer: 'Hvis piloten ikke møter dine forventninger, kan du avslutte når som helst. Vi refunderer eventuelle ubrukte måneder og bruker tilbakemeldingen din til å forbedre tjenesten.'
        },
        {
          question: 'Trenger jeg teknisk kompetanse for å bruke Proanbud?',
          answer: 'Nei, Proanbud er designet for å være brukervennlig. Vi gir grundig opplæring under onboarding, og du får støtte gjennom hele pilotperioden.'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      spots: 'availableSpots'
    },
    prepare(selection: any) {
      const { title, spots } = selection
      return {
        title: title || 'Pilot-side',
        subtitle: `${spots || 0} plasser igjen`
      }
    }
  }
}