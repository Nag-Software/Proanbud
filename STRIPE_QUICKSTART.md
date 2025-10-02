# 🚀 Hurtigstart - Stripe Betalingsintegrasjon

## Rask oppsummering

Proanbud har nå en komplett Stripe-betalingsmur implementert med støtte for:

✅ Basic-plan (299 NOK/måned)  
✅ Pro-plan (799 NOK/måned)  
✅ Gratis plan (begrenset funksjonalitet)  
✅ Stripe Checkout for sikre betalinger  
✅ Stripe Customer Portal for fakturahåndtering  
✅ Webhook-integrasjon for sanntidsoppdateringer  
✅ Abonnementskansellering  

## 🎯 Kom i gang på 5 minutter

### 1. Installer Stripe CLI (valgfritt for lokal testing)

```bash
brew install stripe/stripe-cli/stripe
```

### 2. Sett opp miljøvariabler

Opprett `.env.local` fra `.env.example`:

```bash
cp .env.example .env.local
```

Rediger `.env.local` og fyll inn dine Stripe-nøkler (se [STRIPE_SETUP.md](./STRIPE_SETUP.md) for detaljer).

### 3. Start utviklingsserver

```bash
pnpm dev
```

### 4. Test lokalt

Naviger til: `http://localhost:3000/innstillinger`

Bruk Stripe-testkort: **4242 4242 4242 4242**

## 📁 Ny filstruktur

```
src/
├── app/
│   └── api/
│       └── stripe/
│           ├── create-checkout-session/route.ts  # Opprett betalingssession
│           ├── webhook/route.ts                  # Motta Stripe-events
│           ├── create-portal-session/route.ts    # Kundeportal
│           ├── get-subscription/route.ts         # Hent abonnement
│           └── cancel-subscription/route.ts      # Kanseller abonnement
├── lib/
│   ├── services/
│   │   └── stripeService.ts                      # Stripe-funksjoner
│   └── types.ts                                  # Oppdatert med Subscription-typer
└── components/
    └── settings/
        └── SubscriptionSettings.tsx              # Oppdatert komponent

Nye filer:
├── .env.example                                  # Mal for miljøvariabler
└── STRIPE_SETUP.md                              # Komplett oppsettguide
```

## 🔑 Nødvendige miljøvariabler

```env
# Minimum påkrevd
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Test med Stripe-testkort

| Scenario | Kortnummer | Resultat |
|----------|------------|----------|
| Vellykket betaling | 4242 4242 4242 4242 | Godkjent |
| Krever 3D Secure | 4000 0027 6000 3184 | Godkjent etter auth |
| Avvist | 4000 0000 0000 0002 | Avvist |

**CVV**: Hvilket som helst 3-sifret nummer  
**Utløpsdato**: Hvilken som helst fremtidig dato

## 🔄 Hvordan det fungerer

1. **Bruker velger plan** → Klikker "Velg denne planen"
2. **Redirect til Stripe Checkout** → Sikker betalingsside
3. **Bruker fullfører betaling** → Kort valideres
4. **Webhook mottas** → `checkout.session.completed` event
5. **Firebase oppdateres** → Abonnementsstatus lagres
6. **Bruker redirects tilbake** → Oppdatert status vises

## 📊 Firebase-struktur

Abonnementsdata lagres under:

```
users/{userId}/
  ├── stripeCustomerId
  ├── stripeSubscriptionId
  ├── subscriptionStatus
  ├── subscriptionPriceId
  ├── subscriptionCurrentPeriodEnd
  └── invoices/
      └── {invoiceId}/...
```

## 🛠️ Viktige funksjoner

### Frontend (stripeService.ts)

```typescript
// Redirect til Stripe Checkout
await redirectToCheckout({ 
  priceId: 'price_xxx', 
  userId: 'user123', 
  email: 'user@example.com' 
});

// Hent abonnementsstatus
const subscription = await getSubscription('user123');

// Åpne kundeportal
const { url } = await createPortalSession('cus_xxx');

// Kanseller abonnement
await cancelSubscription('user123');
```

### Backend (API-ruter)

Alle API-ruter er beskyttet og krever autentisering.

## 🚨 Viktig før produksjon

- [ ] Opprett live-produkter i Stripe
- [ ] Oppdater miljøvariabler med live-nøkler (`pk_live_`, `sk_live_`)
- [ ] Konfigurer webhook med produksjons-URL
- [ ] Aktiver Stripe Customer Portal
- [ ] Test med ekte betalingskort
- [ ] Sett opp Firebase Database Security Rules

## 📚 Dokumentasjon

Se [STRIPE_SETUP.md](./STRIPE_SETUP.md) for komplett oppsettguide.

## 🐛 Feilsøking

**Problem**: Webhook mottas ikke lokalt  
**Løsning**: Bruk Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

**Problem**: "Invalid API key"  
**Løsning**: Sjekk at `.env.local` finnes og inneholder riktige nøkler

**Problem**: Abonnement vises ikke  
**Løsning**: Sjekk Firebase Database og Stripe webhook logs

## 💡 Tips

- Bruk Stripe Dashboard → Logs for debugging
- Test alle betalingsscenarier med testkort
- Webhook signing secret er forskjellig for test/live mode
- Bruk Stripe CLI for lokal webhook-testing

---

**🎉 Du er klar!** Gå til `/innstillinger` og test betalingsflyten.
