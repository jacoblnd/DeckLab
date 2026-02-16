import { createRng } from './prng';
import type { Swap, Transformation, CipherMapping } from './deck';

const DECK_SIZE = 26;
const SWAPS_PER_TRANSFORM = 4;

/**
 * Pick `count` unique integers from [1, max) using the given RNG.
 * (Excludes 0 — position 0 is always included separately.)
 */
function sampleUniqueNonZero(rng: () => number, max: number, count: number): number[] {
  const result: number[] = [];
  const used = new Set<number>();
  while (result.length < count) {
    const v = 1 + Math.floor(rng() * (max - 1));
    if (!used.has(v)) {
      used.add(v);
      result.push(v);
    }
  }
  return result;
}

/**
 * Generate a single transformation: 4 swaps with 8 distinct positions.
 * Position 0 is always included by construction — it is placed first,
 * then 7 more unique positions are sampled from 1–25.
 */
function generateTransformation(rng: () => number): Transformation {
  const others = sampleUniqueNonZero(rng, DECK_SIZE, SWAPS_PER_TRANSFORM * 2 - 1);
  const positions = [0, ...others];

  return [
    [positions[0], positions[1]],
    [positions[2], positions[3]],
    [positions[4], positions[5]],
    [positions[6], positions[7]],
  ] as Transformation;
}

/**
 * Normalize and serialize a transformation for equality comparison.
 * Each swap is sorted (lower index first), then swaps are sorted
 * lexicographically, so equivalent transformations produce the same key.
 */
function transformationKey(t: Transformation): string {
  const normalized = t
    .map(([a, b]) => (a < b ? [a, b] : [b, a]) as Swap)
    .sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return normalized.map(([a, b]) => `${a},${b}`).join(';');
}

/**
 * Generate a complete cipher mapping: 26 PT symbols (A–Z) each mapped
 * to a unique transformation. Uses a seeded PRNG for reproducibility.
 */
export function generateCipherMapping(seed: number): CipherMapping {
  const rng = createRng(seed);
  const mapping: CipherMapping = {};
  const usedKeys = new Set<string>();

  for (let i = 0; i < DECK_SIZE; i++) {
    const letter = String.fromCharCode(65 + i);
    while (true) {
      const t = generateTransformation(rng);
      const key = transformationKey(t);
      if (!usedKeys.has(key)) {
        usedKeys.add(key);
        mapping[letter] = t;
        break;
      }
    }
  }

  return mapping;
}
