import { describe, it, expect } from 'vitest';
import { maskEmail } from './email.js';

describe('maskEmail', () => {
  it('masque une adresse standard', () => {
    expect(maskEmail('patient@example.com')).toBe('p******@e******.com');
  });

  it('masque une adresse courte (local 1 char)', () => {
    // local="a" → "a" + 1 étoile fallback = "a*"
    // domain="b.c", lastDot=1 → "b" + 1 étoile fallback + ".c" = "b*.c"
    expect(maskEmail('a@b.c')).toBe('a*@b*.c');
  });

  it('masque un local à 2 chars', () => {
    expect(maskEmail('ab@example.com')).toBe('a*@e******.com');
  });

  it('gère un TLD long (.egypt)', () => {
    expect(maskEmail('test@server.egypt')).toBe('t***@s*****.egypt');
  });

  it('gère un sous-domaine', () => {
    // Utilise le lastIndexOf('.') — donc smtp.example.com → s*********.com
    const r = maskEmail('user@smtp.example.com');
    expect(r.startsWith('u')).toBe(true);
    expect(r).toContain('@s');
    expect(r).toContain('.com');
  });

  it('retourne [empty] pour null/undefined/vide', () => {
    expect(maskEmail(null)).toBe('[empty]');
    expect(maskEmail(undefined)).toBe('[empty]');
    expect(maskEmail('')).toBe('[empty]');
  });

  it('retourne [invalid-email] pour input sans @', () => {
    expect(maskEmail('notanemail')).toBe('[invalid-email]');
    expect(maskEmail('@nolocal.com')).toBe('[invalid-email]'); // at index 0 → treat as invalid
  });

  it('ne leak pas le nom complet ni le domaine complet', () => {
    const email = 'jane.doe@company-name.co.uk';
    const masked = maskEmail(email);
    expect(masked).not.toContain('jane.doe');
    expect(masked).not.toContain('company-name');
    expect(masked.startsWith('j')).toBe(true);
    expect(masked).toContain('@c');
    expect(masked.endsWith('.uk')).toBe(true);
  });
});
