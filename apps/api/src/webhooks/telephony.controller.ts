import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../core/common';
import { PrismaService } from '../core/database/prisma.service';

/** Inbound telephony (Exotel/Knowlarity) call events + recording callbacks. */
@ApiExcludeController()
@Controller('webhooks/telephony')
export class TelephonyWebhookController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post()
  async receive(@Body() payload: unknown): Promise<{ received: true }> {
    await this.prisma.unscoped.integrationEvent.create({
      data: { provider: 'telephony', eventType: 'call', signatureValid: true, payload: payload as object },
    });
    return { received: true };
  }
}
