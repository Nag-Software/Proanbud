# Stripe Betalingsintegrasjon - Oppsettguide

Denne guiden viser hvordan du setter opp Stripe-betalingen for abonnementer i Proanbud.

## Forutsetninger

1. En Stripe-konto (registrer deg på [stripe.com](https://stripe.com))
2. Firebase-prosjekt konfigurert

## Steg 1: Opprett Stripe-konto og hent API-nøkler

1. Logg inn på [Stripe Dashboard](https://dashboard.stripe.com)
2. Gå til **Developers** → **API keys**
3. Kopier følgende:
   - **Publishable key** (begynner med `pk_test_` eller `pk_live_`)
   - **Secret key** (begynner med `sk_test_` eller `sk_live_`)

## Steg 2: Opprett produkter og priser

1. Gå til **Products** i Stripe Dashboard
2. Klikk **+ Add product**

### Basic-plan

- **Navn**: Proanbud Basic
- **Beskrivelse**: Basic abonnement for Proanbud
- **Pris**: 299 NOK per måned
- **Type**: Recurring
- **Billing period**: Monthly
- Kopier **Price ID** (begynner med `price_`)

### Pro-plan

- **Navn**: Proanbud Pro
- **Beskrivelse**: Pro abonnement for Proanbud
- **Pris**: 799 NOK per måned
- **Type**: Recurring
- **Billing period**: Monthly
- Kopier **Price ID** (begynner med `price_`)

## Steg 3: Sett opp Webhook

1. Gå til **Developers** → **Webhooks**
2. Klikk **+ Add endpoint**
3. Legg til URL: `https://ditt-domene.no/api/stripe/webhook`
4. Velg følgende events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Klikk **Add endpoint**
6. Kopier **Signing secret** (begynner med `whsec_`)

## Steg 4: Konfigurer miljøvariabler

Kopier `.env.example` til `.env.local`:

```bash
cp .env.example .env.local
```

Fyll inn verdiene i `.env.local`:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...

# App URL (oppdater til ditt domene i produksjon)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Steg 5: Test lokalt med Stripe CLI

For å teste webhooks lokalt:

1. Installer [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Logg inn:
   ```bash
   stripe login
   ```
3. Start webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Bruk test webhook secret som vises i terminalen

## Steg 6: Aktiver Stripe Customer Portal

1. Gå til **Settings** → **Billing** → **Customer portal**
2. Aktiver customer portal
3. Konfigurer hvilke funksjoner kunder skal ha tilgang til:
   - Update payment method
   - View invoices
   - Cancel subscription

## Steg 7: Test betalingsflyten

### Testkort fra Stripe

Bruk disse kortnumrene i testmiljø:

- **Vellykket betaling**: 4242 4242 4242 4242
- **Krever autentisering**: 4000 0027 6000 3184
- **Avvist kort**: 4000 0000 0000 0002

Alle testkort:
- CVV: Hvilket som helst 3-sifret nummer
- Utløpsdato: Hvilken som helst fremtidig dato

### Testprosedyre

1. Start utviklingsserveren:
   ```bash
   pnpm dev
   ```
2. Naviger til `/innstillinger`
3. Velg en betalingsplan (Basic eller Pro)
4. Fullfør checkout med testkort
5. Verifiser at:
   - Brukeren omdirigeres tilbake til innstillinger
   - Abonnementsstatus oppdateres i Firebase
   - Webhook-events mottas og behandles

## Firebase Database-struktur

Abonnementsdata lagres i Firebase Realtime Database:

```
users/
  {userId}/
    stripeCustomerId: "cus_..."
    stripeSubscriptionId: "sub_..."
    subscriptionStatus: "active"
    subscriptionPriceId: "price_..."
    subscriptionCurrentPeriodEnd: 1234567890
    subscriptionCurrentPeriodStart: 1234567890
    subscriptionUpdatedAt: 1234567890
    invoices/
      {invoiceId}/
        amount: 29900
        currency: "nok"
        status: "paid"
        paidAt: 1234567890
        invoiceUrl: "https://..."
        invoicePdf: "https://..."
```

## Produksjonsmiljø

Før du går i produksjon:

1. **Aktiver live mode i Stripe Dashboard**
2. **Opprett nye produkter og priser** i live mode
3. **Oppdater miljøvariabler** med live-nøkler:
   - `pk_live_...` for publishable key
   - `sk_live_...` for secret key
4. **Oppdater webhook URL** til produksjonsdomenet
5. **Test grundig** med reelle betalingsmetoder
6. **Aktiver 3D Secure** for ekstra sikkerhet

## Sikkerhet

- ✅ API-nøkler er kun på server-siden (unntatt publishable key)
- ✅ Webhook signatur verifiseres
- ✅ Bruker-autentisering sjekkes før API-kall
- ✅ Firebase-regler bør begrense skrivetilgang til abonnementsdata

## Feilsøking

### Webhook mottas ikke

1. Sjekk at webhook URL er riktig
2. Verifiser at webhook secret er korrekt
3. Sjekk logs i Stripe Dashboard under **Developers** → **Webhooks**

### Betaling feiler

1. Sjekk Stripe logs i Dashboard
2. Verifiser at Price IDs er riktige
3. Sjekk at kortet har nok midler (i prod)

### Abonnement vises ikke

1. Sjekk Firebase Database for brukerdata
2. Verifiser at webhook-events blir behandlet
3. Sjekk console logs i browseren og serveren

## Støtte

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Discord Community](https://discord.gg/stripe)
- [Firebase Documentation](https://firebase.google.com/docs)

## API-oversikt

### Tilgjengelige endpoints

- `POST /api/stripe/create-checkout-session` - Opprett betalingssession
- `POST /api/stripe/webhook` - Motta Stripe-events
- `POST /api/stripe/create-portal-session` - Åpne kundeportal
- `POST /api/stripe/get-subscription` - Hent abonnementsstatus
- `POST /api/stripe/cancel-subscription` - Kanseller abonnement

Alle API-kall krever autentisering via Firebase Auth.
