export type Isomorph = {
  pattern: string; // e.g. 'a..ba.ab' — length equals the window length
  startA: number;  // start index of first substring in ciphertext
  startB: number;  // start index of second substring (startB >= startA + pattern.length)
};

/**
 * Computes the isomorph pattern of a string.
 * Characters that appear more than once are assigned labels 'a', 'b', 'c', … in
 * order of first occurrence. Characters that appear exactly once become '.'.
 *
 * Examples:
 *   'ahwoanao' → 'a..ba.ab'
 *   'uvonuyun' → 'a..ba.ab'  (isomorphic with the above)
 *   'abcde'   → '.....'
 */
export function isomorphPattern(s: string): string {
  const freq: Record<string, number> = {};
  for (const c of s) {
    freq[c] = (freq[c] ?? 0) + 1;
  }

  const assigned: Record<string, string> = {};
  let nextCode = 0;
  let result = '';

  for (const c of s) {
    if (freq[c] === 1) {
      result += '.';
    } else {
      if (!(c in assigned)) {
        assigned[c] = String.fromCharCode(97 + nextCode);
        nextCode++;
      }
      result += assigned[c];
    }
  }

  return result;
}

/**
 * Finds all isomorphic substring pairs in the given ciphertext.
 *
 * For every window length n from 3 to floor(length / 2), computes the isomorph
 * pattern of every n-length window and groups positions by pattern. Emits one
 * Isomorph entry for each pair of non-overlapping positions that share a pattern.
 *
 * Trivial windows (all characters distinct, pattern all '.') are skipped.
 * Non-overlap condition: startB >= startA + n.
 */
/** Fraction of non-period characters in a pattern. Range [0, 1]. */
export function isomorphInterestingness(pattern: string): number {
  let repeats = 0;
  for (const c of pattern) {
    if (c !== '.') repeats++;
  }
  return repeats / pattern.length;
}

/**
 * Returns a new array of isomorphs sorted by descending interestingness.
 * Ties are broken by pattern length descending, then startA ascending.
 */
export function sortByInterestingness(isomorphs: Isomorph[]): Isomorph[] {
  return [...isomorphs].sort((a, b) => {
    const di = isomorphInterestingness(b.pattern) - isomorphInterestingness(a.pattern);
    if (di !== 0) return di;
    const dl = b.pattern.length - a.pattern.length;
    if (dl !== 0) return dl;
    return a.startA - b.startA;
  });
}

export function findIsomorphs(ciphertext: string): Isomorph[] {
  const result: Isomorph[] = [];
  const L = ciphertext.length;
  const maxLen = Math.floor(L / 2);

  for (let n = 3; n <= maxLen; n++) {
    const groups = new Map<string, number[]>();

    for (let i = 0; i <= L - n; i++) {
      const pattern = isomorphPattern(ciphertext.slice(i, i + n));
      if (!/[a-z]/.test(pattern)) continue; // skip trivial (all-unique) windows

      const group = groups.get(pattern);
      if (group) {
        group.push(i);
      } else {
        groups.set(pattern, [i]);
      }
    }

    for (const [pattern, positions] of groups) {
      for (let pi = 0; pi < positions.length; pi++) {
        const startA = positions[pi];
        for (let pj = pi + 1; pj < positions.length; pj++) {
          const startB = positions[pj];
          if (startB >= startA + n) {
            result.push({ pattern, startA, startB });
          }
        }
      }
    }
  }

  return result;
}
