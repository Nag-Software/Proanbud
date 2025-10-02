# Firebase Admin SDK Setup Guide

## Overview
Firebase Admin SDK er nå satt opp for å håndtere Stripe webhooks på en sikker måte. Denne guiden viser deg hvordan du setter opp service account nøkkelen.

## Hvorfor Admin SDK?
- ✅ **Sikkerhet**: Webhooks har ingen autentisert bruker-kontekst
- ✅ **Bypass security rules**: Kun server-siden kan skrive subscription data
- ✅ **Best practice**: Anbefalt for alle server-side Firebase operasjoner
- ✅ **Produksjonsklart**: Korrekt implementasjon fra starten

## Steg 1: Last ned Firebase Service Account Key

### 1.1 Gå til Firebase Console
```
https://console.firebase.google.com/
```

### 1.2 Velg prosjektet ditt
- Klikk på prosjektet du vil bruke (proanbud)

### 1.3 Gå til Project Settings
- Klikk på tannhjulet (⚙️) øverst til venstre
- Velg "Project settings"

### 1.4 Naviger til Service Accounts
- Klikk på "Service accounts" tab
- Du vil se en side som sier "Firebase Admin SDK"

### 1.5 Generate ny private key
- Klikk på knappen "Generate new private key"
- En dialog vil spørre om du er sikker
- Klikk "Generate key"
- En JSON-fil vil bli lastet ned (f.eks. `proanbud-firebase-adminsdk-xxxxx.json`)

⚠️ **VIKTIG**: Denne filen inneholder sensitiv informasjon. ALDRI commit den til Git!

## Steg 2: Lagre Service Account Key

### 2.1 Flytt filen til prosjektmappen
```bash
mv ~/Downloads/proanbud-firebase-adminsdk-xxxxx.json /Users/casper/Desktop/Nag-Software/proanbud/firebase-service-account.json
```

### 2.2 Legg til i .gitignore
Filen `firebase-service-account.json` er allerede lagt til i `.gitignore`, så den vil ikke bli committet.

## Steg 3: Legg til i .env.local

Åpne `.env.local` og legg til denne linjen:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY=/Users/casper/Desktop/Nag-Software/proanbud/firebase-service-account.json
```

Eller med relativ path:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json
```

## Steg 4: Restart Development Server

```bash
# Stopp serveren (Ctrl+C)
# Start den igjen
pnpm dev
```

## Verifisering

### Test at Admin SDK er tilgjengelig
Når du starter serveren, skal du se i konsollen:
```
✅ Firebase Admin SDK initialized successfully
```

Hvis du ser denne meldingen, er alt riktig konfigurert!

### Hvis du ser en feilmelding
```
⚠️ Firebase Admin SDK not available
```

Sjekk at:
1. Filen `firebase-service-account.json` eksisterer
2. `FIREBASE_SERVICE_ACCOUNT_KEY` er satt i `.env.local`
3. Path-en er riktig (absolutt eller relativ)
4. Serveren er restartet etter endringer

## Filstruktur

Etter setup skal du ha:
```
proanbud/
├── .env.local (inneholder FIREBASE_SERVICE_ACCOUNT_KEY)
├── firebase-service-account.json (hemmelighet, ikke i git)
├── .gitignore (inneholder firebase-service-account.json)
└── src/
    ├── lib/
    │   └── firebaseAdmin.ts (Admin SDK setup)
    └── app/
        └── api/
            └── stripe/
                └── webhook/
                    └── route.ts (bruker Admin SDK)
```

## Hva skjer når webhooks kommer?

### 1. Stripe sender webhook
```
POST https://proanbud.no/api/stripe/webhook
```

### 2. Webhook verifiserer signatur
```typescript
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

### 3. Admin SDK oppdaterer Firebase
```typescript
// Eksempel: checkout.session.completed
await updateUserSubscription(firebaseUserId, {
  plan: 'pro',
  status: 'active',
  stripeCustomerId: 'cus_...',
  stripeSubscriptionId: 'sub_...',
  // ...
});
```

### 4. Data lagres i Firebase
```json
{
  "users": {
    "userId123": {
      "subscription": {
        "plan": "pro",
        "status": "active",
        "stripeCustomerId": "cus_...",
        "updatedAt": 1234567890
      }
    }
  }
}
```

## Database Security Rules

Subscription data er **read-only** for klienter:
```json
{
  "rules": {
    "users": {
      "$uid": {
        "subscription": {
          ".read": "$uid === auth.uid",
          ".write": false
        }
      }
    }
  }
}
```

Kun Firebase Admin SDK (server-side) kan skrive til subscription data! 🔒

## Neste Steg

Etter at Admin SDK er satt opp:
1. ✅ Sett opp Firebase service account (dette dokumentet)
2. ⏭️ Opprett test produkter i Stripe Dashboard
3. ⏭️ Oppdater Price IDs i `.env.local`
4. ⏭️ Test webhook flow med Stripe CLI

Se `STRIPE_TEST_MODE_SETUP.md` for neste steg!

## Troubleshooting

### "Cannot find module firebase-admin"
```bash
pnpm add firebase-admin
```

### "Firebase Admin SDK not initialized"
- Sjekk at `FIREBASE_SERVICE_ACCOUNT_KEY` er satt
- Sjekk at filen eksisterer på den angitte path-en
- Restart serveren

### "Error reading service account file"
- Sjekk fil-permissions
- Sjekk at JSON-filen er valid
- Prøv med absolutt path i stedet for relativ

### Webhooks feiler fortsatt
- Sjekk at serveren er restartet
- Sjekk logs i terminalen
- Test med Stripe CLI (se `STRIPE_TESTING.md`)

## Produksjon

For produksjon (Vercel):
1. Ikke bruk fil-path
2. Bruk environment variable med hele JSON-innholdet:
```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...",...}'
```

Se `firebaseAdmin.ts` for implementasjon av begge metoder.
