import { describe, it, expect } from 'vitest';
import { buildSnippet } from './mail-snippet.js';

describe('buildSnippet', () => {
  it('utilise le texte brut quand il est présent', () => {
    expect(buildSnippet('Bonjour docteur', '<p>ignoré</p>')).toBe('Bonjour docteur');
  });

  it('déshtmlise le HTML quand le texte brut est absent', () => {
    expect(buildSnippet(null, '<p>Bonjour <b>docteur</b></p>')).toBe('Bonjour docteur');
  });

  it('normalise les espaces multiples', () => {
    expect(buildSnippet('a\n\n  b   c', null)).toBe('a b c');
  });

  it('tronque à 140 caractères avec une ellipse', () => {
    const long = 'x'.repeat(200);
    const out = buildSnippet(long, null);
    expect(out.length).toBe(140);
    expect(out.endsWith('…')).toBe(true);
  });

  it('retourne une chaîne vide sans contenu', () => {
    expect(buildSnippet(null, null)).toBe('');
    expect(buildSnippet('', '')).toBe('');
  });
});
