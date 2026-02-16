import { describe, it, expect } from 'vitest';
import { createInitialDeck, encipherStep } from './deck';

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
