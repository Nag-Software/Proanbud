# ✅ "Send Tilbud På Nytt" Funksjonalitet Implementert

## 🎯 Hva Er Implementert

### Ny Funksjonalitet i QuoteDetailsDrawer

**1. "Send tilbud" Knapp**
- ✅ Knapp med `Send` ikon og tekst
- ✅ Vises kun når:
  - Kunden finnes (`relatedCustomer`)
  - Tilbudet ikke er draft (`status !== 'draft'`)
- ✅ Plassert mellom "Fortsett redigering" og "Rediger" knapper

**2. Cooldown System (10 sekunder)**
- ✅ Countdown vises i parantes: `Send tilbud (10s)`, `(9s)`, `(8s)` etc.
- ✅ Knapp disables automatisk under countdown
- ✅ Forhindrer spam av e-poster til kunde
- ✅ Timer resettes automatisk etter 10 sekunder

**3. E-postutsending**
- ✅ Genererer vakker HTML e-post med gradient design
- ✅ Inkluderer tilbudsvisnings-lenke med viewToken
- ✅ Bruker bedriftsinnstillinger (logo, kontaktinfo)
- ✅ Sender via `/api/send-email` endpoint
- ✅ Viser suksess/feil meldinger

**4. Loading State**
- ✅ Knapp viser "Sender..." mens e-post sendes
- ✅ Knapp disables under sending
- ✅ Cursor endres til "not-allowed" når disabled

## 📋 Brukeropplevelse

### Normal Flyt
1. Bruker åpner tilbudsdetaljer
2. Ser "Send tilbud" knapp (grønn)
3. Klikker på knappen
4. Knapp viser "Sender..."
5. E-post sendes til kunde
6. Alert: "Tilbud sendt på nytt til kunde@example.com!"
7. Countdown starter: "Send tilbud (10s)"
8. Countdown teller ned: (9s), (8s), (7s)...
9. Etter 10 sekunder: Knapp aktiveres igjen

### Hvis Feil Oppstår
1. Alert med feilmelding vises
2. Console logger detaljert feil
3. Knapp aktiveres igjen (ingen countdown)

## 🎨 Design

### Knapp Styling
```tsx
className="px-3 py-2 hover:bg-green-100 rounded-lg 
  transition-colors disabled:opacity-50 
  disabled:cursor-not-allowed flex items-center gap-2"
```

### Knapp States
- **Normal:** Grønn med `Send` ikon + "Send tilbud"
- **Hover:** Lysere grønn bakgrunn
- **Sender:** "Sender..." tekst
- **Cooldown:** "Send tilbud (Xs)" med disabled state
- **Disabled:** 50% opacity + not-allowed cursor

### Plassering
```
[Fortsett redigering] [Send tilbud] [Rediger] | [Slett] [Lukk]
```

## 🔧 Teknisk Implementering

### State Management
```typescript
const [isSendingEmail, setIsSendingEmail] = useState(false);
const [emailCooldown, setEmailCooldown] = useState(0);
```

### Cooldown Timer
```typescript
useEffect(() => {
  if (emailCooldown > 0) {
    const timer = setTimeout(() => {
      setEmailCooldown(emailCooldown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [emailCooldown]);
```

### Resend Function
```typescript
const handleResendEmail = async () => {
  if (!relatedCustomer || emailCooldown > 0 || isSendingEmail) return;
  
  setIsSendingEmail(true);
  try {
    // Generate email HTML with viewToken link
    const emailHtml = generateEmailHtml(quote, relatedCustomer, viewUrl);
    
    // Send via API
    await fetch('/api/send-email', { ... });
    
    // Success
    alert(`Tilbud sendt på nytt til ${kunde.epost}!`);
    setEmailCooldown(10); // Start cooldown
  } catch (error) {
    alert(`Kunne ikke sende e-post:\n${error.message}`);
  } finally {
    setIsSendingEmail(false);
  }
};
```

