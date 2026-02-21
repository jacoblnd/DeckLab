# DeckLab — Current State Snapshot (Two)

## Overview

DeckLab is a deck cipher visualization tool — a static Svelte + TypeScript + Vite web app hosted on GitHub Pages. Users type plaintext, and the app enciphers it in real-time using a deck of 26 cards (A–Z) that rearrange according to cipher transformations.

**All 64 tests pass.** Run with `npm run test:ci`.

---

## Tech Stack

- **Framework:** Svelte 5 (using `$state`, `$derived`, `$derived.by`, `$effect`, `$props` runes)
- **Build:** Vite 7, TypeScript 5.9
- **Testing:** Vitest 4 + @testing-library/svelte (jsdom environment)
- **Package manager:** npm
- **Styling:** Svelte scoped CSS
- **Deployment:** Manual via `npm run deploy` (gh-pages package)
- **Node:** 22.x

---

## Project Structure

```
DeckLab/
├── docs/
│   ├── PROJECT_SETUP.md
│   ├── DECK_LOGIC_SETUP.md
│   ├── MULTI_DECK_STATE.md
│   ├── ISOMORPH_FEATURE.md
│   ├── ISOMORPH_VIZ.md
│   ├── generated_PROJECT_SETUP.md
│   ├── generated_DECK_LOGIC_SETUP.md
│   ├── generated_CURRENT_STATE_ONE.md
│   ├── generated_MULTI_DECK_STATE.md
│   ├── generated_ISOMORPH_FEATURE.md
│   └── generated_ISOMORPH_VIZ.md
├── src/
│   ├── main.ts                          # Entry point — mounts App
│   ├── app.css                          # Global reset/base styles
│   ├── App.svelte                       # Root component — holds all app state
│   ├── lib/
│   │   └── cipher/
│   │       ├── prng.ts                  # Mulberry32 seeded PRNG
│   │       ├── generate.ts              # Cipher mapping generators
│   │       ├── deck.ts                  # Core types & cipher logic
│   │       ├── deck.test.ts             # 35 unit tests
│   │       ├── isomorph.ts              # Isomorph calculation & sorting
│   │       └── isomorph.test.ts         # 25 unit tests
│   └── components/
│       ├── PlaintextInput.svelte        # Text input, emits full value on input
│       ├── CiphertextOutput.svelte      # Character-by-character output with highlight support
│       ├── DeckView.svelte              # Current deck state with label, legend, and 26 Cards
│       ├── Card.svelte                  # Single card with swap highlighting
│       ├── MultiDeckView.svelte         # Horizontally-scrollable per-step deck history
│       ├── IsomorphList.svelte          # Scrollable list of clickable isomorph entries
│       └── __tests__/
│           └── App.test.ts              # 4 component smoke tests
├── index.html
├── vite.config.ts
├── package.json
├── svelte.config.js
└── tsconfig.json / tsconfig.app.json / tsconfig.node.json
```

---

## Key Architecture & Data Flow

### Types (`src/lib/cipher/deck.ts`)
```ts
type DeckState = string[];
type Swap = [number, number];
type Transformation = [Swap, Swap, Swap, Swap];
type CipherMapping = Record<string, Transformation>;
type CipherStep = {
  deck: DeckState;
  ciphertextChar: string;
  transformation: Transformation;
};
```

### Types (`src/lib/cipher/isomorph.ts`)
```ts
type Isomorph = {
  pattern: string;  // e.g. 'a..ba.ab' — length = window length
  startA: number;   // start index of first substring
  startB: number;   // start index of second substring (startB >= startA + pattern.length)
};
```

### App State (`App.svelte`)
```ts
let mapping         = $state(generateSlidingWindowMapping());
let plaintext       = $state('');
let showHighlights  = $state(true);
let showIsomorphs   = $state(false);
let selectedIsomorph = $state<Isomorph | null>(null);

let result             = $derived(encipher(plaintext, mapping));
let isomorphs          = $derived(findIsomorphs(result.ciphertext));
let ciphertextHighlight = $derived(selectedIsomorph ? { startA, startB, length } : null);

// Clears selectedIsomorph whenever result.ciphertext changes
$effect(() => { result.ciphertext; selectedIsomorph = null; });
```

