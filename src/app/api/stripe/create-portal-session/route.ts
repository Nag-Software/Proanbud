import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customer ID' },
        { status: 400 }
      );
    }

    // Create a portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/innstillinger`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
