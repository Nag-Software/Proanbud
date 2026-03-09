#!/usr/bin/env node
/**
 * Integration health check
 * Run with: node scripts/check-integrations.js
 *
 * Checks: Stripe · Firebase Admin · Firebase Stripe Extension · OpenAI
 */

// Load .env.local manually (no dotenv dependency needed)
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

const results = [];

function pass(label, detail = '') {
  results.push({ ok: true, label, detail });
  console.log(`  ✅  ${label}${detail ? ' — ' + detail : ''}`);
}
function fail(label, detail = '') {
  results.push({ ok: false, label, detail });
  console.log(`  ❌  ${label}${detail ? ' — ' + detail : ''}`);
}

// ─────────────────────────────────────────────────
// 1. STRIPE
// ─────────────────────────────────────────────────
async function checkStripe() {
  console.log('\n🔵 Stripe');
  const Stripe = require('stripe');
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) { fail('STRIPE_SECRET_KEY missing'); return; }

  try {
    const stripe = new Stripe(key, { apiVersion: '2023-10-16' });

    // Account
    const account = await stripe.accounts.retrieve();
    pass('Account connected', account.id);

    // Price IDs
    const priceIds = [
      process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID,
      process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
    ].filter(Boolean);

    for (const id of priceIds) {
      try {
        const price = await stripe.prices.retrieve(id);
        pass(`Price exists: ${id}`, `${price.unit_amount / 100} ${price.currency.toUpperCase()}/${price.recurring?.interval ?? 'one-time'}`);
      } catch {
        fail(`Price not found: ${id}`);
      }
    }

    // Webhook secret present (can't validate without a live request)
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      pass('STRIPE_WEBHOOK_SECRET present');
    } else {
      fail('STRIPE_WEBHOOK_SECRET missing');
    }
  } catch (err) {
    fail('Stripe API call failed', err.message);
  }
}

// ─────────────────────────────────────────────────
// 2. FIREBASE ADMIN
// ─────────────────────────────────────────────────
async function checkFirebaseAdmin() {
  console.log('\n🔶 Firebase Admin');
  const admin = require('firebase-admin');

  // Parse service account
  let serviceAccount = null;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) { fail('FIREBASE_SERVICE_ACCOUNT_JSON missing'); return; }

  try {
    serviceAccount = JSON.parse(raw);
    pass('Service account JSON parsed');
  } catch {
    fail('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
    return;
  }

  // Init (may already be initialised if module is cached)
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://proanbudas-default-rtdb.europe-west1.firebasedatabase.app',
      });
    } catch (err) {
      fail('admin.initializeApp failed', err.message);
      return;
    }
  }
  pass('Admin SDK initialised');

  // Firestore read
  try {
    const db = admin.firestore();
    await db.collection('_healthcheck').limit(1).get();
    pass('Firestore reachable');
  } catch (err) {
    fail('Firestore read failed', err.message);
  }

  // Realtime Database ping
  try {
    const db = admin.database();
    await db.ref('_healthcheck').once('value');
    pass('Realtime Database reachable');
  } catch (err) {
    fail('Realtime Database read failed', err.message);
  }
}

// ─────────────────────────────────────────────────
// 3. FIREBASE STRIPE EXTENSION (firestore-stripe-payments)
// ─────────────────────────────────────────────────
async function checkStripeExtension() {
  console.log('\n🟣 Firebase Stripe Extension');
  const admin = require('firebase-admin');
  if (!admin.apps.length) { fail('Firebase Admin not initialised — skipping extension check'); return; }

  const db = admin.firestore();

  // Check products collection
  try {
    const products = await db.collection('products').limit(5).get();
    if (products.empty) {
      fail('products collection empty — extension may not have synced yet');
    } else {
      pass('products collection', `${products.size} product(s) found`);
      // Check at least one product has prices
      const firstProduct = products.docs[0];
      const prices = await firstProduct.ref.collection('prices').limit(1).get();
      if (prices.empty) {
        fail(`prices sub-collection empty on product ${firstProduct.id}`);
      } else {
        pass('prices sub-collection reachable');
      }
    }
  } catch (err) {
    fail('products collection read failed', err.message);
  }

  // Check customers collection (exists after first checkout)
  try {
    const customers = await db.collection('customers').limit(1).get();
    pass('customers collection reachable', `${customers.size} doc(s) found`);
  } catch (err) {
    fail('customers collection read failed', err.message);
  }
}

// ─────────────────────────────────────────────────
// 4. OPENAI
// ─────────────────────────────────────────────────
async function checkOpenAI() {
  console.log('\n🟢 OpenAI');
  const key = process.env.OPENAI_API_KEY;
  if (!key) { fail('OPENAI_API_KEY missing'); return; }

  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      fail('API request failed', body?.error?.message ?? `HTTP ${res.status}`);
      return;
    }
    const data = await res.json();
    const gpt4 = data.data.find((m) => m.id.startsWith('gpt-4'));
    pass('API key valid', gpt4 ? `access to ${gpt4.id}` : `${data.data.length} models`);
  } catch (err) {
    fail('OpenAI request failed', err.message);
  }
}

// ─────────────────────────────────────────────────
// Run all checks
// ─────────────────────────────────────────────────
(async () => {
  console.log('=== Integration Health Check ===');
  await checkStripe();
  await checkFirebaseAdmin();
  await checkStripeExtension();
  await checkOpenAI();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`  ${passed} passed  •  ${failed} failed  •  ${results.length} total`);
  if (failed > 0) process.exit(1);
})();
