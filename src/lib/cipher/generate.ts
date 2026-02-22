import { createRng } from './prng';
import type { Swap, Transformation, CipherMapping } from './deck';

const DECK_SIZE = 26;

export type CipherConfig = {
  swapCount: number;         // 1–13: number of swap pairs per transformation
  rotationMax: number;       // 0–25: 0 = no rotation; positive = rotation amount
  rotationConstant: boolean; // true = every transformation uses rotationMax exactly
                             // false = each transformation picks randomly from [1, rotationMax]
};

/**
 * Wrap a value into range [1, 25] (deck positions excluding 0).
 */
function wrapPos(v: number): number {
  return (v - 1) % 25 + 1;
}

/**
 * Pick `count` unique integers from [1, max) using the given RNG.
 * (Excludes 0 — for use when position 0 must be added separately.)
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
 * Pick `count` unique integers from [0, max) using the given RNG.
 * (Includes 0 — for use when rotation handles the top-card-change rule.)
 */
function sampleUnique(rng: () => number, max: number, count: number): number[] {
  const result: number[] = [];
  const used = new Set<number>();
  while (result.length < count) {
    const v = Math.floor(rng() * max);
    if (!used.has(v)) {
      used.add(v);
      result.push(v);
    }
  }
  return result;
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

    mapping[letter] = {
      swaps: [
        [0, partner],
        [remaining[0], remaining[1]],
        [remaining[2], remaining[3]],
        [remaining[4], remaining[5]],
      ],
      rotation: 1,
    };
  }

  return mapping;
}

/**
 * Generate a single transformation with the given swap count and rotation.
 *
 * If rotation === 0: position 0 must be in one swap (top card must change
 * via swaps). Samples swapCount*2 - 1 unique non-zero positions and prepends 0.
 *
 * If rotation > 0: rotation already guarantees the top card changes, so
 * all 2*swapCount positions are sampled freely from the full deck range.
 */
function generateTransformation(rng: () => number, swapCount: number, rotation: number): Transformation {
  let positions: number[];
  if (rotation === 0) {
    const others = sampleUniqueNonZero(rng, DECK_SIZE, swapCount * 2 - 1);
    positions = [0, ...others];
  } else {
    positions = sampleUnique(rng, DECK_SIZE, swapCount * 2);
  }

  const swaps: Swap[] = [];
  for (let i = 0; i < positions.length; i += 2) {
    swaps.push([positions[i], positions[i + 1]]);
  }

  return { swaps, rotation };
}

/**
 * Normalize and serialize a transformation for equality comparison.
 * Each swap is sorted (lower index first), then swaps are sorted
 * lexicographically, so equivalent transformations produce the same key.
 * Rotation is included in the key so same-swaps/different-rotation
 * transformations are treated as distinct.
 */
export function transformationKey(t: Transformation): string {
  const normalized = t.swaps
    .map(([a, b]) => (a < b ? [a, b] : [b, a]) as Swap)
    .sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return `r${t.rotation};${normalized.map(([a, b]) => `${a},${b}`).join(';')}`;
}

/**
 * Generate a complete cipher mapping: 26 PT symbols (A–Z) each mapped
 * to a unique transformation. Uses a seeded PRNG for reproducibility.
 *
 * Throws if the configuration cannot produce 26 unique transformations.
 * The only currently reachable invalid combination is swapCount=1 with
 * rotationMax=0, which yields only 25 possible keys.
 */
export function generateCipherMapping(seed: number, config: CipherConfig): CipherMapping {
  if (config.swapCount === 1 && config.rotationMax === 0) {
    throw new Error(
      'Invalid cipher config: swapCount=1 with rotationMax=0 can only produce 25 unique ' +
      'transformations, but 26 are required. Increase swapCount to at least 2, or set rotationMax > 0.'
    );
  }
  const rng = createRng(seed);
  const mapping: CipherMapping = {};
  const usedKeys = new Set<string>();

  for (let i = 0; i < DECK_SIZE; i++) {
    const letter = String.fromCharCode(65 + i);
    while (true) {
      let rotation = 0;
      if (config.rotationMax > 0) {
        rotation = config.rotationConstant
          ? config.rotationMax
          : 1 + Math.floor(rng() * config.rotationMax);
      }
      const t = generateTransformation(rng, config.swapCount, rotation);
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
