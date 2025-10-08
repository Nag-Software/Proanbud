# Dashboard Enhancements - Total Profitt & KPI Customization

## Dato: 2025-10-08

## Endringer

### 1. Total Profitt KPI Card
- ✅ Lagt til "Total Profitt" som ny KPI-card på dashboard
- Profitt beregnes fra alle godkjente tilbud (status: 'vunnet')
- Profitt hentes fra `prisgrunnlag` array, der komponenter med `category: 'margin'` representerer fortjeneste
- Viser endring fra forrige måned (prosent)
- Bruker `TrendingUp` ikon fra Lucide

### 2. Forbedret Tilpass-Mode Sidebar
- ✅ Ny, forbedret sidebar når "Tilpass Siden" er aktivert
- Delt i to seksjoner:
  - **Live Komponenter** - Viser hvilke komponenter som er aktive på dashboard med grønn indikator
  - **Tilgjengelige Komponenter** - Viser komponenter som kan legges til
- Visuell indikasjon med farge-coding:
  - Grønn prikk (🟢) = Live/aktiv komponent
  - Grå prikk (⚫) = Tilgjengelig komponent
- Teller som viser antall live vs tilgjengelige komponenter
- Animert grønn pulserende indikator for "Live" seksjonen

### 3. Analytics Service Oppdateringer
- Oppdatert `UserAnalytics` interface med `totalProfit` felt
- Oppdatert `MonthlyData` interface med `profitt` felt for månedlig profitt-tracking
- Oppdatert `updateUserAnalytics()` for å beregne profitt fra tilbud
- Oppdatert `calculateAnalyticsFromTilbud()` for sanntids profitt-beregning
- Oppdatert `getDashboardKPIsWithChange()` for å inkludere profitt KPI med endring fra forrige måned

## Teknisk Implementasjon

### Analytics Beregning
```typescript
// Beregner profitt fra margin komponenter i prisgrunnlag
if (tilbud.status === 'vunnet') {
  if (tilbud.prisgrunnlag && Array.isArray(tilbud.prisgrunnlag)) {
    const marginComponents = tilbud.prisgrunnlag.filter(
      (comp: any) => comp.category === 'margin'
    );
    const tilbudProfit = marginComponents.reduce(
      (sum: number, comp: any) => sum + (comp.amount || 0), 
      0
    );
    totalProfit += tilbudProfit;
    monthData.profitt += tilbudProfit;
  }
}
```

### UI Forbedringer
- Sidebar bredde økt til 96 (24rem) for bedre lesbarhet
- Forbedret visuell hierarki med seksjoner
- Hover-effekter på komponenter
- Smooth transitions og animasjoner
- Bedre spacing og typography

## Filer Endret

1. **src/lib/services/analyticsService.ts**
   - Lagt til `totalProfit` i `UserAnalytics` interface
   - Lagt til `profitt` i `MonthlyData` interface
   - Implementert profitt-beregning i `updateUserAnalytics()`
   - Implementert profitt-beregning i `calculateAnalyticsFromTilbud()`
   - Lagt til profitt KPI i `getDashboardKPIsWithChange()`

2. **src/app/(dashboard)/dashboard/page.tsx**
   - Redesignet edit-mode sidebar med to seksjoner
   - Lagt til visuell indikasjon for live vs tilgjengelige komponenter
   - Forbedret UX med bedre spacing og visuell feedback

## Fremtidige Forbedringer
- [ ] Legg til mulighet for å drag-and-drop komponenter i sidebar for rekkefølge
- [ ] Legg til forhåndsvisning av komponenter i sidebar
- [ ] Legg til mulighet for å eksportere/importere dashboard-layout
- [ ] Legg til flere KPI-cards (f.eks. gjennomsnittlig responstid, kundetilfredshet)
- [ ] Implementer profitt-margin prosentvis analyse

## Testing
Før deploy:
1. Test at profitt beregnes riktig fra godkjente tilbud
2. Verifiser at live/tilgjengelig indikasjon fungerer korrekt
3. Test add/remove komponenter funksjonalitet
4. Sjekk at layout lagres riktig i Firebase
5. Verifiser at prosent-endring for profitt vises riktig
