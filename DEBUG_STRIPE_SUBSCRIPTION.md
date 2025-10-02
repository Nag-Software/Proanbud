# DEBUG: Testing Stripe Subscription Retrieve

Test this in your terminal to see raw Stripe response:

```bash
cd /Users/casper/Desktop/Nag-Software/proanbud

# Create a test script
cat > test-stripe-sub.js << 'EOF'
const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

// Replace with your actual subscription ID
const subId = 'sub_1SDmeQKvzyHZ5ODRExtzTdUR';

stripe.subscriptions.retrieve(subId).then(sub => {
  console.log('Full subscription object:');
  console.log(JSON.stringify(sub, null, 2));
  console.log('\nAccessing properties:');
  console.log('current_period_end:', sub.current_period_end);
  console.log('current_period_start:', sub.current_period_start);
}).catch(err => {
  console.error('Error:', err.message);
});
EOF

# Run it
node test-stripe-sub.js
```

This will show us the raw response from Stripe API.
