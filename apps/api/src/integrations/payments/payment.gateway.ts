import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { AppConfigService } from '../../core/config';

export interface CreateOrderInput {
  amount: number;
  currency: string;
  reference: string;
}

export interface CreateOrderResult {
  gateway: string;
  orderId: string;
}

/**
 * Payment gateway facade for Razorpay/Cashfree. Without keys it issues a stub
 * order id so the checkout flow runs in dev. Webhook signature verification is
 * provided per gateway.
 */
@Injectable()
export class PaymentGateway {
  private readonly logger = new Logger('PaymentGateway');

  constructor(private readonly config: AppConfigService) {}

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const gateway = this.config.get('PAYMENT_DEFAULT_GATEWAY');

    if (gateway === 'razorpay' && this.config.get('RAZORPAY_KEY_ID')) {
      const auth = Buffer.from(
        `${this.config.get('RAZORPAY_KEY_ID')}:${this.config.get('RAZORPAY_KEY_SECRET')}`,
      ).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
        body: JSON.stringify({
          amount: Math.round(input.amount * 100), // paise
          currency: input.currency,
          receipt: input.reference,
        }),
      });
      if (!res.ok) throw new Error(`Razorpay order failed ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as { id: string };
      return { gateway: 'razorpay', orderId: data.id };
    }

    // Stub / unconfigured.
    this.logger.warn(`[DEV] Stub payment order for ${input.reference} (${input.currency} ${input.amount})`);
    return { gateway: 'stub', orderId: `stub_order_${input.reference}` };
  }

  /** Verify a gateway webhook signature (Razorpay HMAC-SHA256 over raw body). */
  verifySignature(gateway: string, rawBody: string, signature: string): boolean {
    if (gateway === 'razorpay') {
      const secret = this.config.get('RAZORPAY_WEBHOOK_SECRET');
      if (!secret) return false;
      const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
      return expected === signature;
    }
    // Stub accepts in dev.
    return !this.config.isProduction;
  }
}
