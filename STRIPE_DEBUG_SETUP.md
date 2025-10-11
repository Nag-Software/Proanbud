# Stripe Debug Tool Setup Instructions

## Issue: Stripe Package Missing

The debug tool requires the Stripe Node.js SDK to be installed. You're seeing this error because the `stripe` package is not in your dependencies.

## Quick Fix

Run this command to install the Stripe SDK:

```bash
pnpm add stripe
```

Or with npm:
```bash
npm install stripe
```

## Alternative: Without Stripe Package

If you prefer not to install the Stripe package, the debug tool will still work with limited functionality:

### What Works:
- ✅ Subscription status monitoring
- ✅ Firebase data inspection
- ✅ Usage limits debugging
- ✅ Webhook event viewing
- ✅ Payment history (from Firebase data)
- ✅ Configuration validation (basic)

### What's Limited:
- ❌ Direct Stripe API testing
- ❌ Price validation through Stripe API
- ❌ Real-time Stripe data synchronization
- ❌ Stripe connectivity testing

## Recommended Setup

For full functionality, install the Stripe package:

1. **Install Stripe SDK:**
   ```bash
   cd "c:\Users\caspe\Documents\GitHub\Proanbud"
   pnpm add stripe
   ```

2. **Restart your development server:**
   ```bash
   pnpm dev
   ```

3. **Test the debug tool:**
   - Go to `http://localhost:3000/stripe-debug`
   - Try the "Test Connection" button in Firebase Extension tab

## Environment Variables

Make sure you have these environment variables configured in your `.env.local`:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Price IDs
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_...

# Webhook
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Troubleshooting

### If you get TypeScript errors:
1. Install Stripe: `pnpm add stripe`
2. Install types: `pnpm add -D @types/stripe` (if needed)
3. Restart TypeScript server in VS Code

### If the debug page doesn't load:
1. Check browser console for errors
2. Verify you're logged in to the application
3. Check that you have admin access or use access code: `debug2024`

### If API endpoints fail:
1. Check that all environment variables are set
2. Verify Firebase configuration
3. Check browser network tab for specific error messages

## Contact

If you continue having issues, the debug tool logs will help identify the specific problem. Check the browser console and the subscription debugger tab for detailed error information.