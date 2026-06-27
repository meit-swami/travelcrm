import { z } from 'zod';

/**
 * Typed, validated environment. The app refuses to boot if required config is
 * missing or malformed (fail-fast). See .env.example for the full list.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),

  // Data
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_REPLICA_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be >= 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be >= 16 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().default(30),
  OTP_TTL_SECONDS: z.coerce.number().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),

  // Encryption (for secrets at rest, e.g. TOTP secrets)
  ENCRYPTION_KEY: z
    .string()
    .min(32, 'ENCRYPTION_KEY must be a 32-byte (64 hex char) key')
    .default('0000000000000000000000000000000000000000000000000000000000000000'),

  // Storage (S3-compatible)
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('travelos'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  // Payment gateways. When keys are unset, a stub gateway issues fake orders.
  PAYMENT_DEFAULT_GATEWAY: z.enum(['razorpay', 'cashfree', 'stub']).default('stub'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET: z.string().optional(),
  CASHFREE_WEBHOOK_SECRET: z.string().optional(),

  // External itinerary builder. When unset, a stub adapter returns sample data.
  ITINERARY_BUILDER_BASE_URL: z.string().optional(),
  ITINERARY_BUILDER_API_KEY: z.string().optional(),

  // WhatsApp Business (Cloud API). When unset, sends are logged (dev) not sent.
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().default('travelos-verify'),
  WHATSAPP_WEBHOOK_SECRET: z.string().optional(),

  // AI providers. When no key is set, a deterministic stub provider is used.
  AI_DEFAULT_PROVIDER: z.enum(['openai', 'gemini', 'stub']).default('stub'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  // Email (SMTP). When SMTP_HOST is unset, emails are logged (dev) not sent.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  EMAIL_FROM: z.string().default('TravelOS AI <no-reply@travelos.ai>'),

  // CORS
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
