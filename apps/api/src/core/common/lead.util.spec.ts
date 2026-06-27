import { buildReferenceCode, computeDedupeHash, normalizeEmail, normalizePhone } from './lead.util';

describe('lead.util', () => {
  it('normalizes phones to the last 10 digits', () => {
    expect(normalizePhone('+91 98765 43210')).toBe('9876543210');
    expect(normalizePhone('098765-43210')).toBe('9876543210');
    expect(normalizePhone(null)).toBeNull();
  });

  it('normalizes emails', () => {
    expect(normalizeEmail(' Test@Example.COM ')).toBe('test@example.com');
    expect(normalizeEmail('not-an-email')).toBeNull();
  });

  it('computes a stable dedupe hash from phone/email', () => {
    const a = computeDedupeHash('+91 98765 43210', 'A@b.com');
    const b = computeDedupeHash('9876543210', 'a@b.com');
    expect(a).toBe(b);
    expect(computeDedupeHash(null, null)).toBeNull();
  });

  it('builds zero-padded reference codes', () => {
    expect(buildReferenceCode('LD', 2026, 123)).toBe('LD-2026-000123');
  });
});
