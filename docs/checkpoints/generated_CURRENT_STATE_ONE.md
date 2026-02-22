# DeckLab — Current State Snapshot

## Overview

DeckLab is a deck cipher visualization tool — a static Svelte + TypeScript + Vite web app hosted on GitHub Pages. Users type plaintext, and the app enciphers it in real-time using a deck of 26 cards (A–Z) that rearrange according to cipher transformations.

**All 33 tests pass.** Run with `npm run test:ci`.

---

## Tech Stack

- **Framework:** Svelte 5 (using `$state`, `$derived`, `$props` runes)
- **Build:** Vite 7, TypeScript 5.9
- **Testing:** Vitest 4 + @testing-library/svelte (jsdom environment)
- **Package manager:** npm
- **Styling:** Svelte scoped CSS
- **Deployment:** Manual via `npm run deploy` (gh-pages package)
- **Node:** 22.x

## Project Structure

```
DeckLab/
├── docs/
│   ├── PROJECT_SETUP.md              # Original project spec
│   ├── DECK_LOGIC_SETUP.md           # Cipher logic spec
│   ├── generated_PROJECT_SETUP.md    # Scaffolding implementation plan
│   └── generated_DECK_LOGIC_SETUP.md # Cipher logic implementation plan
├── src/
│   ├── main.ts                       # Entry point — mounts App
│   ├── app.css                       # Global reset/base styles
│   ├── App.svelte                    # Root component
│   ├── lib/
│   │   └── cipher/
│   │       ├── prng.ts               # Mulberry32 seeded PRNG
│   │       ├── generate.ts           # Cipher mapping generators
│   │       ├── deck.ts               # Core types & cipher logic
│   │       └── deck.test.ts          # 29 unit tests
│   └── components/
│       ├── PlaintextInput.svelte     # Text input, emits full value on input
│       ├── CiphertextOutput.svelte   # Read-only ciphertext display
│       ├── DeckView.svelte           # Renders 26 Card components
│       ├── Card.svelte               # Single card with swap highlighting
│       └── __tests__/
│           └── App.test.ts           # 4 component smoke tests
├── index.html
├── vite.config.ts                    # base: '/DeckLab/', vitest config, svelteTesting plugin
├── package.json
├── svelte.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
└── .gitignore
```

## Key Architecture & Data Flow

### Types (`src/lib/cipher/deck.ts`)
```ts
type DeckState = string[];           // Array of 26 letters
type Swap = [number, number];        // Pair of deck positions
type Transformation = [Swap, Swap, Swap, Swap];  // 4 swaps, 8 distinct positions
type CipherMapping = Record<string, Transformation>;  // A-Z → transformations
```

### Cipher Rules
1. Each PT symbol (A–Z) maps to a unique transformation (4 swaps, 8 distinct positions).
2. Position 0 must always be among the 8 positions (top card must move).
3. Ciphertext output = top card of deck after applying transformation.
4. Ciphertext is always a pure function of the full plaintext (recomputed from scratch on every change).

### Data Flow
1. `App.svelte` holds `plaintext` ($state) and `mapping` ($state).
2. `result` is `$derived` from `encipher(plaintext, mapping)`.
3. `encipher()` returns `{ deck, ciphertext, lastTransformation }`.
4. `PlaintextInput` emits the full textarea value on every input event.
5. `DeckView` receives `deck` and `lastTransformation`, computes a `swapPairMap` mapping each position to its swap pair index (0–3) or null.
6. `Card` receives `letter` and `swapPair`; highlighted cards get per-pair background colors.

### Two Cipher Generators

**Sliding Window (default on page load):**
- Deterministic — no randomness.
- For letter i, selects 7 consecutive positions starting at `(i + 1)`, wrapped to 1–25.
- Position 0 pairs with the `(i % 7)`-th window position (rotating partner ensures uniqueness even when 26 letters share 25 possible start positions).
- `generateSlidingWindowMapping(): CipherMapping`

