import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { auth, firestore } from '../../../lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists
    const user = await auth?.getUser(uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get customer ID from Firestore
    const userDoc = await firestore?.collection('users').doc(uid).get();
    const userData = userDoc?.data();

    if (!userData?.stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found for this user' }, { status: 400 });
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}