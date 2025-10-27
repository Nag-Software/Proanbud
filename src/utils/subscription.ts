import { firestore, auth } from '../lib/firebaseAdmin';
import { getPlanFromPriceId } from '../lib/stripe';
import type { Plan } from '../lib/stripe';

export interface SubscriptionData {
  priceId: string;
  plan: Plan;
  status: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  trial_end: number | null;
  latest_invoice_id?: string;
}

export async function upsertSubscription(
  uid: string,
  subscriptionId: string,
  data: Partial<SubscriptionData>
): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  const subscriptionRef = firestore
    .collection('users')
    .doc(uid)
    .collection('subscriptions')
    .doc(subscriptionId);

  await firestore.runTransaction(async (transaction) => {
    const doc = await transaction.get(subscriptionRef);
    const existingData = doc.exists ? doc.data() : {};

    // Filter out undefined values from data
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    const updatedData: any = {
      ...existingData,
      ...filteredData,
      updatedAt: new Date(),
    };

    // Compute plan from priceId if not provided
    if (data.priceId && !data.plan) {
      const computedPlan = getPlanFromPriceId(data.priceId);
      if (computedPlan) {
        updatedData.plan = computedPlan;
      }
    }

    transaction.set(subscriptionRef, updatedData, { merge: true });
  });
}

export async function updateUserStripeCustomerId(
  uid: string,
  stripeCustomerId: string
): Promise<void> {
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  const userRef = firestore.collection('users').doc(uid);
  await userRef.set({ stripeCustomerId }, { merge: true });
}

export async function getUserSubscriptions(uid: string): Promise<Record<string, SubscriptionData>> {
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  const subscriptionsRef = firestore
    .collection('users')
    .doc(uid)
    .collection('subscriptions');

  const snapshot = await subscriptionsRef.get();
  const subscriptions: Record<string, SubscriptionData> = {};

  snapshot.forEach((doc) => {
    subscriptions[doc.id] = doc.data() as SubscriptionData;
  });

  return subscriptions;
}

export async function setCustomClaims(uid: string, claims: { plan?: Plan; stripeCustomerId?: string }): Promise<void> {
  if (!auth) {
    throw new Error('Auth not initialized');
  }

  await auth.setCustomUserClaims(uid, claims);
}

export async function refreshTokenHint(uid: string): Promise<void> {
  if (!auth) {
    throw new Error('Auth not initialized');
  }

  // Force token refresh by updating a temporary claim
  const user = await auth.getUser(uid);
  const currentClaims = user.customClaims || {};
  await auth.setCustomUserClaims(uid, { ...currentClaims, _refresh: Date.now() });

  // Clean up the temporary claim
  setTimeout(async () => {
    if (auth) {
      await auth.setCustomUserClaims(uid, currentClaims);
    }
  }, 1000);
}