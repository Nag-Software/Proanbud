# 🔍 Debug: Payment Vellykket, Men Ingen Firebase Update

## Problem
Du betalte vellykket i Stripe, men subscription data oppdateres ikke i Firebase.

## 🎯 Mest Sannsynlige Årsaker

### 1. Webhook kommer ikke frem til serveren (Mest vanlig!)

**Symptom**: Betalingen går gjennom, men ingenting skjer i Firebase.

**Årsak**: Stripe kan ikke sende webhooks til `localhost:3000` uten en tunnel.

**Løsning A: Bruk Stripe CLI (Anbefalt for lokal testing)**

```bash
# Terminal 1: Start server (hvis ikke kjører)
pnpm dev

# Terminal 2: Start Stripe webhook listener
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Når du kjører `stripe listen`, vil du se:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Kopier denne secret-en og oppdater `.env.local`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx  # Erstatt med din faktiske secret
```

**Restart serveren** etter å ha oppdatert `.env.local`:
```bash
# Ctrl+C for å stoppe, deretter:
pnpm dev
```

Nå vil webhooks bli videresendt fra Stripe → Stripe CLI → localhost:3000!

---

### 2. Firebase Admin SDK er ikke initialisert

**Sjekk server logs når du starter `pnpm dev`:**

✅ **Skal se:**
```
✅ Firebase Admin SDK initialized successfully
```

❌ **Hvis du ser:**
```
⚠️ Firebase Admin SDK not available
```

**Løsning:**
1. Sjekk at `firebase-service-account.json` eksisterer:
   ```bash
   ls -la firebase-service-account.json
   ```

2. Sjekk at `.env.local` har riktig path:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json
   ```

3. Restart serveren

---

### 3. Webhook secret er feil eller placeholder

**Sjekk `.env.local`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_test_placeholder  # ❌ Dette er en placeholder!
```

**Riktig format:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx  # ✅ Ekte secret fra Stripe CLI
```

---

## 🧪 Testing Steg-for-Steg

### Steg 1: Verifiser Firebase Admin SDK
```bash
# Start serveren og sjekk output
pnpm dev
```

**Forventet output:**
```
✅ Firebase Admin SDK initialized successfully
```

### Steg 2: Start Stripe Webhook Listener
```bash
# I en ny terminal
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Kopier webhook secret som vises** og legg til i `.env.local`

### Steg 3: Restart Server
```bash
# Stopp serveren (Ctrl+C)
pnpm dev
```

### Steg 4: Test Betaling
1. Gå til: http://localhost:3000/innstillinger
2. Klikk "Oppgrader til Basic" eller "Oppgrader til Pro"
3. Bruk test card: `4242 4242 4242 4242`
4. Fyll ut:
   - Utløp: `12/34`
   - CVC: `123`
   - Postnummer: `12345`

### Steg 5: Sjekk Logs

**I terminal med server (pnpm dev):**
```
✅ Subscription created for user xxx - Plan: pro
```

**I terminal med Stripe CLI:**
```
checkout.session.completed [evt_xxx]
POST http://localhost:3000/api/stripe/webhook [200]
```

**Hvis du IKKE ser disse meldingene**, er webhooks ikke konfigurert riktig!

---

## 🔍 Debug Checklist

Gå gjennom denne listen:

- [ ] `pnpm dev` kjører uten feil
- [ ] Server logger viser: `✅ Firebase Admin SDK initialized successfully`
- [ ] `stripe listen` kjører i en separat terminal
- [ ] `.env.local` har riktig `STRIPE_WEBHOOK_SECRET` (fra Stripe CLI)
- [ ] Serveren er restartet etter endringer i `.env.local`
- [ ] `firebase-service-account.json` eksisterer i prosjektmappen
- [ ] Test card `4242 4242 4242 4242` brukes
- [ ] Du er logget inn med en Firebase bruker

---

## 📊 Verifiser Firebase Data

Etter vellykket betaling, sjekk Firebase Console:

1. Gå til: https://console.firebase.google.com/
2. Velg prosjektet ditt
3. Gå til "Realtime Database"
4. Naviger til: `users/{din-user-id}/subscription`

**Skal se:**
```json
{
  "plan": "pro",
  "status": "active",
  "stripeCustomerId": "cus_...",
  "stripeSubscriptionId": "sub_...",
  "stripePriceId": "price_...",
  "currentPeriodEnd": 1234567890,
  "currentPeriodStart": 1234567890,
  "cancelAtPeriodEnd": false,
  "updatedAt": 1234567890
}
```

---

## 🚨 Vanlige Feilmeldinger

### "Webhook signature verification failed"
```
❌ Webhook signature verification failed
```

**Årsak**: Feil webhook secret i `.env.local`

**Løsning**:
1. Kopier secret fra `stripe listen` output
2. Oppdater `.env.local`
3. Restart serveren

---

### "No Firebase user ID in session metadata"
```
❌ No Firebase user ID in session metadata
```

**Årsak**: Session ble opprettet uten bruker-metadata

**Løsning**:
- Sjekk at du er logget inn
- Sjekk at `userId` sendes til API i `stripeService.ts`
- Test på nytt med ny betaling

---

### "Firebase Admin SDK not initialized"
```
⚠️ Firebase Admin SDK not available
```

**Årsak**: Service account key mangler eller er feil

**Løsning**:
1. Last ned service account key fra Firebase Console
2. Lagre som `firebase-service-account.json`
3. Sjekk `.env.local`: `FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json`
4. Restart serveren

---

## 🎯 Quick Fix (90% av tilfellene)

Kjør disse kommandoene:

```bash
# Terminal 1: Start server
pnpm dev

# Terminal 2: Start webhook listener
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Kopier webhook secret som vises (whsec_...)
# Legg til i .env.local:
# STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Restart server (Terminal 1)
# Ctrl+C, deretter:
pnpm dev

# Test betaling på nytt
```

---

## 📞 Fortsatt Problemer?

Hvis det fortsatt ikke fungerer, sjekk:

1. **Server logs**: Se etter feilmeldinger
2. **Stripe CLI logs**: Se om webhooks mottas
3. **Firebase Console**: Sjekk at databasen er tilgjengelig
4. **Browser Console**: Se etter JavaScript-feil

Send meg output fra:
- Server logs (`pnpm dev` terminal)
- Stripe CLI logs (`stripe listen` terminal)
- Browser console (F12 → Console tab)

---

## 🎉 Når det Fungerer

Du skal se:

**Server logs:**
```
✅ Firebase Admin SDK initialized successfully
✅ Subscription created for user xxx - Plan: pro
```

**Stripe CLI logs:**
```
checkout.session.completed [evt_xxx]
POST http://localhost:3000/api/stripe/webhook [200]
```

**Firebase Console:**
```json
{
  "subscription": {
    "plan": "pro",
    "status": "active"
  }
}
```

**UI:**
- Badge viser "Pro Plan"
- "Oppgrader" knapp blir "Administrer abonnement"
