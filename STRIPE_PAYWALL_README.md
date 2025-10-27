# Stripe Paywall Setup

## Environment Variables

Set the following environment variables:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
PRICE_BASIC_ID=price_...
PRICE_PRO_ID=price_...

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_JSON='{...}' # or
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/key.json
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://...

# Next.js
NEXT_PUBLIC_DOMAIN=http://localhost:3000
```

## Running Tests

```bash
# Unit tests
npm test

# Integration tests (requires test Stripe keys)
npm test -- --testPathPattern=integration

# Watch mode
npm run test:watch
```

## Webhook Configuration

Configure the webhook endpoint in Stripe Dashboard:
- URL: `https://yourdomain.com/api/webhook`
- Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

## Testing Locally

Use Stripe CLI for local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```