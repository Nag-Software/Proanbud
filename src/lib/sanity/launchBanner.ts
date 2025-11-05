import { client } from '@/lib/sanity'

export interface LaunchSpecialBanner {
  _id: string
  isActive: boolean
  totalPlaces: number
  availablePlaces: number
  discountPercentage: number
  discountType: 'lifetime' | 'firstYear' | 'threeMonths' | 'oneMonth'
}

export async function getLaunchSpecialBanner(): Promise<LaunchSpecialBanner | null> {
  try {
    const banner = await client.fetch(
      `*[_type == "launchSpecialBanner"][0]`
    )
    return banner || null
  } catch (error) {
    console.error('Error fetching launch special banner:', error)
    return null
  }
}

export function getDiscountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    lifetime: 'på livstid',
    firstYear: 'første år',
    threeMonths: 'første 3 måneder',
    oneMonth: 'første måned'
  }
  return labels[type] || 'på livstid'
}
