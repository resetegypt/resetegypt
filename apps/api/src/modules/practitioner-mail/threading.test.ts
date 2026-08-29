import { describe, it, expect } from 'vitest';
import { extractThreadingRefs, normalizeSubject, subjectsMatch } from './threading.js';

describe('extractThreadingRefs', () => {
  it('retourne un tableau vide sans inReplyTo ni references', () => {
    expect(extractThreadingRefs(null, null)).toEqual([]);
    expect(extractThreadingRefs(undefined, undefined)).toEqual([]);
  });

  it('inclut le inReplyTo en premier', () => {
    expect(extractThreadingRefs('<a@x>', [])).toEqual(['<a@x>']);
  });

  it('inclut les references', () => {
    expect(extractThreadingRefs(null, ['<a@x>', '<b@x>'])).toEqual(['<a@x>', '<b@x>']);
  });

  it('combine inReplyTo et references et déduplique en gardant l ordre', () => {
    expect(extractThreadingRefs('<b@x>', ['<a@x>', '<b@x>'])).toEqual(['<b@x>', '<a@x>']);
  });

  it('ignore les entrées vides et trim les espaces', () => {
    expect(extractThreadingRefs('  <a@x>  ', ['', '  ', '<b@x>'])).toEqual(['<a@x>', '<b@x>']);
  });
});

describe('normalizeSubject', () => {
  it('retourne chaîne vide pour null/undefined/vide', () => {
    expect(normalizeSubject(null)).toBe('');
    expect(normalizeSubject(undefined)).toBe('');
    expect(normalizeSubject('')).toBe('');
    expect(normalizeSubject('   ')).toBe('');
  });

  it('strip le préfixe Re: (case-insensitive)', () => {
    expect(normalizeSubject('Re: rendez-vous')).toBe('rendez-vous');
    expect(normalizeSubject('RE: rendez-vous')).toBe('rendez-vous');
    expect(normalizeSubject('re: rendez-vous')).toBe('rendez-vous');
  });

  it('strip Fwd:, Fw:, FW:, TR: (français), AW: (allemand)', () => {
    expect(normalizeSubject('Fwd: hello')).toBe('hello');
    expect(normalizeSubject('Fw: hello')).toBe('hello');
    expect(normalizeSubject('FW: hello')).toBe('hello');
    expect(normalizeSubject('TR: bonjour')).toBe('bonjour');
    expect(normalizeSubject('AW: guten tag')).toBe('guten tag');
  });

  it('strip les préfixes empilés (Re: Fwd: Re: subject)', () => {
    expect(normalizeSubject('Re: Fwd: Re: mon sujet')).toBe('mon sujet');
    expect(normalizeSubject('RE: FW: RE: Test')).toBe('test');
  });

  it('normalise la casse et le whitespace', () => {
    expect(normalizeSubject('  HELLO   world  ')).toBe('hello world');
    expect(normalizeSubject('Foo\tBar\n\nBaz')).toBe('foo bar baz');
  });

  it('préserve les [TAG] et le contenu non-préfixe', () => {
    // Le tag [EXT] reste, seul le Re: est stripé.
    expect(normalizeSubject('Re: [EXT] Confirmation')).toBe('[ext] confirmation');
  });

  it('gère un subject sans préfixe (no-op sauf normalisation)', () => {
    expect(normalizeSubject('Simple subject')).toBe('simple subject');
  });

  it('ne boucle pas à l infini sur un input pathologique', () => {
    // "Re:Re:Re:Re:Re:Re:Re:Re:Re:Re:Re:x" — garde-fou 10 dépilages
    const input = 'Re:'.repeat(20) + 'x';
    // Le garde-fou stoppe à 10 dépilages, il peut rester des "Re:" — mais pas de crash
    const result = normalizeSubject(input);
    expect(result).toContain('x');
    expect(result.length).toBeLessThan(input.length);
  });
});

describe('subjectsMatch', () => {
  it('match 2 subjects identiques après strip Re:/Fwd:', () => {
    expect(subjectsMatch('Rendez-vous', 'Re: Rendez-vous')).toBe(true);
    expect(subjectsMatch('Re: hello', 'Fwd: hello')).toBe(true);
    expect(subjectsMatch('Re: Fwd: subject', 'Re: subject')).toBe(true);
  });

  it('ne match pas 2 subjects différents', () => {
    expect(subjectsMatch('Rendez-vous', 'Facture')).toBe(false);
    expect(subjectsMatch('Re: hello', 'Re: world')).toBe(false);
  });

  it('renvoie false si l un des 2 est vide', () => {
    expect(subjectsMatch('', 'hello')).toBe(false);
    expect(subjectsMatch('hello', null)).toBe(false);
    expect(subjectsMatch(null, null)).toBe(false);
  });

  it('match case-insensitive', () => {
    expect(subjectsMatch('HELLO WORLD', 'Re: hello world')).toBe(true);
  });
});
