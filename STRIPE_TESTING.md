# 🧪 Lokal Testing - Stripe Betalingsintegrasjon

## Test Scenario 1: Vellykket Basic-abonnement

### Steg 1: Start applikasjonen

```bash
pnpm dev
```

### Steg 2: Logg inn og gå til innstillinger

1. Gå til `http://localhost:3000/login`
2. Logg inn med din testbruker
3. Naviger til `/innstillinger`

### Steg 3: Velg Basic-planen

1. Klikk på "Velg denne planen" under Basic (299 NOK/måned)
2. Du vil bli omdirigert til Stripe Checkout

### Steg 4: Fyll ut betalingsinformasjon

**E-post**: din-test@example.com  
**Kortnummer**: 4242 4242 4242 4242  
**Utløpsdato**: 12/34  
**CVV**: 123  
**Navn**: Test Bruker  

### Steg 5: Fullfør betaling

1. Klikk "Subscribe"
2. Du omdirigeres tilbake til `/innstillinger?success=true&session_id=...`
3. Verifiser at abonnementet vises som "Aktivt"

### Forventet resultat

✅ Status: "Aktivt abonnement"  
✅ Plan: "Basic"  
✅ Pris: "kr 299 per måned"  
✅ Neste fakturering vises  
✅ "Administrer fakturering" og "Avbryt abonnement" knapper er synlige  

---

## Test Scenario 2: Oppgradering fra Basic til Pro

### Steg 1: Med aktivt Basic-abonnement

Du har allerede Basic-planen fra forrige scenario.

### Steg 2: Velg Pro-planen

1. Scroll ned til "Velg abonnement"
2. Klikk "Velg denne planen" under Pro (799 NOK/måned)

### Steg 3: Fullfør oppgraderingen

Stripe Checkout åpnes igjen, fullfør betalingen.

### Forventet resultat

✅ Abonnement endres til "Pro"  
✅ Pris oppdateres til "kr 799 per måned"  
✅ Webhook `customer.subscription.updated` mottas  
✅ Firebase oppdateres med ny priceId  

---

## Test Scenario 3: Administrer fakturering (Customer Portal)

### Steg 1: Klikk "Administrer fakturering"

Fra innstillingssiden, klikk på "Administrer fakturering".

### Steg 2: Utforsk Stripe Customer Portal

Du vil se:
- Aktiv abonnement
- Betalingsmetode
- Fakturahistorikk
- Mulighet til å oppdatere kort
- Mulighet til å kansellere

### Steg 3: Oppdater betalingsmetode (valgfritt)

Test å legge til nytt kort:
**Kortnummer**: 5555 5555 5555 4444 (Mastercard)

### Forventet resultat

✅ Portal åpnes i ny fane  
✅ Alle funksjoner fungerer  
✅ Endringer reflekteres i Stripe Dashboard  

---

## Test Scenario 4: Kanseller abonnement

### Steg 1: Klikk "Avbryt abonnement"

Fra innstillingssiden.

### Steg 2: Bekreft kansellering

En dialog vises: "Er du sikker på at du vil avbryte...?"

Klikk "OK".

### Steg 3: Verifiser kansellering

### Forventet resultat

✅ Status endres til "Abonnementet utløper"  
✅ Utløpsdato vises  
✅ "Avbryt abonnement" knapp forsvinner  
✅ Abonnement er aktivt til periode-slutt  
✅ Firebase `subscriptionStatus` oppdateres  

---

## Test Scenario 5: Webhook-testing med Stripe CLI

### Steg 1: Start Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Kopier webhook signing secret som vises.

### Steg 2: Oppdater .env.local

```env
STRIPE_WEBHOOK_SECRET=whsec_xxx_yyy_zzz
```

Restart dev-serveren.

### Steg 3: Trigger test-event

```bash
stripe trigger checkout.session.completed
```

### Steg 4: Sjekk console output

