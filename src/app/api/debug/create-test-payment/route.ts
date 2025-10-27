import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, currency, status } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const paymentId = `test_payment_${Date.now()}`;
    const paymentData = {
      id: paymentId,
      amount: amount || 29900, // Default to 299 NOK
      currency: currency || 'nok',
      status: status || 'succeeded',
      created: Math.floor(Date.now() / 1000),
      description: `Test payment created by debug tool`,
      customer: `test_customer_${userId}`,
      payment_method: 'pm_test_card',
      metadata: {
        source: 'debug-tool',
        test: true
      }
    };

    // Store in multiple locations for compatibility
    const locations = [
      `stripe_customers/${userId}/payments/${paymentId}`,
      `payments/${userId}/${paymentId}`,
      `users/${userId}/payments/${paymentId}`
    ];

    for (const location of locations) {
      const paymentRef = ref(db, location);
      await set(paymentRef, paymentData);
    }

    // If it's a failed payment, also create an error record
    if (status === 'failed') {
      const errorData = {
        payment_id: paymentId,
        error_code: 'card_declined',
        error_message: 'Your card was declined.',
        created: Math.floor(Date.now() / 1000)
      };
      
      const errorRef = ref(db, `users/${userId}/payment_errors/${paymentId}`);
      await set(errorRef, errorData);
    }

    return NextResponse.json({ 
      success: true, 
      paymentId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      status: paymentData.status,
      message: `Test payment created successfully` 
    });

  } catch (error) {
    console.error('Error creating test payment:', error);
    return NextResponse.json({ 
      error: 'Failed to create test payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}