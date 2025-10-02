import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Validate Stripe configuration
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not configured');
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to .env.local' },
      { status: 500 }
    );
  }
  try {
    const { priceId, userId, email } = await req.json();

    if (!priceId || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    let customer: Stripe.Customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: {
          firebaseUserId: userId,
        },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/innstillinger?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/innstillinger?canceled=true`,
      metadata: {
        firebaseUserId: userId,
      },
      subscription_data: {
        metadata: {
          firebaseUserId: userId,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
