# 🐛 E-post Feilsøking Guide

## Problem
E-post ble ikke sendt for tilbud: "Bygge noe tøft trevirke"

## Løsning

### 1. Sjekk Environment Variables
Verifiser at `.env.local` inneholder:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Hvordan finne API key:**
1. Gå til https://resend.com/api-keys
2. Logg inn
3. Kopier API key
4. Legg til i `.env.local`

### 2. Restart Development Server
Etter å ha lagt til API key:
```bash
# Stopp serveren (Ctrl+C)
# Start på nytt
pnpm dev
```

### 3. Test E-postutsendelse
1. Gå til dashboard
2. Opprett nytt tilbud
3. Send til kunde
4. Se i terminal/console for disse meldingene:

**Vellykket:**
```
📧 Sending email: { to: 'kunde@example.com', subject: 'Tilbud: ...', ... }
✅ Email sent successfully: { messageId: 'xxx', ... }
```

**Feilet - Mangler API key:**
```
❌ Resend API key not configured
Please set RESEND_API_KEY in .env.local
```

**Feilet - Ugyldig API key:**
```
❌ Error sending email: Error: Invalid API key
```

### 4. Forbedringer Implementert

#### A. Bedre Feilmeldinger
- ✅ Detaljert logging i console
- ✅ Alert til bruker hvis e-post feiler
- ✅ Viser hvilken e-postadresse som skulle mottatt

#### B. E-post API Oppdatert
- ✅ Bruker nå riktig HTML fra `generateQuoteHtml`
- ✅ Sender vakker gradient-design
- ✅ Inkluderer tilbudsvisnings-lenke

#### C. Feilhåndtering
```typescript
// Hvis e-post feiler:
alert(`Tilbud opprettet, men e-post kunne ikke sendes:
${error.message}

Vennligst send tilbudet manuelt til kunde@example.com`);
```

## Hvordan Teste

### Manuell Test
```bash
# 1. Start dev server
pnpm dev

# 2. Åpne browser console (F12)
# 3. Opprett og send tilbud
# 4. Sjekk console for:
#    - "📧 Sending email..."
#    - "✅ Email sent successfully..." 
#    - eller "❌ Error sending email..."
```

### Sjekk Resend Dashboard
1. Gå til https://resend.com/emails
2. Se liste over sendte e-poster
3. Klikk på e-post for å se detaljer
4. Verifiser at innhold ser riktig ut

## Common Issues

### Issue 1: "Email service not configured"
**Årsak:** RESEND_API_KEY mangler  
**Løsning:** Legg til i `.env.local` og restart server

### Issue 2: "Invalid API key"
**Årsak:** Feil API key eller utgått  
**Løsning:** Generer ny key på resend.com

### Issue 3: "Failed to send email"
**Årsak:** Resend service error eller rate limit  
**Løsning:** Sjekk Resend status og rate limits

### Issue 4: E-post ikke mottatt
**Årsak:** Spam filter eller feil e-postadresse  
**Løsning:** 
- Sjekk spam folder
- Verifiser e-postadresse i kunde-data
- Sjekk Resend dashboard for delivery status

### Issue 5: "viewToken mangler"
**Årsak:** Token ikke lagret i database  
**Løsning:**
- Sjekk Firebase console
- Verifiser at `viewToken` felt eksisterer
- Sjekk console for warnings

## Testing Checklist

- [ ] RESEND_API_KEY er satt
- [ ] Development server restartet
- [ ] Kunde har gyldig e-postadresse
- [ ] Console viser ingen errors
- [ ] Resend dashboard viser sendt e-post
- [ ] E-post mottatt i inbox
- [ ] Tilbudsvisnings-lenke fungerer
- [ ] viewToken er lagret i database

## Debug Commands

### Sjekk Environment Variable
```bash
# Windows PowerShell
$env:RESEND_API_KEY

# Windows CMD
echo %RESEND_API_KEY%
```

### Sjekk Firebase Connection
```bash
firebase projects:list
```

### Test E-post Manuelt via Resend
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Proanbud <post@proanbud.no>",
    "to": ["test@example.com"],
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

## Neste Gang

For å unngå dette problemet i fremtiden:

1. ✅ **Bedre feilmeldinger** - Implementert
2. ✅ **Detaljert logging** - Implementert
3. ✅ **User feedback** - Implementert
4. 📋 **Health check endpoint** - TODO
5. 📋 **Email preview** - TODO
6. 📋 **Test mode** - TODO

## Support

Hvis problemet fortsetter:
1. Sjekk `.env.local` filen
2. Restart VS Code
3. Clear browser cache
4. Sjekk Resend API status
5. Se server logs i terminal

---

**Oppdatert:** 2025-10-08  
**Status:** Feilsøking forbedret med bedre logging og feilmeldinger
