# Proanbud Pilot Landing Page

Dette er en komplett, mobil-first pilot-landingside for Proanbud AI-tilbudstjeneste.

## Struktur

- `src/app/pilot/page.tsx`: Hovedside for pilotprogrammet
- `src/components/`: Reusable komponenter (Hero, SignupForm, etc.)
- `src/app/api/pilot-signup/route.js`: API endpoint for å håndtere påmeldinger
- `public/proanbud-pilotavtale.html`: Pilotavtale som HTML (konverter til PDF manuelt)

## Miljøvariabler

Sett følgende i `.env.local`:

- `WEBHOOK_URL`: URL for webhook å sende leads til (valgfritt)
- `POSTHOG_API_KEY`: API key for PostHog analytics
- `POSTHOG_HOST`: Host for PostHog (default https://app.posthog.com)

## Hvordan kjøre lokalt

1. Installer dependencies: `pnpm install`
2. Kjør dev server: `pnpm dev`
3. Åpne http://localhost:3000/pilot

## Deploy

Bygg og deploy som vanlig Next.js app. For eksempel til Vercel eller Netlify.

## Oppdatere tall etter pilot

Åpne `src/app/pilot/page.tsx` og oppdater `SUGGESTED_METRICS` objektet med reelle tall.

Eksempel:

```js
const SUGGESTED_METRICS = {
  time_saved: '35%',  // Oppdater her
  win_rate: '+12%',   // Oppdater her
  hours_saved: '80 h', // Oppdater her
};
```

## Generere PDF fra HTML

Bruk en kommando som:

```bash
wkhtmltopdf public/proanbud-pilotavtale.html public/proanbud-pilotavtale.pdf
```

Eller bruk en online converter.

## Analytics

PostHog events:

- `pilot_cta_clicked`: Når primær CTA klikkes
- `pilot_form_submitted`: Når skjema sendes (payload: company, email, proposals_per_month)
- `pilot_agreement_downloaded`: Når avtalen lastes ned

## Tester

Kjør tester med `pnpm test`. Inkluderer enhetstester for formvalidering.

## Leads

Leads lagres i `leads.json` i root. For produksjon, bruk en database eller webhook.