import { describe, it, expect } from 'vitest';
import { extractThreadingRefs } from './threading.js';

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
