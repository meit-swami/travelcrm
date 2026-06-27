import type { AiCompletionRequest, AiCompletionResult, AiProvider } from './ai.types';

/**
 * Deterministic offline provider used when no AI key is configured. Returns
 * plausible structured output so the AI pipeline runs end-to-end in dev/CI
 * without external calls.
 */
export class StubAdapter implements AiProvider {
  readonly name = 'stub';

  async complete(req: AiCompletionRequest): Promise<AiCompletionResult> {
    let text: string;
    if (req.json && /score|probability/i.test(req.prompt)) {
      text = JSON.stringify({ score: 60, hot: false, rationale: 'Stub heuristic score.' });
    } else if (req.json && /extract|requirement/i.test(req.prompt)) {
      text = JSON.stringify({
        destination: null,
        travelDate: null,
        budget: null,
        adults: 2,
        children: 0,
        hotelPreference: null,
        flightRequired: null,
        specialRequests: null,
      });
    } else if (req.json) {
      text = '{}';
    } else {
      text = '[stub] AI provider not configured — set OPENAI_API_KEY or GEMINI_API_KEY.';
    }
    return { text, model: 'stub', promptTokens: 0, completionTokens: 0 };
  }
}
