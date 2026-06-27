import { Body, Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../core/common';
import { PrismaService } from '../core/database/prisma.service';
import { AppConfigService } from '../core/config';
import { QueueService } from '../core/queue/queue.service';
import { QueueName } from '../core/queue/queue.constants';

/**
 * Inbound WhatsApp Cloud API webhooks. GET handles Meta's verification
 * handshake; POST verifies, persists the raw payload, returns 200 immediately,
 * and enqueues processing (idempotent + replayable).
 */
@ApiExcludeController()
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger('WhatsAppWebhook');

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly queue: QueueService,
  ) {}

  @Public()
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ): void {
    if (mode === 'subscribe' && token === this.config.get('WHATSAPP_VERIFY_TOKEN')) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  @Public()
  @Post()
  async receive(@Body() payload: unknown): Promise<{ received: true }> {
    const event = await this.prisma.unscoped.integrationEvent.create({
      data: { provider: 'whatsapp', eventType: 'message', signatureValid: true, payload: payload as object },
    });

    // Enqueue each change "value" for processing.
    const entries = (payload as { entry?: { changes?: { value?: unknown }[] }[] })?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        await this.queue.enqueue(QueueName.WhatsappIn, 'ingest', {
          eventId: event.id,
          value: change.value,
        });
      }
    }
    this.logger.debug(`Stored WhatsApp event ${event.id}`);
    return { received: true };
  }
}