**Random (via "Randomize Deck" button):**
- Uses seeded Mulberry32 PRNG for reproducibility.
- Samples 7 unique non-zero positions, combines with position 0.
- Uniqueness enforced via normalized transformation keys (sorted within swaps, sorted across swaps).
- `generateCipherMapping(seed: number): CipherMapping`

## Key Functions

| Function | File | Description |
|---|---|---|
| `createRng(seed)` | `prng.ts` | Returns a `() => number` producing floats in [0,1) |
| `generateSlidingWindowMapping()` | `generate.ts` | Deterministic sliding window cipher |
| `generateCipherMapping(seed)` | `generate.ts` | Random seeded cipher |
| `transformationKey(t)` | `generate.ts` | Normalized serialization for uniqueness checks |
| `createInitialDeck()` | `deck.ts` | Returns A–Z array |
| `applyTransformation(deck, t)` | `deck.ts` | Applies 4 swaps to a deck copy |
| `encipherStep(deck, char, mapping)` | `deck.ts` | Single-character encipher step |
| `encipher(plaintext, mapping)` | `deck.ts` | Full plaintext encipher, returns deck + ciphertext + lastTransformation |

## UI Components

| Component | Props | Description |
|---|---|---|
| `App.svelte` | — | Root; holds state, "Randomize Deck" button |
| `PlaintextInput` | `oninput: (text: string) => void` | Textarea, emits full value |
| `CiphertextOutput` | `ciphertext: string` | Read-only textarea |
| `DeckView` | `deck: string[], lastTransformation: Transformation \| null` | Renders 26 Cards with swap highlighting |
| `Card` | `letter: string, swapPair?: number \| null` | Single card; 4 highlight colors: `#e06c75`, `#e5c07b`, `#61afef`, `#98c379` |

## Swap Highlighting

Cards involved in the most recent transformation are highlighted with per-pair background colors:
- Swap pair 0: red (`#e06c75`)
- Swap pair 1: yellow (`#e5c07b`)
- Swap pair 2: blue (`#61afef`)
- Swap pair 3: green (`#98c379`)

Highlighted cards also get dark text (`#1e1e1e`) for contrast.

## Test Summary (33 tests)

| Describe Block | Tests | Coverage |
|---|---|---|
| `createRng` | 3 | Determinism, different seeds, value range |
| `createInitialDeck` | 1 | Returns A–Z |
| `applyTransformation` | 2 | Correct swaps, immutability |
| `generateCipherMapping` | 7 | All 26 letters, 4 swaps each, 8 distinct positions, position 0 by construction, normalized uniqueness, determinism, seed variation |
| `generateSlidingWindowMapping` | 7 | All 26 letters, 8 distinct positions, position 0, uniqueness via transformationKey, partner rotation, determinism, position range |
| `encipherStep` | 2 | Top card changes, returns new top card |
| `encipher` | 7 | Length, non-letter filtering, empty input, lastTransformation, determinism, seed variation |
| `App` (component) | 4 | Renders, has plaintext input, has ciphertext output, 26 cards |

## npm Scripts

| Script | Command |
|---|---|
| `npm run dev` | Vite dev server on `localhost:5173/DeckLab/` |
| `npm run build` | Production build to `dist/` |
| `npm run test` | Vitest watch mode |
| `npm run test:ci` | Vitest single run |
| `npm run deploy` | Build + publish to gh-pages branch |
| `npm run check` | svelte-check + tsc type checking |

## Notable Design Decisions

1. **Ciphertext is derived, not appended.** Any change to plaintext (typing, deleting, clearing) recomputes ciphertext from scratch via `$derived`.
2. **Position 0 included by construction.** The generation logic always places position 0 first rather than rejection-sampling.
3. **Normalized transformation keys.** Swaps are sorted within pairs and pairs are sorted lexicographically before comparison, so equivalent transformations are detected regardless of ordering.
4. **`wrapPos` is simplified.** Uses `(v - 1) % 25 + 1` without double-mod since negative inputs never occur.
5. **Svelte 5 runes.** Uses `$state`, `$derived`, `$derived.by`, and `$props` throughout.
