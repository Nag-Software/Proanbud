import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Test basic environment variables
    const config = {
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      environment: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_test') ? 'test' : 'live',
      priceIds: {
        basicMonthly: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
        basicYearly: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID,
        proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        proYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
      }
    };

    // Test Firebase connection
    let firebaseConnected = false;
    try {
      const { db } = await import('@/lib/firebase');
      const { ref, get } = await import('firebase/database');
      
      const testRef = ref(db, '.info/connected');
      const snapshot = await get(testRef);
      firebaseConnected = true;
    } catch (error) {
      console.error('Firebase connection test failed:', error);
    }

    // Test Stripe connection if secret key is available
    let stripeConnected = false;
    let stripeError = null;
    
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        // Try to dynamically import stripe - if not available, catch and handle gracefully
        let stripe;
        try {
          const StripeClass = await import('stripe');
          stripe = new StripeClass.default(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2025-09-30.clover'
          });
        } catch (importError) {
          stripeError = 'Stripe package not installed. Run: pnpm add stripe';
          return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            config,
            connections: {
              firebase: {
                connected: firebaseConnected,
                status: firebaseConnected ? 'success' : 'error'
              },
              stripe: {
                connected: false,
                status: 'error',
                error: stripeError
              }
            },
            diagnostics: {
              configurationComplete: config.hasPublishableKey && config.hasSecretKey,
              priceIdsConfigured: Object.values(config.priceIds).some(id => !!id),
              webhookConfigured: config.hasWebhookSecret
            }
          });
        }
        
        await stripe.customers.list({ limit: 1 });
        stripeConnected = true;
      } catch (error) {
        stripeError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      config,
      connections: {
        firebase: {
          connected: firebaseConnected,
          status: firebaseConnected ? 'success' : 'error'
        },
        stripe: {
          connected: stripeConnected,
          status: stripeConnected ? 'success' : 'error',
          error: stripeError
        }
      },
      diagnostics: {
        configurationComplete: config.hasPublishableKey && config.hasSecretKey,
        priceIdsConfigured: Object.values(config.priceIds).some(id => !!id),
        webhookConfigured: config.hasWebhookSecret
      }
    });

  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}