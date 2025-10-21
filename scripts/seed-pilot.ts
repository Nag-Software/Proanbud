/**
 * Script for å lage første pilot-dokument i Sanity
 * Kjør med: node scripts/seed-pilot.ts
 */

import { createClient } from 'next-sanity'

const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-03-01',
  useCdn: false, // Bruk ikke CDN for writes
}

const client = createClient(sanityConfig)

const pilotData = {
  _type: 'pilot',
  title: 'Bli vår nye Pilotkunde',
  subtitle: 'Begrenset tilgang til vår AI-drevne tilbudsplattform',
  availableSpots: 15,
  usedSpots: 0,
  spotsText: 'plasser igjen',
  pricing: {
    amount: 99,
    currency: 'kr',
    period: 'måned'
  },
  heroDescription: 'Få eksklusiv tilgang til vår revolusjonerende AI-drevne tilbudsplattform. Kun 99 kr/måned i 3 måneder.',
  metrics: [
    {
      label: 'Gj.sn. tid spart per tilbud',
      value: '30–45%',
      description: 'Gj.sn. tid spart per tilbud'
    },
    {
      label: 'Økt vinnerandel',
      value: '+8–15%',
      description: 'Økt vinnerandel'
    },
    {
      label: 'Potensielle timer spart per måned',
      value: '20–120 h',
      description: 'Potensielle timer spart per måned'
    }
  ],
  aiCard: {
    title: 'Automatisk tilbudsgenerering med AI',
    description: 'Vår avanserte AI analyserer markedet og lager profesjonelle tilbud som øker dine sjanser for å vinne oppdrag.',
  },
  trustIndicators: [
    { text: 'Ingen binding' },
    { text: '14 dager oppsigelse' },
    { text: 'GDPR compliant' }
  ],
  processSteps: [
    {
      title: 'Onboarding & 30-minutters demo',
      shortTitle: 'Onboarding & demo',
      description: 'Vi starter med en personlig demo hvor vi lærer deg å kjenne og forstår dine spesifikke behov. Demo-en tar ca. 30 minutter og gjennomføres digitalt via Teams eller Zoom.'
    },
    {
      title: '3 måneders pilotperiode',
      shortTitle: 'Pilotperiode - 3 måneder',
      description: 'I pilotperioden får du full tilgang til alle Proanbud-funksjoner. Du betaler kun 99 kr/måned (i stedet for normalpris på 299 kr/måned) for å dekke våre server- og AI-kostnader.'
    },
    {
      title: 'Full implementasjon & oppfølging',
      shortTitle: 'Implementasjon & oppfølging',
      description: 'Etter vellykket pilotperiode hjelper vi deg med full implementasjon i din organisasjon. Dette inkluderer opplæring av flere brukere, tilpasning av maler og integrasjoner.'
    }
  ],
  faq: [
    {
      question: 'Hva koster pilotprogrammet?',
      answer: 'Pilotprogrammet koster kun 99 kr/måned i 3 måneder. Dette dekker våre server- og AI-kostnader under pilotperioden.'
    },
    {
      question: 'Kan jeg si opp når som helst?',
      answer: 'Ja, du kan si opp pilotavtalen med 14 dagers varsel. Det er ingen binding utover pilotperioden.'
    },
    {
      question: 'Hva skjer etter pilotperioden?',
      answer: 'Etter pilotperioden kan du velge å fortsette med full lisens til normalpris (299 kr/måned), eller avslutte abonnementet.'
    }
  ]
}

async function seedPilotData() {
  try {
    console.log('🔍 Sjekker om pilot-data allerede eksisterer...')

    // Sjekk om pilot-data allerede eksisterer
    const existingPilot = await client.fetch('*[_type == "pilot"][0]')

    if (existingPilot) {
      console.log('✅ Pilot-data eksisterer allerede. Oppdaterer...')
      await client.patch(existingPilot._id).set(pilotData).commit()
      console.log('✅ Pilot-data oppdatert!')
    } else {
      console.log('📝 Lager nytt pilot-dokument...')
      const result = await client.create(pilotData)
      console.log('✅ Pilot-dokument laget med ID:', result._id)
    }

    console.log('🎉 Pilot-data er klar!')
  } catch (error) {
    console.error('❌ Feil ved seeding av pilot-data:', error)
    process.exit(1)
  }
}

// Kjør scriptet
seedPilotData()