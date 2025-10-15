import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPriceIdFromPlan } from '../../../lib/stripe';
import { auth, firestore } from '../../../lib/firebaseAdmin';
import { updateUserStripeCustomerId } from '../../../utils/subscription';

export async function POST(request: NextRequest) {
  try {
    const { priceId, plan, uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists
    const user = await auth?.getUser(uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create priceId
    let finalPriceId = priceId;
    if (!finalPriceId && plan) {
      finalPriceId = getPriceIdFromPlan(plan);
    }

    if (!finalPriceId) {
      return NextResponse.json({ error: 'Price ID or plan is required' }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId: string;

    // Check if user already has a customer ID
    const userDoc = await firestore?.collection('users').doc(uid).get();
    const userData = userDoc?.data();

    if (userData?.stripeCustomerId) {
      customerId = userData.stripeCustomerId;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { uid },
      });
      customerId = customer.id;

      // Store customer ID in Firestore
      await updateUserStripeCustomerId(uid, customerId);
    }

    // Create checkout session with idempotency key
    const idempotencyKey = `checkout_${uid}_${finalPriceId}_${Date.now()}`;

    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: finalPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?canceled=true`,
        metadata: { uid },
      },
      { idempotencyKey }
    );

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}