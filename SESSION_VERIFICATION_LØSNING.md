# 🎯 LØSNING: Webhook Event Kommer Ikke Frem

## Problemet
- Du fullfører betalingen i Stripe
- Redirecter til `/innstillinger?success=true&session_id=...`
- Men **INGEN** `checkout.session.completed` event i Stripe CLI
- Ingenting skrives til Firebase

## Rotårsak
I Stripe **test mode** med lokal utvikling:
1. Webhooks sendes IKKE automatisk når du redirecter fra Checkout
2. Stripe CLI må kjøre for å forwarde events
3. Men selv da kan det være forsinkelse eller events kommer ikke

## 🚀 Løsningen: Dual Approach

Jeg har implementert en **dobbel strategi** som sikrer at subscription ALLTID blir opprettet:

### Strategi 1: Webhook (Standard)
- Stripe sender `checkout.session.completed` event
- Stripe CLI forwarder til localhost
- Webhook handler skriver til Firebase
- **Fordel:** Skjer automatisk i bakgrunnen
- **Ulempe:** Kan være forsinket eller ikke komme i test mode

### Strategi 2: Session Verification (Fallback) ✅ NY!
- Når bruker returnerer med `session_id`, kaller vi **umiddelbart** `/api/stripe/verify-session`
- Denne APIen henter session fra Stripe og skriver til Firebase **direkte**
- **Fordel:** Skjer med en gang, garantert
- **Ulempe:** Krever at bruker returnerer til success_url

## Hva jeg har lagt til

### 1. Ny API: `/api/stripe/verify-session/route.ts`

Denne APIen:
- Tar imot `session_id` fra checkout success
- Henter session fra Stripe API
- Verifiserer at betalingen er gjennomført
- Henter subscription detaljer
- Skriver til Firebase: `users/{userId}/subscription`
- Logger alt for enkel debugging

```typescript
// Brukes når bruker returnerer fra Stripe Checkout
POST /api/stripe/verify-session
Body: { sessionId: "cs_test_..." }

// Returnerer:
{
  success: true,
  plan: "basic",
  status: "active"
}
```

### 2. Oppdatert SubscriptionSettings.tsx

Ny funksjon `handleSuccessfulPayment()`:
1. Detecter `?success=true&session_id=...` i URL
2. Kaller `/api/stripe/verify-session` **umiddelbart**
3. Viser "Betaling vellykket! Oppdaterer abonnement..."
4. Når session er verifisert → "Abonnement aktivert! 🎉"
5. Reloader subscription data
6. Cleaner URL

## Slik fungerer det nå

```
[Bruker betaler i Stripe Checkout]
         ↓
[Stripe redirecter til /innstillinger?success=true&session_id=cs_test_...]
         ↓
[SubscriptionSettings detecter success parameter]
         ↓
[Kaller umiddelbart: POST /api/stripe/verify-session]
         ↓
[verify-session henter session fra Stripe]
         ↓
[verify-session skriver til Firebase: users/{userId}/subscription]
         ↓
[Returnerer success til frontend]
         ↓
[Frontend viser: "Abonnement aktivert! 🎉"]
         ↓
[Reloader subscription data fra Firebase]
         ↓
[UI oppdateres med aktivt abonnement]
```

**OG SAMTIDIG (i bakgrunnen):**
```
[Stripe sender webhook event (hvis Stripe CLI kjører)]
         ↓
[Webhook handler skriver også til Firebase]
         ↓
[Ingen konflikt - samme data skrives]
```

## Test det nå!

### 1. Sørg for at dev server kjører
```bash
# Terminal 1
pnpm dev
```

