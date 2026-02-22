# DeckLab — Current State Snapshot (Five)

## Overview

DeckLab is a deck cipher visualization tool — a static Svelte + TypeScript + Vite web app hosted on GitHub Pages. Users type plaintext, and the app enciphers it in real-time using a deck of 26 cards (A–Z) that rearrange according to cipher transformations. Transformations support variable swap counts (1–13) and optional cyclic rotations (0–25 positions), both configurable from the UI.

Recent additions since State Four:
- **Deck card animations** — cards in the Current Deck State view animate (FLIP) to their new positions on each transformation (optional, off by default).
- **Plaintext highlighting display** — a new read-only filtered-plaintext div between the textarea and the ciphertext output, with the same isomorph position highlighting as the ciphertext.
- **MultiDeckView isomorph outlines** — selecting an isomorph draws a single connected bracket outline around each substring group (A in purple, B in cyan) in the multi-deck column view, including the plaintext label row.
- **MultiDeckView plaintext row** — each column now shows the PT character above the CT character.
- **Isomorph sort order** — interestingness is now the primary sort key; occurrence count is secondary.
- **`Card.svelte` color fix** — `SWAP_COLORS` corrected from 4 entries to the full 13.

**All 83 tests pass.** Run with `npm run test:ci`.

---

## Tech Stack

