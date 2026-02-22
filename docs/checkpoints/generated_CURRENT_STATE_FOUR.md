# DeckLab — Current State Snapshot (Four)

## Overview

DeckLab is a deck cipher visualization tool — a static Svelte + TypeScript + Vite web app hosted on GitHub Pages. Users type plaintext, and the app enciphers it in real-time using a deck of 26 cards (A–Z) that rearrange according to cipher transformations. Transformations support variable swap counts (1–13) and optional cyclic rotations (0–25 positions), both configurable from the UI.

A **Cipher Inspector** modal now lets users examine the full cipher mapping — every PT letter's assigned rotation and swap pairs — via a Transformation Table and a Position Heatmap.

**All 83 tests pass.** Run with `npm run test:ci`.

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
│   ├── CONFIGURABILITY.md
│   ├── generated_PROJECT_SETUP.md
│   ├── generated_DECK_LOGIC_SETUP.md
│   ├── generated_CURRENT_STATE_ONE.md
│   ├── generated_CURRENT_STATE_TWO.md
│   ├── generated_CURRENT_STATE_THREE.md
│   ├── generated_MULTI_DECK_STATE.md
│   ├── generated_ISOMORPH_FEATURE.md
│   ├── generated_ISOMORPH_VIZ.md
│   ├── generated_FEATURE_TWEAKS.md
│   ├── generated_CONFIGURABILITY.md
│   └── generated_CIPHER_INSPECTOR.md
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
│       ├── PlaintextInput.svelte        # Text input, emits full value on input
│       ├── CiphertextOutput.svelte      # Character-by-character output with highlight support
│       ├── DeckView.svelte              # Current deck state with label, legend, and 26 Cards
│       ├── Card.svelte                  # Single card with swap highlighting
│       ├── MultiDeckView.svelte         # Horizontally-scrollable per-step deck history
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
let selectedIsomorph    = $state<Isomorph | null>(null);

let swapCount        = $state(4);
let rotationMax      = $state(1);
let rotationConstant = $state(true);

let result             = $derived(encipher(plaintext, mapping));
let isomorphs          = $derived(findIsomorphs(result.ciphertext));
let ciphertextHighlight = $derived(selectedIsomorph ? { startA, startB, length } : null);

// Clears selectedIsomorph whenever result.ciphertext changes
$effect(() => { result.ciphertext; selectedIsomorph = null; });

// Clamps swapCount to minimum 2 when rotationMax drops to 0
$effect(() => { if (rotationMax === 0 && swapCount < 2) swapCount = 2; });
```

### Data Flow
1. User types in `PlaintextInput` → `plaintext` updates.
2. `result` is `$derived` from `encipher(plaintext, mapping)`, returns `{ deck, ciphertext, lastTransformation, steps }`.
3. `isomorphs` is `$derived` from `findIsomorphs(result.ciphertext)`.
4. `CiphertextOutput` renders each ciphertext character as a `<span>`, applying purple/cyan highlights when an isomorph is selected.
5. `DeckView` renders the final deck with optional swap highlights, compact numbered-swatch legend, and rotation annotation.
6. `MultiDeckView` (right panel) renders one column per ciphertext step, preceded by a fixed initial A–Z column. Each column shows a `↺N` rotation label when applicable.
7. `IsomorphList` (left panel, toggled) renders sorted isomorph entries with pair-count badges; clicking one sets `selectedIsomorph`.
8. `CipherInspector` (modal, toggled by "Inspect Cipher" button) renders a full-screen overlay showing every PT letter's transformation details. Mounted outside `.app-layout` so it overlays the full viewport.

---

## Cipher Logic

### Rules
1. Each PT symbol (A–Z) maps to a unique transformation (variable swaps + optional rotation).
2. If `rotation === 0`, position 0 must be in one swap (top card must change via swaps).
3. If `rotation > 0`, the rotation itself guarantees the top card changes; swaps are unrestricted.
4. Ciphertext output = top card of deck after applying the transformation.
5. Transformation order: rotation first, then swaps.
6. Ciphertext is always a pure function of the full plaintext (recomputed from scratch on every change).

### Three Cipher Generators

**Sliding Window (default on page load):**
- Deterministic — no randomness.
- Always uses 4 swaps and `rotation: 1` for every transformation.
- `generateSlidingWindowMapping(): CipherMapping`

**Random (via "Randomize Cipher" button):**
- Uses seeded Mulberry32 PRNG for reproducibility.
- Respects `CipherConfig` (swapCount, rotationMax, rotationConstant).
- `generateCipherMapping(seed: number, config: CipherConfig): CipherMapping`
- Throws if `swapCount === 1 && rotationMax === 0` (only 25 possible keys, not enough for 26 letters).

### Transformation Key
`transformationKey(t)` serializes a transformation as `r{rotation};{sorted swap pairs}` for uniqueness checking. Transformations with the same swaps but different rotations are considered distinct.

---

## Cipher Inspector (`src/components/CipherInspector.svelte`)

A modal overlay that exposes the internal structure of the currently-loaded `CipherMapping`. Opened via the "Inspect Cipher" button in `.controls`; closed by clicking the `×` button, clicking the backdrop, or pressing `Escape`.

**Props:**
```ts
{ mapping: CipherMapping; onclose: () => void }
```

**Internal state:** `let activeTab = $state<'table' | 'heatmap'>('table');`

**Structure:**
```
<svelte:window onkeydown> (Escape → close)
<div class="backdrop" onclick={onclose}>       ← fixed, full-screen, semi-transparent
  <div class="modal" onclick|stopPropagation>  ← bordered panel, scrollable
    header: "Cipher Inspector"  +  [×] close button
    tabs:   [Table]  [Heatmap]
    content: (active tab)
  </div>
