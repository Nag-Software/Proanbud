# 📚 Proanbud Blogg - Komplett Oppsettguide

Dette dokumentet forklarer hvordan du setter opp og deployer bloggen din med Next.js og Sanity CMS.

---

## 📋 Innholdsfortegnelse

1. [Prosjektstruktur](#prosjektstruktur)
2. [Sanity CMS Oppsett](#sanity-cms-oppsett)
3. [Miljøvariabler](#miljøvariabler)
4. [Kjøre prosjektet lokalt](#kjøre-prosjektet-lokalt)
5. [Deploy til Vercel](#deploy-til-vercel)
6. [Administrere innhold](#administrere-innhold)
7. [Tilpasning og utvidelse](#tilpasning-og-utvidelse)

---

## 🗂️ Prosjektstruktur

```
Proanbud/
├── src/
│   ├── app/
│   │   ├── blogg/
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx        # Dynamisk blogginnlegg-side
│   │   │   └── page.tsx             # Blogg-oversikt
│   │   └── studio/
│   │       └── [[...index]]/
│   │           ├── page.tsx         # Sanity Studio
│   │           └── layout.tsx
│   └── lib/
│       └── sanity.ts                # Sanity klient og queries
├── sanity/
│   └── schemas/
│       ├── post.ts                  # Blogginnlegg schema
│       ├── author.ts                # Forfatter schema
│       ├── category.ts              # Kategori schema
│       ├── blockContent.ts          # Rich text schema
│       └── index.ts                 # Schema export
├── sanity.config.ts                 # Sanity Studio konfigurasjon
├── .env.local.example               # Eksempel på miljøvariabler
└── package.json
```

---

## 🚀 Sanity CMS Oppsett

### Steg 1: Opprett Sanity-prosjekt

1. Gå til [sanity.io](https://www.sanity.io/) og logg inn (eller registrer deg)
2. Klikk på **"Create new project"**
3. Velg et navn: `Proanbud Blogg`
4. Velg dataset: `production`
5. Velg region: `EU (Europe)` (GDPR-vennlig)
6. Klikk **"Create"**

### Steg 2: Hent prosjekt-ID

1. På Sanity Dashboard, finn prosjekt-ID (ser slik ut: `abc123xy`)
2. Kopier denne - du trenger den til `.env.local`

### Steg 3: Generer API-token (valgfritt)

For å kunne publisere innhold fra Studio:

1. Gå til **Settings** → **API** → **Tokens**
2. Klikk **"Add API token"**
3. Gi det et navn: `Proanbud Editor`
4. Velg **Editor** (les og skriv)
5. Klikk **"Create"** og kopier token

---

## 🔐 Miljøvariabler

### Steg 1: Opprett `.env.local` fil

I roten av prosjektet, opprett en fil kalt `.env.local`:

```bash
# Windows PowerShell
Copy-Item .env.local.example .env.local

# Mac/Linux
cp .env.local.example .env.local
```

### Steg 2: Fyll inn verdier

Åpne `.env.local` og fyll inn:

```env
# Sanity CMS miljøvariabler
NEXT_PUBLIC_SANITY_PROJECT_ID=abc123xy          # Din prosjekt-ID fra Sanity
NEXT_PUBLIC_SANITY_DATASET=production            # Dataset (vanligvis "production")

# Sanity API tokens (valgfritt - kun for preview mode)
SANITY_API_READ_TOKEN=sk***                     # Read token fra Sanity
SANITY_API_WRITE_TOKEN=sk***                    # Write token fra Sanity
```

**⚠️ VIKTIG:** Legg aldri `.env.local` i Git! Den er allerede i `.gitignore`.

---

## 💻 Kjøre prosjektet lokalt

### Steg 1: Installer avhengigheter

```bash
pnpm install
```

### Steg 2: Start utviklingsserver

```bash
pnpm dev
```

Prosjektet er nå tilgjengelig på:
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Blogg:** [http://localhost:3000/blogg](http://localhost:3000/blogg)
- **Sanity Studio:** [http://localhost:3000/studio](http://localhost:3000/studio)

### Steg 3: Åpne Sanity Studio

1. Gå til [http://localhost:3000/studio](http://localhost:3000/studio)
2. Logg inn med samme bruker som på sanity.io
3. Du vil se en tom studio - klar til å legge til innhold!

---

## 🌐 Deploy til Vercel

### Steg 1: Push kode til GitHub

```bash
git add .
git commit -m "feat: Legg til Sanity blogg"
git push origin main
```

### Steg 2: Koble til Vercel

1. Gå til [vercel.com](https://vercel.com)
2. Klikk **"Import Project"**
3. Velg ditt GitHub repository
4. Konfigurer:
   - **Framework Preset:** Next.js
   - **Root Directory:** `.` (rot)
   - **Build Command:** `pnpm build` (eller `npm run build`)
   - **Output Directory:** `.next`

### Steg 3: Legg til miljøvariabler

I Vercel, under **Settings** → **Environment Variables**, legg til:

```
NEXT_PUBLIC_SANITY_PROJECT_ID = abc123xy
NEXT_PUBLIC_SANITY_DATASET = production
```

### Steg 4: Deploy

Klikk **"Deploy"** - Vercel bygger og deployer automatisk!

### Steg 5: Konfigurer Sanity CORS

For at Studio skal fungere i produksjon:

1. Gå til [Sanity Dashboard](https://www.sanity.io/manage)
2. Velg ditt prosjekt → **Settings** → **API** → **CORS Origins**
3. Klikk **"Add CORS origin"**
4. Legg til:
   - `https://proanbud.no` (din produksjonsdomene)
   - `https://*.vercel.app` (Vercel preview URLs)
   - `http://localhost:3000` (lokal utvikling)
5. Klikk **"Add"**

---

## ✍️ Administrere innhold

### Legge til første blogginnlegg

1. Gå til [https://proanbud.no/studio](https://proanbud.no/studio) (eller `localhost:3000/studio`)
2. Logg inn med Sanity-brukeren din

#### Opprett kategori (anbefalt først)
1. Klikk **"Kategorier"** i venstre meny
2. Klikk **"+ Create"**
3. Fyll inn:
   - **Tittel:** "Tips & Triks"
   - **URL-slug:** Klikk "Generate" for auto-generering
   - **Beskrivelse:** "Praktiske tips for bedre tilbud"
4. Klikk **"Publish"**

#### Opprett forfatter (valgfritt)
1. Klikk **"Forfattere"** i venstre meny
2. Klikk **"+ Create"**
3. Fyll inn:
   - **Navn:** "Proanbud Team"
   - **URL-slug:** Klikk "Generate"
   - **Biografi:** "Vi hjelper bedrifter med å lage bedre tilbud."
4. Klikk **"Publish"**

#### Opprett blogginnlegg
1. Klikk **"Blogginnlegg"** i venstre meny
2. Klikk **"+ Create"**
3. Fyll inn:
   - **Tittel:** "Hvordan lage profesjonelle tilbud på 5 minutter"
   - **URL-slug:** Klikk "Generate" for auto-generering fra tittel
   - **Sammendrag:** "Lær hvordan du effektiviserer tilbudsprosessen..."
   - **Publiseringsdato:** Velg dagens dato
   - **Forfatter:** Velg "Proanbud Team"
   - **Kategorier:** Velg "Tips & Triks"
   - **Innhold:** Skriv innholdet med rich text editor
4. Klikk **"Publish"**

### Innholdstips

**Rich Text Editor:**
- **H2-H4:** For overskrifter i innholdet
- **Fet/Kursiv:** For å utheve tekst
- **Lenker:** Klikk lenke-ikonet, lim inn URL
- **Bilder:** Klikk bilde-ikonet, last opp fra disk
- **Kodeblokker:** Klikk kode-ikonet, velg språk
- **Lister:** Punktlister og nummererte lister

**SEO-tips:**
- Fyll ut **Sammendrag** (vises i Google)
- Bruk **SEO-innstillinger** for custom meta-tittel og beskrivelse
- Legg til **Alt-tekst** på alle bilder
- Bruk **Kategorier** for bedre organisering

---

## 🎨 Tilpasning og utvidelse

### Endre farger

I `src/app/blogg/page.tsx` og `[slug]/page.tsx`, finn disse Tailwind-klassene:

```tsx
// Grønn primærfarge
from-[#00b85b] to-[#00854a]  // Endre til dine farger
text-[#00b85b]               // Tekst
bg-[#82ffb2]                 // Knapper
```

### Legge til flere felt i blogginnlegg

1. Åpne `sanity/schemas/post.ts`
2. Legg til nytt felt:

```typescript
defineField({
  name: 'featured',
  title: 'Featured innlegg',
  type: 'boolean',
  description: 'Vis dette innlegget øverst',
  initialValue: false,
}),
```

3. Oppdater `src/lib/sanity.ts` GROQ-query:

```typescript
export const allPostsQuery = `
  *[_type == "post" && publishedAt <= now()] | order(featured desc, publishedAt desc) {
    // ... resten av feltene
    featured
  }
`
```

### Legge til søk i bloggen

Du kan bruke Sanity's innebygde søk:

```typescript
export const searchPostsQuery = `
  *[_type == "post" && [title, excerpt, body] match $searchQuery] {
    // ... felter
  }
`
```

### Legge til relaterte innlegg

I `sanity/schemas/post.ts`:

```typescript
defineField({
  name: 'relatedPosts',
  title: 'Relaterte innlegg',
  type: 'array',
  of: [{ type: 'reference', to: [{ type: 'post' }] }],
  validation: (Rule) => Rule.max(3),
}),
```

---

## 🔧 Feilsøking

### Problem: "Project ID not found"
**Løsning:** Sjekk at `NEXT_PUBLIC_SANITY_PROJECT_ID` i `.env.local` er riktig.

### Problem: Ingen innlegg vises
**Løsning:** 
1. Sjekk at innlegget er **publisert** i Studio
2. Sjekk at **Publiseringsdato** er i fortiden
3. Restart dev server: `pnpm dev`

### Problem: Studio lastes ikke
**Løsning:**
1. Sjekk at CORS er konfigurert i Sanity Dashboard
2. Sjekk Console for feilmeldinger (F12 i browser)

### Problem: Bilder vises ikke
**Løsning:**
1. Legg til Sanity domene i `next.config.ts`:

```typescript
images: {
  domains: ['cdn.sanity.io'],
},
```

---

## 📊 Nyttige kommandoer

```bash
# Installere avhengigheter
pnpm install

# Starte utviklingsserver
pnpm dev

# Bygge for produksjon
pnpm build

# Kjøre produksjonsbygget lokalt
pnpm start

# Linting og formatering
pnpm lint

# TypeScript type-sjekk
pnpm typecheck
```

---

## 📚 Ressurser

- **Sanity Dokumentasjon:** [https://www.sanity.io/docs](https://www.sanity.io/docs)
- **Next.js Dokumentasjon:** [https://nextjs.org/docs](https://nextjs.org/docs)
- **GROQ Query Language:** [https://www.sanity.io/docs/groq](https://www.sanity.io/docs/groq)
- **Vercel Deployment:** [https://vercel.com/docs](https://vercel.com/docs)

---

## 🎯 Neste steg

- [ ] Legg til flere blogginnlegg
- [ ] Konfigurer custom domene for Studio (studio.proanbud.no)
- [ ] Sett opp automatisk bildeoptimalisering
- [ ] Legg til RSS-feed for bloggen
- [ ] Implementer kommentarfunksjon
- [ ] Sett opp Google Analytics
- [ ] Legg til social sharing-knapper

---

## ✅ Ferdig!

Du har nå en komplett blogg med:
- ✅ Sanity CMS for innholdsadministrasjon
- ✅ Next.js med App Router og SSG
- ✅ SEO-optimalisert med metadata
- ✅ Norsk datoformatering
- ✅ Responsive design med Tailwind CSS
- ✅ Rich text editor med bilder og kodeblokker
- ✅ Klar for deploy til Vercel

**Lykke til med bloggen! 🚀**
