import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe';
import { firestore } from '../../../lib/firebaseAdmin';
import { upsertSubscription, updateUserStripeCustomerId } from '../../../utils/subscription';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature') as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    // Check for duplicate events
    if (firestore) {
      const eventRef = firestore.collection('webhook_events').doc(event.id);
      const eventDoc = await eventRef.get();

      if (eventDoc.exists) {
        console.log('Duplicate webhook event:', event.id);
        return NextResponse.json({ received: true });
      }

      // Mark event as processed
      await eventRef.set({ processedAt: new Date() });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const uid = session.metadata?.uid;
  if (!uid || !session.customer) {
    console.error('Missing uid or customer in checkout session');
    return;
  }

  // Store customer ID on user doc
  await updateUserStripeCustomerId(uid, session.customer as string);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  if (!firestore) return;

  // Find user by customer ID
  const usersRef = firestore.collection('users');
  const userQuery = usersRef.where('stripeCustomerId', '==', subscription.customer);
  const userSnapshot = await userQuery.get();

  if (userSnapshot.empty) {
    console.error('User not found for customer:', subscription.customer);
    return;
  }

  const uid = userSnapshot.docs[0].id;

  // Get price ID from subscription
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  // Upsert subscription document
  await upsertSubscription(uid, subscription.id, {
    priceId,
    status: subscription.status || 'incomplete',
    current_period_end: (subscription as any).current_period_end,
    cancel_at_period_end: (subscription as any).cancel_at_period_end,
    trial_end: (subscription as any).trial_end,
    latest_invoice_id: typeof (subscription as any).latest_invoice === 'string'
      ? (subscription as any).latest_invoice
      : (subscription as any).latest_invoice?.id,
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!firestore) return;

  // Find subscription and update latest_invoice_id
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  // Find user by customer ID
  const usersRef = firestore.collection('users');
  const userQuery = usersRef.where('stripeCustomerId', '==', invoice.customer);
  const userSnapshot = await userQuery.get();

  if (userSnapshot.empty) {
    console.error('User not found for customer:', invoice.customer);
    return;
  }

  const uid = userSnapshot.docs[0].id;

  await upsertSubscription(uid, subscriptionId, {
    latest_invoice_id: invoice.id,
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!firestore) return;

  // Find subscription and mark as past_due or similar
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  // Find user by customer ID
  const usersRef = firestore.collection('users');
  const userQuery = usersRef.where('stripeCustomerId', '==', invoice.customer);
  const userSnapshot = await userQuery.get();

  if (userSnapshot.empty) {
    console.error('User not found for customer:', invoice.customer);
    return;
  }

  const uid = userSnapshot.docs[0].id;

  await upsertSubscription(uid, subscriptionId, {
    status: 'past_due',
    latest_invoice_id: invoice.id,
  });
}