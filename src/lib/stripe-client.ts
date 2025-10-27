// Client-side Stripe configuration
// This file can be safely imported by client-side code

export const PRICE_IDS = {
  BASIC: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID!,
  PRO: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
} as const;

export type Plan = 'free' | 'trial' | 'basic' | 'pro';

export const getPlanFromPriceId = (priceId: string): Plan | null => {
  if (priceId === PRICE_IDS.BASIC) return 'basic';
  if (priceId === PRICE_IDS.PRO) return 'pro';
  return null;
};

export const getPriceIdFromPlan = (plan: Plan): string | null => {
  switch (plan) {
    case 'basic':
      return PRICE_IDS.BASIC;
    case 'pro':
      return PRICE_IDS.PRO;
    default:
      return null;
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

export const SUBSCRIPTION_PLANS: SubscriptionPlanDetails[] = [
  {
    id: 'free',
    name: 'Gratis prøveperiode',
    description: 'Test alle funksjoner gratis i 14 dager – ingen kredittkort nødvendig',
    price: { monthly: 0, yearly: 0 },
    features: ['Inntil 3 tilbud', 'Inntil 1 kunder', 'E-post support', 'Grunnleggende statistikk'],
    color: 'gray',
    cta: 'Start prøveperiode',
    popular: false,
    limits: { quotes: 3, customers: 1, storage: 0 },
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For små bedrifter som trenger mer funksjonalitet',
    price: { monthly: 299, yearly: 2990 },
    features: ['Inntil 15 tilbud per måned', 'Inntil 10 kunder', 'Grunnleggende rapporter', 'E-post support', '1GB lagring', 'Tilpassbare maler', 'Kunde-database'],
    color: 'blue',
    cta: 'Velg Basic',
    popular: false,
    limits: { quotes: 15, customers: 10, storage: 1 },
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
      yearly: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For voksende bedrifter med profesjonelle behov',
    price: { monthly: 799, yearly: 7990 },
    features: ['Ubegrenset tilbud', 'Ubegrenset kunder', 'Avanserte rapporter og analyser', 'Prioritert support', '10GB lagring', 'API-tilgang', 'Tilpassede maler', 'Integrasjoner', 'Automasjon', 'Team-samarbeid'],
    color: 'purple',
    cta: 'Velg Pro',
    popular: true,
    limits: { quotes: -1, customers: -1, storage: 10 },
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID
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

  return period === 'yearly' ? `${formatted}/år` : `${formatted}/måned`;
};

export const getDaysRemaining = (trialEnd: number, currentTime?: number): number => {
  const now = currentTime || Math.floor(Date.now() / 1000);
  const remaining = trialEnd - now;
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60)));
};