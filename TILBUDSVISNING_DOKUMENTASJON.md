# Offentlig Tilbudsvisning - Dokumentasjon

## Oversikt

Denne funksjonen lar kunder se, godkjenne/avvise, og kommentere på tilbud uten å måtte logge inn. Tilbudet sendes via e-post med en sikker lenke som inneholder en unik token.

## Arkitektur

### Sikkerhet
- **ViewToken**: Hvert tilbud får automatisk generert en unik 32-tegns token ved opprettelse
- **Ingen autentisering påkrevd**: Kunder får tilgang via token i URL
- **Database rules**: Firebase Realtime Database rules tillater lesing av tilbud med gyldig viewToken

### Komponenter

#### 1. Backend API
- **`/api/quotes/[id]`**: Henter tilbudsdata med token-verifisering
- **`/api/quotes/[id]/feedback`**: Håndterer kunde-feedback (godkjenning, avvisning, spørsmål)

#### 2. Frontend
- **`/tilbudsvisning/[id]`**: Offentlig tilbudsvisningsside med:
  - Profesjonelt dokument-design
  - Fullstendig prissammendrag
  - Godkjenn/avvis-knapper
  - Chat/kommentar-funksjonalitet

#### 3. E-postutsendelse
- Vakkert designet HTML-e-post
- Tydelig lenke til tilbudsvisning
- Oversikt over funksjonalitet

### Database Struktur

```
users/
  {userId}/
    tilbud/
      {tilbudId}/
        viewToken: "abc123..."  // Unik 32-tegns token
        kundenavn: "..."
        prosjekt: "..."
        belop: 150000
        status: "venter"
        ...
```

### Flyt

1. **Håndverker oppretter tilbud**
   - Tilbud lagres med automatisk generert viewToken
   - E-post sendes til kunde med link

2. **Kunde mottar e-post**
   - Inneholder pen oversikt og CTA-knapp
   - Link: `https://domain.com/tilbudsvisning/{id}?token={viewToken}`

3. **Kunde åpner tilbudsvisning**
   - Token valideres mot database
   - Tilbud vises med full info og prissammendrag

4. **Kunde interagerer**
   - **Godkjenn**: Status endres til "vunnet", melding til innboks
   - **Avvis**: Status endres til "tapt", melding til innboks  
   - **Spørsmål**: Melding sendes til håndverkerens innboks

5. **Håndverker mottar tilbakemelding**
   - Melding dukker opp i innboks med riktig type
   - Link tilbake til tilbudet for kontekst

## Bruk

### For Utviklere

#### Opprette tilbud med viewToken
```typescript
import { createTilbud } from '@/lib/services/tilbudService';

const quoteId = await createTilbud({
  kundenavn: "Ole Nordmann",
  prosjekt: "Kjøkkenrenovering",
  // ...
});

// ViewToken genereres automatisk
```

#### Hente tilbud med token (kunde-side)
```typescript
const response = await fetch(`/api/quotes/${quoteId}?token=${token}`);
const { quote, businessSettings } = await response.json();
```

#### Sende feedback
```typescript
await fetch(`/api/quotes/${quoteId}/feedback`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: token,
    message: "Når kan dere starte?",
    type: 'question',
    customerName: 'Ole Nordmann'
  })
});
```

### Typer

```typescript
interface Tilbud {
  id: string;
  viewToken?: string;  // Ny
  userId?: string;     // Ny
  kundenavn: string;
  prosjekt: string;
  belop: number;
  status: 'draft' | 'venter' | 'vunnet' | 'tapt';
  // ...
}

interface InboxMessage {
  type: 'quote_approved' | 'quote_rejected' | 'quote_question' | ...;
  quoteId?: string;
  customerName?: string;
  // ...
}
```

## Testing

1. **Opprett et tilbud** via dashboard
2. **Åpne e-post** (sjekk Resend dashboard i dev)
3. **Klikk på "Se tilbud og svar"**
4. **Test funksjonalitet**:
   - Verifiser at alle data vises korrekt
   - Test godkjenning
   - Test avvisning
   - Test å sende spørsmål
5. **Sjekk innboks** i håndverker-dashboard

## Sikkerhetstiltak

✅ Token-basert tilgang (32 tegn, kryptografisk sikker)
✅ Ingen sensitiv data eksponert uten token
✅ Database rules sikrer at kun tilbud med token er lesbare
✅ Rate limiting på API-endepunkter (håndteres av Next.js)
✅ XSS-beskyttelse via React (automatisk escaping)

## Fremtidige Forbedringer

- [ ] Notifikasjoner til håndverker ved kunde-interaksjon
- [ ] Mulighet for kunde å laste opp bilder/dokumenter
- [ ] Signatur-funksjonalitet for formell godkjenning
- [ ] PDF-eksport av tilbud
- [ ] Automatisk påminnelse ved nærming av svarfrist
- [ ] Anonymisert sporing (Google Analytics) av åpningsrate

## Feilsøking

### Tilbud ikke tilgjengelig
- Sjekk at `viewToken` finnes i databasen
- Verifiser at token i URL matcher token i database
- Sjekk Firebase Database rules er deployet

### E-post ikke sendt
- Sjekk `RESEND_API_KEY` er satt i environment variables
- Verifiser at avsender-domene er verifisert i Resend
- Sjekk Resend logs for feilmeldinger

### Feedback ikke mottas
- Sjekk at innboks-meldinger opprettes i Firebase
- Verifiser at userId er riktig i tilbudet
- Sjekk console for API-feil

## Deployment

### Environment Variables
```env
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
# ... andre Firebase config
```

### Database Rules
Deploy rules til Firebase:
```bash
firebase deploy --only database
```

## Support

For spørsmål eller problemer, kontakt utviklingsteamet eller opprett en issue i repository.