</div>
```

### Tab 1: Transformation Table
One row per PT letter (A–Z) with three columns:

| PT | ↺   | Swaps                               |
|----|-----|-------------------------------------|
| A  | ↺1  | `[0↔5]` `[3↔12]` `[8↔20]` `[2↔7]` |
| B  | —   | `[0↔1]` `[4↔15]` `[9↔22]` `[3↔11]`|

- **PT column**: monospace bold letter
- **↺ column**: `↺N` if `rotation > 0`, else dim `—`
- **Swaps column**: one colored chip per swap pair (`SWAP_COLORS[i]`), text `a↔b` (position numbers), dark text on colored background

### Tab 2: Position Heatmap
A 26×28 grid: rows = PT letters A–Z, columns = deck positions 0–25, plus a final ↺ column. A "Deck Position" axis label spans all 26 position columns in the header.

- Each cell is colored `SWAP_COLORS[pairIndex]` if that position participates in any swap for that letter; empty otherwise
- ↺ column: `↺N` if rotation > 0, else dim `—`
- Table wrapper uses `overflow-x: auto` to handle viewport overflow

**Helper function:**
```ts
function getPairIndex(t: Transformation, pos: number): number | null {
  for (let i = 0; i < t.swaps.length; i++) {
    if (t.swaps[i][0] === pos || t.swaps[i][1] === pos) return i;
  }
  return null;
}
```

**`SWAP_COLORS` array** — duplicates the same 13-entry array used by `DeckView` and `MultiDeckView` (consistent with the established pattern).

---

## Isomorph Logic (`src/lib/cipher/isomorph.ts`)

### `isomorphPattern(s: string): string`
Encodes the repetition structure of a string. Characters appearing more than once are assigned labels `a`, `b`, `c`, … in order of first occurrence. Characters appearing exactly once become `.`.

### `findIsomorphs(ciphertext: string): Isomorph[]`
For every window length `n` from 3 to `floor(length / 2)`:
- Computes `isomorphPattern` for every n-length window.
- **Skips** windows whose pattern is all-periods (all-unique chars), **starts with a period** (leading singletons), or **ends with a period** (trailing singletons).
- Groups positions by pattern; emits one `Isomorph` per non-overlapping pair (`startB >= startA + n`).

### `countPatternOccurrences(isomorphs: Isomorph[]): Map<string, number>`
Counts the number of isomorph pair entries per pattern across the collection.

### `isomorphInterestingness(pattern: string): number`
Returns `(non-period char count) / pattern.length`. Range [0, 1].

### `sortByInterestingness(isomorphs, patternCounts?): Isomorph[]`
Returns a new array sorted by:
1. Descending pair count (from `patternCounts`, or 0 if omitted)
2. Descending interestingness (density)
3. Descending pattern length (tie-break)
4. Ascending startA (tie-break)

---

## UI Components

| Component | Props | Description |
|---|---|---|
| `App.svelte` | — | Root; holds all state; two-panel layout |
| `PlaintextInput` | `oninput: (text: string) => void` | Resizable textarea |
| `CiphertextOutput` | `ciphertext: string`, `highlight: { startA, startB, length } \| null` | Per-character `<span>` div; highlighted chars get purple (A) or cyan (B) background |
| `DeckView` | `deck: string[]`, `lastTransformation: Transformation \| null`, `showHighlights: boolean` | "Current Deck State" label + `↺N` rotation annotation + compact numbered-swatch legend + 26 Card components |
| `Card` | `letter: string`, `swapPair?: number \| null` | Single card; colored when `swapPair` is set |
| `MultiDeckView` | `steps: CipherStep[]`, `showHighlights: boolean` | Horizontally-scrollable row; initial A–Z column (`—`) followed by one column per ciphertext step; columns show `↺N` when rotation > 0 |
| `IsomorphList` | `isomorphs: Isomorph[]`, `ciphertext: string`, `selected: Isomorph \| null`, `onselect: (iso) => void` | Flex-wrap, vertically-scrollable (max 300px); entries show pattern, pair-count badge (`×N`), positions, and colored substrings |
| `CipherInspector` | `mapping: CipherMapping`, `onclose: () => void` | Full-viewport modal; two tabs (Table + Heatmap); Escape key or backdrop click closes it |

---

## Layout

```
┌─────────────────────── app-layout (flex row) ───────────────────────────────┐
│  left-panel (700px fixed)          │  right-panel (flex:1, overflow-x:auto) │
│  ─────────────────────────────     │  ──────────────────────────────────     │
│  h1: DeckLab                       │  MultiDeckView:                         │
│  controls:                         │    —    col  col  col  col  ...         │
│    [Randomize Cipher]              │   (A-Z) (one per ciphertext character,  │
│    [Inspect Cipher]                │          scrolls horizontally)          │
│    Swaps: [4]                      │                                         │
│    Rotations: [1] [✓ Constant]     │                                         │
│    [✓] Show swap highlights        │                                         │
│    [ ] Show isomorphs              │                                         │
│  PlaintextInput (textarea)         │                                         │
│  CiphertextOutput (span div)       │                                         │
│  DeckView (label + legend + cards) │                                         │
│  IsomorphList (if showIsomorphs)   │                                         │
└────────────────────────────────────┴─────────────────────────────────────────┘

