import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../core/common';
import { PrismaService } from '../core/database/prisma.service';

/**
 * Inbound webhook for itinerary-builder updates. Persists the raw payload;
 * staff trigger a sync (or a future processor reconciles by external id).
 */
@ApiExcludeController()
@Controller('webhooks/itinerary')
export class ItineraryWebhookController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post()
  async receive(@Body() payload: unknown): Promise<{ received: true }> {
    await this.prisma.unscoped.integrationEvent.create({
      data: { provider: 'itinerary', eventType: 'updated', signatureValid: true, payload: payload as object },
    });
    return { received: true };
  }
}
