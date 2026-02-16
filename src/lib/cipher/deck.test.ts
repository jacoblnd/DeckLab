import { describe, it, expect } from 'vitest';
import { createInitialDeck, encipherStep, encipher } from './deck';

describe('createInitialDeck', () => {
  it('returns an array of 26 letters A–Z', () => {
    const deck = createInitialDeck();
    expect(deck).toHaveLength(26);
    expect(deck[0]).toBe('A');
    expect(deck[25]).toBe('Z');
    expect(deck.join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  });
});

describe('encipherStep', () => {
  it('returns the uppercase character and a copy of the deck (stub)', () => {
    const deck = createInitialDeck();
    const result = encipherStep(deck, 'a');
    expect(result.ciphertextChar).toBe('A');
    expect(result.newDeck).toEqual(deck);
    expect(result.newDeck).not.toBe(deck); // should be a new array
  });
});

describe('encipher', () => {
  it('enciphers a full plaintext string', () => {
    const result = encipher('hello');
    expect(result.ciphertext).toBe('HELLO');
  });

  it('filters out non-letter characters', () => {
    const result = encipher('h3llo!');
    expect(result.ciphertext).toBe('HLLO');
  });

  it('returns initial deck and empty ciphertext for empty input', () => {
    const result = encipher('');
    expect(result.ciphertext).toBe('');
    expect(result.deck).toEqual(createInitialDeck());
  });

  it('produces the same output for the same input (pure function)', () => {
    const a = encipher('test');
    const b = encipher('test');
    expect(a.ciphertext).toBe(b.ciphertext);
    expect(a.deck).toEqual(b.deck);
  });
});