### 2. Start Stripe webhook listener (valgfritt, men anbefalt)
```bash
# Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**VIKTIG:** Selv om Stripe CLI IKKE kjører, vil subscription bli opprettet via session verification! 🎉

### 3. Test betalingen
1. Gå til http://localhost:3000/innstillinger
2. Velg Basic eller Pro plan
3. Bruk test card: `4242 4242 4242 4242`
4. Fullfør betalingen
5. **Observer i Next.js terminal:**
   ```
   🔍 Verifying checkout session: cs_test_...
   📋 Session status: paid
   📦 Subscription ID: sub_...
   📋 Determined plan: basic
   ✅ Subscription verified and saved for user abc123 - Plan: basic
   ```
6. Se i browseren:
   - "Betaling vellykket! Oppdaterer abonnement..."
   - Deretter: "Abonnement aktivert! 🎉"
   - Subscription vises som aktiv!

### 4. Verifiser i Firebase
Sjekk Firebase console:
```
users
  └── {userId}
       └── subscription
            ├── plan: "basic"
            ├── status: "active"
            ├── stripeCustomerId: "cus_..."
            ├── stripeSubscriptionId: "sub_..."
            ├── stripePriceId: "price_..."
            ├── currentPeriodEnd: 1234567890
            ├── currentPeriodStart: 1234567890
            ├── cancelAtPeriodEnd: false
            └── updatedAt: 1234567890
```

## Debugging

### Se hva som skjer i real-time

**Next.js Terminal:**
```bash
# Du skal se:
🔍 Verifying checkout session: cs_test_...
📋 Session status: paid
📋 Session mode: subscription
📦 Subscription ID: sub_...
📋 Determined plan: basic
✅ Subscription verified and saved for user abc123 - Plan: basic
```

**Browser Console:**
```bash
# Høyreklikk → Inspiser → Console
# Du skal se:
✅ Session verified: { success: true, plan: "basic", status: "active" }
```

**Firebase Console:**
- Gå til Realtime Database
- Naviger til `users/{userId}/subscription`
- Data skal være der!

### Hvis det IKKE fungerer

1. **Check Next.js terminal for errors**
   ```bash
   ❌ Error verifying session: ...
   ```

2. **Check at STRIPE_SECRET_KEY er satt**
   ```bash
   grep STRIPE_SECRET_KEY .env.local
   ```

3. **Check at Firebase Admin SDK er initialisert**
   ```bash
   # I Next.js terminal ved oppstart skal du se:
   ✅ Firebase Admin SDK initialized successfully
   ```

4. **Test verify-session endpoint manuelt**
   ```bash
   curl -X POST http://localhost:3000/api/stripe/verify-session \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"cs_test_YOUR_SESSION_ID"}'
   ```

## Forskjellen fra før

### ❌ Før (Kun webhook)
```
Betaling → Redirect → Webhook (kanskje?) → Firebase (kanskje?) → Ingenting skjer
```

### ✅ Nå (Webhook + Session Verification)
```
Betaling → Redirect → Session Verification (GARANTERT!) → Firebase → Abonnement aktivert! 🎉

OG

Webhook (hvis tilgjengelig) → Firebase → Samme data (ingen konflikt)
```

## Production (Vercel)

I production fungerer **begge** strategiene:
1. **Session Verification:** Fungerer ALLTID (bruker Stripe API direkte)
2. **Webhook:** Fungerer når Stripe sender events til din Vercel-webhook endpoint

For production webhook:
1. Gå til Stripe Dashboard → Developers → Webhooks
2. Legg til endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Velg events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Kopier webhook secret
5. Legg til i Vercel: `STRIPE_WEBHOOK_SECRET`

## Oppsummering

🎉 **Du trenger IKKE lenger bekymre deg om at webhooks ikke kommer!**

Session verification sikrer at:
- ✅ Subscription opprettes UMIDDELBART når bruker returnerer
- ✅ Fungerer UTEN at Stripe CLI kjører
- ✅ Fungerer UTEN webhook events
- ✅ Gir umiddelbar feedback til bruker
- ✅ Logger alt for enkel debugging

Webhook fungerer fortsatt som backup, men er ikke lenger kritisk! 🚀
