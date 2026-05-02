import { NextRequest, NextResponse } from 'next/server';
import { Agent, AgentInputItem, Runner, RunContext, withTrace } from '@openai/agents';
import { client, aiConfigQuery } from '@/lib/sanity';

interface ClarificationHistoryItem {
  question: string;
  answer: string;
}

interface ClarificationContext {
  projectDescription: string;
  history: ClarificationHistoryItem[];
  maxQuestions: number;
}

interface ClarificationResponse {
  question: string;
  suggestions: string[];
  shouldContinue: boolean;
  reason?: string;
}

const clarificationInstructions = (runContext: RunContext<ClarificationContext>, _agent: Agent<ClarificationContext>) => {
  const { projectDescription, history, maxQuestions } = runContext.context;
  const historyText = history.length
    ? history.map((item, index) => `${index + 1}. Spørsmål: ${item.question}\nSvar: ${item.answer}`).join('\n\n')
    : 'Ingen tidligere avklaringer.';

  return `Du er en norsk tilbuds- og mengdeavklaringsassistent for bygg- og håndverksprosjekter.

Målet ditt er å stille ETT relevant oppfølgingsspørsmål om gangen, som hjelper håndverkeren å forstå prosjektet bedre før materialvalg, mengdeberegning og prissetting.

Prioriter spørsmål som avklarer:
- mål, areal, lengder, høyder, tykkelser og antall
- materialtype, kvalitet, overflate, dimensjon og produktvalg
- eksisterende forhold, riving, underlag, tilkomst og avfall
- rom/soner, omfang, avgrensninger og forbehold
- ting som direkte påvirker mengder eller materialvalg

Ikke spør om noe som allerede er besvart. Ikke still generiske spørsmål hvis et mer konkret spørsmål kan stilles ut fra prosjektbeskrivelsen. Ikke still flere spørsmål samtidig.

Prosjektbeskrivelse:
${projectDescription}

Tidligere spørsmål og svar:
${historyText}

Maks antall spørsmål i denne flyten: ${maxQuestions}. Det er allerede stilt ${history.length} spørsmål.

Hvis det fortsatt mangler viktig informasjon for mengde/materialvalg, returner shouldContinue=true og ett konkret spørsmål.
Hvis prosjektet er tilstrekkelig avklart, eller maks antall spørsmål er nådd, returner shouldContinue=false, question som tom streng og suggestions som tom liste.

Returner KUN valid JSON i dette formatet:
{
  "question": "ett kort og konkret spørsmål på norsk",
  "suggestions": ["kort forslag", "kort forslag", "kort forslag", "kort forslag"],
  "shouldContinue": true,
  "reason": "kort intern begrunnelse på norsk"
}`;
};

async function getAIConfig() {
  try {
    const config = await client.fetch(aiConfigQuery);
    return {
      model: config?.model || 'gpt-5',
      reasoningEffort: config?.reasoningEffort || config?.reasoningeffort || 'low',
    };
  } catch (error) {
    console.error('Failed to fetch AI config for quote clarifications:', error);
    return {
      model: 'gpt-5',
      reasoningEffort: 'low',
    };
  }
}

function parseClarificationOutput(output: string): ClarificationResponse {
  const cleaned = output
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const parsed = JSON.parse(cleaned);

  return {
    question: typeof parsed.question === 'string' ? parsed.question : '',
    suggestions: Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((item: unknown) => typeof item === 'string').slice(0, 4)
      : [],
    shouldContinue: Boolean(parsed.shouldContinue),
    reason: typeof parsed.reason === 'string' ? parsed.reason : '',
  };
}

async function runClarificationWorkflow(input: ClarificationContext): Promise<ClarificationResponse> {
  return await withTrace('Proanbud quote clarifications', async () => {
    const aiConfig = await getAIConfig();
    const modelSettings = aiConfig.model.startsWith('gpt-5')
      ? {
          reasoning: {
            effort: aiConfig.reasoningEffort,
            summary: 'auto' as const,
          },
          store: false,
        }
      : { store: false };

    const agent = new Agent<ClarificationContext>({
      name: 'Tilbudsavklaringer',
      instructions: clarificationInstructions,
      model: aiConfig.model,
      modelSettings,
    });

    const conversationHistory: AgentInputItem[] = [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify({
              projectDescription: input.projectDescription,
              history: input.history,
              remainingQuestions: Math.max(input.maxQuestions - input.history.length, 0),
            }),
          },
        ],
      },
    ];

    const runner = new Runner({
      traceMetadata: {
        __trace_source__: 'quote-clarifications',
      },
    });

    const result = await runner.run(agent, conversationHistory, { context: input });
    if (!result.finalOutput) {
      throw new Error('AI returnerte ikke et avklaringsspørsmål');
    }

    return parseClarificationOutput(result.finalOutput);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectDescription = String(body?.projectDescription || body?.jobDescription || '').trim();
    const history = Array.isArray(body?.history) ? body.history : [];
    const maxQuestions = Number(body?.maxQuestions) || 5;

    if (!projectDescription) {
      return NextResponse.json({ error: 'Missing projectDescription' }, { status: 400 });
    }

    if (history.length >= maxQuestions) {
      return NextResponse.json({ question: '', suggestions: [], shouldContinue: false }, { status: 200 });
    }

    const normalizedHistory = history
      .map((item: any) => ({
        question: String(item?.question || '').trim(),
        answer: String(item?.answer || '').trim(),
      }))
      .filter((item: ClarificationHistoryItem) => item.question && item.answer)
      .slice(0, maxQuestions);

    const result = await runClarificationWorkflow({
      projectDescription,
      history: normalizedHistory,
      maxQuestions,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/quote-clarifications:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}