### Data Flow
1. User types in `PlaintextInput` → `plaintext` updates.
2. `result` is `$derived` from `encipher(plaintext, mapping)`, returns `{ deck, ciphertext, lastTransformation, steps }`.
3. `isomorphs` is `$derived` from `findIsomorphs(result.ciphertext)`.
4. `CiphertextOutput` renders each ciphertext character as a `<span>`, applying purple/cyan highlights when an isomorph is selected.
5. `DeckView` renders the final deck with optional swap highlights and a color legend.
6. `MultiDeckView` (right panel) renders one column per ciphertext step, with compact cards.
7. `IsomorphList` (left panel, toggled) renders sorted isomorph entries; clicking one sets `selectedIsomorph`.

---

## Cipher Logic

### Rules
1. Each PT symbol (A–Z) maps to a unique transformation (4 swaps, 8 distinct positions).
2. Position 0 must always be among the 8 positions (top card must move).
3. Ciphertext output = top card of deck after applying the transformation.
4. Ciphertext is always a pure function of the full plaintext (recomputed from scratch on every change).

### Two Cipher Generators

**Sliding Window (default on page load):**
- Deterministic — no randomness.
- `generateSlidingWindowMapping(): CipherMapping`

**Random (via "Randomize Cipher" button):**
- Uses seeded Mulberry32 PRNG for reproducibility.
- `generateCipherMapping(seed: number): CipherMapping`

---

## Isomorph Logic (`src/lib/cipher/isomorph.ts`)

### `isomorphPattern(s: string): string`
Encodes the repetition structure of a string. Characters appearing more than once are assigned labels `a`, `b`, `c`, … in order of first occurrence. Characters appearing exactly once become `.`.
```
'ahwoanao' → 'a..ba.ab'
'uvonuyun' → 'a..ba.ab'  (isomorphic — same pattern)
'abcde'   → '.....'
```

### `findIsomorphs(ciphertext: string): Isomorph[]`
For every window length `n` from 3 to `floor(length / 2)`:
- Computes `isomorphPattern` for every n-length window.
- **Skips** windows whose pattern is all-periods (all-unique chars) or **starts with a period** (leading singletons).
- Groups positions by pattern; emits one `Isomorph` per non-overlapping pair (`startB >= startA + n`).

### `isomorphInterestingness(pattern: string): number`
Returns `(non-period char count) / pattern.length`. Range [0, 1].

### `sortByInterestingness(isomorphs: Isomorph[]): Isomorph[]`
Returns a new array sorted by:
1. Descending interestingness (density)
2. Descending pattern length (tie-break)
3. Ascending startA (tie-break)

---

## UI Components

| Component | Props | Description |
|---|---|---|
| `App.svelte` | — | Root; holds all state; two-panel layout |
| `PlaintextInput` | `oninput: (text: string) => void` | Resizable textarea |
| `CiphertextOutput` | `ciphertext: string`, `highlight: { startA, startB, length } \| null` | Per-character `<span>` div; highlighted chars get purple (A) or cyan (B) background |
| `DeckView` | `deck: string[]`, `lastTransformation: Transformation \| null`, `showHighlights: boolean` | "Current Deck State" label + optional swap legend + 26 Card components |
| `Card` | `letter: string`, `swapPair?: number \| null` | Single card; 4 highlight colors when `swapPair` is set |
| `MultiDeckView` | `steps: CipherStep[]`, `showHighlights: boolean` | Horizontally-scrollable row of columns; one column per ciphertext step; compact 1.6rem mini-cards |
| `IsomorphList` | `isomorphs: Isomorph[]`, `ciphertext: string`, `selected: Isomorph \| null`, `onselect: (iso) => void` | Flex-wrap, vertically-scrollable (max 300px); entries sorted by interestingness; click to select/deselect |

---

## Layout

```
┌─────────────────────── app-layout (flex row) ───────────────────────────────┐
│  left-panel (700px fixed)          │  right-panel (flex:1, overflow-x:auto) │
│  ─────────────────────────────     │  ──────────────────────────────────     │
│  h1: DeckLab                       │  MultiDeckView:                         │
│  controls:                         │    col  col  col  col  col  ...         │
│    [Randomize Cipher]              │    (one per ciphertext character,        │
│    [✓] Show swap highlights        │     scrolls horizontally)               │
│    [ ] Show isomorphs              │                                         │
│  PlaintextInput (textarea)         │                                         │
│  CiphertextOutput (span div)       │                                         │
│  DeckView (label + legend + cards) │                                         │
│  IsomorphList (if showIsomorphs)   │                                         │
└────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## Color Palette

| Role | Color | Hex |
|---|---|---|
| Swap pair 0 | Red | `#e06c75` |
| Swap pair 1 | Yellow | `#e5c07b` |
| Swap pair 2 | Blue | `#61afef` |
| Swap pair 3 | Green | `#98c379` |
| Isomorph substring A | Purple | `#c678dd` |
| Isomorph substring B | Cyan | `#56b6c2` |
| Highlighted card text | Dark | `#1e1e1e` |
| Muted labels / positions | Gray | `#abb2bf` |

