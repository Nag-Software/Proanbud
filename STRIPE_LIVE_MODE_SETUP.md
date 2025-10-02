# 🚨 VIKTIG: Stripe Live Mode Setup

## ⚠️ DU BRUKER LIVE MODE NØKLER!

Jeg ser at du har live mode Stripe-nøkler konfigurert. Dette betyr at ekte betalinger vil bli behandlet.

## ✅ Hva er fikset

1. **Lagt til `NEXT_PUBLIC_APP_URL`** - Nødvendig for Stripe redirects
2. **Rettet publishable key** - Endret fra "ppk_" til "pk_"

## 🔴 KRITISK: Du mangler Price IDs

For at betalinger skal fungere, må du opprette produkter i Stripe:

### 1. Gå til Stripe Dashboard

Åpne: https://dashboard.stripe.com/products

**VIKTIG**: Sørg for at du er i **Live Mode** (ikke Test Mode)

### 2. Opprett Basic Plan

1. Klikk **"+ Add product"**
2. Fyll inn:
   - **Name**: Proanbud Basic
   - **Description**: Basic abonnement for Proanbud
   - **Pricing model**: Recurring
   - **Price**: 299 NOK
   - **Billing period**: Monthly
3. Klikk **Save product**
4. **Kopier Price ID** (starter med `price_...`)

### 3. Opprett Pro Plan

1. Klikk **"+ Add product"** igjen
2. Fyll inn:
   - **Name**: Proanbud Pro
   - **Description**: Pro abonnement for Proanbud
   - **Pricing model**: Recurring
   - **Price**: 799 NOK
   - **Billing period**: Monthly
3. Klikk **Save product**
4. **Kopier Price ID** (starter med `price_...`)

### 4. Oppdater .env.local

Erstatt placeholder-verdiene:

```bash
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_din_basic_id_her
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_din_pro_id_her
```

### 5. Oppdater Webhook URL

**VIKTIG**: Webhooks må peke til din produksjons-URL, ikke localhost!

1. Gå til https://dashboard.stripe.com/webhooks
2. Klikk på din webhook (eller opprett ny)
3. Sett URL til: `https://ditt-domene.no/api/stripe/webhook`
4. Velg følgende events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Kopier Signing Secret** (whsec_...)
6. Oppdater i `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_din_nye_secret
   ```

### 6. Aktiver Customer Portal

1. Gå til https://dashboard.stripe.com/settings/billing/portal
2. Klikk **"Activate"**
3. Aktiver:
   - ✅ Update payment method
   - ✅ Cancel subscription
   - ✅ View invoice history

### 7. Restart serveren

```bash
# Stopp serveren (Ctrl+C)
pnpm dev
```

## 🧪 Testing i Live Mode

**ADVARSEL**: Live mode = Ekte penger!

### Test kun med ditt eget kort først

1. Gå til `/innstillinger`
2. Velg Basic eller Pro plan
3. Bruk ditt eget kort for testing
4. Kanseller abonnementet umiddelbart etter test

### Refunder testbetalinger

1. Gå til https://dashboard.stripe.com/payments
2. Finn testbetalingen
3. Klikk **Refund**

## 📋 Produksjons-URL

For produksjon, oppdater:

```bash
NEXT_PUBLIC_APP_URL=https://ditt-produksjonsdomene.no
```

## ⚠️ Anbefalinger før produksjon

1. ✅ **Test grundig** med test mode først
2. ✅ **Sett opp Firebase Security Rules** (se STRIPE_SECURITY.md)
3. ✅ **Verifiser webhook** fungerer i produksjon
4. ✅ **Test alle betalingsscenarier**:
   - Vellykket betaling
   - Avvist betaling
   - Kansellering
   - Oppgradering
5. ✅ **Aktiver 3D Secure** for sikkerhet
6. ✅ **Sett opp betalingsfrist-varsler**

## 🔒 Sikkerhet

### VIKTIG: Beskytt dine nøkler!

- ❌ **Aldri commit** .env.local til git
- ❌ **Aldri del** secret keys med andre
- ✅ **Bruk miljøvariabler** i produksjon
- ✅ **Roter nøkler** hvis de blir kompromittert

### Sjekk .gitignore

Verifiser at `.env.local` er i `.gitignore`:

```bash
grep "\.env\.local" .gitignore
```

## 🚀 Neste steg

1. **Opprett produkter** i Stripe Dashboard
2. **Legg til Price IDs** i .env.local
3. **Restart server**: `pnpm dev`
4. **Test betalingsflyt**
5. **Verifiser webhook** mottar events

## 🆘 Problemer?

### "Invalid price ID"
- Sjekk at Price IDs starter med `price_`
- Verifiser at de er fra **Live Mode**, ikke Test Mode

### "Webhook signature verification failed"
- Sjekk at webhook secret er riktig
- Verifiser at webhook URL er korrekt

### "No such customer"
- Dette betyr webhook ikke har kjørt ennå
- Sjekk Stripe Dashboard → Webhooks → Logs

---

**⚠️ VIKTIG**: Du bruker nå live mode. Test forsiktig og refunder testbetalinger umiddelbart!
