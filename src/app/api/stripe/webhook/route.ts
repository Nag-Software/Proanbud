import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';
import * as admin from 'firebase-admin';

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

    console.log(`🔔 Received webhook: ${event.type} (ID: ${event.id})`);
    // console.log(`📋 Event data:`, JSON.stringify(event.data, null, 2));

    // Check for duplicate events to prevent double processing
    try {
      const duplicateCheck = await get(ref(db, `webhook_events/${event.id}`));
      if (duplicateCheck.exists()) {
        console.log(`⚠️ Duplicate webhook event: ${event.id}, skipping`);
        return NextResponse.json({ received: true, duplicate: true });
      }

      // Mark event as processed immediately
      await set(ref(db, `webhook_events/${event.id}`), {
        processedAt: new Date().toISOString(),
        type: event.type,
        stripeId: event.id
      });
      console.log(`✅ Marked webhook event ${event.id} as processed`);
    } catch (error) {
      console.error('❌ Failed to check/process duplicate webhook:', error);
      // Continue processing even if duplicate check fails
    }

    // Handle different event types with better error handling
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          console.log('💳 Processing checkout session completed');
          await handleCheckoutSessionCompleted(event.data.object);
          break;
        
        case 'customer.subscription.created':
          console.log('📝 Processing subscription created');
          await handleSubscriptionCreated(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          console.log('🔄 Processing subscription updated');
          await handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          console.log('🗑️ Processing subscription deleted');
          await handleSubscriptionDeleted(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          console.log('💰 Processing invoice payment succeeded');
          await handleInvoicePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          console.log('❌ Processing invoice payment failed');
          await handleInvoicePaymentFailed(event.data.object);
          break;
        
        default:
          console.log(`🔕 Unhandled event type: ${event.type}`);
      }
      
      console.log(`✅ Successfully processed webhook: ${event.type}`);
      return NextResponse.json({ received: true, processed: true });
      
    } catch (processingError) {
      console.error(`❌ Error processing webhook ${event.type}:`, processingError);
      
      // Mark the event as failed for potential retry
      try {
        await set(ref(db, `webhook_events/${event.id}`), {
          processedAt: new Date().toISOString(),
          type: event.type,
          stripeId: event.id,
          error: processingError instanceof Error ? processingError.message : 'Unknown error',
          failed: true
        });
      } catch (markError) {
        console.error('❌ Failed to mark webhook as failed:', markError);
      }
      
      return NextResponse.json({ 
        error: 'Processing failed', 
        eventId: event.id,
        eventType: event.type 
      }, { status: 500 });
    }

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

    // Save subscription data to Firestore for client access
    try {
      const firestoreData = {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        price: {
          id: priceId,
        },
        current_period_start: {
          seconds: subscription.current_period_start || Math.floor(Date.now() / 1000),
        },
        current_period_end: {
          seconds: subscription.current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        },
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        created: {
          seconds: subscription.created,
        },
        createdAt: subscription.created,
        updated: {
          seconds: Math.floor(Date.now() / 1000),
        },
      };

      await admin.firestore().doc(`users/${firebaseUid}/subscriptions/${subscription.id}`).set(firestoreData);
      console.log('✅ Subscription data written to Firestore');

      // Mark trial as used since user has subscribed to a paid plan
      try {
        await set(ref(db, `users/${firebaseUid}/trialUsed`), true);
        console.log('✅ Marked trial as used for user:', firebaseUid);
      } catch (trialError) {
        console.error('❌ Failed to mark trial as used:', trialError);
      }
    } catch (firestoreError) {
      console.error('❌ Failed to write subscription to Firestore:', firestoreError);
    }

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

    // Save subscription data to Firestore for client access
    try {
      const firestoreData = {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        price: {
          id: priceId,
        },
        current_period_start: {
          seconds: subscription.current_period_start || Math.floor(Date.now() / 1000),
        },
        current_period_end: {
          seconds: subscription.current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        },
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        created: {
          seconds: subscription.created,
        },
        createdAt: subscription.created,
        updated: {
          seconds: Math.floor(Date.now() / 1000),
        },
      };

      await admin.firestore().doc(`users/${firebaseUid}/subscriptions/${subscription.id}`).set(firestoreData);
      console.log('✅ Subscription data written to Firestore');
    } catch (firestoreError) {
      console.error('❌ Failed to write subscription to Firestore:', firestoreError);
    }

    console.log(`✅ Subscription created for user ${firebaseUid} - Plan: ${plan}`);

  } catch (error: any) {
    console.error('❌ Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('🔄 Handling subscription updated:', subscription.id);
    console.log('📋 Subscription status:', subscription.status);
    console.log('📋 Cancel at period end:', subscription.cancel_at_period_end);
    console.log('📋 Current period end:', subscription.current_period_end);
    
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

    // Update subscription data in Realtime Database
    try {
      await set(ref(db, `users/${firebaseUid}/subscription`), subscriptionData);
      console.log('✅ Subscription data updated in Realtime Database');
    } catch (realtimeError) {
      console.error('❌ Failed to update subscription in Realtime Database:', realtimeError);
    }

    // Save updated subscription data to Firestore
    try {
      const firestoreData = {
        status: subscription.status,
        current_period_start: {
          seconds: subscription.current_period_start || Math.floor(Date.now() / 1000),
        },
        current_period_end: {
          seconds: subscription.current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        },
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated: {
          seconds: Math.floor(Date.now() / 1000),
        },
      };

      await admin.firestore().doc(`users/${firebaseUid}/subscriptions/${subscription.id}`).set(firestoreData);
      console.log('✅ Subscription data updated in Firestore');
    } catch (firestoreError) {
      console.error('❌ Failed to update subscription in Firestore:', firestoreError);
    }

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
    const subscriptionData = {
      plan: 'free',
      status: 'canceled',
      cancelAtPeriodEnd: true,
      updatedAt: Date.now(),
    };

    // Update subscription data in Firestore
    try {
      const firestoreData = {
        status: 'canceled',
        cancel_at_period_end: true,
        updated: {
          seconds: Math.floor(Date.now() / 1000),
        },
      };

      await admin.firestore().doc(`users/${firebaseUid}/subscriptions/${subscription.id}`).update(firestoreData);
      console.log('✅ Subscription data updated in Firestore');
    } catch (firestoreError) {
      console.error('❌ Failed to update subscription in Firestore:', firestoreError);
    }

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
    const subscriptionData = {
      status: 'active',
      currentPeriodStart: subscription.current_period_start || Math.floor(Date.now() / 1000),
      currentPeriodEnd: subscription.current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      updatedAt: Date.now(),
    };

    // Update subscription data in Firestore
    try {
      const firestoreData = {
        status: 'active',
        current_period_start: {
          seconds: subscription.current_period_start || Math.floor(Date.now() / 1000),
        },
        current_period_end: {
          seconds: subscription.current_period_end || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        },
        updated: {
          seconds: Math.floor(Date.now() / 1000),
        },
      };

      await admin.firestore().doc(`users/${firebaseUid}/subscriptions/${subscription.id}`).update(firestoreData);
      console.log('✅ Subscription data updated in Firestore');
    } catch (firestoreError) {
      console.error('❌ Failed to update subscription in Firestore:', firestoreError);
    }

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
    const subscriptionData = {
      status: subscription.status, // Could be 'past_due' or other status
      updatedAt: Date.now(),
    };

    // Update subscription data in Firestore
    try {
      const firestoreData = {
        status: subscription.status,
        updated: {
          seconds: Math.floor(Date.now() / 1000),
        },
      };

      await admin.firestore().doc(`users/${firebaseUid}/subscriptions/${subscription.id}`).update(firestoreData);
      console.log('✅ Subscription data updated in Firestore');
    } catch (firestoreError) {
      console.error('❌ Failed to update subscription in Firestore:', firestoreError);
    }

    console.log(`⚠️ Payment failed for user ${firebaseUid}, status: ${subscription.status}`);

  } catch (error: any) {
    console.error('❌ Error handling invoice payment failed:', error);
  }
}