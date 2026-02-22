import { describe, it, expect } from 'vitest';
import { createInitialDeck, applyTransformation, encipherStep, encipher } from './deck';
import type { Transformation, CipherMapping, CipherStep } from './deck';
import { generateCipherMapping, generateSlidingWindowMapping, transformationKey } from './generate';
import type { CipherConfig } from './generate';
import { createRng } from './prng';

const DEFAULT_CONFIG: CipherConfig = { swapCount: 4, rotationMax: 0, rotationConstant: false };

// ── PRNG ──

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it('produces values in [0, 1)', () => {
    const rng = createRng(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

// ── Deck basics ──

describe('createInitialDeck', () => {
  it('returns an array of 26 letters A–Z', () => {
    const deck = createInitialDeck();
    expect(deck).toHaveLength(26);
    expect(deck[0]).toBe('A');
    expect(deck[25]).toBe('Z');
    expect(deck.join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });
});

// ── applyTransformation ──

describe('applyTransformation', () => {
  it('swaps the correct positions (no rotation)', () => {
    const deck = createInitialDeck();
    const t: Transformation = {
      swaps: [[0, 1], [2, 3], [4, 5], [6, 7]],
      rotation: 0,
    };
    const result = applyTransformation(deck, t);
    expect(result[0]).toBe('B');
    expect(result[1]).toBe('A');
    expect(result[2]).toBe('D');
    expect(result[3]).toBe('C');
    expect(result[4]).toBe('F');
    expect(result[5]).toBe('E');
    expect(result[6]).toBe('H');
    expect(result[7]).toBe('G');
    // rest unchanged
    expect(result[8]).toBe('I');
  });

  it('does not mutate the original deck', () => {
    const deck = createInitialDeck();
    const original = [...deck];
    applyTransformation(deck, { swaps: [[0, 25], [1, 24], [2, 23], [3, 22]], rotation: 0 });
    expect(deck).toEqual(original);
  });

  it('applies rotation by shifting cards left by N positions', () => {
    const deck = createInitialDeck(); // [A, B, C, D, ...]
    const t: Transformation = { swaps: [[0, 1]], rotation: 2 };
    const result = applyTransformation(deck, t);
    // After rotation by 2: [C, D, E, ..., A, B]
    // Then swap positions 0 and 1: [D, C, E, ..., A, B]
    expect(result[0]).toBe('D'); // was C (from rotation), swapped with D
    expect(result[1]).toBe('C'); // was D (from rotation), swapped with C
    expect(result[2]).toBe('E'); // unchanged by swap
  });

  it('applies rotation of 0 as a no-op', () => {
    const deck = createInitialDeck();
    const t: Transformation = { swaps: [[0, 1]], rotation: 0 };
    const result = applyTransformation(deck, t);
    expect(result[0]).toBe('B');
    expect(result[1]).toBe('A');
    expect(result[2]).toBe('C');
  });

  it('applies rotation before swaps', () => {
    // Deck: [A, B, C, D, E, ...]. Rotation 1 → [B, C, D, E, ...]. Swap (0,1) → [C, B, D, E, ...]
    const deck = createInitialDeck();
    const t: Transformation = { swaps: [[0, 1]], rotation: 1 };
    const result = applyTransformation(deck, t);
    expect(result[0]).toBe('C');
    expect(result[1]).toBe('B');
    expect(result[2]).toBe('D');
  });
});

// ── Cipher generation ──

describe('generateCipherMapping', () => {
  const mapping = generateCipherMapping(42, DEFAULT_CONFIG);

  it('produces a mapping for all 26 letters', () => {
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      expect(mapping[letter]).toBeDefined();
    }
  });

  it('each transformation has exactly 4 swaps', () => {
    for (const t of Object.values(mapping)) {
      expect(t.swaps).toHaveLength(4);
    }
  });

  it('each transformation uses 8 distinct positions', () => {
    for (const t of Object.values(mapping)) {
      const positions = t.swaps.flat();
      expect(positions).toHaveLength(8);
      expect(new Set(positions).size).toBe(8);
    }
  });

  it('every transformation includes position 0 by construction (not by rejection)', () => {
    // Verify across many seeds that position 0 is always the first element
    // of the first swap — this confirms it's built in, not rejection-sampled.
    for (let seed = 0; seed < 50; seed++) {
      const m = generateCipherMapping(seed, DEFAULT_CONFIG);
      for (const t of Object.values(m)) {
        const positions = t.swaps.flat();
        expect(positions).toContain(0);
        expect(t.swaps[0][0]).toBe(0);
      }
    }
  });

  it('no two PT symbols share the same transformation (normalized comparison)', () => {
    function normalizeKey(t: Transformation): string {
      return t.swaps
        .map(([a, b]) => (a < b ? [a, b] : [b, a]))
        .sort((x, y) => x[0] - y[0] || x[1] - y[1])
        .map(([a, b]) => `${a},${b}`)
        .join(';');
    }

    for (let seed = 0; seed < 20; seed++) {
      const m = generateCipherMapping(seed, DEFAULT_CONFIG);
      const keys = Object.values(m).map(normalizeKey);
      expect(new Set(keys).size).toBe(26);
    }
  });

  it('same seed produces the same mapping', () => {
    const a = generateCipherMapping(99, DEFAULT_CONFIG);
    const b = generateCipherMapping(99, DEFAULT_CONFIG);
    expect(a).toEqual(b);
  });

  it('different seeds produce different mappings', () => {
    const a = generateCipherMapping(1, DEFAULT_CONFIG);
    const b = generateCipherMapping(2, DEFAULT_CONFIG);
    expect(a).not.toEqual(b);
  });

  it('respects a custom swapCount of 2', () => {
    const m = generateCipherMapping(42, { swapCount: 2, rotationMax: 0, rotationConstant: false });
    for (const t of Object.values(m)) {
      expect(t.swaps).toHaveLength(2);
      expect(t.swaps.flat()).toHaveLength(4);
      expect(new Set(t.swaps.flat()).size).toBe(4);
    }
  });

  it('respects a custom swapCount of 2', () => {
    const m = generateCipherMapping(42, { swapCount: 2, rotationMax: 0, rotationConstant: false });
    for (const t of Object.values(m)) {
      expect(t.swaps).toHaveLength(2);
      expect(t.swaps.flat()).toHaveLength(4);
      expect(new Set(t.swaps.flat()).size).toBe(4);
      expect(t.swaps[0][0]).toBe(0); // position 0 must be in a swap when rotation === 0
    }
  });

  it('applies constant rotation when rotationConstant is true', () => {
    const m = generateCipherMapping(42, { swapCount: 4, rotationMax: 5, rotationConstant: true });
    for (const t of Object.values(m)) {
      expect(t.rotation).toBe(5);
    }
  });

  it('applies random rotation within [1, rotationMax] when rotationConstant is false', () => {
    const m = generateCipherMapping(42, { swapCount: 4, rotationMax: 10, rotationConstant: false });
    for (const t of Object.values(m)) {
      expect(t.rotation).toBeGreaterThanOrEqual(1);
      expect(t.rotation).toBeLessThanOrEqual(10);
    }
  });

  it('produces rotation 0 for all transformations when rotationMax is 0', () => {
    const m = generateCipherMapping(42, { swapCount: 4, rotationMax: 0, rotationConstant: false });
    for (const t of Object.values(m)) {
      expect(t.rotation).toBe(0);
    }
  });

  it('throws for swapCount=1 with rotationMax=0 (only 25 possible keys)', () => {
    expect(() => generateCipherMapping(42, { swapCount: 1, rotationMax: 0, rotationConstant: false }))
      .toThrow();
  });

  it('does not throw for swapCount=1 with rotationMax > 0', () => {
    expect(() => generateCipherMapping(42, { swapCount: 1, rotationMax: 1, rotationConstant: false }))
      .not.toThrow();
  });

  it('treats same-swaps/different-rotation transformations as distinct', () => {
    // Two configs with same seed but different constant rotations — all 26 transformations unique
    const m1 = generateCipherMapping(42, { swapCount: 4, rotationMax: 3, rotationConstant: true });
    const keys = new Set(Object.values(m1).map(transformationKey));
    expect(keys.size).toBe(26);
  });
});

// ── Sliding window generation ──

describe('generateSlidingWindowMapping', () => {
  const mapping = generateSlidingWindowMapping();

  it('produces a mapping for all 26 letters', () => {
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      expect(mapping[letter]).toBeDefined();
    }
  });

  it('each transformation has exactly 4 swaps with 8 distinct positions', () => {
    for (const t of Object.values(mapping)) {
      expect(t.swaps).toHaveLength(4);
      const positions = t.swaps.flat();
      expect(positions).toHaveLength(8);
      expect(new Set(positions).size).toBe(8);
    }
  });

  it('every transformation includes position 0', () => {
    for (const t of Object.values(mapping)) {
      expect(t.swaps[0][0]).toBe(0);
    }
  });

  it('every transformation has rotation 0', () => {
    for (const t of Object.values(mapping)) {
      expect(t.rotation).toBe(0);
    }
  });

  it('all 26 transformations are unique', () => {
    const keys = Object.values(mapping).map(transformationKey);
    expect(new Set(keys).size).toBe(26);
  });

  it('position 0 partner rotates through the window per letter', () => {
    // A (i=0): partner = window[0] = 1, B (i=1): partner = window[1] = 3
    expect(mapping['A'].swaps[0]).toEqual([0, 1]);
    expect(mapping['B'].swaps[0]).toEqual([0, 3]);
    // H (i=7): partner = window[0] again (7 % 7 = 0), but window starts at 8
    expect(mapping['H'].swaps[0]).toEqual([0, 8]);
  });

  it('is deterministic — same result every time', () => {
    const a = generateSlidingWindowMapping();
    const b = generateSlidingWindowMapping();
    expect(a).toEqual(b);
  });

  it('all non-zero positions are in range 1–25', () => {
    for (const t of Object.values(mapping)) {
      for (const [a, b] of t.swaps) {
        if (a !== 0) {
          expect(a).toBeGreaterThanOrEqual(1);
          expect(a).toBeLessThanOrEqual(25);
        }
        if (b !== 0) {
          expect(b).toBeGreaterThanOrEqual(1);
          expect(b).toBeLessThanOrEqual(25);
        }
      }
    }
  });
});

// ── Encipherment ──

describe('encipherStep', () => {
  const mapping = generateCipherMapping(42, DEFAULT_CONFIG);

  it('changes the top card after a step', () => {
    const deck = createInitialDeck();
    const { newDeck } = encipherStep(deck, 'A', mapping);
    expect(newDeck[0]).not.toBe(deck[0]);
  });

  it('returns the new top card as ciphertextChar', () => {
    const deck = createInitialDeck();
    const { newDeck, ciphertextChar } = encipherStep(deck, 'A', mapping);
    expect(ciphertextChar).toBe(newDeck[0]);
  });
});

describe('encipher', () => {
  const mapping = generateCipherMapping(42, DEFAULT_CONFIG);

  it('enciphers a plaintext string', () => {
    const result = encipher('hello', mapping);
    expect(result.ciphertext).toHaveLength(5);
  });

  it('filters out non-letter characters', () => {
    const result = encipher('h3llo!', mapping);
    expect(result.ciphertext).toHaveLength(4);
  });

  it('returns initial deck, empty ciphertext, and null lastTransformation for empty input', () => {
    const result = encipher('', mapping);
    expect(result.ciphertext).toBe('');
    expect(result.deck).toEqual(createInitialDeck());
    expect(result.lastTransformation).toBeNull();
  });

  it('returns the transformation of the last PT symbol as lastTransformation', () => {
    const result = encipher('ab', mapping);
    expect(result.lastTransformation).toEqual(mapping['B']);
  });

  it('returns the only transformation when a single character is enciphered', () => {
    const result = encipher('x', mapping);
    expect(result.lastTransformation).toEqual(mapping['X']);
  });

  it('same plaintext + same seed = same ciphertext', () => {
    const m = generateCipherMapping(77, DEFAULT_CONFIG);
    const a = encipher('test', m);
    const b = encipher('test', m);
    expect(a.ciphertext).toBe(b.ciphertext);
    expect(a.deck).toEqual(b.deck);
  });

  it('same plaintext + different seed = different ciphertext', () => {
    const m1 = generateCipherMapping(1, DEFAULT_CONFIG);
    const m2 = generateCipherMapping(2, DEFAULT_CONFIG);
    const a = encipher('test', m1);
    const b = encipher('test', m2);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('returns empty steps for empty input', () => {
    const result = encipher('', mapping);
    expect(result.steps).toEqual([]);
  });

  it('returns empty steps when input has no alphabetic characters', () => {
    const result = encipher('123!@#', mapping);
    expect(result.steps).toEqual([]);
  });

  it('returns one step per ciphertext character (non-letters filtered)', () => {
    const result = encipher('h3llo!', mapping);
    expect(result.steps).toHaveLength(4);
    expect(result.steps).toHaveLength(result.ciphertext.length);
  });

  it('each step ciphertextChar matches the corresponding character in ciphertext', () => {
    const result = encipher('hello', mapping);
    for (let i = 0; i < result.steps.length; i++) {
      expect(result.steps[i].ciphertextChar).toBe(result.ciphertext[i]);
    }
  });

  it('each step transformation matches the mapping entry for the plaintext letter', () => {
    const result = encipher('ab', mapping);
    expect(result.steps[0].transformation).toEqual(mapping['A']);
    expect(result.steps[1].transformation).toEqual(mapping['B']);
  });

  it('each step deck has 26 letters and equals the top-card of that step', () => {
    const result = encipher('hello', mapping);
    for (const step of result.steps) {
      expect(step.deck).toHaveLength(26);
      expect(step.deck[0]).toBe(step.ciphertextChar);
    }
  });
});