- **Framework:** Svelte 5 (using `$state`, `$derived`, `$derived.by`, `$effect`, `$props`, `{#snippet}`, `{@render}` runes)
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
│   ├── CONFIGURABILITY.md
│   ├── ISOMORPH_REFINEMENT.md
│   ├── generated_PROJECT_SETUP.md
│   ├── generated_DECK_LOGIC_SETUP.md
│   ├── generated_CURRENT_STATE_ONE.md
│   ├── generated_CURRENT_STATE_TWO.md
│   ├── generated_CURRENT_STATE_THREE.md
│   ├── generated_CURRENT_STATE_FOUR.md
│   ├── generated_MULTI_DECK_STATE.md
│   ├── generated_ISOMORPH_FEATURE.md
│   ├── generated_ISOMORPH_VIZ.md
│   ├── generated_FEATURE_TWEAKS.md
│   ├── generated_CONFIGURABILITY.md
│   ├── generated_CIPHER_INSPECTOR.md
│   ├── generated_INITIAL_ANIMATIONS.md
│   └── generated_ISOMORPH_REFINEMENT.md
├── src/
│   ├── main.ts                          # Entry point — mounts App
│   ├── app.css                          # Global reset/base styles
│   ├── App.svelte                       # Root component — holds all app state
│   ├── lib/
│   │   └── cipher/
│   │       ├── prng.ts                  # Mulberry32 seeded PRNG
│   │       ├── generate.ts              # Cipher mapping generators + CipherConfig type
│   │       ├── deck.ts                  # Core types & cipher logic
│   │       ├── deck.test.ts             # 47 unit tests
│   │       ├── isomorph.ts              # Isomorph calculation & sorting
│   │       └── isomorph.test.ts         # 32 unit tests
│   └── components/
│       ├── PlaintextInput.svelte        # Text input textarea
│       ├── PlaintextOutput.svelte       # Filtered PT read-only display with isomorph highlighting
│       ├── CiphertextOutput.svelte      # Character-by-character CT output with isomorph highlighting
│       ├── DeckView.svelte              # Current deck state with FLIP animation support
│       ├── Card.svelte                  # Single card with swap highlighting (13-color palette)
│       ├── MultiDeckView.svelte         # Per-step deck history with PT row and isomorph brackets
│       ├── IsomorphList.svelte          # Scrollable list of clickable isomorph entries
│       ├── CipherInspector.svelte       # Modal overlay: Transformation Table + Position Heatmap
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
type Transformation = {
  swaps: Swap[];    // 1–13 swap pairs
  rotation: number; // 0 = no rotation; N = cyclic shift by N positions (applied before swaps)
};
type CipherMapping = Record<string, Transformation>;
type CipherStep = {
  deck: DeckState;
  ciphertextChar: string;
  transformation: Transformation;
};
```

### Types (`src/lib/cipher/generate.ts`)
```ts
type CipherConfig = {
  swapCount: number;         // 1–13: number of swap pairs per transformation
  rotationMax: number;       // 0–25: 0 = no rotation; positive = max rotation amount
  rotationConstant: boolean; // true = all transformations use rotationMax exactly
                             // false = each transformation picks randomly from [1, rotationMax]
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
let mapping             = $state(generateSlidingWindowMapping());
let plaintext           = $state('');
let showHighlights      = $state(true);
let showIsomorphs       = $state(false);
let showCipherInspector = $state(false);
let showAnimations      = $state(false);
let selectedIsomorph    = $state<Isomorph | null>(null);

let swapCount        = $state(4);
let rotationMax      = $state(1);
let rotationConstant = $state(true);

// Only A–Z characters from plaintext, uppercased; indices align 1:1 with ciphertext
let filteredPlaintext = $derived(
  [...plaintext]
    .filter(c => { const u = c.toUpperCase(); return u >= 'A' && u <= 'Z'; })
    .map(c => c.toUpperCase())
    .join('')
);

let result             = $derived(encipher(plaintext, mapping));
let isomorphs          = $derived(findIsomorphs(result.ciphertext));
let ciphertextHighlight = $derived(
  selectedIsomorph
    ? { startA: selectedIsomorph.startA, startB: selectedIsomorph.startB, length: selectedIsomorph.pattern.length }
    : null
);

// Clears selectedIsomorph whenever result.ciphertext changes
$effect(() => { result.ciphertext; selectedIsomorph = null; });

// Clamps swapCount to minimum 2 when rotationMax drops to 0
$effect(() => { if (rotationMax === 0 && swapCount < 2) swapCount = 2; });
```

### Data Flow
1. User types in `PlaintextInput` → `plaintext` updates.
2. `filteredPlaintext` is `$derived` — strips non-alpha chars, uppercases.
3. `result` is `$derived` from `encipher(plaintext, mapping)` → `{ deck, ciphertext, lastTransformation, steps }`.
4. `isomorphs` is `$derived` from `findIsomorphs(result.ciphertext)`.
5. `ciphertextHighlight` is `$derived` from `selectedIsomorph` → `{ startA, startB, length } | null`.
6. `PlaintextOutput` renders `filteredPlaintext` with position highlights using `ciphertextHighlight`.
7. `CiphertextOutput` renders `result.ciphertext` with the same position highlights.
8. `DeckView` renders the final deck with optional FLIP animations and swap highlights.
9. `MultiDeckView` (right panel) renders one column per step. Each column shows PT char → CT char → rotation → 26 mini-cards. When `ciphertextHighlight` is set, a single bracket outline wraps each substring group.
10. `IsomorphList` (left panel, toggled) renders sorted isomorph entries; clicking one sets `selectedIsomorph`.
11. `CipherInspector` (modal) exposes the full cipher mapping on demand.

---

## Cipher Logic

### Rules
1. Each PT symbol (A–Z) maps to a unique transformation (variable swaps + optional rotation).
2. If `rotation === 0`, position 0 must be in one swap.
3. If `rotation > 0`, the rotation guarantees the top card changes; swaps are unrestricted.
4. Ciphertext output = top card of deck after applying the transformation.
5. Transformation order: rotation first, then swaps.
6. Ciphertext is always a pure function of the full plaintext (recomputed from scratch on every change).

### Three Cipher Generators
**Sliding Window (default):** Deterministic; 4 swaps, `rotation: 1` for every transformation. `generateSlidingWindowMapping()`

**Random:** Seeded Mulberry32 PRNG; respects `CipherConfig`. `generateCipherMapping(seed, config)`. Throws if `swapCount === 1 && rotationMax === 0`.

---

## Isomorph Logic (`src/lib/cipher/isomorph.ts`)

### Sort Order (`sortByInterestingness`)
1. **Descending interestingness** (primary) — `(non-period chars) / pattern.length`
2. **Descending pair count** (secondary) — from `countPatternOccurrences`
3. Descending pattern length
4. Ascending startA

### `findIsomorphs` filters
- All-period patterns (all-unique chars)
- Patterns starting with `.` (leading singleton)
- Patterns ending with `.` (trailing singleton)
- Overlapping pairs (`startB < startA + n`)

---

## UI Components

| Component | Props | Description |
|---|---|---|
| `App.svelte` | — | Root; holds all state; two-panel layout |
| `PlaintextInput` | `oninput: (text) => void` | Resizable textarea |
| `PlaintextOutput` | `filteredPlaintext: string`, `highlight: {startA,startB,length}\|null` | 6rem fixed height, overflow-y:auto; per-char spans with purple/cyan highlights |
| `CiphertextOutput` | `ciphertext: string`, `highlight: {startA,startB,length}\|null` | 6rem fixed height, overflow-y:auto; per-char spans with purple/cyan highlights |
| `DeckView` | `deck`, `lastTransformation`, `showHighlights`, `showAnimations` | Cards in keyed `{#each}` with `animate:flip` (duration 500ms when enabled, 0 when disabled) |
| `Card` | `letter`, `swapPair?` | Single card; 13-color palette for swap highlights |
| `MultiDeckView` | `steps`, `showHighlights`, `highlight`, `plaintextChars` | Per-step columns rendered via `{#snippet column(step, globalIdx)}`; isomorph groups wrapped in `<div class="group-bracket">` with single `outline` |
| `IsomorphList` | `isomorphs`, `ciphertext`, `selected`, `onselect` | Flex-wrap, max 300px scrollable; pattern + `×N` badge + positions + colored substrings |
| `CipherInspector` | `mapping`, `onclose` | Full-viewport modal; Table tab (per-letter rotation + swap chips) + Heatmap tab (26×28 position grid) |

---

## Layout

```
┌─────────────────────── app-layout (flex row) ───────────────────────────────┐
│  left-panel (700px fixed)          │  right-panel (flex:1, overflow-x:auto) │
│  ─────────────────────────────     │  ──────────────────────────────────     │
│  h1: DeckLab                       │  MultiDeckView:                         │
│  controls:                         │    —    col  col  col  col  ...         │
│    [Randomize Cipher]              │   (A-Z) per ciphertext char:            │
│    [Inspect Cipher]                │          PT char (plain row)            │
│    Swaps: [4]                      │          CT char (cipher row)           │
│    Rotations: [1] [✓ Constant]     │          ↺N (rotation row)              │
│    [✓] Show swap highlights        │          26 mini-cards                  │
│    [ ] Show isomorphs              │   isomorph selection → bracket outline  │
│    [ ] Animate deck                │   around A columns (purple) and         │
│  PlaintextInput (textarea)         │   B columns (cyan)                      │
│  PlaintextOutput (6rem, scroll)    │                                         │
│  CiphertextOutput (6rem, scroll)   │                                         │
│  DeckView (label + legend + cards) │                                         │
│  IsomorphList (if showIsomorphs)   │                                         │
└────────────────────────────────────┴─────────────────────────────────────────┘

CipherInspector (when open — overlays full viewport):
┌── backdrop (fixed, semi-transparent) ──────────────────────────┐
│  ┌── modal ──────────────────────────────────────────────────┐ │
│  │  Cipher Inspector                                    [×]  │ │
│  │  [Table]  [Heatmap]                                       │ │
│  │  (active tab)                                             │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## MultiDeckView Column Structure

Each step column (rendered via `{#snippet column(step, globalIdx)}`):
```
pt-label      → filteredPlaintext[globalIdx]  (PT char, muted gray, min-height: 1.3rem)
col-label     → step.ciphertextChar           (CT char, bold)
col-rotation  → ↺N or empty                  (min-height: 0.7rem)
mini-card × 26 → deck positions
```

The initial `—` column has matching empty `pt-label` and `col-rotation` divs with the same `min-height` values so all columns stay vertically aligned.

### Isomorph Bracket Rendering

When `highlight` is non-null, the template branches into five `{#each}` segments:
```
steps[0 … startA-1]                     → flat columns
<div class="group-bracket" outline=purple> steps[startA … startA+length-1] </div>
steps[startA+length … startB-1]          → flat columns
<div class="group-bracket" outline=cyan>  steps[startB … startB+length-1]  </div>
steps[startB+length … end]               → flat columns
```
`.group-bracket` is `display: flex; flex-direction: row; gap: 0.4rem` — the same gap as the parent — so internal column spacing is unchanged. The single `outline` on the wrapper spans the full group including the inter-column gaps.

---

## Deck Animation (`DeckView.svelte`)

- `{#each deck as letter, i (letter)}` — keyed by letter (unique in A–Z permutation)
- Each card wrapped in `<div class="card-slot" animate:flip={{ duration: showAnimations ? 500 : 0 }}>`
- FLIP measures the element's current screen position (even mid-animation) as the new start → interruptions are smooth
- `.card-slot { display: inline-flex }` — transparent sizing wrapper for the flex layout

---

## Color Palette

### Swap highlight colors (13 fixed positions — shared by DeckView, MultiDeckView, Card, CipherInspector)

| Swap | Color | Hex |
|---|---|---|
| 1 | Red | `#e06c75` |
| 2 | Yellow | `#e5c07b` |
| 3 | Blue | `#61afef` |
| 4 | Green | `#98c379` |
| 5 | Purple | `#c678dd` |
| 6 | Cyan | `#56b6c2` |
| 7 | Orange | `#d19a66` |
| 8 | Hot pink | `#e96eb0` |
| 9 | Dark red | `#be5046` |
| 10 | Bright blue | `#528bff` |
| 11 | Mint | `#7ec8a4` |
| 12 | Light red | `#f0a0a0` |
| 13 | Light blue | `#a0c8f0` |

### Other UI colors

| Role | Color | Hex |
|---|---|---|
| Isomorph substring A (PT/CT highlight, MultiDeckView bracket) | Purple | `#c678dd` |
| Isomorph substring B (PT/CT highlight, MultiDeckView bracket) | Cyan | `#56b6c2` |
| Highlighted card / chip text | Dark | `#1e1e1e` |
| Muted labels / positions | Gray | `#abb2bf` |
| Modal background | Dark | `#282c34` |

---

## Key Functions

| Function | File | Description |
|---|---|---|
| `createRng(seed)` | `prng.ts` | Mulberry32 PRNG — returns `() => number` in [0,1) |
| `generateSlidingWindowMapping()` | `generate.ts` | Deterministic sliding window cipher; 4 swaps, rotation=1 |
| `generateCipherMapping(seed, config)` | `generate.ts` | Random seeded cipher respecting `CipherConfig` |
| `transformationKey(t)` | `generate.ts` | Normalized serialization: `r{rotation};{sorted swaps}` |
| `createInitialDeck()` | `deck.ts` | Returns A–Z array |
| `applyTransformation(deck, t)` | `deck.ts` | Applies rotation then swaps to a deck copy |
| `encipherStep(deck, char, mapping)` | `deck.ts` | Single-character encipher step |
| `encipher(plaintext, mapping)` | `deck.ts` | Full plaintext encipher; returns `{ deck, ciphertext, lastTransformation, steps }` |
| `isomorphPattern(s)` | `isomorph.ts` | Repetition-structure encoding of a string |
| `findIsomorphs(ciphertext)` | `isomorph.ts` | All non-overlapping isomorphic pairs; filters trivial/leading-period/trailing-period |
| `countPatternOccurrences(isomorphs)` | `isomorph.ts` | Pair count per pattern |
| `isomorphInterestingness(pattern)` | `isomorph.ts` | Non-period density [0,1] |
| `sortByInterestingness(isomorphs, patternCounts?)` | `isomorph.ts` | Sort: interestingness desc → count desc → length desc → startA asc |
| `getPairIndex(t, pos)` | `CipherInspector.svelte` | Swap pair index for a deck position, or null |

---

## Test Summary (83 tests)

| File | Describe Block | Tests |
|---|---|---|
| `deck.test.ts` | `createRng` | 3 |
| | `createInitialDeck` | 1 |
| | `applyTransformation` | 4 |
| | `generateCipherMapping` | 13 |
| | `generateSlidingWindowMapping` | 8 |
| | `encipherStep` | 2 |
| | `encipher` | 13 |
| | **Subtotal** | **47** |
| `isomorph.test.ts` | `isomorphPattern` | 6 |
| | `findIsomorphs` | 12 |
| | `isomorphInterestingness` | 4 |
| | `sortByInterestingness` | 5 |
| | `countPatternOccurrences` | 5 |
| | **Subtotal** | **32** |
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

1. **`Transformation` struct.** `{ swaps: Swap[], rotation: number }` — rotation applied before swaps.
2. **`generateCipherMapping` requires `CipherConfig`.** Explicit config; throws if `swapCount=1` and `rotationMax=0`.
3. **UI clamps `swapCount` when `rotationMax` drops to 0.** `$effect` bumps to 2; input `min` updates reactively.
4. **Default config: `rotationMax=1`, `rotationConstant=true`.** Matches the sliding window cipher behavior.
5. **`transformationKey` includes rotation.** `r{rotation};{sorted swaps}` — same swaps, different rotation = distinct.
6. **`SWAP_COLORS` is 13 fixed entries duplicated across 4 components.** `DeckView`, `MultiDeckView`, `Card`, `CipherInspector` all share the identical hardcoded array.
7. **FLIP animation uses `duration: 0` when disabled.** Single code path; no duplicate `{#each}` blocks needed.
8. **`filteredPlaintext` reused for both `PlaintextOutput` and `MultiDeckView`.** Derived once in `App.svelte`; `filteredPlaintext[i]` aligns 1:1 with `steps[i]` and `ciphertext[i]`.
9. **`ciphertextHighlight` is the single highlight object** shared by `PlaintextOutput`, `CiphertextOutput`, and `MultiDeckView`. Its `{ startA, startB, length }` indices apply directly to all three because `filteredPlaintext`, `ciphertext`, and `steps` are all the same length.
10. **MultiDeckView uses a `{#snippet}` for the column template.** `column(step, globalIdx)` avoids duplicating the column HTML across the flat and grouped render paths. The highlighted branch passes the correct global offset (`startA + i`, `startB + i`, etc.) for each sliced `{#each}`.
11. **`group-bracket` uses a single `outline`.** The wrapper `div` is a flex row with the same gap as the parent; `outline` is drawn outside the layout box, spanning all columns and their gaps as one connected rectangle.
12. **`pt-label` has `min-height: 1.3rem`.** Ensures the empty `pt-label` in the initial `—` column reserves the same vertical space as content-bearing labels in step columns, maintaining row alignment. Mirrors the same pattern used for `col-rotation`'s `min-height: 0.7rem`.
13. **Isomorph sort: interestingness first, count second.** Cryptanalytically denser patterns surface at the top regardless of how many pairs they have.
14. **`CipherInspector` is mounted outside `.app-layout`.** Overlays the full viewport; backdrop click or Escape closes it.
