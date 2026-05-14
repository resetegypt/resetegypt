import { describe, it, expect } from 'vitest';
import { canAccessMailbox } from './mail-access.js';
import type { JWTPayload } from '../../plugins/auth.js';

function user(role: JWTPayload['role'], sub: string): JWTPayload {
  return { sub, email: `${sub}@x`, role, firstName: 'F', lastName: 'L' };
}

describe('canAccessMailbox', () => {
  const mailbox = { userId: 'u-ahmad' };

  it('autorise le propriétaire de la mailbox', () => {
    expect(canAccessMailbox(user('PRACTITIONER', 'u-ahmad'), mailbox)).toBe(true);
  });

  it('autorise un ADMIN même non-propriétaire', () => {
    expect(canAccessMailbox(user('ADMIN', 'u-admin'), mailbox)).toBe(true);
  });

  it('refuse une SECRETARY', () => {
    expect(canAccessMailbox(user('SECRETARY', 'u-sec'), mailbox)).toBe(false);
  });

  it('refuse un autre praticien', () => {
    expect(canAccessMailbox(user('PRACTITIONER', 'u-autre'), mailbox)).toBe(false);
  });
});
