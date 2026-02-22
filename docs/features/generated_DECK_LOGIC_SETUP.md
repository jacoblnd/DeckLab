# DeckLab — Deck Cipher Logic Implementation Plan

## Overview

Replace the stub cipher logic with a real deck cipher. A cipher is a mapping from each of the 26 PT symbols (A–Z) to a distinct transformation (set of 4 swaps). On each PT symbol, the corresponding transformation is applied to the deck, then the top card is read as the CT symbol.

---

## Key Rules (from spec + clarifications)

1. Each PT symbol maps to a unique transformation (26 symbols → 26 distinct transformations).
2. Each transformation consists of exactly 4 swaps.
3. Each swap involves 2 distinct card positions; all 8 positions across the 4 swaps are distinct (no card is touched twice within a single transformation).
4. After applying a transformation, the card at position 0 must differ from the card that was there before (the end result must move the top card).
5. The cipher mapping is generated randomly using a **seeded PRNG**, so the same seed always produces the same cipher. A different seed produces a different cipher.

## Data Model

### Types (`src/lib/cipher/deck.ts`)

```ts
// A swap is a pair of deck positions [i, j] where 0 <= i, j < 26 and i !== j
type Swap = [number, number];

// A transformation is exactly 4 swaps with all 8 positions distinct
type Transformation = [Swap, Swap, Swap, Swap];

// A cipher maps each PT letter (A–Z) to its transformation
type CipherMapping = Record<string, Transformation>;
```

## Implementation Steps

### 1. Add a seeded PRNG utility (`src/lib/cipher/prng.ts`)

- Implement a simple, deterministic PRNG (e.g. mulberry32 or xoshiro128) that accepts a numeric seed.
- Export a factory function: `createRng(seed: number): () => number` that returns a function producing floats in [0, 1).
- This keeps cipher generation reproducible for a given seed.

### 2. Add cipher generation (`src/lib/cipher/generate.ts`)

- `generateCipherMapping(seed: number): CipherMapping`
- For each of the 26 PT symbols (A–Z):
  1. Generate 4 swaps using the seeded PRNG.
  2. Ensure all 8 positions across the 4 swaps are distinct (sample 8 unique positions from 0–25, pair them into 4 swaps).
  3. Validate that applying this transformation to any possible deck state moves the top card (position 0 must be among the 8 selected positions).
  4. If position 0 is not among the 8 positions, resample.
- Ensure no two PT symbols share the same transformation. Since we randomly generate 8-distinct-position swaps per symbol and the space is large, collisions are extremely unlikely, but add a check and resample if needed.

### 3. Update core cipher logic (`src/lib/cipher/deck.ts`)

- `applyTransformation(deck: DeckState, transformation: Transformation): DeckState` — applies the 4 swaps in order to a copy of the deck and returns the new deck.
- Update `encipherStep` to accept a `CipherMapping` and look up the PT symbol's transformation.
- Update `encipher` to accept a `CipherMapping` parameter.

Updated signatures:
```ts
function applyTransformation(deck: DeckState, transformation: Transformation): DeckState;
function encipherStep(deck: DeckState, plaintextChar: string, mapping: CipherMapping): { newDeck: DeckState; ciphertextChar: string };
function encipher(plaintext: string, mapping: CipherMapping): { deck: DeckState; ciphertext: string };
```

### 4. Wire up seed + cipher in `App.svelte`

- Generate a random seed on page load (e.g. `Math.floor(Math.random() * 2**32)`).
- Derive the `CipherMapping` from the seed (this only recomputes when the seed changes).
- Pass the mapping into `encipher()`.
- The seed could later be exposed in the UI for sharing/reproducing ciphers.

### 5. Update tests (`src/lib/cipher/deck.test.ts`)

Unit tests for PRNG:
- Same seed produces same sequence.
- Different seeds produce different sequences.

Unit tests for cipher generation:
- Each PT symbol has a transformation with exactly 4 swaps.
- All 8 positions per transformation are distinct.
- Position 0 is among the 8 positions for every transformation (ensures top card moves).
- No two PT symbols share the same transformation.

Unit tests for encipherment:
- Applying a transformation swaps the correct positions.
- Top card changes after every encipherStep.
- `encipher` with a known seed produces a deterministic, reproducible ciphertext.
- Same plaintext + same seed = same ciphertext.
- Same plaintext + different seed = different ciphertext.

### 6. Update component test

- Smoke test still passes (no interface changes to components).

## Files Changed / Created

| File | Action |
|---|---|
| `src/lib/cipher/prng.ts` | **Create** — seeded PRNG |
| `src/lib/cipher/generate.ts` | **Create** — cipher mapping generation |
| `src/lib/cipher/deck.ts` | **Modify** — add types, `applyTransformation`, update `encipherStep`/`encipher` signatures |
| `src/lib/cipher/deck.test.ts` | **Modify** — add tests for generation, transformation, determinism |
| `src/App.svelte` | **Modify** — generate seed + mapping, pass mapping to `encipher` |

## Execution Order

1. Create `prng.ts` with seeded PRNG.
2. Create `generate.ts` with `generateCipherMapping`.
3. Update `deck.ts` — add types, `applyTransformation`, update function signatures.
4. Update `App.svelte` to generate seed/mapping and pass it through.
5. Update tests for all new logic.
6. Run `npm run test:ci` and verify all tests pass.
