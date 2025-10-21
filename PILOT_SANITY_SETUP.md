# Pilot-side Content Management Setup

Denne guiden forklarer hvordan du setter opp og administrerer innholdet på pilot-siden gjennom Sanity CMS.

## 🚀 Oversikt

Pilot-siden er nå konfigurert til å hente all tekst, statistikk og annen innhold fra Sanity CMS. Dette gjør det enkelt å oppdatere innholdet uten å endre kode.

## 📋 Forutsetninger

1. **Sanity CMS konfigurert** - Du må ha et Sanity-prosjekt med riktige environment-variabler:
   ```bash
   NEXT_PUBLIC_SANITY_PROJECT_ID=din_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

2. **Sanity Studio tilgjengelig** på `/studio`

## 🛠️ Oppsett

### 1. Kjør utviklingsserveren
```bash
npm run dev
```

### 2. Åpne Sanity Studio
Naviger til `http://localhost:3000/studio` (eller porten som vises i terminalen)

### 3. Opprett pilot-innhold
1. I Sanity Studio, klikk på "Pilot-side" i venstre meny
2. Klikk "Create new document" eller rediger eksisterende dokument
3. Fyll ut følgende felt:

#### Grunnleggende informasjon
- **Tittel**: Hovedtittel på siden (f.eks. "Bli vår nye Pilotkunde")
- **Undertittel**: Beskrivelse under tittelen
- **Badge-tekst**: Tekst i badge-et (f.eks. "Begrenset Pilotprogram")
- **Antall plasser**: Totalt antall tilgjengelige pilotplasser (f.eks. 15)
- **Brukte plasser**: Antall aktive piloter som allerede er påmeldt (f.eks. 0)
- **Plasser-tekst**: Tekst etter antall (f.eks. "plasser igjen")

#### Prissetting
- **Beløp**: Månedspris (f.eks. 99)
- **Valuta**: Valutasymbol (f.eks. "kr")
- **Periode**: Tidsperiode (f.eks. "måned")

#### Hero-beskrivelse
Beskrivelse som vises i hero-seksjonen

#### Statistikk/Metrikker
Array med nøkkeltall som vises på siden:
- **Merkelapp**: Kort beskrivelse (f.eks. "Gj.sn. tid spart per tilbud")
- **Verdi**: Det faktiske tallet (f.eks. "30–45%")
- **Beskrivelse**: Full beskrivelse

#### AI-kort
Informasjon som vises i det høyre kortet:
- **Tittel**: Kort tittel (f.eks. "AI-drevet presisjon")
- **Beskrivelse**: Lengre beskrivelse
- **Prosent fylte plasser**: Beregnet automatisk basert på brukte/total plasser
- **Gjenværende plasser**: Beregnet automatisk basert på total - brukte plasser

#### Tillitsindikatorer
Liste med punkter som bygger tillit (ingen binding, GDPR, etc.)

#### Prosess-steg
De tre hovedstegene i pilotprogrammet

#### FAQ
Ofte stilte spørsmål med svar

## 🔄 Hvordan oppdatere innhold

1. Åpne Sanity Studio på `/studio`
2. Klikk på "Pilot-side" i venstre meny
3. Rediger dokumentet
4. Publiser endringene
5. Siden oppdateres automatisk

## 📊 Tilgjengelige felter

### Statistikk som kan tilpasses:
- Tid spart per tilbud
- Økt vinnerandel
- Potensielle timer spart per måned
- Prissetting
- Antall plasser (totalt og brukte)
- Progress-indikatorer

### Tekstinnhold som kan tilpasses:
- Alle overskrifter og beskrivelser
- CTA-knappetekst
- Trust indicators
- Prosess-steg
- FAQ-spørsmål og svar

## 🧪 Testing

For å teste at alt fungerer:

1. Åpne pilot-siden: `http://localhost:3000/pilot`
2. Gjør endringer i Sanity Studio
3. Publiser endringene
4. Refresh pilot-siden for å se oppdateringene

## 🔧 Feilsøking

### Siden viser ikke oppdateringer
- Sørg for at du har publisert endringene i Sanity Studio
- Sjekk nettleserens cache (hard refresh: Cmd+Shift+R)

### Sanity Studio laster ikke
- Sjekk at environment-variablene er riktige
- Sørg for at Sanity-prosjektet eksisterer og er tilgjengelig

### Feil i konsollen
- Sjekk at alle required environment-variabler er satt
- Verifiser at Sanity-skjemaet er korrekt importert

## 📝 Seed Data

Hvis du vil populere Sanity med eksempeldata, kan du kjøre:

```bash
# Sørg for at environment-variabler er satt
node scripts/seed-pilot.js
```

Dette lager et komplett pilot-dokument med eksempeldata.

## 🎯 Neste steg

Når pilot-innholdet er satt opp:

1. Test redigering av innhold i Sanity Studio
2. Verifiser at endringene vises på pilot-siden
3. Konfigurer eventuelle tilleggsfelter du trenger
4. Sett opp brukerrettigheter for content editors

## 📞 Support

Hvis du støter på problemer:

1. Sjekk Sanity Studio på `/studio` for feilmeldinger
2. Verifiser environment-variabler i `.env.local`
3. Sjekk nettleserens developer tools for JavaScript-feil
4. Sørg for at Next.js-serveren kjører (`npm run dev`)