When showCipherInspector is true (overlays full viewport):
┌──────────────────── backdrop (fixed, full-screen, semi-transparent) ─────────┐
│          ┌───────────────── modal ──────────────────────┐                    │
│          │  Cipher Inspector                        [×]  │                    │
│          │  [Table]  [Heatmap]                           │                    │
│          │  ─────────────────────────────────────────    │                    │
│          │  (active tab content)                         │                    │
│          └───────────────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Color Palette

### Swap highlight colors (13 fixed positions)

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

This array is duplicated identically in `DeckView`, `MultiDeckView`, and `CipherInspector`.

### Other UI colors

| Role | Color | Hex |
|---|---|---|
| Isomorph substring A | Purple | `#c678dd` |
| Isomorph substring B | Cyan | `#56b6c2` |
| Highlighted card text | Dark | `#1e1e1e` |
| Muted labels / positions | Gray | `#abb2bf` |
| Modal background | Dark | `#282c34` |

---

## Key Functions

| Function | File | Description |
|---|---|---|
| `createRng(seed)` | `prng.ts` | Mulberry32 PRNG — returns `() => number` in [0,1) |
| `generateSlidingWindowMapping()` | `generate.ts` | Deterministic sliding window cipher; 4 swaps, rotation=1 per transformation |
| `generateCipherMapping(seed, config)` | `generate.ts` | Random seeded cipher respecting `CipherConfig`; throws on invalid config |
| `transformationKey(t)` | `generate.ts` | Normalized serialization: `r{rotation};{sorted swaps}` |
| `createInitialDeck()` | `deck.ts` | Returns A–Z array |
| `applyTransformation(deck, t)` | `deck.ts` | Applies rotation then swaps to a deck copy |
| `encipherStep(deck, char, mapping)` | `deck.ts` | Single-character encipher step |
| `encipher(plaintext, mapping)` | `deck.ts` | Full plaintext encipher; returns `{ deck, ciphertext, lastTransformation, steps }` |
| `isomorphPattern(s)` | `isomorph.ts` | Repetition-structure string for a substring |
| `findIsomorphs(ciphertext)` | `isomorph.ts` | All non-overlapping isomorphic pairs; filters trivial, leading-period, and trailing-period patterns |
| `countPatternOccurrences(isomorphs)` | `isomorph.ts` | Pair count per pattern from the collection |
| `isomorphInterestingness(pattern)` | `isomorph.ts` | Non-period density [0,1] |
| `sortByInterestingness(isomorphs, patternCounts?)` | `isomorph.ts` | Sort by count desc → density desc → length desc → startA asc |
| `getPairIndex(t, pos)` | `CipherInspector.svelte` | Returns swap pair index (0-based) for a deck position, or null if not involved |

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