---

## Key Functions

| Function | File | Description |
|---|---|---|
| `createRng(seed)` | `prng.ts` | Mulberry32 PRNG — returns `() => number` in [0,1) |
| `generateSlidingWindowMapping()` | `generate.ts` | Deterministic sliding window cipher |
| `generateCipherMapping(seed)` | `generate.ts` | Random seeded cipher |
| `transformationKey(t)` | `generate.ts` | Normalized serialization for uniqueness checks |
| `createInitialDeck()` | `deck.ts` | Returns A–Z array |
| `applyTransformation(deck, t)` | `deck.ts` | Applies 4 swaps to a deck copy |
| `encipherStep(deck, char, mapping)` | `deck.ts` | Single-character encipher step |
| `encipher(plaintext, mapping)` | `deck.ts` | Full plaintext encipher; returns `{ deck, ciphertext, lastTransformation, steps }` |
| `isomorphPattern(s)` | `isomorph.ts` | Repetition-structure string for a substring |
| `findIsomorphs(ciphertext)` | `isomorph.ts` | All non-overlapping isomorphic pairs; filters trivial and leading-period patterns |
| `isomorphInterestingness(pattern)` | `isomorph.ts` | Non-period density [0,1] |
| `sortByInterestingness(isomorphs)` | `isomorph.ts` | Sort by density desc → length desc → startA asc |

---

## Test Summary (64 tests)

| File | Describe Block | Tests |
|---|---|---|
| `deck.test.ts` | `createRng` | 3 |
| | `createInitialDeck` | 1 |
| | `applyTransformation` | 2 |
| | `generateCipherMapping` | 7 |
| | `generateSlidingWindowMapping` | 7 |
| | `encipherStep` | 2 |
| | `encipher` | 13 (7 original + 6 for `steps`) |
| `isomorph.test.ts` | `isomorphPattern` | 6 |
| | `findIsomorphs` | 11 |
| | `isomorphInterestingness` | 4 |
| | `sortByInterestingness` | 4 |
| `App.test.ts` | `App` | 4 |

---

## npm Scripts

| Script | Command |
|---|---|
| `npm run dev` | Vite dev server on `localhost:5173/DeckLab/` |
| `npm run build` | Production build to `dist/` |
| `npm run test` | Vitest watch mode |
| `npm run test:ci` | Vitest single run |
| `npm run deploy` | Build + publish to gh-pages branch |
| `npm run check` | svelte-check + tsc type checking |

---

## Notable Design Decisions

1. **`encipher()` returns `steps`.** The `steps: CipherStep[]` array captures each intermediate deck state, enabling `MultiDeckView` to display the full history without re-running the cipher.
2. **`CiphertextOutput` uses spans, not a textarea.** Replacing the `<textarea>` with per-character `<span>` elements enables inline background-color highlights for isomorph visualization. `data-testid="ciphertext-output"` is preserved on the outer `<div>`.
3. **Isomorph selection identity by value.** `selectedIsomorph` is compared by `(startA, startB, pattern)` triple rather than object reference, since `$derived` recreates the `isomorphs` array on every ciphertext change.
4. **`$effect` clears selection on ciphertext change.** Listing `result.ciphertext` as a dependency ensures stale highlights are never shown after the user edits plaintext.
5. **Leading-period filter.** `findIsomorphs` skips windows whose pattern starts with `.` in addition to all-period patterns, ensuring only cryptanalytically useful isomorphs are returned.
6. **Interestingness = density.** `isomorphInterestingness` is defined as `(non-period chars) / length`. Ties in `sortByInterestingness` are broken by pattern length descending, then `startA` ascending.
7. **No overlap guarantee.** The `findIsomorphs` non-overlap invariant (`startB >= startA + n`) means the two highlighted ciphertext regions never share a character, so `hl-a` and `hl-b` CSS classes never conflict.
