import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Can } from '../../core/rbac';
import { AppConfigService } from '../../core/config';
import type { Env } from '../../core/config/env.schema';

/**
 * Reports which external integrations are configured (booleans only — never the
 * secret values). Powers the Settings → Integrations status page so operators
 * can see, at a glance, what is live vs. running on the built-in stub.
 */
@ApiTags('System')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly config: AppConfigService) {}

  @Get('status')
  @Can('settings.read')
  status() {
    const has = (k: keyof Env) => Boolean(this.config.get(k));
    const aiProvider = this.config.get('AI_DEFAULT_PROVIDER');
    const paymentGateway = this.config.get('PAYMENT_DEFAULT_GATEWAY');

    return {
      ai: {
        provider: aiProvider,
        configured:
          aiProvider === 'openai'
            ? has('OPENAI_API_KEY')
            : aiProvider === 'gemini'
              ? has('GEMINI_API_KEY')
              : false,
        envKeys: ['AI_DEFAULT_PROVIDER', 'OPENAI_API_KEY', 'GEMINI_API_KEY'],
      },
      payments: {
        provider: paymentGateway,
        configured: has('RAZORPAY_KEY_ID') || has('CASHFREE_APP_ID'),
        envKeys: ['PAYMENT_DEFAULT_GATEWAY', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'CASHFREE_APP_ID', 'CASHFREE_SECRET'],
      },
      whatsapp: {
        configured: has('WHATSAPP_TOKEN') && has('WHATSAPP_PHONE_ID'),
        envKeys: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID', 'WHATSAPP_WEBHOOK_SECRET'],
      },
      email: {
        configured: has('SMTP_HOST'),
        envKeys: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'],
      },
      itinerary: {
        configured: has('ITINERARY_BUILDER_BASE_URL'),
        envKeys: ['ITINERARY_BUILDER_BASE_URL', 'ITINERARY_BUILDER_API_KEY'],
      },
    };
  }
}
