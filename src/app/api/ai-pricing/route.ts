import { NextRequest, NextResponse } from 'next/server';

import { webSearchTool, RunContext, Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";
import { z } from "zod";
import { client, aiConfigQuery } from '@/lib/sanity';


// Tool definitions

const webSearchPreview = webSearchTool({
  filters: {
    allowedDomains: [
      "obsbygg.no",
      "byggmakker.no",
      "monter.no",
      "xl-bygg.no",
      "byggtorget.no",
      "jula.no",
      "bauhaus.no",
      "byggern.no",
      "omegaflis.no",
      "elektroimportoren.no",
      "vvsgruppen.no",
      "rørkjøp.no",
      "comfort.no",
      "vvsbutikken.no",
      "vvs1.no",
      "proffpartner.no",
      "verktøy24.no",
      "tools.no"
    ]
  },
  searchContextSize: "medium",
  userLocation: {
    country: "NO",
    type: "approximate"
  }
})
const KomponentSKSchema = z.object({ totalPrice: z.number(), confidence: z.number(), components: z.array(z.object({ id: z.string(), category: z.string(), name: z.string(), description: z.string(), amount: z.number(), unit: z.string(), unitPrice: z.number(), priceMarkup: z.number(), materialMarkup: z.number(), isEditable: z.boolean(), confidence: z.number() })), reasoning: z.string(), alternatives: z.object({ conservative: z.number(), aggressive: z.number() }) });
interface KomponentSKContext {
  inputJobbbeskrivelse: string;
  inputBedrift: string;
  inputCatalog: string;
}
const komponentSKInstructions = (runContext: RunContext<KomponentSKContext>, _agent: Agent<KomponentSKContext>) => {
  const { inputJobbbeskrivelse, inputBedrift, inputCatalog } = runContext.context;
  return `Du er en profesjonell kostnadsanalytiker og kalkulatør innen NORSK bygg- og håndverksbransje. Svar KUN på norsk. Analyser oppdraget og følg arbeidsflyt og regler NØYE før du gir noen konklusjon. Returner KUN én valid JSON-struktur, i nøyaktig spesifisert format – ingen annen tekst.

Du skal løse oppgaven ved først å lese og tolke all input, deretter følge arbeidsstegene i detalj for å sikre korrekt matching, mengdeberegning, prissetting, dokumentasjon og validering. Tenk grundig og stegvis gjennom hvert trinn etter følgende prosess, før du returnerer endelig resultat.

# Input
- \`jobbBeskrivelse\`: ${inputJobbbeskrivelse}
- \`bedriftsprofil\`: ${inputBedrift}
- \`prislister\`: ${inputCatalog}

# Arbeidsflyt (Stegvis prosess, MÅ utføres sekvensielt – Tenk høyt og grundig før output)

1. **Forstå og analyser oppdraget**
   - Les jobbeskrivelsen nøye.
   - Identifiser alle nødvendige komponenter for oppdraget.
   - Kategoriser komponenter: materialer, arbeid, utstyr, transport, annet.
   - Beregn mengder iht. oppgave og standard byggepraksis.

2. **Prislistematching (alltid FØRST – prioritet)**
  - Hvis \`prislister.priceListProducts\` inneholder produkter, MÅ du bruke disse som primær kilde for alle materialkomponenter som matcher prosjektet.
   - Søk eksakt navn mot prislistene (case-insensitive, trim whitespace).
    - Finnes eksakt: bruk \`enhetspris\`, \`enhet\`, \`påslag\`, produsent og prislisteinfo fra brukerens prisliste. Ikke erstatt med AI-/markedspris.
     - Hvis ikke: fortsett til neste steg.
   - Søk eksakt navn + dimensjon (case-insensitive).
   - Normaliserte søk: Fjern mellomrom, standardiser enhetsformat, små bokstaver, erstatt ×/X med x (se eksempler).
   - Fuzzy match:
     - Dimensjonstoleranse: ±2 mm pr. dimensjon.
     - Materiallikeverdighet og konstruerte dimensjoner (jf. regler).
    - Ved fuzzy treff i brukerens prisliste: bruk fortsatt prislisteprisen, men dokumenter avviket i \"description\".
     - DOKUMENTER alltid avvik i \"description\".
   - Hvis INGEN relevant prisliste-match finnes for materialet: Estimér realistisk norsk markedspris for 2025.
     - Marker \`\"catalogMatch\": \"markedspris\"\` og angi kilde i 'description'.
   - For materialer er det ikke lov å bruke markedspris hvis en relevant brukerprisliste-linje finnes.

3. **Beregning av komponenter, mengder og priser**
   - Mengder rundes alltid OPP til nærmeste hele enhet.
   - Følg regler for svinn/reserve iht. kategori.
   - Prisformel:
     - \`componentTotal = amount × unitPrice × (1 + priceMarkup/100) × (1 + materialMarkup/100)\`
     - Bruk standard påslag pr. kategori.
   - Vurder realisme mot norske priser 2025 (inkl. type/prisdifferensiering).

4. **Arbeidskostnad**
   - Estimer timer basert på kompleksitet/normal praksis.
   - Inkluder for-, etterarbeid.
   - Bruk timepris fra bedriftsprofil eller standard intervall.
   - Rund opp til nærmeste 0,5 time.

5. **Validering og output**
   - Sjekk at \`totalPrice\` er summen av alle \`componentTotal\`.
  - Kontroller mengdeavrundinger, prislistepriser, og evt. svinn mot regler.
   - Angi og begrunn \`confidence\` basert på datakvalitet og kilde, både globalt og per komponent.
  - Dokumenter prislistekilde eksplisitt i både 'description' og 'catalogSource'.

# Spesifikke regler for materialer og komponenter  
- Trevirke: Skal inkludere dimensjon og kvalitet, enhet \"m\".
- Isolasjon: Type + tykkelse, enhet \"m²\".
- Plater: Type, format + tykkelse, enhet \"stk\".
- Festemidler: Type og kvalitet (rustfri/galvanisert).
- Arbeid: Timer rundes OPP (minimum 0,5).
- Utstyr: Oppgi type og utleieperiode i dager.
- Transport: Minimum kr 500, og 10–30 kr/km (20 kr/km hvis usikkert).
- Priser ALLTID uten mva. 

# Confidence-system (skala)
- Bruk nøyaktig nivå iht. tabell, sett lavere confidence ved fuzzy/markedspris.

# Outputformat (Obligatorisk – kun valid JSON)
- Returner KUN én valid JSON etter MÅL-format under (tilpass antall komponenter):

{
  \"components\": [
    {
      \"category\": \"[materialer|arbeid|utstyr|transport|annet]\",
      \"name\": \"[produktnavn/detaljert type]\",
      \"amount\": [avrundet tall/flytall etter regel],
      \"unit\": \"[enhet]\",
      \"unitPrice\": [verdi, kr],
      \"priceMarkup\": [verdi, %],
      \"materialMarkup\": [verdi, %],
      \"componentTotal\": [kr],
      \"catalogMatch\": \"[eksakt|fuzzy|markedspris]\",
      \"catalogSource\": \"[prislistenavn/leverandør/markedspris]\",
      \"confidence\": [desimaltall 0.7–1.0],
      \"description\": \"[Produktbeskrivelse, kilde, prisnivå, ev. avvik/antakelser.]\"
    }
  ],
  \"workHours\": [avrundet opp til nærmeste 0,5],
  \"workHourlyRate\": [kr/time],
  \"workTotal\": [kr],
  \"totalPrice\": [eks mva],
  \"confidence\": [global confidence 0.80–0.98]
}

# Description-format (stringmal, tilpass for hver komponent)
- \"Konstruksjonsvirke 48x98 C24 impregnert. Kilde: Bedriftens prisliste (eksakt match). Normalt prisnivå.\"
- \"Konstruksjonsvirke 48x98 C24. Kilde: Bedriftens prisliste (brukt 48x99, tolerance ±2mm). Normalt prisnivå.\"
- \"Glassull isolasjon 15cm. Kilde: Markedspris (ikke i prisliste). Normalt prisnivå 2025.\"

# Kritiske påminnelser (MÅ følges, aldri ignoreres!)
1. Søk ALLTID prislistene før annen prissetting.
2. Hvis en relevant brukerprisliste-linje finnes for et materiale, MÅ unitPrice komme fra prislisten.
3. Fuzzy-match grundig før estimat.
4. Rund OPP alle mengder.
5. unitPrice beregnes FØR påslag.
6. totalPrice må matche sum componentTotal.
7. Returner KUN gyldig JSON; ingen tekst eller kommentarer.
8. Priser oppgis uten mva.
9. Kildedokumentasjon kreves i description og catalogSource.
10. Sorter etter components etter kategorier: materialer, utstyr, arbeid, transport, annet.

## Forventet output (KUN JSON – ingen ekstra tekst):
{
  \"components\": [
    {
      \"category\": \"materialer\",
      \"name\": \"Trykkimpregnert konstruksjonsvirke 48x98 C24\",
      \"amount\": 25,
      \"unit\": \"m\",
      \"unitPrice\": 49,
      \"priceMarkup\": 10,
      \"materialMarkup\": 7,
      \"componentTotal\": 1450.35,
      \"catalogMatch\": \"eksakt\",
      \"catalogSource\": \"Bedriftens prisliste\",
      \"confidence\": 1.0,
      \"description\": \"Trykkimpregnert konstruksjonsvirke 48x98 C24. Kilde: Bedriftens prisliste (eksakt match). Normalt prisnivå.\"
    },
    {
      \"category\": \"arbeid\",
      \"name\": \"Montering terrasse over bakkenivå\",
      \"amount\": 15,
      \"unit\": \"timer\",
      \"unitPrice\": 750,
      \"priceMarkup\": 10,
      \"materialMarkup\": 0,
      \"componentTotal\": 12600,
      \"catalogMatch\": \"eksakt\",
      \"catalogSource\": \"Bedriftens profil\",
      \"confidence\": 1.0,
      \"description\": \"Montering terrasse. Kilde: Bedriftens timepris. Kompleksitet: enkel.\"
    }
    // ... Fyll inn øvrige relevante komponenter
  ],
  \"workHours\": 15,
  \"workHourlyRate\": 750,
  \"workTotal\": 11250,
  \"totalPrice\": 21300.35,
  \"confidence\": 0.98
}
*(En reell leveranse skal inkludere ALLE relevante komponenter, med riktige avrundinger, mengder og detaljer iht. oppdrag og prislister!)*

# Output Format

Returner kun én valid JSON i spesifisert format, ALDRI tekst eller kommentarer, og alltid på norsk.

---

**HUSK:**  
- Følg ALLE arbeidssteg og regler; tenk steg-for-steg, og valider alt før output.
- Returner UTELUKKENDE valid JSON etter spesifisert mal, uten tilleggstekst.  
- Dokumenter ALLTID kilde og confidence.  

*(Påminnelse: Grundig, sekvensiell behandling før output, presis prislistematch og full kildedokumentasjon.)*`
}

// Function to fetch AI config from Sanity
async function getAIConfig() {
  try {
    const config = await client.fetch(aiConfigQuery);
    return {
      model: config?.model || "gpt-5",
      reasoningeffort: config?.reasoningeffort || "low",
      komponentSKs: config?.komponentSKs || [],
      allowWebsearch: config?.allowWebsearch ?? true
    };
  } catch (error) {
    console.error('Failed to fetch AI config:', error);
    // Fallback to defaults
    return {
      model: "gpt-5",
      reasoningeffort: "low",
      komponentSKs: [],
      allowWebsearch: false
    };
  }
}

// Create the Agent with dynamic config
async function createKomponentSKAgent(allowWebsearchOverride?: boolean) {
  const aiConfig = await getAIConfig();

  // allowWebsearchOverride takes precedence when explicitly provided
  const allowWebsearch = typeof allowWebsearchOverride === 'boolean' ? allowWebsearchOverride : aiConfig.allowWebsearch;

  const tools = [];
  if (allowWebsearch) {
    tools.push(webSearchPreview);
  }

  return new Agent({
    name: "Komponent-Søk",
    instructions: komponentSKInstructions,
    model: aiConfig.model,
    tools: tools,
    modelSettings: {
      reasoning: {
        effort: aiConfig.reasoningeffort,
        summary: "auto"
      },
      store: false
    }
  });
}

type WorkflowInput = { prompt: string, businessInfo: string, catalog: any };

const normalizeProductText = (value: unknown) => String(value || '')
  .toLowerCase()
  .replace(/[×x]/g, 'x')
  .replace(/[^a-zæøå0-9]+/gi, ' ')
  .trim();

const getPriceListProducts = (catalog: any): any[] => {
  if (Array.isArray(catalog?.priceListProducts)) {
    return catalog.priceListProducts;
  }

  if (!catalog || typeof catalog !== 'object') return [];

  return Object.values(catalog).flatMap((category: any) => {
    if (!category || !Array.isArray(category.subcategories)) return [];
    return category.subcategories.flatMap((subcategory: any) => {
      if (!Array.isArray(subcategory.products)) return [];
      return subcategory.products.filter((product: any) => product?.prisliste || product?.prislisteId);
    });
  });
};

const findMatchingPriceListProduct = (component: any, priceListProducts: any[]) => {
  const componentName = normalizeProductText(component?.name);
  if (!componentName) return null;

  const exact = priceListProducts.find(product => normalizeProductText(product?.produktnavn) === componentName);
  if (exact) return { product: exact, match: 'eksakt' };

  const contained = priceListProducts.find(product => {
    const productName = normalizeProductText(product?.produktnavn);
    return productName && (componentName.includes(productName) || productName.includes(componentName));
  });
  if (contained) return { product: contained, match: 'fuzzy' };

  const componentTokens = new Set(componentName.split(' ').filter(token => token.length > 2));
  if (componentTokens.size === 0) return null;

  const scored = priceListProducts
    .map(product => {
      const productName = normalizeProductText(product?.produktnavn);
      const productTokens = productName.split(' ').filter(token => token.length > 2);
      const overlap = productTokens.filter(token => componentTokens.has(token)).length;
      return { product, score: overlap / Math.max(productTokens.length, componentTokens.size) };
    })
    .filter(item => item.score >= 0.6)
    .sort((a, b) => b.score - a.score)[0];

  return scored ? { product: scored.product, match: 'fuzzy' } : null;
};

const applyUserPriceListPrices = (components: any[], catalog: any) => {
  const priceListProducts = getPriceListProducts(catalog);
  if (priceListProducts.length === 0) return components;

  return components.map(component => {
    if (component?.category !== 'materialer') return component;

    const match = findMatchingPriceListProduct(component, priceListProducts);
    if (!match) return component;

    const { product, match: matchType } = match;
    const quantity = Number(component.amount) || 0;
    const unitPrice = Number(product.enhetspris) || Number(component.unitPrice) || 0;
    const priceMarkup = Number(product.påslag) || Number(component.priceMarkup) || 0;
    const materialMarkup = Number(component.materialMarkup) || 0;
    const componentTotal = Math.round(quantity * unitPrice * (1 + priceMarkup / 100) * (1 + materialMarkup / 100));
    const sourceName = product.prisliste || product.sourcePriceListName || 'Bedriftens prisliste';
    const identifiers = [product.nobb ? `NOBB ${product.nobb}` : '', product.ean ? `EAN ${product.ean}` : '']
      .filter(Boolean)
      .join(', ');

    return {
      ...component,
      name: component.name || product.produktnavn,
      unit: product.enhet || component.unit,
      unitPrice,
      priceMarkup,
      componentTotal,
      catalogMatch: matchType,
      catalogSource: sourceName,
      description: `${component.description || product.beskrivelse || product.produktnavn} Kilde: ${sourceName}${identifiers ? ` (${identifiers})` : ''}.`,
    };
  });
};


// Main code entrypoint
export const runWorkflow = async (workflow: WorkflowInput) => {
  return await withTrace("Proanbud", async () => {
    const conversationHistory: AgentInputItem[] = [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: workflow.prompt
          }
        ]
      }
    ];
    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_68fa61e4b8448190bebb0b325af7fe8f0ec21e94103549ef"
      }
    });
    const transformResult = {catalog: JSON.stringify(workflow.catalog), jobbbeskrivelse: workflow.prompt, bedrift: workflow.businessInfo};
    
    // Create agent with dynamic config from Sanity
    // Try to create the agent with websearch enabled (if allowed).
    // If the model rejects hosted tools we'll retry without tools.
    let komponentSK = await createKomponentSKAgent();
    let komponentSKResultTemp;
    try {
      komponentSKResultTemp = await runner.run(
        komponentSK,
        [
          ...conversationHistory
        ],
        {
          context: {
            inputJobbbeskrivelse: transformResult.jobbbeskrivelse,
            inputBedrift: transformResult.bedrift,
            inputCatalog: transformResult.catalog
          }
        }
      );
    } catch (err: any) {
      // If the model doesn't support hosted tools (web_search_preview), retry without tools
      const message = err?.message || '';
      const param = err?.param || '';
      if (message.includes('Hosted tool') || param === 'tools' || (message && message.includes('not supported'))) {
        console.warn('Agent run failed due to hosted tool support. Retrying without websearch tools. Error:', err);
        // recreate agent with websearch disabled and retry
        komponentSK = await createKomponentSKAgent(false);
        komponentSKResultTemp = await runner.run(
          komponentSK,
          [
            ...conversationHistory
          ],
          {
            context: {
              inputJobbbeskrivelse: transformResult.jobbbeskrivelse,
              inputBedrift: transformResult.bedrift,
              inputCatalog: transformResult.catalog
            }
          }
        );
      } else {
        throw err;
      }
    }

    if (!komponentSKResultTemp.finalOutput) {
        throw new Error("Agent result is undefined");
    }

    // Convert to expected schema
    const raw = JSON.parse(komponentSKResultTemp.finalOutput);
    const componentsWithPriceLists = applyUserPriceListPrices(raw.components || [], workflow.catalog);
    const totalPrice = componentsWithPriceLists.reduce((sum: number, comp: any) => sum + (Number(comp.componentTotal) || 0), 0);
    const converted = {
      totalPrice: totalPrice || raw.totalPrice,
      confidence: raw.confidence,
      components: componentsWithPriceLists.map((comp: any, index: number) => ({
        id: `comp_${index}`,
        category: comp.category,
        name: comp.name,
        description: comp.description,
        amount: comp.amount,
        unit: comp.unit,
        unitPrice: comp.unitPrice,
        priceMarkup: comp.priceMarkup,
        materialMarkup: comp.materialMarkup,
        componentTotal: comp.componentTotal,
        catalogMatch: comp.catalogMatch,
        catalogSource: comp.catalogSource,
        isEditable: true,
        confidence: comp.confidence
      })),
      reasoning: "",
      alternatives: {
        conservative: (totalPrice || raw.totalPrice) * 0.9,
        aggressive: (totalPrice || raw.totalPrice) * 1.1
      }
    };

    const komponentSKResult = {
      output_text: komponentSKResultTemp.finalOutput,
      output_parsed: converted
    };
    return komponentSKResult;
  });
}

export async function POST(request: NextRequest) {
  console.log("POST /api/ai-pricing called");
  try {
    const body = await request.json();

    // Expecting { prompt, businessInfo, catalog }
    const prompt = body?.prompt ?? body?.jobbbeskrivelse ?? body?.jobbBeskrivelse;
  const businessInfo = body?.businessInfo || body?.bedriftsprofil || body?.business || "";
    const catalog = body?.catalog ?? body?.produktkatalog ?? body?.catalogue ?? {};

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt in request body' }, { status: 400 });
    }

    const workflowInput = {
      prompt,
      businessInfo,
      catalog,
    } as WorkflowInput;

    const result = await runWorkflow(workflowInput);

    // Return the parsed output if available, otherwise the raw agent output
    const responsePayload = result?.output_parsed ?? { output_text: result?.output_text ?? null };
    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/ai-pricing:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
