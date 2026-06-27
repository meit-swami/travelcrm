import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../core/config';

export interface SendWhatsAppResult {
  externalId: string;
}

/**
 * WhatsApp Business Cloud API sender. When no token is configured it logs the
 * message (dev) instead of calling Meta, so the flow runs end-to-end locally.
 */
@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger('WhatsApp');

  constructor(private readonly config: AppConfigService) {}

  get configured(): boolean {
    return Boolean(this.config.get('WHATSAPP_TOKEN') && this.config.get('WHATSAPP_PHONE_ID'));
  }

  async sendText(to: string, body: string): Promise<SendWhatsAppResult> {
    if (!this.configured) {
      this.logger.warn(`[DEV] WhatsApp → ${to}: ${body}`);
      return { externalId: `dev-${Date.now()}` };
    }
    const phoneId = this.config.get('WHATSAPP_PHONE_ID');
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.get('WHATSAPP_TOKEN')}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });
    if (!res.ok) throw new Error(`WhatsApp send failed ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { messages?: { id: string }[] };
    return { externalId: data.messages?.[0]?.id ?? '' };
  }
}
