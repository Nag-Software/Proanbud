import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ 
        error: 'Stripe secret key not configured',
        valid: false 
      }, { status: 400 });
    }

    try {
      const StripeClass = await import('stripe');
      const stripe = new StripeClass.default(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-09-30.clover'
      });
      
      try {
        const price = await stripe.prices.retrieve(priceId);
        
        return NextResponse.json({
          valid: true,
          price: {
            id: price.id,
            active: price.active,
            currency: price.currency,
            unit_amount: price.unit_amount,
            type: price.type,
            recurring: price.recurring,
            product: price.product,
            created: price.created,
            nickname: price.nickname
          }
        });

      } catch (stripeError: any) {
        return NextResponse.json({
          valid: false,
          error: stripeError.message || 'Invalid price ID',
          type: stripeError.type || 'unknown_error'
        }, { status: 400 });
      }

    } catch (importError) {
      return NextResponse.json({
        valid: false,
        error: 'Stripe package not installed. Run: pnpm add stripe'
      }, { status: 400 });
    }  } catch (error) {
    console.error('Error validating price:', error);
    return NextResponse.json({ 
      valid: false,
      error: 'Failed to validate price',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}