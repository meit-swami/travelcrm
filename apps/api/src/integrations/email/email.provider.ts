import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { AppConfigService } from '../../core/config';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  messageId: string;
}

/**
 * SMTP email provider (nodemailer). When SMTP_HOST is unset it falls back to a
 * JSON transport that logs the message instead of sending (dev/local).
 */
@Injectable()
export class EmailProvider {
  private readonly logger = new Logger('Email');
  private readonly transporter: Transporter;
  private readonly defaultFrom: string;
  private readonly live: boolean;

  constructor(private readonly config: AppConfigService) {
    this.defaultFrom = config.get('EMAIL_FROM');
    const host = config.get('SMTP_HOST');
    this.live = Boolean(host);

    this.transporter = this.live
      ? nodemailer.createTransport({
          host,
          port: config.get('SMTP_PORT'),
          secure: config.get('SMTP_SECURE'),
          auth:
            config.get('SMTP_USER') && config.get('SMTP_PASS')
              ? { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') }
              : undefined,
        })
      : nodemailer.createTransport({ jsonTransport: true });
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const info = await this.transporter.sendMail({
      from: input.from ?? this.defaultFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (!this.live) {
      this.logger.warn(`[DEV] Email to ${input.to} — "${input.subject}" (not sent: no SMTP_HOST)`);
    }
    return { messageId: info.messageId };
  }
}
