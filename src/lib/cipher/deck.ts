export type DeckState = string[];
export type Swap = [number, number];
export type Transformation = [Swap, Swap, Swap, Swap];
export type CipherMapping = Record<string, Transformation>;

export function createInitialDeck(): DeckState {
  return Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
}

export function applyTransformation(deck: DeckState, transformation: Transformation): DeckState {
  const newDeck = [...deck];
  for (const [i, j] of transformation) {
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function encipherStep(
  deck: DeckState,
  plaintextChar: string,
  mapping: CipherMapping
): { newDeck: DeckState; ciphertextChar: string } {
  const upper = plaintextChar.toUpperCase();
  const transformation = mapping[upper];
  const newDeck = applyTransformation(deck, transformation);
  return {
    newDeck,
    ciphertextChar: newDeck[0],
  };
}

export function encipher(
  plaintext: string,
  mapping: CipherMapping
): { deck: DeckState; ciphertext: string; lastTransformation: Transformation | null } {
  let deck = createInitialDeck();
  let ciphertext = '';
  let lastTransformation: Transformation | null = null;

  for (const char of plaintext) {
    const upper = char.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
      const result = encipherStep(deck, upper, mapping);
      lastTransformation = mapping[upper];
      deck = result.newDeck;
      ciphertext += result.ciphertextChar;
    }
  }

  return { deck, ciphertext, lastTransformation };
}
