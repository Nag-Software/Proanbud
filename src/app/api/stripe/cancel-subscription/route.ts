import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

    // Get user data from Firebase
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = snapshot.val();

    if (!userData.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 400 }
      );
    }

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(
      userData.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      }
    );

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      currentPeriodEnd: (subscription as any).current_period_end,
    });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
