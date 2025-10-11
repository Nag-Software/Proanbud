# Stripe Extension Configuration Fix

## Problem
The Firebase Stripe extension is timing out when creating checkout sessions because the Stripe API key in Google Secret Manager is not properly configured.

## Current Configuration Issue
Your extension configuration shows:
```
STRIPE_API_KEY=projects/956288932829/secrets/ext-firestore-stripe-payments-STRIPE_API_KEY/versions/1
```

This means the extension is trying to read the Stripe API key from Google Secret Manager, but this secret likely doesn't contain your actual Stripe secret key.

## Solution Options

### Option 1: Update the Secret in Google Cloud Console (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/security/secret-manager)
2. Select your project: `proanbudas`
3. Find the secret: `ext-firestore-stripe-payments-STRIPE_API_KEY`
4. Create a new version with your actual Stripe secret key from `.env.local`:
   ```
   sk_test_51SDktzKvzyHZ5ODRbN0sL48vsMrzzknzUFEg9HmGHgG7MuDuRfawWHkOPZlHxYZhAcElU8oPYDAUT5RpoLvgXhcV00RgUBE2x6
   ```

### Option 2: Reconfigure the Extension

Run this command to reconfigure the extension:
```bash
firebase ext:configure firestore-stripe-payments
```

When prompted for the Stripe API key, enter your actual secret key.

### Option 3: Manual Secret Update (if you have gcloud CLI)

If you have Google Cloud CLI installed:
```bash
echo "sk_test_51SDktzKvzyHZ5ODRbN0sL48vsMrzzknzUFEg9HmGHgG7MuDuRfawWHkOPZlHxYZhAcElU8oPYDAUT5RpoLvgXhcV00RgUBE2x6" | gcloud secrets versions add ext-firestore-stripe-payments-STRIPE_API_KEY --data-file=-
```

## Verification

After updating the secret:

1. Wait a few minutes for the change to propagate
2. Test the checkout session creation again
3. Check the Firebase Functions logs for any errors

## Alternative: Use Direct Stripe Integration

If the extension continues to have issues, we can fall back to a direct Stripe integration with custom webhook handling. Let me know if you'd prefer this approach.

## Next Steps

1. Update the secret using one of the methods above
2. Test the checkout session creation
3. If it still doesn't work, check the Firebase Functions logs in the Firebase Console