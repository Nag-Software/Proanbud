# Stripe Debug Tool

## Overview

The Stripe Debug Tool is a comprehensive debugging interface for troubleshooting subscription-related issues with the Stripe Firebase extension. It provides real-time monitoring, testing capabilities, and detailed insights into your payment and subscription system.

## Access

Navigate to: `http://localhost:3000/stripe-debug`

### Authentication

The debug tool requires authentication and admin access:

1. **Admin Emails**: Pre-configured admin emails get automatic access
2. **Access Code**: Non-admin users can use the debug access code: `debug2024`
3. **Login Required**: Must be logged into the application

## Features

### 1. Subscription Status Tab 📊

- **Current Subscription Overview**: View active plan, status, billing periods
- **Usage & Limits**: Real-time usage counters for quotes, customers, storage
- **Raw Firebase Data**: Direct access to subscription data in Firebase
- **Manual Refresh**: Force refresh subscription data from Firebase
- **Debug Logs**: Real-time logging of subscription operations

### 2. Webhooks Tab 🔗

- **Event History**: View recent webhook events from Stripe
- **Event Filtering**: Filter by subscription, payment, customer, or error events
- **Event Details**: Detailed view of webhook payload and processing status
- **Webhook Simulator**: Test webhook events without going through Stripe
- **Status Monitoring**: Track successful vs failed webhook processing

**Simulatable Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.created`
- `customer.updated`
- `payment_method.attached`

### 3. Firebase Extension Tab 🔥

- **Extension Status**: Monitor Firebase Stripe extension health
- **Products & Prices**: View Stripe products synchronized to Firebase
- **Customer Data**: Inspect customer records in Firebase
- **Subscriptions**: View active subscriptions in Firebase
- **Checkout Sessions**: Monitor checkout session data
- **Validation Issues**: Automatically detect configuration problems
- **Data Synchronization**: Force sync between Stripe and Firebase

### 4. Stripe Config Tab ⚙️

- **Environment Detection**: Identify test vs live mode
- **Configuration Validation**: Test all Stripe API keys and price IDs
- **Price ID Testing**: Validate each subscription price in Stripe
- **Webhook Endpoint Testing**: Verify webhook accessibility
- **Environment Template**: Copy-ready environment variable template

**Tested Configuration:**
- Publishable Key validation
- Price ID verification for all plans
- Webhook endpoint accessibility
- Secret key connectivity

### 5. Usage & Limits Tab 📈

- **Real-time Usage Calculation**: Recalculate usage from Firebase data
- **Limit Monitoring**: Visual indicators for usage approaching limits
- **Usage Override Tool**: Manually set usage counters for testing
- **Usage Simulation**: Increment/decrement usage counters
- **Plan Limits Display**: View current plan limitations
- **Percentage Calculations**: See usage as percentage of limits

**Testing Tools:**
- Reset all usage counters to 0
- Simulate adding/removing quotes and customers
- Manual usage override with custom values

### 6. Payment History Tab 💳

- **Payment Records**: View all payment transactions
- **Invoice History**: Monitor subscription invoices
- **Payment Status Tracking**: Success/failure analytics
- **Test Payment Creation**: Generate test payments for debugging
- **Payment Statistics**: Revenue and success rate metrics

**Test Payment Options:**
- Create successful payments (299 NOK, 799 NOK)
- Create failed payments for testing error handling
- View payment trends and patterns

## Quick Actions

### 🚨 Run Full Diagnostic
Comprehensive health check of entire Stripe integration:
- Configuration validation
- Connection testing
- Data integrity checks
- Usage calculation verification

### 🔄 Sync Data
Force synchronization between Stripe and Firebase:
- Customer data sync
- Subscription status update
- Payment method synchronization
- Invoice data refresh

### 📋 Export Debug Data
Download complete debugging information:
- Configuration snapshot
- Recent events and logs
- Usage and subscription data
- Error reports and diagnostics

## API Endpoints

The debug tool uses several API endpoints for testing and data manipulation:

- `POST /api/debug/simulate-webhook` - Simulate Stripe webhook events
- `POST /api/debug/test-stripe-connection` - Test Stripe API connectivity
- `POST /api/debug/validate-price` - Validate Stripe price IDs
- `POST /api/debug/sync-stripe-data` - Force data synchronization
- `POST /api/debug/create-test-payment` - Create test payment records

## Security

### Access Control
- Admin email whitelist
- Debug access code protection
- User authentication requirement
- Session-based access control

### Safe Operations
- All test operations use clearly marked test data
- Production data is read-only unless explicitly overridden
- Usage overrides are clearly labeled as debug operations
- Test payments are marked with metadata

## Troubleshooting Common Issues

### Subscription Not Updating
1. Check webhook events tab for recent subscription events
2. Verify webhook endpoint is accessible
3. Use sync data function to force refresh
4. Check Firebase extension configuration

### Payment Failures
1. Review payment history for error patterns
2. Check Stripe configuration for valid keys
3. Verify customer data synchronization
4. Test with simulated successful payments

### Usage Limits Not Working
1. Recalculate usage from raw Firebase data
2. Check subscription plan configuration
3. Verify usage calculation logic
4. Use usage override for testing limit enforcement

### Configuration Issues
1. Run full diagnostic to identify problems
2. Validate all price IDs in Stripe config tab
3. Check environment variable configuration
4. Test Stripe API connectivity

## Development Notes

### File Structure
```
src/
├── app/stripe-debug/page.tsx          # Main debug page
├── components/stripe-debug/           # Debug components
│   ├── AdminGuard.tsx                # Access control
│   ├── SubscriptionDebugger.tsx      # Subscription monitoring
│   ├── WebhookDebugger.tsx           # Webhook testing
│   ├── FirebaseExtensionDebugger.tsx # Extension monitoring
│   ├── StripeConfigDebugger.tsx      # Configuration testing
│   ├── UsageLimitsDebugger.tsx       # Usage monitoring
│   └── PaymentHistoryDebugger.tsx    # Payment tracking
└── api/debug/                        # Debug API endpoints
    ├── simulate-webhook/route.ts
    ├── test-stripe-connection/route.ts
    ├── validate-price/route.ts
    ├── sync-stripe-data/route.ts
    └── create-test-payment/route.ts
```

### Adding New Debug Features
1. Create component in `components/stripe-debug/`
2. Add tab to main debug page
3. Implement API endpoint if needed
4. Update this documentation

## Support

For issues with the debug tool:
1. Check browser console for JavaScript errors
2. Verify Firebase and Stripe connectivity
3. Review debug logs in the subscription tab
4. Contact development team with specific error messages

---

**⚠️ Warning**: This tool provides direct access to subscription and payment data. Use responsibly and ensure proper access controls in production environments.