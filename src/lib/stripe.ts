import { getStripePayments } from '@invertase/firestore-stripe-payments';
import { firestore } from './firebase';
import { getApp } from 'firebase/app';

// Initialize Stripe Payments
export const stripePayments = getStripePayments(getApp(), {
  productsCollection: 'products',
  customersCollection: 'customers',
});

// Wrapper function for creating checkout sessions using Firestore
export const createCheckoutSession = async (priceId: string, customerId?: string) => {
  console.log('Creating checkout session with:', { priceId, customerId });
  
  if (!priceId || priceId.trim() === '') {
    throw new Error('Price ID is required and cannot be empty');
  }
  
  // Note: The customerId parameter is not needed with the Firestore extension
  // as it automatically handles customer creation and management
  
  try {
    // This function is now implemented in SubscriptionContextNew.tsx
    // and uses Firestore collections directly
    throw new Error('Use createCheckoutSession from SubscriptionContextNew instead');
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    throw error;
  }
};

// Debug environment variables
console.log('Stripe Environment Variables:');
console.log('NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID:', process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID);
console.log('NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID:', process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID);
console.log('NEXT_PUBLIC_STRIPE_PRO_PRICE_ID:', process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID);
console.log('NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID:', process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID);

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Gratis prøveperiode',
    description: 'Test alle funksjoner gratis i 14 dager – ingen kredittkort nødvendig',
    price: {
      monthly: 0,
      yearly: 0
    },
    features: [
      'Inntil 5 tilbud',
      'Inntil 3 kunder',
      'E-post support',
      'Grunnleggende statistikk'
    ],
    color: 'gray',
    cta: 'Start prøveperiode',
    popular: false,
    limits: {
      quotes: 5,
      customers: 3,
      storage: 1 // 1GB
    }
  },
  {
    id: 'trial',
    name: 'Prøveperiode',
    description: 'Aktiv prøveperiode med begrensede funksjoner',
    price: {
      monthly: 0,
      yearly: 0
    },
    features: [
      'Inntil 3 tilbud per måned',
      'Inntil 1 ny kunde per måned',
      'E-post support',
      'Grunnleggende statistikk'
    ],
    color: 'blue',
    cta: 'Prøveperiode aktiv',
    popular: false,
    limits: {
      quotes: 3,
      customers: 1,
      storage: 1 // 1GB
    }
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For små bedrifter som trenger mer funksjonalitet',
    price: {
      monthly: 299,
      yearly: 2990
    },
    features: [
      'Inntil 15 tilbud per måned',
      'Inntil 10 kunder',
      'Grunnleggende rapporter',
      'E-post support',
      '1GB lagring',
      'Tilpassbare maler',
      'Kunde-database'
    ],
    color: 'blue',
    cta: 'Velg Basic',
    popular: false,
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
      yearly: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID
    },
    limits: {
      quotes: 15,
      customers: 10,
      storage: 1 // 1GB
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For voksende bedrifter med profesjonelle behov',
    price: {
      monthly: 799,
      yearly: 7990
    },
    features: [
      'Ubegrenset tilbud',
      'Ubegrenset kunder',
      'Avanserte rapporter og analyser',
      'Prioritert support',
      '10GB lagring',
      'API-tilgang',
      'Tilpassede maler',
      'Integrasjoner',
      'Automasjon',
      'Team-samarbeid'
    ],
    color: 'purple',
    cta: 'Velg Pro',
    popular: true,
    stripePriceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID
    },
    limits: {
      quotes: -1, // unlimited
      customers: -1, // unlimited
      storage: 10 // 10GB
    }
  }
];

export const FREE_TRIAL_DAYS = 14;

export const getPlanById = (planId: string) => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0
  }).format(price);
};

export const calculateTrialEndDate = () => {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + (FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000));
  return Math.floor(trialEnd.getTime() / 1000); // Unix timestamp
};

export const getDaysRemaining = (endTimestamp: number) => {
  const now = Math.floor(Date.now() / 1000);
  const daysRemaining = Math.max(0, Math.ceil((endTimestamp - now) / (24 * 60 * 60)));
  return daysRemaining;
};

export const isTrialExpired = (endTimestamp: number) => {
  const now = Math.floor(Date.now() / 1000);
  return now > endTimestamp;
};