Du skal se:
```
✓ Checkout session completed event received
✓ Subscription created for user xxx
```

### Forventet resultat

✅ Event mottas av webhook  
✅ Firebase oppdateres  
✅ Ingen feil i console  

---

## Test Scenario 6: Feilet betaling

### Steg 1: Bruk avvist testkort

**Kortnummer**: 4000 0000 0000 0002

### Steg 2: Prøv å fullføre betaling

Stripe vil avvise betalingen.

### Forventet resultat

✅ Feilmelding vises i Checkout  
✅ Bruker redirectes ikke  
✅ Abonnement opprettes ikke  
✅ Firebase oppdateres ikke  

---

## Test Scenario 7: 3D Secure autentisering

### Steg 1: Bruk 3DS testkort

**Kortnummer**: 4000 0027 6000 3184

### Steg 2: Fullfør 3D Secure

En modal vises for autentisering.

Klikk "Authenticate" eller "Complete".

### Forventet resultat

✅ 3D Secure modal vises  
✅ Betaling godkjennes etter auth  
✅ Abonnement opprettes  

---

## Verifisering i Stripe Dashboard

Etter hver test, verifiser i Stripe Dashboard:

1. **Customers** → Sjekk at kunde er opprettet
2. **Subscriptions** → Sjekk abonnementsstatus
3. **Events** → Sjekk at events er mottatt
4. **Webhooks** → Sjekk webhook delivery logs

---

## Verifisering i Firebase

Sjekk Firebase Realtime Database:

```
users/
  {userId}/
    ✅ stripeCustomerId: "cus_xxx"
    ✅ stripeSubscriptionId: "sub_xxx"
    ✅ subscriptionStatus: "active" | "canceled"
    ✅ subscriptionPriceId: "price_xxx"
    ✅ subscriptionCurrentPeriodEnd: timestamp
```

---

## Console Kommandoer for Testing

### Test checkout session
```bash
stripe trigger checkout.session.completed
```

### Test subscription update
```bash
stripe trigger customer.subscription.updated
```

### Test payment success
```bash
stripe trigger invoice.payment_succeeded
```

### Test payment failure
```bash
stripe trigger invoice.payment_failed
```

### List all events
```bash
stripe events list
```

---

## Feilsøking under testing

### Problem: "Invalid publishable key"

**Sjekk**:
- `.env.local` finnes
- Nøkkel begynner med `pk_test_`
- Server er restartet etter endring

### Problem: Webhook mottas ikke

**Sjekk**:
- Stripe CLI kjører
- Webhook secret er oppdatert
- Ingen firewall blokkerer

### Problem: Subscription vises ikke

**Sjekk**:
- Webhook `checkout.session.completed` ble sendt
- Firebase har skrivetilgang
- Console errors i browser

### Problem: "No Firebase user ID"

**Sjekk**:
- Bruker er logget inn
- `user.uid` eksisterer
- Auth-token er gyldig

---

## Testing Checklist

Før du går videre, verifiser at:

- [ ] ✅ Basic-plan kan kjøpes
- [ ] ✅ Pro-plan kan kjøpes
- [ ] ✅ Oppgradering fungerer
- [ ] ✅ Nedgradering fungerer
- [ ] ✅ Customer Portal åpner
- [ ] ✅ Kansellering fungerer
- [ ] ✅ Webhooks mottas og behandles
- [ ] ✅ Firebase oppdateres korrekt
- [ ] ✅ Feilede betalinger håndteres
- [ ] ✅ 3D Secure fungerer

---

## Neste steg

Når lokal testing er komplett:

1. ✅ Gå gjennom alle scenarier
2. ✅ Verifiser i Stripe Dashboard
3. ✅ Sjekk Firebase data
4. ✅ Les [STRIPE_SETUP.md](./STRIPE_SETUP.md) for produksjonsoppsett

---

**🎉 God testing!**
