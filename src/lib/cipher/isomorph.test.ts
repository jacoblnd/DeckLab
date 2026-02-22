import { describe, it, expect } from 'vitest';
import { isomorphPattern, findIsomorphs, isomorphInterestingness, sortByInterestingness, countPatternOccurrences } from './isomorph';
import type { Isomorph } from './isomorph';

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
    // 'aba' appears at positions 0, 6, 12 — all pairs (0,6), (0,12), (6,12) are valid
    const ct = 'abaxyzabaxyzaba';
    const results = findIsomorphs(ct);
    const aDotA = results.filter(r => r.pattern === 'a.a');
    expect(aDotA).toContainEqual({ pattern: 'a.a', startA: 0, startB: 6 });
    expect(aDotA).toContainEqual({ pattern: 'a.a', startA: 0, startB: 12 });
    expect(aDotA).toContainEqual({ pattern: 'a.a', startA: 6, startB: 12 });
  });

  it('excludes patterns that start with one or more periods', () => {
    // 'xaa' at positions 0 and 3 in 'xaaxaa' would form pattern '.aa' — leading '.' → excluded
    const results = findIsomorphs('xaaxaa');
    expect(results.filter(r => r.pattern.startsWith('.'))).toHaveLength(0);
  });

  it('excludes patterns that end with one or more periods', () => {
    // 'aax' at positions 0 and 3 in 'aaxaax' would form pattern 'aa.' — trailing '.' → excluded
    const results = findIsomorphs('aaxaax');
    expect(results.filter(r => r.pattern.endsWith('.'))).toHaveLength(0);
  });

  it('uses the corrected doc example with partial isomorph structure', () => {
    // CT1 'yfgepxleyx' → 'a..b.c.bac', CT2 'qrmjmltjql' → 'a.bcbd.cad'
    // CT1's constraints (pos 0==8, pos 3==7, pos 5==9) are all satisfied by CT2
    expect(isomorphPattern('yfgepxleyx')).toBe('a..b.c.bac');
    expect(isomorphPattern('qrmjmltjql')).toBe('a.bcbd.cad');
  });
});

// ── isomorphInterestingness ──

describe('isomorphInterestingness', () => {
  it('returns 0 for an all-period pattern', () => {
    expect(isomorphInterestingness('.....')).toBe(0);
  });

  it('returns 1 for an all-letter pattern', () => {
    expect(isomorphInterestingness('aaaa')).toBe(1);
  });

  it('returns the correct fraction for a mixed pattern', () => {
    // 'a..ba.ab' has 5 non-period chars out of 8
    expect(isomorphInterestingness('a..ba.ab')).toBeCloseTo(5 / 8);
  });

  it('returns the correct fraction for a sparse pattern', () => {
    // 'a....a' has 2 non-period chars out of 6
    expect(isomorphInterestingness('a....a')).toBeCloseTo(2 / 6);
  });
});

// ── sortByInterestingness ──

describe('sortByInterestingness', () => {
  it('returns a new array without mutating the input', () => {
    const input: Isomorph[] = [{ pattern: 'a.a', startA: 0, startB: 5 }];
    const result = sortByInterestingness(input);
    expect(result).not.toBe(input);
    expect(input).toHaveLength(1);
  });

  it('sorts by descending interestingness (density)', () => {
    // 'aa' density 1.0, 'a.a' density 0.667 → 'aa' comes first
    const lo: Isomorph = { pattern: 'a.a', startA: 0, startB: 10 };
    const hi: Isomorph = { pattern: 'aa', startA: 0, startB: 5 };
    const sorted = sortByInterestingness([lo, hi]);
    expect(sorted[0]).toEqual(hi);
    expect(sorted[1]).toEqual(lo);
  });

  it('breaks equal-density ties by pattern length descending', () => {
    // Both 'aa' and 'aaaa' have density 1.0; longer pattern ranks higher
    const short: Isomorph = { pattern: 'aa', startA: 0, startB: 2 };
    const long: Isomorph  = { pattern: 'aaaa', startA: 0, startB: 4 };
    const sorted = sortByInterestingness([short, long]);
    expect(sorted[0]).toEqual(long);
    expect(sorted[1]).toEqual(short);
  });

  it('breaks equal-density and equal-length ties by startA ascending', () => {
    // Two 'aa' entries at different positions; lower startA comes first
    const later: Isomorph  = { pattern: 'aa', startA: 2, startB: 4 };
    const earlier: Isomorph = { pattern: 'aa', startA: 0, startB: 2 };
    const sorted = sortByInterestingness([later, earlier]);
    expect(sorted[0]).toEqual(earlier);
    expect(sorted[1]).toEqual(later);
  });

  it('breaks equal-interestingness ties by descending count when patternCounts is provided', () => {
    // Both 'aa' and 'bb' have density 1.0; 'bb' has count 3 vs 'aa' count 1,
    // so 'bb' should rank first because count is the secondary key
    const lo: Isomorph = { pattern: 'aa', startA: 0, startB: 5 };
    const hi: Isomorph = { pattern: 'bb', startA: 0, startB: 10 };
    const counts = new Map([['aa', 1], ['bb', 3]]);
    const sorted = sortByInterestingness([lo, hi], counts);
    expect(sorted[0]).toEqual(hi);
    expect(sorted[1]).toEqual(lo);
  });
});

// ── countPatternOccurrences ──

describe('countPatternOccurrences', () => {
  it('returns an empty map for an empty array', () => {
    expect(countPatternOccurrences([])).toEqual(new Map());
  });

  it('counts one pair for a single entry', () => {
    const isomorphs: Isomorph[] = [{ pattern: 'a.a', startA: 0, startB: 5 }];
    expect(countPatternOccurrences(isomorphs).get('a.a')).toBe(1);
  });

  it('counts three pairs when three entries share a pattern', () => {
    const isomorphs: Isomorph[] = [
      { pattern: 'aa.', startA: 0, startB: 6 },
      { pattern: 'aa.', startA: 0, startB: 12 },
      { pattern: 'aa.', startA: 6, startB: 12 },
    ];
    expect(countPatternOccurrences(isomorphs).get('aa.')).toBe(3);
  });

  it('counts each pattern independently when multiple patterns are present', () => {
    const isomorphs: Isomorph[] = [
      { pattern: 'aa.', startA: 0, startB: 6 },
      { pattern: 'a.a', startA: 1, startB: 8 },
      { pattern: 'a.a', startA: 1, startB: 15 },
    ];
    const counts = countPatternOccurrences(isomorphs);
    expect(counts.get('aa.')).toBe(1);
    expect(counts.get('a.a')).toBe(2);
  });

  it('counts two pairs for two entries with the same pattern', () => {
    const isomorphs: Isomorph[] = [
      { pattern: 'aa.', startA: 0, startB: 6 },
      { pattern: 'aa.', startA: 0, startB: 12 },
    ];
    expect(countPatternOccurrences(isomorphs).get('aa.')).toBe(2);
  });
});
