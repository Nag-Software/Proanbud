import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateUserSubscription, storeInvoice, isAdminAvailable } from '@/lib/firebaseAdmin';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error('Stripe or webhook secret not configured');
    return NextResponse.json(
      { error: 'Stripe webhook not configured' },
      { status: 500 }
    );
  }

  if (!isAdminAvailable()) {
    console.error('Firebase Admin SDK not available');
    return NextResponse.json(
      { error: 'Firebase Admin SDK not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const firebaseUserId = session.metadata?.firebaseUserId;

        if (!firebaseUserId) {
          console.error('No Firebase user ID in session metadata');
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        
        const subAny = subscription as any;

        // Determine plan based on price ID
        const priceId = subscription.items.data[0].price.id;
        let plan: 'free' | 'basic' | 'pro' = 'free';
        
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
          plan = 'basic';
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
          plan = 'pro';
        }

        // Update user's subscription in Firebase using Admin SDK
        // Use new API fields: start_date and billing_cycle_anchor
        await updateUserSubscription(firebaseUserId, {
          plan,
          status: subscription.status,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          currentPeriodEnd: subAny.billing_cycle_anchor,
          currentPeriodStart: subAny.start_date || subAny.created,
          cancelAtPeriodEnd: subAny.cancel_at_period_end || false,
        });

        console.log(`✅ Subscription created for user ${firebaseUserId} - Plan: ${plan}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const subAny = subscription as any;
        const firebaseUserId = subscription.metadata?.firebaseUserId;

        if (!firebaseUserId) {
          console.error('No Firebase user ID in subscription metadata');
          break;
        }

        // Determine plan based on price ID
        const priceId = subscription.items.data[0].price.id;
        let plan: 'free' | 'basic' | 'pro' = 'free';
        
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
          plan = 'basic';
        } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
          plan = 'pro';
        }

        // Update subscription status in Firebase using Admin SDK
        // Use new API fields: start_date and billing_cycle_anchor
        await updateUserSubscription(firebaseUserId, {
          plan,
          status: subscription.status,
          stripePriceId: priceId,
          currentPeriodEnd: subAny.billing_cycle_anchor,
          currentPeriodStart: subAny.start_date || subAny.created,
          cancelAtPeriodEnd: subAny.cancel_at_period_end || false,
        });

        console.log(`✅ Subscription updated for user ${firebaseUserId} - Plan: ${plan}, Status: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const firebaseUserId = subscription.metadata?.firebaseUserId;

        if (!firebaseUserId) {
          console.error('No Firebase user ID in subscription metadata');
          break;
        }

        // Update subscription to free plan using Admin SDK
        await updateUserSubscription(firebaseUserId, {
          plan: 'free',
          status: 'canceled',
          cancelAtPeriodEnd: false,
        });

        console.log(`✅ Subscription canceled for user ${firebaseUserId} - Reset to free plan`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceAny = invoice as any;
        
        let firebaseUserId = invoiceAny.subscription_details?.metadata?.firebaseUserId;

        // Try to get user ID from subscription if not in invoice metadata
        if (!firebaseUserId && invoiceAny.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoiceAny.subscription as string
          );
          firebaseUserId = subscription.metadata?.firebaseUserId;
        }

        if (!firebaseUserId) {
          console.error('No Firebase user ID found for invoice');
          break;
        }

        // Store invoice in Firebase using Admin SDK
        if (invoice.id && typeof invoice.id === 'string') {
          await storeInvoice(firebaseUserId, invoice.id, {
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status || 'paid',
            paidAt: invoice.status_transitions?.paid_at ?? undefined,
            invoiceUrl: invoice.hosted_invoice_url ?? undefined,
            invoicePdf: invoice.invoice_pdf ?? undefined,
          });

          console.log(`✅ Invoice payment succeeded for user ${firebaseUserId} - Invoice: ${invoice.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceAny = invoice as any;

        if (invoiceAny.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoiceAny.subscription as string
          );
          const firebaseUserId = subscription.metadata?.firebaseUserId;

          if (firebaseUserId && invoice.id && typeof invoice.id === 'string') {
            // Store failed invoice in Firebase using Admin SDK
            await storeInvoice(firebaseUserId, invoice.id, {
              amount: invoice.amount_due,
              currency: invoice.currency,
              status: 'failed',
              invoiceUrl: invoice.hosted_invoice_url ?? undefined,
              invoicePdf: invoice.invoice_pdf ?? undefined,
            });

            console.log(`⚠️ Invoice payment failed for user ${firebaseUserId} - Invoice: ${invoice.id}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
