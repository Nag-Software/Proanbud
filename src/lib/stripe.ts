import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

export const PRICE_IDS = {
  STANDARD: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID!,
  PROFF: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
} as const;

export type Plan = 'trial' | 'standard' | 'proff';

export const getPlanFromPriceId = (priceId: string): Plan | null => {
  if (priceId === PRICE_IDS.STANDARD) return 'standard';
  if (priceId === PRICE_IDS.PROFF) return 'proff';
  return null;
};

export const getPriceIdFromPlan = (plan: Plan): string | null => {
  switch (plan) {
    case 'standard':
      return PRICE_IDS.STANDARD;
    case 'proff':
      return PRICE_IDS.PROFF;
    default:
      return null;
  }
};

// Re-export SUBSCRIPTION_PLANS from client config for server-side use
export { SUBSCRIPTION_PLANS } from './stripe-client';
