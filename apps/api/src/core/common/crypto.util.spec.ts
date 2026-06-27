import { decryptSecret, encryptSecret, generateOtp, randomToken, sha256 } from './crypto.util';

const KEY = '0'.repeat(64); // 32 bytes hex

describe('crypto.util', () => {
  it('encrypts and decrypts a secret round-trip', () => {
    const plaintext = 'JBSWY3DPEHPK3PXP';
    const enc = encryptSecret(plaintext, KEY);
    expect(enc).not.toContain(plaintext);
    expect(decryptSecret(enc, KEY)).toBe(plaintext);
  });

  it('produces different ciphertext each time (random IV)', () => {
    expect(encryptSecret('x', KEY)).not.toBe(encryptSecret('x', KEY));
  });

  it('hashes deterministically with sha256', () => {
    expect(sha256('abc')).toBe(sha256('abc'));
    expect(sha256('abc')).not.toBe(sha256('abd'));
  });

  it('generates numeric OTP of requested length', () => {
    const otp = generateOtp(6);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('generates url-safe random tokens', () => {
    expect(randomToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
