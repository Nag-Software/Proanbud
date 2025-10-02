# Firebase Security Rules for Stripe Integration

## Database Rules (Realtime Database)

Legg til følgende regler i Firebase Realtime Database:

```json
{
  "rules": {
    "users": {
      "$uid": {
        // User can read their own data
        ".read": "auth != null && auth.uid === $uid",
        
        // User settings can be written by user
        "userSettings": {
          ".write": "auth != null && auth.uid === $uid"
        },
        
        "businessSettings": {
          ".write": "auth != null && auth.uid === $uid"
        },
        
        // Subscription data - READ ONLY for users, written by backend
        "stripeCustomerId": {
          ".write": false  // Only backend can write
        },
        "stripeSubscriptionId": {
          ".write": false
        },
        "subscriptionStatus": {
          ".write": false
        },
        "subscriptionPriceId": {
          ".write": false
        },
        "subscriptionCurrentPeriodEnd": {
          ".write": false
        },
        "subscriptionCurrentPeriodStart": {
          ".write": false
        },
        "subscriptionUpdatedAt": {
          ".write": false
        },
        "subscriptionCanceledAt": {
          ".write": false
        },
        
        // Invoices - READ ONLY
        "invoices": {
          ".read": "auth != null && auth.uid === $uid",
          ".write": false  // Only backend can write
        },
        
        // Other user data
        "tilbud": {
          ".write": "auth != null && auth.uid === $uid"
        },
        "kunder": {
          ".write": "auth != null && auth.uid === $uid"
        },
        "products": {
          ".write": "auth != null && auth.uid === $uid"
        },
        "categories": {
          ".write": "auth != null && auth.uid === $uid"
        }
      }
    }
  }
}
```

## Viktige sikkerhetspunkter

### 1. Abonnementsdata er READ-ONLY for klienten

```json
"subscriptionStatus": {
  ".write": false  // ✅ Kun backend kan endre
}
```

**Hvorfor?** Forhindrer at brukere manipulerer abonnementsstatus på klientsiden.

### 2. Backend skriver med Admin SDK

Backend API-ruter (`/api/stripe/*`) bruker Firebase Admin SDK som:
- Bypasser security rules
- Har full skrivetilgang
- Autentiseres med service account

### 3. Brukere kan lese egen data

```json
".read": "auth != null && auth.uid === $uid"
```

Dette lar `SubscriptionSettings`-komponenten lese abonnementsstatus.

## Implementering i Firebase Console

### Steg 1: Gå til Firebase Console

1. Åpne [Firebase Console](https://console.firebase.google.com)
2. Velg ditt prosjekt
3. Gå til **Realtime Database**
4. Klikk på **Rules** tab

### Steg 2: Oppdater reglene

Kopier reglene over og lim inn i Firebase Rules-editoren.

### Steg 3: Publiser

Klikk **Publish** for å aktivere de nye reglene.

## Testing av Security Rules

### Test 1: Bruker kan lese egen subscription

```javascript
const userId = 'test-user-123';
const subscription = await get(ref(db, `users/${userId}/subscriptionStatus`));
// ✅ Skal fungere hvis bruker er autentisert
```

### Test 2: Bruker kan IKKE skrive til subscription

```javascript
const userId = 'test-user-123';
await set(ref(db, `users/${userId}/subscriptionStatus`), 'premium');
// ❌ Skal feile med "Permission denied"
```

### Test 3: Backend kan skrive

Fra webhook eller API-rute med Admin SDK:

```javascript
import { getDatabase } from 'firebase-admin/database';
const db = getDatabase();
await db.ref(`users/${userId}/subscriptionStatus`).set('active');
// ✅ Skal fungere
```

## Firebase Admin SDK Oppsett

Hvis du ikke har satt opp Firebase Admin SDK ennå:

### 1. Generer Service Account Key

1. Gå til **Project Settings** → **Service Accounts**
2. Klikk **Generate New Private Key**
3. Last ned JSON-filen
4. **VIKTIG**: Ikke commit denne filen til git!

### 2. Legg til i .env.local

```env
FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}'
```

Eller oppgi sti til JSON-fil:

```env
FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

### 3. Initialiser Admin SDK (hvis ikke gjort)

Opprett `src/lib/firebaseAdmin.ts`:

```typescript
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY)
    : require(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH!);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

export const adminDb = admin.database();
export const adminAuth = admin.auth();
```

### 4. Bruk Admin SDK i API-ruter

```typescript
import { adminDb } from '@/lib/firebaseAdmin';

// I webhook eller API-rute
await adminDb.ref(`users/${userId}/subscriptionStatus`).set('active');
```

## Potensielle sikkerhetsproblemer å unngå

### ❌ IKKE gjør dette

```javascript
// Client-side code
const updateSubscription = async () => {
  await set(ref(db, `users/${userId}/subscriptionStatus`), 'pro');
  // Dette vil feile, men ideen er gal
};
```

### ✅ Gjør dette i stedet

```javascript
// Client-side
const upgradeSubscription = async () => {
  // Redirect til Stripe Checkout
  await redirectToCheckout({...});
  // Webhook oppdaterer Firebase automatisk
};
```

## Ekstra sikkerhetstips

### 1. Valider subscription server-side

Før du gir tilgang til premium-funksjoner:

```typescript
// API-rute
export async function POST(req: Request) {
  const { userId } = await req.json();
  
  // Hent subscription fra Firebase (server-side)
  const snapshot = await adminDb.ref(`users/${userId}`).once('value');
  const userData = snapshot.val();
  
  if (userData.subscriptionStatus !== 'active') {
    return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
  }
  
  // Fortsett med premium-funksjon...
}
```

### 2. Rate limiting

Implementer rate limiting på API-endepunkter:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutter
  max: 100 // Max 100 requests per 15 min
});
```

### 3. CORS-konfigurasjon

Begrens CORS til ditt domene:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/stripe/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'POST' },
        ],
      },
    ];
  },
};
```

## Security Checklist

Før produksjon:

- [ ] ✅ Firebase Security Rules er aktivert
- [ ] ✅ Abonnementsdata er read-only for klienter
- [ ] ✅ Admin SDK er konfigurert
- [ ] ✅ Service account key er sikret (ikke i git)
- [ ] ✅ Webhook signature verifiseres
- [ ] ✅ API-ruter krever autentisering
- [ ] ✅ Rate limiting er implementert
- [ ] ✅ CORS er konfigurert
- [ ] ✅ Alle sensitive miljøvariabler er sikret

## Monitorering

Overvåk for uautoriserte tilgangsforsøk:

1. **Firebase Console** → **Authentication** → **Usage**
2. **Stripe Dashboard** → **Developers** → **Webhooks** → **Logs**
3. Sett opp alerts for feilede webhook-forsøk

---

**🔒 Sikkerhet først!** Test alle regler grundig før produksjon.
