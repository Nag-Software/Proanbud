import { NextRequest } from 'next/server';
import { POST } from '../webhook/route';

jest.mock('../../../lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
  STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
}));

jest.mock('../../../lib/firebaseAdmin', () => ({
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(() => ({
          empty: false,
          docs: [{ id: 'user123' }],
        })),
      })),
    })),
    runTransaction: jest.fn(),
  },
}));

jest.mock('../../../utils/subscription', () => ({
  upsertSubscription: jest.fn(),
  updateUserStripeCustomerId: jest.fn(),
}));

const { stripe } = require('../../../lib/stripe');
const { firestore } = require('../../../lib/firebaseAdmin');
const { upsertSubscription, updateUserStripeCustomerId } = require('../../../utils/subscription');

describe('/api/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set environment variable
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  it('should handle checkout.session.completed event', async () => {
    const mockEvent = {
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          client_reference_id: 'user123',
          customer: 'cus_test_456',
          subscription: 'sub_test_789',
          metadata: {
            uid: 'user123',
          },
        },
      },
    };

    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);
    firestore.collection.mockReturnValue({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn().mockResolvedValue({ exists: false }),
      })),
      where: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [{ id: 'user123' }],
        }),
      })),
    });

    const rawBody = JSON.stringify(mockEvent);
    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      body: rawBody,
      headers: {
        'stripe-signature': 't=123,v1=test_signature',
      },
    });

    // Mock the text method for webhook body
    Object.defineProperty(request, 'text', {
      value: jest.fn().mockResolvedValue(rawBody),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      rawBody,
      't=123,v1=test_signature',
      'whsec_test_secret'
    );
    expect(firestore.collection).toHaveBeenCalledWith('webhook_events');
  });

  it('should handle customer.subscription.updated event', async () => {
    const mockEvent = {
      id: 'evt_test_456',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test_789',
          customer: 'cus_test_456',
          status: 'active',
          current_period_start: 1234567890,
          current_period_end: 1234567890 + 30 * 24 * 60 * 60,
          items: {
            data: [
              {
                price: {
                  id: 'price_basic_123',
                },
              },
            ],
          },
        },
      },
    };

    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);
    firestore.collection.mockReturnValue({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn().mockResolvedValue({ exists: false }),
      })),
      where: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [{ id: 'user123' }],
        }),
      })),
    });
    upsertSubscription.mockResolvedValue(undefined);

    const rawBody = JSON.stringify(mockEvent);
    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      body: rawBody,
      headers: {
        'stripe-signature': 't=123,v1=test_signature',
      },
    });

    Object.defineProperty(request, 'text', {
      value: jest.fn().mockResolvedValue(rawBody),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(upsertSubscription).toHaveBeenCalledWith('user123', 'sub_test_789', {
      priceId: 'price_basic_123',
      status: 'active',
      current_period_end: 1237159890,
      cancel_at_period_end: undefined,
      trial_end: undefined,
      latest_invoice_id: undefined,
    });
  });

  it('should skip duplicate events', async () => {
    const mockEvent = {
      id: 'evt_test_duplicate',
      type: 'checkout.session.completed',
      data: { object: {} },
    };

    stripe.webhooks.constructEvent.mockReturnValue(mockEvent);
    firestore.collection.mockReturnValue({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ exists: true }),
      })),
      where: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [{ id: 'user123' }],
        }),
      })),
    });

    const rawBody = JSON.stringify(mockEvent);
    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      body: rawBody,
      headers: {
        'stripe-signature': 't=123,v1=test_signature',
      },
    });

    Object.defineProperty(request, 'text', {
      value: jest.fn().mockResolvedValue(rawBody),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(firestore.collection).toHaveBeenCalledWith('webhook_events');
    expect(upsertSubscription).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid signature', async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'stripe-signature': 'invalid_signature',
      },
    });

    Object.defineProperty(request, 'text', {
      value: jest.fn().mockResolvedValue(JSON.stringify({})),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('{"error":"Webhook signature verification failed"}');
  });

  it('should return 400 for missing stripe-signature header', async () => {
    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('{"error":"Webhook signature verification failed"}');
  });
});