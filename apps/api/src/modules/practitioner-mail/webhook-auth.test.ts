import { describe, it, expect } from 'vitest';
import { secretMatches } from './webhook-auth.js';

describe('secretMatches', () => {
  it('retourne true pour deux secrets identiques', () => {
    expect(secretMatches('abc123', 'abc123')).toBe(true);
  });

  it('retourne false pour des secrets différents', () => {
    expect(secretMatches('abc123', 'xyz789')).toBe(false);
  });

  it('retourne false si le secret fourni est undefined', () => {
    expect(secretMatches(undefined, 'abc123')).toBe(false);
  });

  it('retourne false si les longueurs diffèrent', () => {
    expect(secretMatches('abc', 'abc123')).toBe(false);
  });

  it('retourne false si le secret attendu est vide', () => {
    expect(secretMatches('abc', '')).toBe(false);
  });
});
