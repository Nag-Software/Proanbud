import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import * as admin from 'firebase-admin';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (!adminAuth) {
      console.error('❌ Firebase Admin auth not available');
      return NextResponse.json({
        error: 'Firebase Admin authentication not available. Please check server configuration.'
      }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    console.log('🔍 Verifying checkout session:', sessionId);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('📋 Session status:', session.payment_status);
    console.log('📋 Session mode:', session.mode);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ 
        error: 'Session not paid', 
        status: session.payment_status 
      }, { status: 400 });
    }

    if (session.mode !== 'subscription') {
      return NextResponse.json({ 
        error: 'Not a subscription session', 
        mode: session.mode 
      }, { status: 400 });
    }

    // Verify this session belongs to the authenticated user
    let sessionUserId = session.metadata?.firebase_uid;
    console.log('📋 Session metadata firebase_uid:', sessionUserId);
    console.log('📋 Authenticated userId:', userId);
    
    // If session metadata doesn't have firebase_uid, try to get it from customer metadata
    if (!sessionUserId && session.customer) {
      try {
        const customer = await stripe.customers.retrieve(session.customer as string);
        sessionUserId = customer.metadata?.firebaseUID;
        console.log('📋 Customer metadata:', customer.metadata);
        console.log('📋 Got firebase_uid from customer metadata:', sessionUserId);
      } catch (error) {
        console.error('❌ Failed to retrieve customer:', error);
      }
    }
    
    console.log('📋 Final sessionUserId:', sessionUserId);
    console.log('📋 Comparison:', sessionUserId, '===', userId, '?', sessionUserId === userId);
    
    if (sessionUserId !== userId) {
      return NextResponse.json({ 
        error: 'Session does not belong to authenticated user' 
      }, { status: 403 });
    }

    // Get the subscription ID from the session
    const subscriptionId = session.subscription;
    if (!subscriptionId) {
      return NextResponse.json({ 
        error: 'No subscription ID in session' 
      }, { status: 400 });
    }

    console.log('📦 Subscription ID:', subscriptionId);

    // Fetch the full subscription object from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Determine plan from price ID
    const priceId = subscription.items.data[0]?.price?.id;
    let plan = 'standard'; // default
    
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
      plan = 'proff';
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
      plan = 'standard';
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

    // Ensure subscription data is in Firestore for client access
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

      await admin.firestore().doc(`users/${userId}/subscriptions/${subscription.id}`).set(firestoreData);
      console.log('✅ Subscription data written to Firestore');
    } catch (firestoreError) {
      console.error('❌ Failed to write subscription to Firestore:', firestoreError);
      // Continue anyway, as the extension might handle it
    }    // Note: Subscription data is automatically managed by Stripe Firestore extension
    // No need to manually store in Realtime Database

    console.log(`✅ Subscription verified for user ${userId} - Plan: ${plan}`);

    return NextResponse.json({
      success: true,
      subscription: subscriptionData,
      message: `Subscription activated: ${plan} plan`
    });

  } catch (error: any) {
    console.error('❌ Error verifying session:', error);
    return NextResponse.json({
      error: 'Failed to verify session',
      details: error.message
    }, { status: 500 });
  }
}