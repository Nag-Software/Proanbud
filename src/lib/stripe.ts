import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

export const PRICE_IDS = {
  BASIC: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID!,
  PRO: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
} as const;

export type Plan = 'trial' | 'basic' | 'pro';

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

// Re-export SUBSCRIPTION_PLANS from client config for server-side use
export { SUBSCRIPTION_PLANS } from './stripe-client';
