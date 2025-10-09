# 🚨 CORS-feil løsning for Sanity Studio

## Problemet
Du får en `CorsOriginError` fordi Sanity ikke tillater requests fra `localhost:3000` ennå.

## Løsning

### Steg 1: Logg inn på Sanity
1. Gå til [https://www.sanity.io/manage](https://www.sanity.io/manage)
2. Logg inn med din konto

### Steg 2: Velg prosjektet ditt
1. Finn og klikk på prosjektet ditt (f.eks. "Proanbud Blogg")
2. Hvis du ikke har opprettet prosjekt ennå, klikk **"Create new project"**

### Steg 3: Konfigurer CORS
1. I venstre meny, klikk **"API"**
2. Scroll ned til **"CORS Origins"**
3. Klikk **"Add CORS origin"**
4. Legg til følgende URLs (en om gangen):

   ```
   http://localhost:3000
   ```
   
   Klikk **"Add"**

5. (Valgfritt) Legg også til for produksjon senere:
   ```
   https://proanbud.no
   https://studio.proanbud.no
   https://*.vercel.app
   ```

### Steg 4: Hent Project ID
1. På samme side, finn **"Project ID"**
2. Kopier project ID (ser ut som: `abc12xyz`)
3. Åpne `.env.local` i prosjektet ditt
4. Sett inn:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=abc12xyz
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

### Steg 5: Restart dev server
```bash
# Stopp serveren (Ctrl+C)
# Start på nytt
pnpm dev
```

### Steg 6: Åpne Studio
Gå til [http://localhost:3000/studio](http://localhost:3000/studio)

---

## Hvis du ikke har opprettet Sanity-prosjekt ennå

### Opprett nytt prosjekt via CLI (raskeste måte):

```bash
# I prosjekt-mappen
pnpm sanity init

# Følg instruksjonene:
# 1. Logg inn med Google/GitHub
# 2. Velg "Create new project"
# 3. Gi det et navn: "Proanbud Blogg"
# 4. Velg dataset: "production"
# 5. Kopier Project ID som vises
```

Deretter oppdater `.env.local` med Project ID.

---

## Sjekkliste

- [ ] Opprettet Sanity-prosjekt
- [ ] Lagt til CORS origin for `http://localhost:3000`
- [ ] Kopiert Project ID til `.env.local`
- [ ] Restartet dev server
- [ ] Testet `/studio` route

---

## Trenger du hjelp?

Se [BLOGG_SETUP.md](./BLOGG_SETUP.md) for fullstendig guide!
