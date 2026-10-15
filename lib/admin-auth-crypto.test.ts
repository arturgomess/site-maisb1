import { describe, expect, it } from 'vitest';
import { hashAdminPassword, hashSessionToken, verifyAdminPassword } from './admin-auth-crypto';

describe('admin authentication cryptography', () => {
  it('stores passwords as salted scrypt hashes and verifies them', async () => {
    const hash = await hashAdminPassword('Grupo+Seguro2026!');

    expect(hash).not.toContain('Grupo+Seguro2026!');
    expect(hash.startsWith('scrypt$')).toBe(true);
    await expect(verifyAdminPassword('Grupo+Seguro2026!', hash)).resolves.toBe(true);
    await expect(verifyAdminPassword('outra senha', hash)).resolves.toBe(false);
  });

  it('stores only a deterministic SHA-256 digest of a session token', () => {
    expect(hashSessionToken('raw-session-token')).toBe(hashSessionToken('raw-session-token'));
    expect(hashSessionToken('raw-session-token')).not.toContain('raw-session-token');
    expect(hashSessionToken('raw-session-token')).toHaveLength(64);
  });
});
