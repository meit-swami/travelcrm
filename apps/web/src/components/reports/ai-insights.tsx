'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { clientFetch } from '@/lib/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * AI management-insights panel. "Generate" posts to the AI analytics endpoint,
 * which summarises loss reasons, top destinations and recommendations. Works
 * with the stub AI provider (deterministic) until a real OpenAI/Gemini key is
 * configured.
 */
export function AiInsights({ initialNarrative }: { initialNarrative: string | null }) {
  const [narrative, setNarrative] = useState<string | null>(initialNarrative);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await clientFetch('/api/proxy/ai-analytics/insights', { method: 'POST' });
      if (!res.ok) throw new Error('failed');
      const data = (await res.json()) as { narrative?: string };
      setNarrative(data.narrative ?? 'No narrative returned.');
    } catch {
      setError('Could not generate insights. (Check that AI analytics is enabled for your role.)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="theme-gradient-text flex items-center gap-1.5 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> AI Insights
          </span>
        </CardTitle>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loading ? 'Analysing…' : narrative ? 'Regenerate' : 'Generate insights'}
        </button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!narrative && !error && (
          <p className="text-sm text-muted-foreground">
            Generate an AI summary of why deals are lost, your best-converting destinations, and
            concrete recommendations.
          </p>
        )}
        {narrative && (
          <div className="accent-soft rounded-lg p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {narrative}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
