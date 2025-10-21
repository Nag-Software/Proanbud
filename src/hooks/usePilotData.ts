import { useState, useEffect } from 'react'
import { client, pilotDataQuery } from '@/lib/sanity'

interface PilotPricing {
  amount: number
  currency: string
  period: string
}

interface PilotMetric {
  label: string
  value: string
  description: string
}

interface PilotAiCard {
  title: string
  description: string
  spotsFilled: number
  spotsRemaining: number
}

interface PilotTrustIndicator {
  text: string
}

interface PilotSecondaryCTA {
  text: string
  url: string
}

interface PilotProcessStep {
  title: string
  description: string
}

interface PilotFaq {
  question: string
  answer: string
}

export interface PilotData {
  _id: string
  title: string
  subtitle?: string
  badgeText: string
  availableSpots: number
  usedSpots: number
  spotsText: string
  pricing: PilotPricing
  heroDescription?: string
  metrics: PilotMetric[]
  aiCard: PilotAiCard
  trustIndicators: PilotTrustIndicator[]
  secondaryCTA: PilotSecondaryCTA
  processSteps: PilotProcessStep[]
  faq: PilotFaq[]
}

export function usePilotData() {
  const [pilotData, setPilotData] = useState<PilotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPilotData() {
      try {
        setLoading(true)
        const data = await client.fetch<PilotData>(pilotDataQuery)
        setPilotData(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching pilot data:', err)
        setError('Kunne ikke laste pilot-data')
      } finally {
        setLoading(false)
      }
    }

    fetchPilotData()
  }, [])

  return { pilotData, loading, error }
}