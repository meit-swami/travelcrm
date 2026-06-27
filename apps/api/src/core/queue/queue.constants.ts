/** BullMQ queue names. Each has its own processor + retry/backoff policy. */
export const QueueName = {
  Audit: 'audit',
  Email: 'email',
  WhatsappOut: 'whatsapp.out',
  WhatsappIn: 'whatsapp.in',
  AiSummarize: 'ai.summarize',
  AiExtract: 'ai.extract',
  AiScore: 'ai.score',
  VoucherPdf: 'voucher.pdf',
  InvoicePdf: 'invoice.pdf',
  CallTranscribe: 'call.transcribe',
  ReportRollup: 'report.rollup',
  ReminderDispatch: 'reminder.dispatch',
  WebhookProcess: 'webhook.process',
  IntegrationRetry: 'integration.retry',
} as const;
export type QueueName = (typeof QueueName)[keyof typeof QueueName];

export const REDIS_CONNECTION = Symbol('REDIS_CONNECTION');
