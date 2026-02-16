import { describe, it, expect } from 'vitest';
import { createInitialDeck, applyTransformation, encipherStep, encipher } from './deck';
import type { Transformation, CipherMapping } from './deck';
import { generateCipherMapping } from './generate';
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

  it('returns initial deck and empty ciphertext for empty input', () => {
    const result = encipher('', mapping);
    expect(result.ciphertext).toBe('');
    expect(result.deck).toEqual(createInitialDeck());
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
});
