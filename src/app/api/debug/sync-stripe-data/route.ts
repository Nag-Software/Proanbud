import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ 
        error: 'Stripe secret key not configured' 
      }, { status: 400 });
    }

    let stripe;
    try {
      const StripeClass = await import('stripe');
      stripe = new StripeClass.default(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-09-30.clover'
      });
    } catch (importError) {
      return NextResponse.json({ 
        error: 'Stripe package not installed. Run: pnpm add stripe'
      }, { status: 400 });
    }
    const syncResults: any = {
      timestamp: Date.now(),
      userId,
      synced: {},
      errors: []
    };

    try {
      // Get customer data from Stripe
      const customerRef = ref(db, `stripe_customers/${userId}`);
      const customerSnapshot = await get(customerRef);
      
      if (customerSnapshot.exists()) {
        const customerData = customerSnapshot.val();
        const stripeCustomerId = customerData.stripeId || customerData.id;

        if (stripeCustomerId) {
          try {
            // Sync customer data
            const customer = await stripe.customers.retrieve(stripeCustomerId);
            await set(ref(db, `stripe_customers/${userId}/customer_data`), {
              ...customer,
              synced_at: Date.now()
            });
            syncResults.synced.customer = true;

            // Sync subscriptions
            const subscriptions = await stripe.subscriptions.list({
              customer: stripeCustomerId,
              limit: 10
            });
            
            for (const subscription of subscriptions.data) {
              await set(ref(db, `stripe_customers/${userId}/subscriptions/${subscription.id}`), {
                ...subscription,
                synced_at: Date.now()
              });
            }
            syncResults.synced.subscriptions = subscriptions.data.length;

            // Sync payment methods
            const paymentMethods = await stripe.paymentMethods.list({
              customer: stripeCustomerId,
              type: 'card'
            });
            
            for (const paymentMethod of paymentMethods.data) {
              await set(ref(db, `stripe_customers/${userId}/payment_methods/${paymentMethod.id}`), {
                ...paymentMethod,
                synced_at: Date.now()
              });
            }
            syncResults.synced.paymentMethods = paymentMethods.data.length;

            // Sync invoices
            const invoices = await stripe.invoices.list({
              customer: stripeCustomerId,
              limit: 10
            });
            
            for (const invoice of invoices.data) {
              await set(ref(db, `stripe_customers/${userId}/invoices/${invoice.id}`), {
                ...invoice,
                synced_at: Date.now()
              });
            }
            syncResults.synced.invoices = invoices.data.length;

          } catch (stripeError: any) {
            syncResults.errors.push({
              type: 'stripe_api_error',
              message: stripeError.message
            });
          }
        } else {
          syncResults.errors.push({
            type: 'no_stripe_customer_id',
            message: 'No Stripe customer ID found in Firebase'
          });
        }
      } else {
        syncResults.errors.push({
          type: 'no_customer_data',
          message: 'No customer data found in Firebase'
        });
      }

      // Sync products (global data)
      try {
        const products = await stripe.products.list({ limit: 10, active: true });
        
        for (const product of products.data) {
          const prices = await stripe.prices.list({ 
            product: product.id, 
            active: true 
          });
          
          const productData = {
            ...product,
            prices: {} as Record<string, any>,
            synced_at: Date.now()
          };
          
          for (const price of prices.data) {
            productData.prices[price.id] = price;
          }
          
          await set(ref(db, `products/${product.id}`), productData);
        }
        
        syncResults.synced.products = products.data.length;
      } catch (error) {
        syncResults.errors.push({
          type: 'products_sync_error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }

    } catch (error) {
      syncResults.errors.push({
        type: 'general_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return NextResponse.json({
      success: syncResults.errors.length === 0,
      results: syncResults
    });

  } catch (error) {
    console.error('Error syncing Stripe data:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to sync Stripe data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}