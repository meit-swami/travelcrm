import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../core/config';

/**
 * Delivers OTP codes. In Phase 0 this logs the code (dev) and is the seam where
 * production wiring dispatches via the SMS/WhatsApp/email queues.
 */
@Injectable()
export class OtpNotifier {
  private readonly logger = new Logger('OTP');

  constructor(private readonly config: AppConfigService) {}

  async send(channel: string, identifier: string, code: string): Promise<void> {
    if (this.config.isProduction) {
      // TODO(phase-2): enqueue to whatsapp.out / email / sms provider queue.
      this.logger.log(`Dispatching OTP via ${channel} to ${identifier}`);
      return;
    }
    this.logger.warn(`[DEV] OTP for ${identifier} via ${channel}: ${code}`);
  }
}
