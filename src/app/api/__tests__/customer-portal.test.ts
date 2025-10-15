import { NextRequest } from 'next/server';
import { POST } from '../customer-portal/route';

jest.mock('../../../lib/stripe', () => ({
  stripe: {
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock('../../../lib/firebaseAdmin', () => ({
  auth: {
    getUser: jest.fn(),
  },
  firestore: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  },
}));

const { stripe } = require('../../../lib/stripe');
const { auth, firestore } = require('../../../lib/firebaseAdmin');

describe('/api/customer-portal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful user verification
    auth.getUser.mockResolvedValue({ uid: 'user123', email: 'test@example.com' });
    // Mock Firestore user data with stripeCustomerId
    const mockUserDoc = {
      exists: true,
      data: jest.fn(() => ({ stripeCustomerId: 'cus_test_123' })),
    };
    firestore.collection.mockReturnValue({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockUserDoc),
      })),
    });
  });

  it('should create a customer portal session', async () => {
    const mockSession = { url: 'https://billing.stripe.com/session/test_session' };
    stripe.billingPortal.sessions.create.mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/customer-portal', {
      method: 'POST',
      body: JSON.stringify({ uid: 'user123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://billing.stripe.com/session/test_session');
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_test_123',
      return_url: expect.stringContaining('/dashboard'),
    });
  });

  it('should return 400 for missing uid', async () => {
    const request = new NextRequest('http://localhost:3000/api/customer-portal', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('User ID is required');
  });

  it('should return 500 for non-existent user', async () => {
    auth.getUser.mockRejectedValue(new Error('User not found'));

    const request = new NextRequest('http://localhost:3000/api/customer-portal', {
      method: 'POST',
      body: JSON.stringify({ uid: 'nonexistent' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should return 400 for user without Stripe customer', async () => {
    const mockUserDoc = {
      get: jest.fn().mockResolvedValue({
        data: () => ({}), // No stripeCustomerId
      }),
    };
    firestore.collection.mockReturnValue({
      doc: jest.fn(() => mockUserDoc),
    });

    const request = new NextRequest('http://localhost:3000/api/customer-portal', {
      method: 'POST',
      body: JSON.stringify({ uid: 'user123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No Stripe customer found for this user');
  });

  it('should handle Stripe errors', async () => {
    stripe.billingPortal.sessions.create.mockRejectedValue(new Error('Stripe error'));

    const request = new NextRequest('http://localhost:3000/api/customer-portal', {
      method: 'POST',
      body: JSON.stringify({ uid: 'user123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});