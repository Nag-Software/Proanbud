import { client } from '@/lib/sanity'

export interface LaunchSpecialBanner {
  _id: string
  isActive: boolean
  emoji?: string
  headline?: string
  totalPlaces: number
  availablePlaces: number
  discountPercentage: number
  discountType: 'lifetime' | 'firstYear' | 'threeMonths' | 'oneMonth'
  discountLabel?: string
  descriptionTemplate?: string
  promoCodeLabel?: string
  promoCodeValue?: string
  availabilityTemplate?: string
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

export function applyBannerTemplate(
  template: string | undefined,
  replacements: Record<string, string | number | undefined>
): string | undefined {
  if (!template) return undefined
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = replacements[key]
    return value !== undefined && value !== null ? String(value) : ''
  })
}
