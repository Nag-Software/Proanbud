import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Import Stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
    });

    // Create or get customer
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: decodedToken.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
        console.log('📋 Found existing customer:', customer.id, 'metadata:', customer.metadata);
        // Update customer metadata if firebase_uid is missing
        if (!customer.metadata?.firebase_uid) {
          console.log('📋 Updating customer metadata to add firebase_uid');
          customer = await stripe.customers.update(customer.id, {
            metadata: {
              ...customer.metadata,
              firebase_uid: userId,
            },
          });
          console.log('📋 Updated customer metadata:', customer.metadata);
        }
      } else {
        customer = await stripe.customers.create({
          email: decodedToken.email || undefined,
          metadata: {
            firebase_uid: userId,
          },
        });
        console.log('📋 Created new customer:', customer.id, 'metadata:', customer.metadata);
      }
    } catch (error) {
      console.error('Error creating/finding customer:', error);
      return NextResponse.json({ error: 'Customer creation failed' }, { status: 500 });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.nextUrl.origin}/innstillinger?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/innstillinger?canceled=true`,
      allow_promotion_codes: true,
      metadata: {
        firebase_uid: userId,
      },
    });

    return NextResponse.json({
      id: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create checkout session',
    }, { status: 500 });
  }
}