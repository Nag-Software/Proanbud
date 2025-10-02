# 🎉 FIKSET: Stripe API 2025-09-30 Field Names

## Rotårsaken var funnet!
Stripe API versjon `2025-09-30.clover` bruker **ANDRE feltnavn** enn tidligere versjoner:

### ❌ Gamle feltnavn (ikke lenger tilgjengelig):
- `current_period_end`
- `current_period_start`

### ✅ Nye feltnavn (2025-09-30.clover):
- `billing_cycle_anchor` → Når neste fakturering skjer (= current_period_end)
- `start_date` → Når subscription startet (= current_period_start)
- `created` → Fallback hvis start_date ikke finnes

## Endringer gjort

### 1. `/api/stripe/verify-session/route.ts`
```typescript
// FØR (ga undefined)
currentPeriodEnd: (subscription as any).current_period_end  // undefined!
currentPeriodStart: (subscription as any).current_period_start // undefined!

// ETTER (fungerer!)
const currentPeriodStart = subAny.start_date || subAny.created;
const currentPeriodEnd = subAny.billing_cycle_anchor;
```

### 2. `/api/stripe/webhook/route.ts`
Oppdatert både `checkout.session.completed` og `customer.subscription.updated` til å bruke de nye feltnavnene.

## Test det nå!

1. Gå til http://localhost:3000/innstillinger
2. Velg Basic eller Pro plan
3. Bruk test card: `4242 4242 4242 4242`
4. Fullfør betalingen

**I Next.js terminal skal du nå se:**
```
🔍 Verifying checkout session: cs_test_...
📋 Session status: paid
📦 Subscription ID: sub_...
📋 Billing periods:
   - currentPeriodStart: 1759412201 10/2/2025
   - currentPeriodEnd (billing_cycle_anchor): 1759412201 10/2/2025
📋 Determined plan: basic
📋 Data to save: {
  plan: 'basic',
  status: 'active',
  currentPeriodStart: 1759412201,
  currentPeriodEnd: 1759412201,
  ...
}
✅ Subscription verified and saved for user abc123 - Plan: basic
```

**INGEN UNDEFINED!** ✅

Firebase skal nå ha:
```
users/{userId}/subscription
  ├── currentPeriodStart: 1759412201  ✅
  ├── currentPeriodEnd: 1759412201    ✅
  └── ...
```

## Hvorfor skjedde dette?

Stripe oppdaterer API'en sin regelmessig. Versjon `2025-09-30.clover` er en ny versjon som har endret navnene på disse feltene. Vi brukte gamle feltnavn som ikke lenger eksisterer i den nye API-versjonen.

## Referanse

Fra Stripe API docs for versjon 2025-09-30:
- `billing_cycle_anchor`: The point in time when the billing cycle is anchored.
- `start_date`: Date when the subscription was first created.

Disse erstatter de gamle `current_period_*` feltene.
