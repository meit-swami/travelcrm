import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../core/config';

export interface FetchedItinerary {
  title: string;
  destination?: string;
  durationDays?: number;
  payload: Record<string, unknown>;
  externalVersionRef?: string;
}

/**
 * Adapter for the external itinerary builder. When no base URL is configured it
 * returns a deterministic sample so import/sync flows work in dev.
 */
@Injectable()
export class ItineraryBuilderProvider {
  private readonly logger = new Logger('ItineraryBuilder');

  constructor(private readonly config: AppConfigService) {}

  private get configured(): boolean {
    return Boolean(this.config.get('ITINERARY_BUILDER_BASE_URL'));
  }

  async fetch(externalId: string): Promise<FetchedItinerary> {
    if (!this.configured) {
      this.logger.warn(`[DEV] Itinerary builder not configured — returning sample for ${externalId}`);
      return {
        title: `Itinerary ${externalId}`,
        destination: 'Goa',
        durationDays: 4,
        externalVersionRef: 'v1',
        payload: {
          days: [
            { day: 1, title: 'Arrival & North Goa', items: ['Hotel check-in', 'Baga Beach'] },
            { day: 2, title: 'South Goa', items: ['Dudhsagar Falls', 'Spice plantation'] },
          ],
        },
      };
    }

    const base = this.config.get('ITINERARY_BUILDER_BASE_URL');
    const res = await fetch(`${base}/itineraries/${externalId}`, {
      headers: { Authorization: `Bearer ${this.config.get('ITINERARY_BUILDER_API_KEY')}` },
    });
    if (!res.ok) throw new Error(`Itinerary fetch failed ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as Record<string, unknown>;
    return {
      title: String(data.title ?? `Itinerary ${externalId}`),
      destination: data.destination as string | undefined,
      durationDays: data.durationDays as number | undefined,
      externalVersionRef: data.versionRef as string | undefined,
      payload: data,
    };
  }
}
