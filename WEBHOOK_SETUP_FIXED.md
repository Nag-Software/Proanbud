# WEBHOOK SETUP FOR LOCAL DEVELOPMENT

## Problem
Når du betaler for abonnement, returnerer Stripe deg til innstillinger-siden, men ingenting blir skrevet til databasen. Dette skjer fordi:

1. **Webhooks kjører ikke lokalt** - Stripe sender webhooks til serveren din, men i lokal utvikling må du forwarde disse
2. **Database path mismatch** - Webhook skrev til feil sti i Firebase (NÅ FIKSET ✅)

## Løsning

### Steg 1: Installer Stripe CLI (hvis ikke allerede installert)

```bash
# På macOS med Homebrew
brew install stripe/stripe-cli/stripe

# Logg inn på Stripe
stripe login
```

### Steg 2: Start Next.js dev server

```bash
pnpm dev
```

La denne kjøre i én terminal.

### Steg 3: Start Stripe webhook listener i ny terminal

```bash
./start-stripe-webhooks.sh
```

ELLER manuelt:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Dette vil:
- Forwarde alle Stripe webhooks til din lokale server
- Vise deg webhook secret (whsec_...)
- La deg se alle webhook events i real-time

### Steg 4: Oppdater .env.local med webhook secret

Når du starter `stripe listen`, vil du se noe som:

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef... (^C to quit)
```

Kopier denne secret og legg til i `.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

**VIKTIG:** Restart Next.js dev server etter å ha oppdatert .env.local!

### Steg 5: Test betalingen

1. Gå til http://localhost:3000/innstillinger
2. Velg et abonnement (Basic eller Pro)
3. Bruk Stripe test card: `4242 4242 4242 4242`
4. Fullfør betalingen
5. Du vil bli redirectet tilbake til innstillinger-siden
6. Abonnementet skal nå være aktivert! 🎉

## Hva skjer når betalingen er vellykket?

1. **Stripe checkout completes** → Redirects til `/innstillinger?success=true&session_id=...`
2. **Stripe sender webhook** → `checkout.session.completed` event
3. **Webhook listener forwards** → Til `http://localhost:3000/api/stripe/webhook`
4. **Webhook handler** → Skriver subscription data til Firebase: `users/{userId}/subscription`
5. **Frontend oppdaget success param** → Viser melding og reloader subscription data
6. **get-subscription API** → Leser fra `users/{userId}/subscription` (NÅ FIKSET ✅)
7. **UI oppdateres** → Viser aktivt abonnement

## Feilsøking

### Webhook mottas ikke

Check at:
- `stripe listen` kjører
- Next.js dev server kjører på port 3000
- STRIPE_WEBHOOK_SECRET er satt i .env.local
- Du har restartet Next.js etter å ha endret .env.local

### Database oppdateres ikke

1. Sjekk terminal hvor `stripe listen` kjører - du skal se webhook events
2. Sjekk Next.js terminal - du skal se `✅ Subscription created for user...`
3. Sjekk Firebase console under `users/{userId}/subscription`

### Subscription vises ikke i UI

1. Vent 2-3 sekunder etter betaling (webhook processing tar litt tid)
2. Refresh siden manuelt hvis auto-reload ikke fungerer
3. Sjekk console for errors
4. Sjekk at `users/{userId}/subscription` eksisterer i Firebase

## Production (Vercel)

I production trenger du IKKE Stripe CLI. I stedet:

1. Gå til Stripe Dashboard → Developers → Webhooks
2. Legg til endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Velg events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`
4. Kopier webhook secret
5. Legg til i Vercel environment variables: `STRIPE_WEBHOOK_SECRET`

## Endringer som er gjort

### ✅ Fixed: Database path mismatch
- **get-subscription/route.ts**: Nå leser fra `users/{userId}/subscription` i stedet for `users/{userId}/stripeSubscriptionId`

### ✅ Fixed: Success handling
- **SubscriptionSettings.tsx**: Nå håndterer `?success=true` parameter og reloader subscription automatisk

### ✅ Added: Visual feedback
- Viser "Betaling vellykket!" melding
- Auto-reload etter 2 sekunder
- "Abonnement aktivert! 🎉" når data er lastet

## Test Webhook Manuelt

Du kan også teste webhooks manuelt:

```bash
# Simuler checkout.session.completed event
stripe trigger checkout.session.completed
```

Dette sender et test event til din lokale webhook endpoint.
