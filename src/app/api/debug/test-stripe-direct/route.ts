import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if Stripe is properly configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID;
    
    if (!stripeSecretKey) {
      return NextResponse.json({ 
        error: 'Stripe secret key not configured',
        configured: false 
      });
    }

    // Import Stripe dynamically
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });

    // Test the connection and verify the price exists
    const priceCheck = await stripe.prices.retrieve(basicPriceId || '');
    
    return NextResponse.json({
      configured: true,
      stripeConnected: true,
      priceExists: !!priceCheck,
      price: priceCheck,
      environment: stripeSecretKey.startsWith('sk_test') ? 'test' : 'live'
    });

  } catch (error: any) {
    console.error('Stripe test error:', error);
    return NextResponse.json({
      configured: true,
      stripeConnected: false,
      error: error.message,
      type: error.type || 'unknown'
    });
  }
}