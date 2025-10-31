import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    // Get price IDs from environment variables
    const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID;
    const proPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
    const basicYearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID;
    const proYearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID;

    if (!basicPriceId || !proPriceId) {
      return NextResponse.json(
        { error: 'Stripe price IDs not configured' },
        { status: 500 }
      );
    }

    // Fetch all price objects from Stripe
    const priceIds = [basicPriceId, proPriceId];
    if (basicYearlyPriceId) priceIds.push(basicYearlyPriceId);
    if (proYearlyPriceId) priceIds.push(proYearlyPriceId);

    const prices = await Promise.all(
      priceIds.map(priceId => stripe.prices.retrieve(priceId))
    );

    // Transform the data to match our expected format
    const priceData: Record<string, any> = {};

    prices.forEach((price) => {
      const amount = price.unit_amount || 0; // Amount in cents/øre
      const amountInNOK = amount / 100; // Convert to NOK

      if (price.id === basicPriceId) {
        priceData.basic = {
          monthly: amountInNOK,
          yearly: amountInNOK * 12 // This will be overridden if yearly price exists
        };
      } else if (price.id === proPriceId) {
        priceData.pro = {
          monthly: amountInNOK,
          yearly: amountInNOK * 12 // This will be overridden if yearly price exists
        };
      } else if (price.id === basicYearlyPriceId) {
        if (priceData.basic) {
          priceData.basic.yearly = amountInNOK;
        }
      } else if (price.id === proYearlyPriceId) {
        if (priceData.pro) {
          priceData.pro.yearly = amountInNOK;
        }
      }
    });

    return NextResponse.json({
      success: true,
      prices: priceData
    });

  } catch (error: any) {
    console.error('Error fetching prices from Stripe:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices from Stripe', details: error.message },
      { status: 500 }
    );
  }
}