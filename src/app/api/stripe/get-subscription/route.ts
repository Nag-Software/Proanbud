import { NextRequest, NextResponse } from 'next/server';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import Stripe from 'stripe';

// Validate Stripe configuration
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    // If Stripe is not configured, return free plan
    if (!stripe) {
      console.warn('Stripe not configured, returning free plan');
      return NextResponse.json({
        plan: 'free',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });
    }
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

    // Check if subscription exists in database (written by webhook)
    if (userData.subscription) {
      // Return subscription data from database
      return NextResponse.json({
        plan: userData.subscription.plan || 'free',
        status: userData.subscription.status || 'active',
        currentPeriodEnd: userData.subscription.currentPeriodEnd || null,
        currentPeriodStart: userData.subscription.currentPeriodStart || null,
        cancelAtPeriodEnd: userData.subscription.cancelAtPeriodEnd || false,
        stripeCustomerId: userData.subscription.stripeCustomerId,
      });
    }

    // If no subscription data in database, return free plan
    return NextResponse.json({
      plan: 'free',
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
  } catch (error: any) {
    console.error('Error getting subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
