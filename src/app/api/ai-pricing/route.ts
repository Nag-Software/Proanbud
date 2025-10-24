import { NextRequest, NextResponse } from 'next/server';

import { webSearchTool, RunContext, Agent, AgentInputItem, Runner, withTrace } from "@openai/agents";
import { z } from "zod";
import { client, aiConfigQuery } from '@/lib/sanity';


// Tool definitions

const webSearchPreview = webSearchTool({
  filters: {
    allowedDomains: [
      "obsbygg.nobyggmakker.nomaxbo.nomonter.noxl-bygg.nobyggtorget.nojula.nobauhaus.nobyggern.nomegaflis.no"
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
- \`produktkatalog\`: ${inputCatalog}

# Arbeidsflyt (Stegvis prosess, MÅ utføres sekvensielt – Tenk høyt og grundig før output)

1. **Forstå og analyser oppdraget**
   - Les jobbeskrivelsen nøye.
   - Identifiser alle nødvendige komponenter for oppdraget.
   - Kategoriser komponenter: materialer, arbeid, utstyr, transport, annet.
   - Beregn mengder iht. oppgave og standard byggepraksis.

2. **Katalogmatching (alltid FØRST – prioritet)**
   - Søk eksakt navn mot produktkatalog (case-insensitive, trim whitespace).
     - Finnes eksakt: bruk katalogpris/info, ignorer AI-pris.
     - Hvis ikke: fortsett til neste steg.
   - Søk eksakt navn + dimensjon (case-insensitive).
   - Normaliserte søk: Fjern mellomrom, standardiser enhetsformat, små bokstaver, erstatt ×/X med x (se eksempler).
   - Fuzzy match:
     - Dimensjonstoleranse: ±2 mm pr. dimensjon.
     - Materiallikeverdighet og konstruerte dimensjoner (jf. regler).
     - DOKUMENTER alltid avvik i \"description\".
   - Hvis INGEN match: Estimér realistisk norsk markedspris for 2025.
     - Marker \`\"catalogMatch\": \"markedspris\"\` og angi kilde i 'description'.

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
   - Kontroller mengdeavrundinger, katalogpriser, og evt. svinn mot regler.
   - Angi og begrunn \`confidence\` basert på datakvalitet og kilde, både globalt og per komponent.
   - Dokumenter katalogkilde eksplisitt i både 'description' og 'catalogSource'.

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
      \"catalogSource\": \"[katalognavn/leverandør/markedspris]\",
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
- \"Konstruksjonsvirke 48x98 C24 impregnert. Kilde: Bedriftens katalog (eksakt match). Normalt prisnivå.\"
- \"Konstruksjonsvirke 48x98 C24. Kilde: Bedriftens katalog (brukt 48x99, tolerance ±2mm). Normalt prisnivå.\"
- \"Glassull isolasjon 15cm. Kilde: Markedspris (ikke i katalog). Normalt prisnivå 2025.\"

# Kritiske påminnelser (MÅ følges, aldri ignoreres!)
1. Søk ALLTID katalogen før annen prissetting.
2. Fuzzy-match grundig før estimat.
3. Rund OPP alle mengder.
4. unitPrice beregnes FØR påslag.
5. totalPrice må matche sum componentTotal.
6. Returner KUN gyldig JSON; ingen tekst eller kommentarer.
7. Priser oppgis uten mva.
8. Kildedokumentasjon kreves i description og catalogSource.
9. Sorter etter components etter kategorier: materialer, utstyr, arbeid, transport, annet.

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
      \"catalogSource\": \"Bedriftens katalog\",
      \"confidence\": 1.0,
      \"description\": \"Trykkimpregnert konstruksjonsvirke 48x98 C24. Kilde: Bedriftens katalog (eksakt match). Normalt prisnivå.\"
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
*(En reell leveranse skal inkludere ALLE relevante komponenter, med riktige avrundinger, mengder og detaljer iht. oppdrag og katalog!)*

# Output Format

Returner kun én valid JSON i spesifisert format, ALDRI tekst eller kommentarer, og alltid på norsk.

---

**HUSK:**  
- Følg ALLE arbeidssteg og regler; tenk steg-for-steg, og valider alt før output.
- Returner UTELUKKENDE valid JSON etter spesifisert mal, uten tilleggstekst.  
- Dokumenter ALLTID kilde og confidence.  

*(Påminnelse: Grundig, sekvensiell behandling før output, presis katalogmatch og full kildedokumentasjon.)*`
}

// Function to fetch AI config from Sanity
async function getAIConfig() {
  try {
    const config = await client.fetch(aiConfigQuery);
    return {
      model: config?.model || "gpt-5-nano",
      reasoningeffort: config?.reasoningeffort || "low",
      komponentSKs: config?.komponentSKs || [],
      allowWebsearch: config?.allowWebsearch ?? true
    };
  } catch (error) {
    console.error('Failed to fetch AI config:', error);
    // Fallback to defaults
    return {
      model: "gpt-5-nano",
      reasoningeffort: "minimal",
      komponentSKs: [],
      allowWebsearch: false
    };
  }
}

// Create the Agent with dynamic config
async function createKomponentSKAgent() {
  const aiConfig = await getAIConfig();

  const tools = [];
  if (aiConfig.allowWebsearch) {
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
    const komponentSK = await createKomponentSKAgent();
    
    const komponentSKResultTemp = await runner.run(
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

    if (!komponentSKResultTemp.finalOutput) {
        throw new Error("Agent result is undefined");
    }

    // Convert to expected schema
    const raw = JSON.parse(komponentSKResultTemp.finalOutput);
    const converted = {
      totalPrice: raw.totalPrice,
      confidence: raw.confidence,
      components: raw.components.map((comp: any, index: number) => ({
        id: `comp_${index}`,
        category: comp.category,
        name: comp.name,
        description: comp.description,
        amount: comp.amount,
        unit: comp.unit,
        unitPrice: comp.unitPrice,
        priceMarkup: comp.priceMarkup,
        materialMarkup: comp.materialMarkup,
        isEditable: true,
        confidence: comp.confidence
      })),
      reasoning: "",
      alternatives: {
        conservative: raw.totalPrice * 0.9,
        aggressive: raw.totalPrice * 1.1
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
    console.log("Request body:", body);
    const { prompt, businessInfo, catalog } = body;
    const result = await runWorkflow({ prompt, businessInfo, catalog });
    console.log("Workflow result keys:", Object.keys(result.output_parsed));
    return NextResponse.json(result.output_parsed);
  } catch (error) {
    console.log("Error in POST:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
