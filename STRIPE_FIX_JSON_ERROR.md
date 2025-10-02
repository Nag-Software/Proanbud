# 🔧 Fikse "Unexpected token '<', <!DOCTYPE..." Feil

## Problemet

Denne feilen oppstår når:
1. Stripe ikke er konfigurert (manglende miljøvariabler)
2. API returnerer HTML-feilside i stedet for JSON

## ✅ Løsning

### Trinn 1: Opprett .env.local fil

```bash
cp .env.example .env.local
```

### Trinn 2: Legg til minimum konfigurering

Åpne `.env.local` og legg til:

```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Midlertidige Stripe-verdier (for testing uten Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_basic_placeholder
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_pro_placeholder
```

### Trinn 3: Restart utviklingsserveren

```bash
# Stopp serveren (Ctrl+C)
# Start på nytt
pnpm dev
```

## Hvis du vil aktivere ekte Stripe-betalinger

Følg disse trinnene:

### 1. Opprett Stripe-konto

Gå til [stripe.com](https://stripe.com) og registrer deg.

### 2. Hent API-nøkler

1. Gå til [Stripe Dashboard](https://dashboard.stripe.com)
2. Naviger til **Developers** → **API keys**
3. Kopier:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

### 3. Opprett produkter

1. Gå til **Products** i Stripe Dashboard
2. Opprett to produkter:

**Basic Plan**:
- Navn: Proanbud Basic
- Pris: 299 NOK
- Type: Recurring - Monthly
- Kopier Price ID (price_...)

**Pro Plan**:
- Navn: Proanbud Pro
- Pris: 799 NOK
- Type: Recurring - Monthly
- Kopier Price ID (price_...)

### 4. Oppdater .env.local

Erstatt placeholder-verdiene med dine ekte Stripe-nøkler:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_din_nøkkel_her
STRIPE_SECRET_KEY=sk_test_din_nøkkel_her
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_din_basic_id_her
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_din_pro_id_her
```

### 5. Sett opp webhook (for produksjon)

For lokal testing:

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Kopier webhook secret som vises
# Legg til i .env.local:
STRIPE_WEBHOOK_SECRET=whsec_din_webhook_secret
```

### 6. Restart server

```bash
pnpm dev
```

## Verifiser at det fungerer

1. Gå til `http://localhost:3000/innstillinger`
2. Du skal nå se abonnementskortene uten feil
3. Hvis Stripe ikke er konfigurert, ser du en blå info-melding
4. Med ekte Stripe-nøkler kan du teste betaling med: **4242 4242 4242 4242**

## Hva har vi fikset?

### Backend (API-ruter)

✅ Validerer at Stripe-nøkler finnes før bruk
✅ Returnerer JSON-feil i stedet for HTML
✅ Returnerer gratis plan som standard hvis Stripe ikke er konfigurert

### Frontend

✅ Håndterer både JSON og HTML-feilsvar
✅ Viser informativ melding når Stripe ikke er konfigurert
✅ Fallback til gratis plan ved feil

## Fortsatt problemer?

### Sjekk at .env.local finnes og inneholder verdier

```bash
ls -la .env.local
cat .env.local
```

### Sjekk at serveren ble restartet

Etter endringer i .env.local **må** serveren restartes.

### Sjekk console for feilmeldinger

Åpne Developer Tools i nettleseren og sjekk Console-fanen.

## Neste steg

For full Stripe-integrasjon, se:
- [STRIPE_QUICKSTART.md](./STRIPE_QUICKSTART.md) - Kom i gang på 5 min
- [STRIPE_SETUP.md](./STRIPE_SETUP.md) - Komplett guide

---

**✅ Feilen skal nå være fikset!**
