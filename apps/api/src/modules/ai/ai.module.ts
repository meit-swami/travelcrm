import { Module } from '@nestjs/common';
import { AppConfigService } from '../../core/config';
import { AI_PROVIDER, type AiProvider } from '../../integrations/ai/ai.types';
import { OpenAiAdapter } from '../../integrations/ai/openai.adapter';
import { GeminiAdapter } from '../../integrations/ai/gemini.adapter';
import { StubAdapter } from '../../integrations/ai/stub.adapter';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

/** Picks the AI provider from config, falling back to the stub when no key. */
function aiProviderFactory(config: AppConfigService): AiProvider {
  const provider = config.get('AI_DEFAULT_PROVIDER');
  const openaiKey = config.get('OPENAI_API_KEY');
  const geminiKey = config.get('GEMINI_API_KEY');

  if (provider === 'openai' && openaiKey) return new OpenAiAdapter(openaiKey, config.get('OPENAI_MODEL'));
  if (provider === 'gemini' && geminiKey) return new GeminiAdapter(geminiKey, config.get('GEMINI_MODEL'));
  return new StubAdapter();
}

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    { provide: AI_PROVIDER, useFactory: aiProviderFactory, inject: [AppConfigService] },
  ],
  exports: [AiService],
})
export class AiModule {}
