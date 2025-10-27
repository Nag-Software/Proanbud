import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const { type, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Simulate different webhook events
    const webhookEvents: Record<string, any> = {
      'customer.subscription.created': {
        id: `evt_${Date.now()}`,
        type: 'customer.subscription.created',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `sub_${Date.now()}`,
            customer: `cus_${Date.now()}`,
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
            items: {
              data: [{
                price: {
                  id: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID || 'price_test',
                  recurring: { interval: 'month' }
                }
              }]
            }
          }
        },
        processed: true
      },
      'customer.subscription.updated': {
        id: `evt_${Date.now()}`,
        type: 'customer.subscription.updated',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `sub_${Date.now()}`,
            customer: `cus_${Date.now()}`,
            status: 'active',
            cancel_at_period_end: true,
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
          }
        },
        processed: true
      },
      'customer.subscription.deleted': {
        id: `evt_${Date.now()}`,
        type: 'customer.subscription.deleted',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `sub_${Date.now()}`,
            customer: `cus_${Date.now()}`,
            status: 'canceled'
          }
        },
        processed: true
      },
      'invoice.payment_succeeded': {
        id: `evt_${Date.now()}`,
        type: 'invoice.payment_succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `in_${Date.now()}`,
            customer: `cus_${Date.now()}`,
            amount_paid: 29900, // 299 NOK
            currency: 'nok',
            status: 'paid',
            subscription: `sub_${Date.now()}`
          }
        },
        processed: true
      },
      'invoice.payment_failed': {
        id: `evt_${Date.now()}`,
        type: 'invoice.payment_failed',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `in_${Date.now()}`,
            customer: `cus_${Date.now()}`,
            amount_due: 29900,
            currency: 'nok',
            status: 'open',
            subscription: `sub_${Date.now()}`
          }
        },
        processed: false,
        error: 'Payment failed due to insufficient funds'
      },
      'customer.created': {
        id: `evt_${Date.now()}`,
        type: 'customer.created',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `cus_${Date.now()}`,
            email: 'test@proanbud.no',
            created: Math.floor(Date.now() / 1000)
          }
        },
        processed: true
      },
      'customer.updated': {
        id: `evt_${Date.now()}`,
        type: 'customer.updated',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `cus_${Date.now()}`,
            email: 'test@proanbud.no',
            name: 'Test Customer'
          }
        },
        processed: true
      },
      'payment_method.attached': {
        id: `evt_${Date.now()}`,
        type: 'payment_method.attached',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: `pm_${Date.now()}`,
            customer: `cus_${Date.now()}`,
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242'
            }
          }
        },
        processed: true
      }
    };

    const eventData = webhookEvents[type];
    if (!eventData) {
      return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    // Store the simulated webhook event
    const webhookRef = ref(db, `users/${userId}/webhook_events/${eventData.id}`);
    await set(webhookRef, eventData);

    return NextResponse.json({ 
      success: true, 
      eventId: eventData.id,
      message: `Simulated ${type} webhook event` 
    });

  } catch (error) {
    console.error('Error simulating webhook:', error);
    return NextResponse.json({ 
      error: 'Failed to simulate webhook event',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}