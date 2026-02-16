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
