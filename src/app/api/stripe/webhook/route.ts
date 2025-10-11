import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') as string;

    if (!signature) {
      console.error('❌ No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`🔔 Received webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`🔕 Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log('🔍 Verifying checkout session:', session.id);
    console.log('📋 Session status:', session.payment_status);
    console.log('📋 Session mode:', session.mode);

    if (session.payment_status !== 'paid') {
      console.log('⚠️ Session not paid yet, skipping');
      return;
    }

    if (session.mode !== 'subscription') {
      console.log('⚠️ Not a subscription session, skipping');
      return;
    }

    // Get the subscription ID from the session
    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      console.error('❌ No subscription ID in session');
      return;
    }

    console.log('📦 Subscription ID:', subscriptionId);

    // Fetch the full subscription object from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Get Firebase UID from metadata
    const firebaseUid = session.metadata?.firebase_uid;
    if (!firebaseUid) {
      console.error('❌ No Firebase UID in session metadata');
      return;
    }

    // Determine plan from price ID
    const priceId = subscription.items.data[0]?.price?.id;
    let plan = 'basic'; // default
    
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
      plan = 'pro';
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
      plan = 'basic';
    }

    console.log('📋 Determined plan:', plan);

    const subscriptionData = {
      plan: plan,
      status: subscription.status,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: subscription.current_period_start || Math.floor(Date.now() / 1000),
      currentPeriodEnd: subscription.current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    console.log('📋 Subscription details:', subscriptionData);

    // Note: Subscription data is automatically managed by Stripe Firestore extension
    // No need to manually store in Realtime Database

    console.log(`✅ Subscription verified for user ${firebaseUid} - Plan: ${plan}`);

  } catch (error: any) {
    console.error('❌ Error handling checkout session completed:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log('🆕 Handling subscription created:', subscription.id);
    
    // Get customer to find Firebase UID
    const customer = await stripe.customers.retrieve(subscription.customer);
    const firebaseUid = customer.metadata?.firebase_uid;
    
    if (!firebaseUid) {
      console.error('❌ No Firebase UID in customer metadata');
      return;
    }

    // Determine plan from price ID
    const priceId = subscription.items.data[0]?.price?.id;
    let plan = 'basic';
    
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
      plan = 'pro';
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
      plan = 'basic';
    }

    const subscriptionData = {
      plan: plan,
      status: subscription.status,
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: subscription.current_period_start || Math.floor(Date.now() / 1000),
      currentPeriodEnd: subscription.current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Note: Subscription data is automatically managed by Stripe Firestore extension
    // No need to manually store in Realtime Database

    console.log(`✅ Subscription created for user ${firebaseUid} - Plan: ${plan}`);

  } catch (error: any) {
    console.error('❌ Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('🔄 Handling subscription updated:', subscription.id);
    
    const customer = await stripe.customers.retrieve(subscription.customer);
    const firebaseUid = customer.metadata?.firebase_uid;
    
    if (!firebaseUid) {
      console.error('❌ No Firebase UID in customer metadata');
      return;
    }

    // Get current subscription data from Firebase
    const subscriptionRef = ref(db, `users/${firebaseUid}/subscription`);
    
    // Update subscription data
    const subscriptionData = {
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start || Math.floor(Date.now() / 1000),
      currentPeriodEnd: subscription.current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      updatedAt: Date.now(),
    };

    // Note: Subscription data is automatically managed by Stripe Firestore extension
    // No need to manually store in Realtime Database

    console.log(`✅ Subscription updated for user ${firebaseUid}`);

  } catch (error: any) {
    console.error('❌ Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    console.log('🗑️ Handling subscription deleted:', subscription.id);
    
    const customer = await stripe.customers.retrieve(subscription.customer);
    const firebaseUid = customer.metadata?.firebase_uid;
    
    if (!firebaseUid) {
      console.error('❌ No Firebase UID in customer metadata');
      return;
    }

    // Update subscription to canceled status
    const subscriptionRef = ref(db, `users/${firebaseUid}/subscription`);
    const subscriptionData = {
      plan: 'free',
      status: 'canceled',
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    };

    // Note: Subscription data is automatically managed by Stripe Firestore extension
    // No need to manually store in Realtime Database

    console.log(`✅ Subscription canceled for user ${firebaseUid}`);

  } catch (error: any) {
    console.error('❌ Error handling subscription deleted:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    console.log('💳 Handling successful payment for invoice:', invoice.id);
    
    if (!invoice.subscription) {
      console.log('⚠️ Invoice not associated with subscription, skipping');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customer = await stripe.customers.retrieve(subscription.customer);
    const firebaseUid = customer.metadata?.firebase_uid;
    
    if (!firebaseUid) {
      console.error('❌ No Firebase UID in customer metadata');
      return;
    }

    // Update subscription status to ensure it's active
    const subscriptionRef = ref(db, `users/${firebaseUid}/subscription`);
    const subscriptionData = {
      status: 'active',
      currentPeriodStart: subscription.current_period_start || Math.floor(Date.now() / 1000),
      currentPeriodEnd: subscription.current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      updatedAt: Date.now(),
    };

    // Note: Subscription data is automatically managed by Stripe Firestore extension
    // No need to manually store in Realtime Database

    console.log(`✅ Payment processed for user ${firebaseUid}`);

  } catch (error: any) {
    console.error('❌ Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  try {
    console.log('❌ Handling failed payment for invoice:', invoice.id);
    
    if (!invoice.subscription) {
      console.log('⚠️ Invoice not associated with subscription, skipping');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customer = await stripe.customers.retrieve(subscription.customer);
    const firebaseUid = customer.metadata?.firebase_uid;
    
    if (!firebaseUid) {
      console.error('❌ No Firebase UID in customer metadata');
      return;
    }

    // Update subscription status
    const subscriptionRef = ref(db, `users/${firebaseUid}/subscription`);
    const subscriptionData = {
      status: subscription.status, // Could be 'past_due' or other status
      updatedAt: Date.now(),
    };

    // Note: Subscription data is automatically managed by Stripe Firestore extension
    // No need to manually store in Realtime Database

    console.log(`⚠️ Payment failed for user ${firebaseUid}, status: ${subscription.status}`);

  } catch (error: any) {
    console.error('❌ Error handling invoice payment failed:', error);
  }
}