import { createRng } from './prng';
import type { Swap, Transformation, CipherMapping } from './deck';

const DECK_SIZE = 26;
const SWAPS_PER_TRANSFORM = 4;
const POSITIONS_PER_TRANSFORM = SWAPS_PER_TRANSFORM * 2; // 8

/**
 * Pick `count` unique integers from [0, max) using the given RNG.
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
 * Generate a single transformation: 4 swaps with 8 distinct positions,
 * guaranteed to include position 0 so the top card always moves.
 */
function generateTransformation(rng: () => number): Transformation {
  while (true) {
    const positions = sampleUnique(rng, DECK_SIZE, POSITIONS_PER_TRANSFORM);
    if (!positions.includes(0)) continue;

    return [
      [positions[0], positions[1]],
      [positions[2], positions[3]],
      [positions[4], positions[5]],
      [positions[6], positions[7]],
    ] as Transformation;
  }
}

/**
 * Serialize a transformation for equality comparison.
 */
function transformationKey(t: Transformation): string {
  return t.map(([a, b]) => `${a},${b}`).join(';');
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
