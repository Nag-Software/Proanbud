import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, firestore, database } from '@/lib/firebaseAdmin';
import { stripe } from '@/lib/stripe';


export async function POST(request: NextRequest) {
  try {
    // Verify Firebase auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log('🔍 Sync requested for userId:', userId);

    if (!firestore) {
      return NextResponse.json({ error: 'Firestore not available' }, { status: 500 });
    }

    // Find user's customer ID by document ID (which should be the Firebase UID)
    console.log('🔍 Looking for user document with ID:', userId);
    const userDoc = await firestore.collection('users').doc(userId).get();
    console.log('🔍 User document exists:', userDoc.exists);

    let customerId: string | null = null;

    if (userDoc.exists) {
      const userData = userDoc.data();
      if (!userData) {
        return NextResponse.json({ error: 'User data not found' }, { status: 404 });
      }
      console.log('✅ User data found:', { hasStripeCustomerId: !!userData.stripeCustomerId, customerId: userData.stripeCustomerId });
      customerId = userData.stripeCustomerId;
    } else {
      console.log('ℹ️ User document does not exist yet - checking if user has subscriptions in Stripe by email');

      // Try to find customer by email if user document doesn't exist
      const decodedToken = await adminAuth.verifyIdToken(token);
      const userEmail = decodedToken.email;

      if (userEmail) {
        console.log('🔍 Looking for Stripe customer by email:', userEmail);
        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });

        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          console.log('✅ Found Stripe customer by email:', customerId);

          // Create the user document with the customer ID
          await firestore.collection('users').doc(userId).set({
            stripeCustomerId: customerId,
            email: userEmail,
            createdAt: new Date(),
          });
          console.log('✅ Created user document with stripeCustomerId');
        } else {
          console.log('❌ No Stripe customer found for email:', userEmail);
        }
      }
    }

    if (!customerId) {
      return NextResponse.json({
        error: 'No subscription data found. Please create a subscription first.',
        code: 'NO_SUBSCRIPTION'
      }, { status: 404 });
    }

    // Get all subscriptions for this customer from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all', // Get all statuses including canceled
      limit: 10,
    });

    console.log(`🔍 Found ${subscriptions.data.length} subscriptions for customer ${customerId}`);

    // Normalize timestamps (handle ms vs s), compute latest period end across subscriptions,
    // and perform a single reset decision per-user to avoid repeated/residual resets.
    const normalizeSeconds = (v: any) => {
      if (!v && v !== 0) return null;
      const n = Number(v);
      if (Number.isNaN(n)) return null;
      // If value looks like milliseconds, convert to seconds
      return n > 1e12 ? Math.floor(n / 1000) : n;
    };

    // Compute period starts and ends for each subscription
    const now = Math.floor(Date.now() / 1000);
    const periodStarts = subscriptions.data.map(sub => normalizeSeconds((sub as any).current_period_start) || now);
    const periodEnds = subscriptions.data.map(sub => normalizeSeconds((sub as any).current_period_end) || (now + (30 * 24 * 60 * 60)));
    // Choose the most recent period start and corresponding end
    const latestPeriodStart = periodStarts.length > 0 ? Math.max(...periodStarts) : now;
    const latestPeriodEnd = periodEnds.length > 0 ? Math.max(...periodEnds) : (now + (30 * 24 * 60 * 60));

    // Single check/reset using Realtime Database marker
    if (database) {
      try {
        const lastResetRef = database.ref(`users/${userId}/lastUsageResetPeriod`);
        const lastResetSnap = await lastResetRef.once('value');
        const lastResetPeriodRaw = lastResetSnap.exists() ? lastResetSnap.val() : null;
        const lastResetPeriod = lastResetPeriodRaw !== null ? Number(lastResetPeriodRaw) : null;

        console.log(`ℹ️ lastUsageResetPeriod for user ${userId}:`, lastResetPeriod, 'latestPeriodStart:', latestPeriodStart, 'now:', now);

        // Decision logic:
        // - If lastResetPeriod is in the future (> now), don't reset yet (it likely contains a period end marker).
        // - Otherwise, only reset when the billing period has started (now >= latestPeriodStart)
        //   and we haven't already reset during this period (latestPeriodStart > lastResetPeriod).
        const lastResetInFuture = lastResetPeriod !== null && lastResetPeriod > now;

        if (lastResetInFuture) {
          console.log(`Marker is in the future; skipping reset for user ${userId}. marker=${lastResetPeriod}`);
        } else {
          const shouldReset = (lastResetPeriod === null && now >= latestPeriodStart) || (lastResetPeriod !== null && latestPeriodStart > lastResetPeriod && now >= latestPeriodStart);

          if (shouldReset) {
            try {
              await database.ref(`users/${userId}/tilbudCount`).set(0);
              await database.ref(`users/${userId}/kunderCount`).set(0);
              // Record that we reset now (use current timestamp) to avoid future duplicate resets.
              await lastResetRef.set(now);
              console.log(`♻️ Reset tilbudCount and kunderCount for user ${userId} and recorded lastUsageResetPeriod=${now}`);
            } catch (dbErr) {
              console.error('Failed to write reset marker/counters for user', userId, dbErr);
            }
          } else {
            console.log(`No reset needed for user ${userId}. lastUsageResetPeriod=${lastResetPeriod}, latestPeriodStart=${latestPeriodStart}, now=${now}`);
          }
        }
      } catch (dbErr) {
        console.error('Failed to read/update realtime DB usage reset marker for user', userId, dbErr);
      }
    } else {
      console.warn('Realtime database not initialized; cannot check/reset usage counters for', userId);
    }

    // Update each subscription in Firestore
    for (const subscription of subscriptions.data) {
      const priceId = subscription.items.data[0]?.price.id;
      const plan = priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ? 'pro' :
                   priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID ? 'basic' : 'free';

      const newPeriodEndSeconds = normalizeSeconds((subscription as any).current_period_end) || Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

      const firestoreData = {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
        price: {
          id: priceId,
        },
        current_period_start: {
          seconds: normalizeSeconds((subscription as any).current_period_start) || Math.floor(Date.now() / 1000),
        },
        current_period_end: {
          seconds: newPeriodEndSeconds,
        },
        cancel_at_period_end: subscription.cancel_at_period_end,
        created: {
          seconds: subscription.created || Math.floor(Date.now() / 1000),
        },
        createdAt: subscription.created || Date.now(),
        updatedAt: Date.now(),
      };

      await firestore.doc(`users/${userId}/subscriptions/${subscription.id}`).set(firestoreData, { merge: true });
      console.log(`✅ Updated subscription ${subscription.id} with status: ${subscription.status}`);
    }

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_end: (sub as any).current_period_end,
      }))
    });

  } catch (error) {
    console.error('Error syncing subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}