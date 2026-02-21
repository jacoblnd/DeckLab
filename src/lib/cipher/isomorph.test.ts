import { describe, it, expect } from 'vitest';
import { isomorphPattern, findIsomorphs } from './isomorph';

// ── isomorphPattern ──

describe('isomorphPattern', () => {
  it('returns all periods for an all-unique string', () => {
    expect(isomorphPattern('abcde')).toBe('.....');
  });

  it('labels a single repeated character', () => {
    expect(isomorphPattern('abac')).toBe('a.a.');
  });

  it('labels two repeat groups (doc example string 1)', () => {
    expect(isomorphPattern('ahwoanao')).toBe('a..ba.ab');
  });

  it('produces the same pattern for an isomorphic string (doc example string 2)', () => {
    expect(isomorphPattern('uvonuyun')).toBe('a..ba.ab');
  });

  it('labels all positions when all characters are identical', () => {
    expect(isomorphPattern('aaaa')).toBe('aaaa');
  });

  it('assigns labels in first-occurrence order, not alphabetical char order', () => {
    // 'c' is first encountered and repeats, so it gets label 'a'; 'b' gets label 'b'
    // Alphabetical order would give 'b'→'a' and 'c'→'b', producing 'baab'
    expect(isomorphPattern('cbbc')).toBe('abba');
  });
});

// ── findIsomorphs ──

describe('findIsomorphs', () => {
  it('returns empty array for an empty string', () => {
    expect(findIsomorphs('')).toEqual([]);
  });

  it('returns empty array when ciphertext is too short (length 2)', () => {
    // maxLen = floor(2/2) = 1 < 3, so no valid window lengths
    expect(findIsomorphs('ab')).toEqual([]);
  });

  it('returns empty array when ciphertext is too short (length 5)', () => {
    // maxLen = floor(5/2) = 2 < 3, so no valid window lengths
    expect(findIsomorphs('abcde')).toEqual([]);
  });

  it('returns empty array when all windows have only unique characters', () => {
    // Every 3- and 4-char window of 'abcdefgh' is trivial
    expect(findIsomorphs('abcdefgh')).toEqual([]);
  });

  it('finds a known isomorphic pair from the doc example', () => {
    // 'ahwoanao' and 'uvonuyun' both have pattern 'a..ba.ab', placed at positions 0 and 8
    const results = findIsomorphs('ahwoanaouvonuyun');
    expect(results).toContainEqual({ pattern: 'a..ba.ab', startA: 0, startB: 8 });
  });

  it('excludes overlapping window pairs with the same pattern', () => {
    // 'ababab': at n=3, 'aba' at pos 0 and pos 2 share pattern 'a.a' but overlap (2 < 0+3)
    const results = findIsomorphs('ababab');
    const overlapping = results.filter(r => r.startA === 0 && r.startB === 2);
    expect(overlapping).toHaveLength(0);
  });

  it('includes non-overlapping window pairs with the same pattern', () => {
    // 'ababab': at n=3, 'aba' at pos 0 and 'bab' at pos 3 share pattern 'a.a', non-overlapping (3 >= 0+3)
    const results = findIsomorphs('ababab');
    expect(results).toContainEqual({ pattern: 'a.a', startA: 0, startB: 3 });
  });

  it('includes touching (adjacent, non-overlapping) window pairs', () => {
    // The pair (0,3) in 'ababab' is exactly touching: startB === startA + n
    const results = findIsomorphs('ababab');
    const touching = results.filter(r => r.startB === r.startA + r.pattern.length);
    expect(touching.length).toBeGreaterThan(0);
  });

  it('returns all valid pairs when three isomorphic windows are non-overlapping', () => {
    // 'aab' appears at positions 0, 6, 12 — all pairs (0,6), (0,12), (6,12) are valid
    const ct = 'aabxyzaabpqraab';
    const results = findIsomorphs(ct);
    const aaDot = results.filter(r => r.pattern === 'aa.');
    expect(aaDot).toContainEqual({ pattern: 'aa.', startA: 0, startB: 6 });
    expect(aaDot).toContainEqual({ pattern: 'aa.', startA: 0, startB: 12 });
    expect(aaDot).toContainEqual({ pattern: 'aa.', startA: 6, startB: 12 });
  });

  it('uses the corrected doc example with partial isomorph structure', () => {
    // CT1 'yfgepxleyx' → 'a..b.c.bac', CT2 'qrmjmltjql' → 'a.bcbd.cad'
    // CT1's constraints (pos 0==8, pos 3==7, pos 5==9) are all satisfied by CT2
    expect(isomorphPattern('yfgepxleyx')).toBe('a..b.c.bac');
    expect(isomorphPattern('qrmjmltjql')).toBe('a.bcbd.cad');
  });
});
