// Client-side Stripe configuration
// This file can be safely imported by client-side code

export const PRICE_IDS = {
  STANDARD: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID!,
  PROFF: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
  STANDARD_YEARLY: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID,
  PROFF_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
} as const;

export type Plan = 'free' | 'trial' | 'standard' | 'proff';

export const getPlanFromPriceId = (priceId: string): Plan | null => {
  if (priceId === PRICE_IDS.STANDARD || priceId === PRICE_IDS.STANDARD_YEARLY) return 'standard';
  if (priceId === PRICE_IDS.PROFF || priceId === PRICE_IDS.PROFF_YEARLY) return 'proff';
  return null;
};

export const getPriceIdFromPlan = (plan: Plan, billingPeriod: 'monthly' | 'yearly' = 'monthly'): string | null => {
  switch (plan) {
    case 'standard':
      return billingPeriod === 'yearly' && PRICE_IDS.STANDARD_YEARLY
        ? PRICE_IDS.STANDARD_YEARLY
        : PRICE_IDS.STANDARD;
    case 'proff':
      return billingPeriod === 'yearly' && PRICE_IDS.PROFF_YEARLY
        ? PRICE_IDS.PROFF_YEARLY
        : PRICE_IDS.PROFF;
    default:
      return null;
  }
};

// Function to fetch current prices from Stripe API
export const fetchStripePrices = async () => {
  try {
    const response = await fetch('/api/stripe/prices');
    if (!response.ok) {
      throw new Error('Failed to fetch prices');
    }
    const data = await response.json();
    return data.prices;
  } catch (error) {
    console.error('Error fetching prices from Stripe:', error);
    // Fallback to hardcoded prices if API fails
    return {
      standard: { monthly: 699, yearly: 6990 },
      proff: { monthly: 1999, yearly: 19990 }
    };
  }
};

// Subscription plans configuration
export interface SubscriptionPlanDetails {
  id: Plan;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  color: 'gray' | 'blue' | 'purple';
  cta: string;
  popular: boolean;
  stripePriceId?: {
    monthly?: string;
    yearly?: string;
  };
  limits: {
    quotes: number;
    customers: number;
    storage: number;
  };
}

// Function to get subscription plans with current prices
export const getSubscriptionPlans = async (): Promise<SubscriptionPlanDetails[]> => {
  const prices = await fetchStripePrices();

  return [
    {
      id: 'free',
      name: 'Gratis prøveperiode',
      description: 'Test alle funksjoner gratis i 14 dager – ingen kredittkort nødvendig',
      price: { monthly: 0, yearly: 0 },
      features: ['Inntil 10 tilbud', 'Inntil 10 kunder', 'E-post support', 'Grunnleggende statistikk'],
      color: 'gray',
      cta: 'Start prøveperiode',
      popular: false,
      limits: { quotes: 10, customers: 10, storage: 0 },
    },
    {
      id: 'standard',
      name: 'Standard',
      description: 'For små bedrifter som trenger mer funksjonalitet',
      price: prices.standard || { monthly: 399, yearly: 3990 },
      features: ['Inntil 15 nye tilbud', 'Inntil 10 nye kunder', 'Grunnleggende rapporter', 'E-post support', '1GB lagring (kommer)', 'Kunde-database'],
      color: 'blue',
      cta: 'Velg Standard',
      popular: false,
      limits: { quotes: 15, customers: 10, storage: 1 },
      stripePriceId: {
        monthly: PRICE_IDS.STANDARD,
        yearly: PRICE_IDS.STANDARD_YEARLY
      }
    },
    {
      id: 'proff',
      name: 'Proff',
      description: 'For voksende bedrifter med profesjonelle behov',
      price: prices.proff || { monthly: 799, yearly: 7990 },
      features: ['Ubegrenset nye tilbud', 'Ubegrenset nye kunder', 'Avanserte rapporter og analyser', 'Prioritert support', '10GB lagring (kommer)', 'API-tilgang', 'Integrasjoner', 'Automasjon', 'Team-samarbeid (kommer)'],
      color: 'purple',
      cta: 'Velg Proff',
      popular: true,
      limits: { quotes: -1, customers: -1, storage: 10 },
      stripePriceId: {
        monthly: PRICE_IDS.PROFF,
        yearly: PRICE_IDS.PROFF_YEARLY
      }
    }
  ];
};

// Legacy export for backward compatibility - uses fallback prices
export const SUBSCRIPTION_PLANS: SubscriptionPlanDetails[] = [
  {
    id: 'free',
    name: 'Gratis prøveperiode',
    description: 'Test alle funksjoner gratis i 14 dager – ingen kredittkort nødvendig',
    price: { monthly: 0, yearly: 0 },
    features: ['Inntil 10 tilbud', 'Inntil 10 kunder', 'E-post support', 'Grunnleggende statistikk'],
    color: 'gray',
    cta: 'Start prøveperiode',
    popular: false,
    limits: { quotes: 10, customers: 10, storage: 0 },
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'For små bedrifter som trenger mer funksjonalitet',
    price: { monthly: 399, yearly: 3990 },
    features: ['Inntil 15 nye tilbud', 'Inntil 10 nye kunder', 'Grunnleggende rapporter', 'E-post support', '1GB lagring (kommer)', 'Kunde-database'],
    color: 'blue',
    cta: 'Velg Standard',
    popular: false,
    limits: { quotes: 15, customers: 10, storage: 1 },
    stripePriceId: {
      monthly: PRICE_IDS.STANDARD,
      yearly: PRICE_IDS.STANDARD_YEARLY
    }
  },
  {
    id: 'proff',
    name: 'Proff',
    description: 'For voksende bedrifter med profesjonelle behov',
    price: { monthly: 799, yearly: 7990 },
    features: ['Ubegrenset nye tilbud', 'Ubegrenset nye kunder', 'Avanserte rapporter og analyser', 'Prioritert support', '10GB lagring (kommer)', 'API-tilgang', 'Integrasjoner', 'Automasjon', 'Team-samarbeid (kommer)'],
    color: 'purple',
    cta: 'Velg Proff',
    popular: true,
    limits: { quotes: -1, customers: -1, storage: 10 },
    stripePriceId: {
      monthly: PRICE_IDS.PROFF,
      yearly: PRICE_IDS.PROFF_YEARLY
    }
  }
];

export const FREE_TRIAL_DAYS = 14;

export const calculateTrialEndDate = (startDate: Date = new Date()): Date => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + FREE_TRIAL_DAYS);
  return endDate;
};

export const formatPrice = (price: number, period: 'monthly' | 'yearly' = 'monthly'): string => {
  const formatted = Math.round(price).toString();

  return period === 'yearly' ? `${formatted}/år` : `${formatted} kr`;
};

export const getDaysRemaining = (trialEnd: number, currentTime?: number): number => {
  const now = currentTime || Math.floor(Date.now() / 1000);
  const remaining = trialEnd - now;
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60)));
};