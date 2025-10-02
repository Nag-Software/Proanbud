# 🧪 Test Mode Oppsett - Trinn for Trinn

## ✅ Hva er gjort

Din `.env.local` er nå konfigurert for **TEST MODE**:
- ✅ Test mode publishable key aktivert
- ✅ Test mode secret key aktivert  
- ✅ Live mode nøkler kommentert ut
- ✅ Placeholder Price IDs klar for oppdatering

## 📋 Neste steg (ca. 5 minutter)

### Trinn 1: Åpne Stripe Dashboard i Test Mode

1. Gå til: https://dashboard.stripe.com
2. **VIKTIG**: Skru på **Test Mode** (toggle i toppen til venstre)
   - Skal si "Test mode" og være orange/gul
   - Ikke "Live mode" (blå)

### Trinn 2: Opprett Basic Plan (Test Mode)

1. Gå til **Products**: https://dashboard.stripe.com/test/products
2. Klikk **+ Add product**
3. Fyll inn:
   ```
   Name: Proanbud Basic Test
   Description: Basic abonnement for Proanbud (Test)
   ```
4. Under **Pricing**:
   ```
   Pricing model: Standard pricing
   Price: 299
   Currency: NOK
   Billing period: Recurring - Monthly
   ```
5. Klikk **Add product**
6. **VIKTIG**: Kopier **Price ID** (begynner med `price_`)
   - Finn det under produktet, ser ut som: `price_1AbCdEfGhIjKlMnO`

### Trinn 3: Opprett Pro Plan (Test Mode)

1. Klikk **+ Add product** igjen
2. Fyll inn:
   ```
   Name: Proanbud Pro Test
   Description: Pro abonnement for Proanbud (Test)
   ```
3. Under **Pricing**:
   ```
   Pricing model: Standard pricing
   Price: 799
   Currency: NOK
   Billing period: Recurring - Monthly
   ```
4. Klikk **Add product**
5. **VIKTIG**: Kopier **Price ID** (begynner med `price_`)

### Trinn 4: Sett opp Firebase Admin SDK (VIKTIG!)

**Før du kan teste betalinger, må du sette opp Firebase Admin SDK:**

1. Følg instruksjonene i `FIREBASE_ADMIN_SETUP.md`
2. Dette er nødvendig for at webhooks skal kunne oppdatere subscription data
3. Ta ca. 2 minutter

**Hurtigoversikt:**
```bash
# 1. Last ned service account key fra Firebase Console
# 2. Lagre som firebase-service-account.json
# 3. Legg til i .env.local:
FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json
```

Se detaljert guide: `FIREBASE_ADMIN_SETUP.md`

### Trinn 5: Oppdater .env.local

Åpne `.env.local` og erstatt placeholder-verdiene:

```bash
# Erstatt disse linjene:
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_test_basic_placeholder
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_test_pro_placeholder

# Med dine faktiske Price IDs:
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_1AbCdEfGhIjKlMnO
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_1XyZaBcDeFgHiJkL
```

### Trinn 6: Sett opp Webhook for lokal testing (Valgfritt)

#### Alternativ A: Bruk Stripe CLI (Anbefalt)

```bash
# Installer Stripe CLI hvis ikke installert
brew install stripe/stripe-cli/stripe

# Logg inn
stripe login

# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Når kommandoen kjører, vil den vise en webhook secret. Kopier den og oppdater i `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnop
```

#### Alternativ B: Hopp over webhook (for nå)

Du kan teste betalinger uten webhook, men abonnementsstatus vil ikke oppdateres automatisk i Firebase.

### Trinn 7: Restart utviklingsserveren

```bash
# Stopp serveren (Ctrl+C)
# Start på nytt
pnpm dev
```

### Trinn 7: Test betalingsflyten! 🎉

1. Åpne: http://localhost:3000/innstillinger
2. Velg Basic eller Pro plan
3. Klikk "Velg denne planen"
4. Bruk test kort:
   - **Kortnummer**: 4242 4242 4242 4242
   - **Utløpsdato**: 12/34 (eller hvilken som helst fremtidig dato)
   - **CVV**: 123
   - **Navn**: Test Bruker
   - **E-post**: test@example.com

## 🧪 Test Scenarios

### Vellykket betaling
```
Kort: 4242 4242 4242 4242
Resultat: Betaling godkjent ✅
```

### Krever 3D Secure autentisering
```
Kort: 4000 0027 6000 3184
Resultat: Viser autentisering-modal, deretter godkjent ✅
```

### Avvist betaling
```
Kort: 4000 0000 0000 0002
Resultat: Kortet avvises ❌
```

### Utilstrekkelige midler
```
Kort: 4000 0000 0000 9995
Resultat: Betaling avvises - ikke nok penger ❌
```

## ✅ Verifisering

Etter vellykket test-betaling, verifiser:

1. **Stripe Dashboard**:
   - Gå til https://dashboard.stripe.com/test/payments
   - Se betalingen i listen
   - Sjekk https://dashboard.stripe.com/test/subscriptions
   - Se abonnementet opprettet

2. **Firebase Database**:
   - Åpne Firebase Console
   - Gå til Realtime Database
   - Sjekk `users/{userId}/` for:
     - `stripeCustomerId`
     - `stripeSubscriptionId`
     - `subscriptionStatus: "active"`

3. **Innstillingssiden**:
   - Refresh siden
   - "Aktivt abonnement" skal vises
   - Riktig plan (Basic eller Pro)
   - Neste faktureringsdato vises

## 🔄 Bytte tilbake til Live Mode (senere)

Når du er klar for produksjon:

1. Åpne `.env.local`
2. Kommenter ut test mode keys
3. Aktiver live mode keys:
   ```bash
   # Test Mode Keys (INAKTIV)
   # NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   # STRIPE_SECRET_KEY=sk_test_...
   
   # Live Mode Keys (AKTIV)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```
4. Opprett live mode produkter
5. Oppdater Price IDs til live mode IDs
6. Oppdater webhook secret til live mode
7. Restart server

## 🆘 Problemer?

### "Invalid price ID"
- Sjekk at du er i **Test Mode** i Stripe Dashboard
- Verifiser at Price IDs starter med `price_`
- Restart serveren etter endringer i .env.local

### "Stripe webhook not configured"
- Dette er OK for testing uten webhook
- Abonnementsstatus vil ikke oppdateres automatisk
- Bruk Stripe CLI for full webhook-testing

### "No such customer"
- Prøv en ny betaling
- Sjekk at webhook kjører (hvis du bruker Stripe CLI)

### Siden viser fortsatt feil
- Sørg for at serveren er restartet
- Clear browser cache
- Sjekk console for feilmeldinger

## 📚 Flere ressurser

- [Stripe Test Kort](https://stripe.com/docs/testing)
- [STRIPE_TESTING.md](./STRIPE_TESTING.md) - Alle test scenarios
- [STRIPE_QUICKSTART.md](./STRIPE_QUICKSTART.md) - Rask oversikt

---

**🎉 Klar til å teste!** Følg stegene over og du vil ha en fungerende test-versjon om 5 minutter.
