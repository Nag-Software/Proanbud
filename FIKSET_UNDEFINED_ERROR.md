# 🔧 FIKSET: currentPeriodEnd undefined error

## Problemet
```
❌ Error verifying session: Error: set failed: value argument contains undefined in property 'users.xxx.subscription.currentPeriodEnd'
```

## Rotårsak
1. Checkout session returnerer `subscription` som en **string ID**, ikke et fullstendig objekt
2. Selv med `expand: ['subscription']`, ble ikke alle felter tilgjengelig
3. `current_period_end` og `current_period_start` var undefined

## Løsningen
I stedet for å bruke expandert subscription fra checkout session, henter vi nå subscription separat:

```typescript
// FØR (ikke fungerte)
const session = await stripe.checkout.sessions.retrieve(sessionId, {
  expand: ['subscription'],
});
const subscription = session.subscription as Stripe.Subscription;

// ETTER (fungerer!)
const session = await stripe.checkout.sessions.retrieve(sessionId);
const subscriptionId = session.subscription as string;
const subscription = await stripe.subscriptions.retrieve(subscriptionId);
```

Dette sikrer at vi får **alle** felter fra subscription objektet, inkludert:
- `current_period_end`
- `current_period_start`
- `cancel_at_period_end`

## Test det nå!

Samme prosess som før, men nå skal det fungere:

1. Gå til http://localhost:3000/innstillinger
2. Velg Basic eller Pro plan
3. Bruk test card: `4242 4242 4242 4242`
4. Fullfør betalingen

**I Next.js terminal skal du nå se:**
```
🔍 Verifying checkout session: cs_test_...
📋 Session status: paid
📋 Session mode: subscription
📦 Subscription ID: sub_...
📋 Determined plan: basic
📋 Subscription details: {
  status: 'active',
  current_period_end: 1234567890,
  current_period_start: 1234567890,
  cancel_at_period_end: false
}
✅ Subscription verified and saved for user abc123 - Plan: basic
```

**INGEN ERROR!** ✅

Firebase skal nå ha all data:
```
users/{userId}/subscription
  ├── plan: "basic"
  ├── status: "active"
  ├── currentPeriodEnd: 1234567890
  ├── currentPeriodStart: 1234567890
  ├── cancelAtPeriodEnd: false
  └── ...
```
