import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateUserSubscription, isAdminAvailable } from '@/lib/firebaseAdmin';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    console.error('Stripe not configured');
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 }
    );
  }

  if (!isAdminAvailable()) {
    console.error('Firebase Admin SDK not available');
    return NextResponse.json(
      { error: 'Firebase Admin SDK not configured' },
      { status: 500 }
    );
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    console.log('🔍 Verifying checkout session:', sessionId);

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('📋 Session status:', session.payment_status);
    console.log('📋 Session mode:', session.mode);

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      console.log('⚠️ Payment not completed yet');
      return NextResponse.json(
        { error: 'Payment not completed', status: session.payment_status },
        { status: 400 }
      );
    }

    const firebaseUserId = session.metadata?.firebaseUserId;

    if (!firebaseUserId) {
      console.error('❌ No Firebase user ID in session metadata');
      return NextResponse.json(
        { error: 'No user ID in session metadata' },
        { status: 400 }
      );
    }

    // Get subscription ID from session
    const subscriptionId = session.subscription as string;

    if (!subscriptionId) {
      console.error('❌ No subscription found in session');
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }

    console.log('📦 Subscription ID:', subscriptionId);

    // Fetch the full subscription object
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // In Stripe API 2025-09-30.clover, the fields are:
    // - start_date: when subscription started
    // - billing_cycle_anchor: next billing date
    const subAny: any = subscription;
    const currentPeriodStart = subAny.start_date || subAny.created;
    const currentPeriodEnd = subAny.billing_cycle_anchor;
    
    console.log('� Billing periods:');
    console.log('   - currentPeriodStart:', currentPeriodStart, new Date(currentPeriodStart * 1000).toLocaleDateString());
    console.log('   - currentPeriodEnd (billing_cycle_anchor):', currentPeriodEnd, new Date(currentPeriodEnd * 1000).toLocaleDateString());

    // Determine plan based on price ID
    const priceId = subscription.items.data[0].price.id;
    let plan: 'free' | 'basic' | 'pro' = 'free';
    
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
      plan = 'basic';
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
      plan = 'pro';
    }

    console.log('📋 Determined plan:', plan);

    // Prepare subscription data with the new API fields
    const subscriptionData = {
      plan,
      status: subscription.status,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subAny.cancel_at_period_end || false,
    };

    console.log('📋 Data to save:', subscriptionData);

    // Update user's subscription in Firebase
    await updateUserSubscription(firebaseUserId, subscriptionData);

    console.log(`✅ Subscription verified and saved for user ${firebaseUserId} - Plan: ${plan}`);

    return NextResponse.json({
      success: true,
      plan,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('❌ Error verifying session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
