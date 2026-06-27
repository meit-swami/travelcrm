import { Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../core/common';
import { PrismaService } from '../core/database/prisma.service';
import { PaymentGateway } from '../integrations/payments/payment.gateway';
import { PaymentsService } from '../modules/payments/payments.service';

/**
 * Gateway webhooks (Razorpay/Cashfree). Verifies the signature, persists the
 * raw payload, and reconciles the matching payment to "paid".
 */
@ApiExcludeController()
@Controller('webhooks')
export class PaymentsWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PaymentGateway,
    private readonly payments: PaymentsService,
  ) {}

  @Public()
  @Post(':gateway')
  async receive(
    @Param('gateway') gateway: string,
    @Body() payload: Record<string, unknown>,
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature?: string,
  ): Promise<{ received: true }> {
    const raw = JSON.stringify(req.body ?? {});
    const valid = this.gateway.verifySignature(gateway, raw, signature ?? '');

    await this.prisma.unscoped.paymentWebhook.create({
      data: { gateway, eventType: String(payload?.event ?? 'unknown'), signatureValid: valid, payload: payload as object },
    });

    if (valid) {
      // Razorpay: payload.payload.payment.entity.{order_id,id}
      const entity = (payload as { payload?: { payment?: { entity?: { order_id?: string; id?: string } } } })
        ?.payload?.payment?.entity;
      if (entity?.order_id && entity?.id) {
        await this.payments.applyGatewayPayment(gateway, entity.order_id, entity.id);
      }
    }
    return { received: true };
  }
}
