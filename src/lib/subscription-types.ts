export type SubscriptionPlan = 'free' | 'trial' | 'basic' | 'pro';

export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
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
    quotes: number; // -1 for unlimited
    customers: number; // -1 for unlimited
    storage: number; // in GB, -1 for unlimited
  };
}

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  trialEnd?: number;
  createdAt: number;
  updatedAt: number;
}

export interface SubscriptionUsage {
  quotesUsed: number;
  customersUsed: number;
  storageUsed: number; // in MB
  quotesLimit: number; // -1 for unlimited
  customersLimit: number; // -1 for unlimited
  storageLimit: number; // in MB, -1 for unlimited
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface UserSubscriptionContext {
  subscription: UserSubscription | null;
  usage: SubscriptionUsage | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  createCheckoutSession: (priceId: string) => Promise<StripeCheckoutSession>;
  createCustomerPortalSession: () => Promise<string>;
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
}
