// Debug Stripe customers
const { readFileSync } = require('fs');
const Stripe = require('stripe');

// Load environment variables from .env.local
const envContent = readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

async function debugStripeCustomers() {
  try {
    console.log('🔍 Debugging Stripe customers...\n');

    const customers = await stripe.customers.list({
      limit: 10,
    });

    console.log(`✅ Found ${customers.data.length} customers in Stripe:`);

    for (const customer of customers.data) {
      console.log(`Customer ID: ${customer.id}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Created: ${new Date(customer.created * 1000).toISOString()}`);

      // Check subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 5,
      });

      console.log(`   Subscriptions: ${subscriptions.data.length}`);
      subscriptions.data.forEach((sub, index) => {
        console.log(`     ${index + 1}. Status: ${sub.status}, ID: ${sub.id}`);
      });

      console.log('');
    }

  } catch (error) {
    console.error('❌ Error debugging Stripe customers:', error);
  }
}

debugStripeCustomers();