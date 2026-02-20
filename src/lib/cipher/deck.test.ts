import { describe, it, expect } from 'vitest';
import { createInitialDeck, applyTransformation, encipherStep, encipher } from './deck';
import type { Transformation, CipherMapping, CipherStep } from './deck';
import { generateCipherMapping, generateSlidingWindowMapping, transformationKey } from './generate';
import { createRng } from './prng';

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
  it('swaps the correct positions', () => {
    const deck = createInitialDeck();
    const t: Transformation = [[0, 1], [2, 3], [4, 5], [6, 7]];
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
    applyTransformation(deck, [[0, 25], [1, 24], [2, 23], [3, 22]]);
    expect(deck).toEqual(original);
  });
});

// ── Cipher generation ──

describe('generateCipherMapping', () => {
  const mapping = generateCipherMapping(42);

  it('produces a mapping for all 26 letters', () => {
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      expect(mapping[letter]).toBeDefined();
    }
  });

  it('each transformation has exactly 4 swaps', () => {
    for (const t of Object.values(mapping)) {
      expect(t).toHaveLength(4);
    }
  });

  it('each transformation uses 8 distinct positions', () => {
    for (const t of Object.values(mapping)) {
      const positions = t.flat();
      expect(positions).toHaveLength(8);
      expect(new Set(positions).size).toBe(8);
    }
  });

  it('every transformation includes position 0 by construction (not by rejection)', () => {
    // Verify across many seeds that position 0 is always the first element
    // of the first swap — this confirms it's built in, not rejection-sampled.
    for (let seed = 0; seed < 50; seed++) {
      const m = generateCipherMapping(seed);
      for (const t of Object.values(m)) {
        const positions = t.flat();
        expect(positions).toContain(0);
        // Position 0 should always be positions[0] (first element of first swap)
        expect(t[0][0]).toBe(0);
      }
    }
  });

  it('no two PT symbols share the same transformation (normalized comparison)', () => {
    // Normalize each transformation: sort within swaps, then sort swaps,
    // so reorderings of the same set of swaps are detected as duplicates.
    function normalizeKey(t: Transformation): string {
      return t
        .map(([a, b]) => (a < b ? [a, b] : [b, a]))
        .sort((x, y) => x[0] - y[0] || x[1] - y[1])
        .map(([a, b]) => `${a},${b}`)
        .join(';');
    }

    // Check across multiple seeds
    for (let seed = 0; seed < 20; seed++) {
      const m = generateCipherMapping(seed);
      const keys = Object.values(m).map(normalizeKey);
      expect(new Set(keys).size).toBe(26);
    }
  });

  it('same seed produces the same mapping', () => {
    const a = generateCipherMapping(99);
    const b = generateCipherMapping(99);
    expect(a).toEqual(b);
  });

  it('different seeds produce different mappings', () => {
    const a = generateCipherMapping(1);
    const b = generateCipherMapping(2);
    expect(a).not.toEqual(b);
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
      expect(t).toHaveLength(4);
      const positions = t.flat();
      expect(positions).toHaveLength(8);
      expect(new Set(positions).size).toBe(8);
    }
  });

  it('every transformation includes position 0', () => {
    for (const t of Object.values(mapping)) {
      expect(t[0][0]).toBe(0);
    }
  });

  it('all 26 transformations are unique', () => {
    const keys = Object.values(mapping).map(transformationKey);
    expect(new Set(keys).size).toBe(26);
  });

  it('position 0 partner rotates through the window per letter', () => {
    // A (i=0): partner = window[0] = 1, B (i=1): partner = window[1] = 3
    expect(mapping['A'][0]).toEqual([0, 1]);
    expect(mapping['B'][0]).toEqual([0, 3]);
    // H (i=7): partner = window[0] again (7 % 7 = 0), but window starts at 8
    expect(mapping['H'][0]).toEqual([0, 8]);
  });

  it('is deterministic — same result every time', () => {
    const a = generateSlidingWindowMapping();
    const b = generateSlidingWindowMapping();
    expect(a).toEqual(b);
  });

  it('all non-zero positions are in range 1–25', () => {
    for (const t of Object.values(mapping)) {
      for (const [a, b] of t) {
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
  const mapping = generateCipherMapping(42);

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
  const mapping = generateCipherMapping(42);

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
    const m = generateCipherMapping(77);
    const a = encipher('test', m);
    const b = encipher('test', m);
    expect(a.ciphertext).toBe(b.ciphertext);
    expect(a.deck).toEqual(b.deck);
  });

  it('same plaintext + different seed = different ciphertext', () => {
    const m1 = generateCipherMapping(1);
    const m2 = generateCipherMapping(2);
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
