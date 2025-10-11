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

    // Import Stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
    });

    // Find customer by email
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: decodedToken.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return NextResponse.json({ 
          error: 'No Stripe customer found. Please create a subscription first.' 
        }, { status: 404 });
      }

      customer = customers.data[0];
    } catch (error) {
      console.error('Error finding customer:', error);
      return NextResponse.json({ error: 'Failed to find customer' }, { status: 500 });
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${request.nextUrl.origin}/innstillinger`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });

  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create customer portal session',
    }, { status: 500 });
  }
}