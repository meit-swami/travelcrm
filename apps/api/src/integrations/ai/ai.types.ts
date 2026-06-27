export interface AiCompletionRequest {
  system: string;
  prompt: string;
  /** Hint that a JSON object response is expected. */
  json?: boolean;
}

export interface AiCompletionResult {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export interface AiProvider {
  readonly name: string;
  complete(req: AiCompletionRequest): Promise<AiCompletionResult>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