1. **`Transformation` is a struct, not a tuple.** Changed from `[Swap, Swap, Swap, Swap]` to `{ swaps: Swap[], rotation: number }` to support variable swap counts and rotations. Rotation is applied before swaps.
2. **`generateCipherMapping` requires `CipherConfig`.** The config parameter is required (no default) so all callers are explicit about their cipher parameters.
3. **Invalid config throws immediately.** `swapCount=1` with `rotationMax=0` yields only 25 unique keys — not enough for 26 letters. The function throws a descriptive error rather than looping forever.
4. **UI clamps swapCount when rotationMax drops to 0.** A `$effect` bumps `swapCount` to 2 if it would otherwise become invalid. The swapCount input's `min` attribute also updates reactively.
5. **Sliding window mapping uses `rotation: 1`.** The deterministic default cipher includes a 1-position cyclic shift in every transformation.
6. **`transformationKey` includes rotation.** Key format `r{rotation};{sorted swaps}` ensures same-swaps/different-rotation transformations are treated as distinct for uniqueness checking.
7. **Swap highlight colors are 13 fixed entries.** Positionally indexed so color assignments are consistent across page reloads and cipher changes. `DeckView`, `MultiDeckView`, and `CipherInspector` all share the identical hardcoded array.
8. **DeckView legend uses compact numbered swatches.** Each swap pair is shown as a small colored square bearing its number (1–13). The "Swaps:" text label identifies the legend. Rotation is shown as `↺N` inline. Legend is hidden when `lastTransformation` is null.
9. **`MultiDeckView` always shows the initial A–Z column.** A `—`-labeled column prepended to the steps shows the deck state before any encipherment. Per-step columns show `↺N` when their transformation includes a rotation.
10. **Isomorph patterns filter leading and trailing periods.** `findIsomorphs` skips any window whose pattern starts or ends with `.`, eliminating cryptanalytically less useful isomorphs symmetrically.
11. **Isomorph sort uses pair count as primary key.** `sortByInterestingness` accepts an optional `patternCounts: Map<string, number>` computed by `countPatternOccurrences`. The count equals the number of list entries for that pattern, so the `×N` badge always matches the visible entry count.
12. **`encipher()` returns `steps`.** The `steps: CipherStep[]` array captures each intermediate deck state, enabling `MultiDeckView` to display the full history without re-running the cipher.
13. **`CipherInspector` is mounted outside `.app-layout`.** The modal lives at the root level in `App.svelte` so it overlays the full viewport rather than being constrained by the two-panel layout.
14. **Backdrop click closes the modal; inner clicks do not.** `onclick|stopPropagation` on `.modal` prevents bubbling to the backdrop's `onclick={onclose}` handler, giving correct dismiss-on-outside-click behavior.
15. **Default config changed to `rotationMax=1`, `rotationConstant=true`.** The UI now defaults to the same parameters used by the sliding window mapping (1-position constant rotation), making the default cipher behavior consistent with the controls' initial values.
