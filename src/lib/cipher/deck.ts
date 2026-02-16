export type DeckState = string[];

export function createInitialDeck(): DeckState {
  return Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
}

export function encipherStep(
  deck: DeckState,
  plaintextChar: string
): { newDeck: DeckState; ciphertextChar: string } {
  // Stub: returns character unchanged and deck unmodified.
  // Real cipher logic will be implemented later.
  return {
    newDeck: [...deck],
    ciphertextChar: plaintextChar.toUpperCase(),
  };
}

export function encipher(plaintext: string): { deck: DeckState; ciphertext: string } {
  let deck = createInitialDeck();
  let ciphertext = '';

  for (const char of plaintext) {
    const upper = char.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
      const result = encipherStep(deck, upper);
      deck = result.newDeck;
      ciphertext += result.ciphertextChar;
    }
  }

  return { deck, ciphertext };
}
