# Sanity Blogg - Hurtigstart

## 🚀 Kom i gang på 5 minutter

### 1. Installer pakker
```bash
pnpm install
```

### 2. Opprett Sanity-prosjekt
1. Gå til [sanity.io](https://www.sanity.io/)
2. Opprett nytt prosjekt → Kopier Project ID

### 3. Konfigurer miljøvariabler
```bash
# Opprett .env.local
NEXT_PUBLIC_SANITY_PROJECT_ID=din_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

### 4. Start prosjektet
```bash
pnpm dev
```

- **Frontend:** http://localhost:3000
- **Blogg:** http://localhost:3000/blogg
- **Sanity Studio:** http://localhost:3000/studio

### 5. Legg til innhold
1. Gå til http://localhost:3000/studio
2. Logg inn med Sanity-brukeren din
3. Opprett kategori → Opprett forfatter → Opprett blogginnlegg
4. Klikk "Publish"

### 6. Deploy til Vercel
```bash
git add .
git commit -m "feat: Legg til Sanity blogg"
git push
```

På Vercel:
1. Import repository
2. Legg til miljøvariabler
3. Deploy!

### 7. Konfigurer CORS i Sanity
1. Gå til [Sanity Dashboard](https://www.sanity.io/manage)
2. Settings → API → CORS Origins
3. Legg til: `https://proanbud.no` og `http://localhost:3000`

## ✅ Ferdig!

Les mer i [BLOGG_SETUP.md](./BLOGG_SETUP.md) for detaljert dokumentasjon.
