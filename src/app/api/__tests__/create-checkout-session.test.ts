import { NextRequest } from 'next/server';
import { POST } from '../create-checkout-session/route';
import { createMocks } from 'node-mocks-http';

jest.mock('../../../lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    customers: {
      create: jest.fn(),
    },
  },
  PRICE_STANDARD_ID: 'price_standard_123',
  PRICE_PROFF_ID: 'price_proff_456',
  getPriceIdFromPlan: jest.fn((plan) => {
    if (plan === 'standard') return 'price_standard_123';
    if (plan === 'proff') return 'price_proff_456';
    return undefined;
  }),
}));

jest.mock('../../../lib/firebaseAdmin', () => ({
  auth: {
    getUser: jest.fn(),
  },
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
      })),
    })),
  },
}));

jest.mock('../../../utils/subscription', () => ({
  updateUserStripeCustomerId: jest.fn(),
}));

const { stripe, getPriceIdFromPlan } = require('../../../lib/stripe');
const { auth, firestore } = require('../../../lib/firebaseAdmin');
const { updateUserStripeCustomerId } = require('../../../utils/subscription');

describe('/api/create-checkout-session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful user verification
    auth.getUser.mockResolvedValue({ uid: 'user123', email: 'test@example.com' });
    // Mock Stripe customer creation
    stripe.customers.create.mockResolvedValue({ id: 'cus_test_123' });
    // Mock Firestore operations
    const mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({})), // No existing stripeCustomerId
    };
    const mockDoc = {
      get: jest.fn().mockResolvedValue(mockUserDoc),
      set: jest.fn(),
      update: jest.fn(),
    };
    firestore.collection.mockReturnValue({
      doc: jest.fn(() => mockDoc),
    });
    updateUserStripeCustomerId.mockResolvedValue(undefined);
  });

  it('should create a checkout session for standard plan', async () => {
    const mockSession = { id: 'cs_test_123', url: 'https://checkout.stripe.com/pay/cs_test_123' };
    stripe.checkout.sessions.create.mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan: 'standard', uid: 'user123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessionId).toBe('cs_test_123');
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      {
        customer: 'cus_test_123',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_standard_123',
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: 'http://localhost:3000/dashboard?success=true',
        cancel_url: 'http://localhost:3000/dashboard?canceled=true',
        metadata: { uid: 'user123' },
      },
      { idempotencyKey: expect.stringContaining('checkout_user123_price_standard_123_') }
    );
  });

  it('should create a checkout session for proff plan', async () => {
    const mockSession = { id: 'cs_test_456', url: 'https://checkout.stripe.com/pay/cs_test_456' };
    stripe.checkout.sessions.create.mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan: 'proff', uid: 'user456' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessionId).toBe('cs_test_456');
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      {
        customer: 'cus_test_123',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_pro_456',
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: 'http://localhost:3000/dashboard?success=true',
        cancel_url: 'http://localhost:3000/dashboard?canceled=true',
        metadata: { uid: 'user456' },
      },
      { idempotencyKey: expect.stringContaining('checkout_user456_price_pro_456_') }
    );
  });

  it('should return 400 for invalid plan', async () => {
    const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan: 'invalid', uid: 'user123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Price ID or plan is required');
  });

  it('should return 400 for missing uid', async () => {
    const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan: 'standard' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User ID is required');
  });

  it('should return 404 for non-existent user', async () => {
    auth.getUser.mockRejectedValue(new Error('User not found'));

    const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan: 'standard', uid: 'nonexistent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle Stripe errors', async () => {
    stripe.checkout.sessions.create.mockRejectedValue(new Error('Stripe error'));

    const request = new NextRequest('http://localhost:3000/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan: 'standard', uid: 'user123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});