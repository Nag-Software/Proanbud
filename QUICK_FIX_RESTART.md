# 🔧 QUICK FIX - Restart Server

## Problem
Server har cachet gammel config uten Firebase Database URL.

## Løsning

### Steg 1: Stopp Serveren Fullstendig
```bash
# I terminalen hvor pnpm dev kjører:
# Trykk Ctrl+C (kanskje 2 ganger)

# Hvis serveren ikke stopper, kill den:
pkill -f "next-server"
```

### Steg 2: Slett Next.js Cache
```bash
rm -rf .next
```

### Steg 3: Start Serveren På Nytt
```bash
pnpm dev
```

### Steg 4: Verifiser Output
Du skal se:
```
✅ Firebase Admin SDK initialized successfully
📍 Database URL: https://proanbudas-default-rtdb.europe-west1.firebasedatabase.app
```

### Steg 5: Test Webhook Endpoint
I en ny terminal:
```bash
curl -I http://localhost:3000/api/stripe/webhook
```

Du skal få `HTTP/1.1 405 Method Not Allowed` (ikke 500!)
- 405 = OK (endpoint fungerer, men HEAD ikke tillatt)
- 500 = Feil (Firebase config mangler)

### Steg 6: Start Stripe Listener (hvis ikke kjører)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Steg 7: Test Betaling
1. Gå til http://localhost:3000/innstillinger
2. Velg plan
3. Betal med `4242 4242 4242 4242`
4. Sjekk logs!

---

## Hvis du fortsatt får 500 error

Sjekk at `.env.local` inneholder:
```bash
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://proanbudas-default-rtdb.europe-west1.firebasedatabase.app
FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json
```

Restart serveren igjen etter endringer!

---

## Forventet Output

**Server startup logs:**
```
✅ Firebase Admin SDK initialized successfully
📍 Database URL: https://proanbudas-default-rtdb.europe-west1.firebasedatabase.app
```

**Etter betaling i server logs:**
```
✅ Subscription created for user xxx - Plan: pro
```

**I Stripe CLI terminal:**
```
checkout.session.completed [evt_xxx]
POST http://localhost:3000/api/stripe/webhook [200]
```

🎉 Da fungerer alt!
