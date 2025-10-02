import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export interface CreateCheckoutSessionParams {
  priceId: string;
  userId: string;
  email: string;
}

export const createCheckoutSession = async ({
  priceId,
  userId,
  email,
}: CreateCheckoutSessionParams): Promise<{ sessionId: string; url: string }> => {
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      userId,
      email,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
};

export const createPortalSession = async (
  customerId: string
): Promise<{ url: string }> => {
  const response = await fetch('/api/stripe/create-portal-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create portal session');
  }

  return response.json();
};

export interface SubscriptionData {
  plan: 'free' | 'basic' | 'pro';
  status: string;
  currentPeriodEnd: number | null;
  currentPeriodStart?: number | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
}

export const getSubscription = async (
  userId: string
): Promise<SubscriptionData> => {
  try {
    const response = await fetch('/api/stripe/get-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });

    if (!response.ok) {
      // Try to parse error as JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get subscription');
      } else {
        // If not JSON (e.g., HTML error page), return default
        console.error('Non-JSON response from API:', await response.text());
        throw new Error('Failed to get subscription - API returned non-JSON response');
      }
    }

    return response.json();
  } catch (error: any) {
    console.error('Error in getSubscription:', error);
    // Return free plan as fallback
    return {
      plan: 'free',
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }
};

export const cancelSubscription = async (
  userId: string
): Promise<{ success: boolean; cancelAtPeriodEnd: boolean; currentPeriodEnd: number }> => {
  const response = await fetch('/api/stripe/cancel-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel subscription');
  }

  return response.json();
};

export const redirectToCheckout = async ({
  priceId,
  userId,
  email,
}: CreateCheckoutSessionParams): Promise<void> => {
  const { url } = await createCheckoutSession({ priceId, userId, email });

  if (url) {
    window.location.href = url;
  } else {
    throw new Error('No checkout URL returned');
  }
};
