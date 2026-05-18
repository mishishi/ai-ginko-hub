import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password utils', () => {
  // hashPassword returns a bcrypt hash string
  it('hashPassword returns a bcrypt hash string', () => {
    const hash = hashPassword('testpassword');
    expect(typeof hash).toBe('string');
    expect(hash.startsWith('$2a$')).toBe(true);
    expect(hash.length).toBe(60);
  });

  // verifyPassword returns true for correct password
  it('verifyPassword returns true for correct password', () => {
    const hash = hashPassword('mysecretpassword');
    const result = verifyPassword('mysecretpassword', hash);
    expect(result).toBe(true);
  });

  // verifyPassword returns false for wrong password
  it('verifyPassword returns false for wrong password', () => {
    const hash = hashPassword('mysecretpassword');
    const result = verifyPassword('wrongpassword', hash);
    expect(result).toBe(false);
  });

  // hash is different each time (due to salt)
  it('hash is different each time due to salt', () => {
    const hash1 = hashPassword('samepassword');
    const hash2 = hashPassword('samepassword');
    expect(hash1).not.toBe(hash2);
    // but both should verify correctly
    expect(verifyPassword('samepassword', hash1)).toBe(true);
    expect(verifyPassword('samepassword', hash2)).toBe(true);
  });
});
