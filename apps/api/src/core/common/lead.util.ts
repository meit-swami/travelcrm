import { createHash } from 'node:crypto';

/** Normalize a phone to a comparable form (digits only, last 10 for IN-style). */
export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.includes('@') ? trimmed : null;
}

/** Stable hash over normalized phone+email for fast duplicate detection. */
export function computeDedupeHash(phone?: string | null, email?: string | null): string | null {
  const p = normalizePhone(phone);
  const e = normalizeEmail(email);
  if (!p && !e) return null;
  return createHash('sha256').update(`${p ?? ''}|${e ?? ''}`).digest('hex');
}

/** Human-friendly reference code, e.g. LD-2026-000123. */
export function buildReferenceCode(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;
}