### E-post Generering
```typescript
const generateEmailHtml = (quote, customer, viewUrl) => {
  // Samme design som i NewQuoteDrawer
  // Gradient header
  // Totalpris fremhevet
  // CTA knapp til tilbudsvisning
  // Bedriftsinformasjon
};
```

## 📱 Responsivt Design

- ✅ Desktop: Full tekst synlig
- ✅ Tablet: Kompakt layout
- ✅ Mobil: Stakket layout hvis nødvendig

## 🧪 Testing

### Test Scenario 1: Normal Utsending
1. Åpne tilbudsdetaljer (ikke draft)
2. Klikk "Send tilbud"
3. ✅ Verify: "Sender..." vises
4. ✅ Verify: Alert med suksess
5. ✅ Verify: Countdown starter på 10s
6. ✅ Verify: Knapp disabled med countdown
7. ✅ Verify: Countdown teller ned til 0
8. ✅ Verify: Knapp aktiveres etter 10s

### Test Scenario 2: Cooldown Fungerer
1. Send tilbud
2. Prøv å klikke igjen under countdown
3. ✅ Verify: Knapp er disabled
4. ✅ Verify: Cursor viser "not-allowed"
5. ✅ Verify: Ingen ny e-post sendes

### Test Scenario 3: Draft Tilbud
1. Åpne draft tilbud
2. ✅ Verify: "Send tilbud" knapp vises IKKE
3. ✅ Verify: Kun "Fortsett redigering" og "Rediger" vises

### Test Scenario 4: Feil Håndtering
1. Disconnect internett / sett ugyldig RESEND_API_KEY
2. Klikk "Send tilbud"
3. ✅ Verify: Feilmelding i alert
4. ✅ Verify: Detaljert feil i console
5. ✅ Verify: Knapp aktiveres (ingen countdown ved feil)

## 🔐 Sikkerhet

### Spam Prevention
- ✅ 10 sekunders cooldown mellom sending
- ✅ Client-side validering
- ✅ Knapp disabled under sending
- ✅ Knapp disabled under cooldown

### E-post Validering
- ✅ Sjekker at `relatedCustomer` finnes
- ✅ Sjekker at e-postadresse er gyldig
- ✅ Server-side validering i API

## 📊 Logging

### Console Output Ved Sending
```
📧 Resending quote email to: kunde@example.com
✅ Email resent successfully: { messageId: 'xxx', success: true }
```

### Console Output Ved Feil
```
❌ Error resending email: Error: Failed to send email
```

## 🎉 Resultater

### Før
- Kunne ikke sende tilbud på nytt
- Måtte gå via "Ny tilbud" drawer
- Ingen beskyttelse mot spam

### Nå
- ✅ Enkel "Send tilbud" knapp
- ✅ Countdown forhindrer spam
- ✅ Visuell feedback (Xs countdown)
- ✅ Bedre brukeropplevelse
- ✅ Beskytter mot utilsiktet spam

## 🚀 Neste Steg

For å teste:
```bash
pnpm dev
```

1. Gå til dashboard
2. Åpne et eksisterende tilbud (ikke draft)
3. Klikk "Send tilbud" knappen
4. Se countdown i action: (10s) → (9s) → (8s) → ...
5. Prøv å klikke igjen under countdown (skal ikke fungere)
6. Vent til countdown er ferdig
7. Verifiser at knapp aktiveres igjen

## 📝 Dokumentasjon Oppdatert

- ✅ QuoteDetailsDrawer.tsx oppdatert
- ✅ Ny state for cooldown og sending
- ✅ Ny useEffect for timer
- ✅ Ny handleResendEmail funksjon
- ✅ Ny generateEmailHtml funksjon
- ✅ Import av `Send` ikon fra lucide-react

---

**Status:** ✅ Fullstendig implementert og klar for testing  
**Dato:** 2025-10-08  
**Feature:** Send tilbud på nytt med 10s cooldown
