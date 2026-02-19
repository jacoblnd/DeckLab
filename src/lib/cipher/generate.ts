import { createRng } from './prng';
import type { Swap, Transformation, CipherMapping } from './deck';

const DECK_SIZE = 26;
const SWAPS_PER_TRANSFORM = 4;

/**
 * Wrap a value into range [1, 25] (deck positions excluding 0).
 */
function wrapPos(v: number): number {
  return (v - 1) % 25 + 1;
}

/**
 * Generate a cipher mapping using a sliding window pattern.
 * For letter i (A=0 .. Z=25), 7 consecutive non-zero positions are
 * selected starting at (i + 1), wrapped to 1–25. Position 0 is then
 * paired with the (i % 7)-th position in the window — this rotation
 * ensures that even when two letters share the same window (inevitable
 * with 26 letters and 25 non-zero positions), their pairings differ.
 * The remaining 6 positions are paired sequentially.
 */
export function generateSlidingWindowMapping(): CipherMapping {
  const mapping: CipherMapping = {};

  for (let i = 0; i < DECK_SIZE; i++) {
    const letter = String.fromCharCode(65 + i);
    const window: number[] = [];
    for (let k = 0; k < 7; k++) {
      window.push(wrapPos(i + 1 + k));
    }

    // Pick which window position pairs with 0, rotating per letter
    const partnerIdx = i % 7;
    const partner = window[partnerIdx];
    const remaining = window.filter((_, idx) => idx !== partnerIdx);

    mapping[letter] = [
      [0, partner],
      [remaining[0], remaining[1]],
      [remaining[2], remaining[3]],
      [remaining[4], remaining[5]],
    ] as Transformation;
  }

  return mapping;
}

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
export function transformationKey(t: Transformation): string {
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
