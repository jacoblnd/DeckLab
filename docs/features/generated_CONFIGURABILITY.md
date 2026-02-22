# Configurability — Implementation Plan

## Overview

Add UI controls for **swap count** (1–13) and **rotation** (0–25, with random/constant toggle) that apply when "Randomize Cipher" is pressed. The sliding window mapping is unchanged in behavior but must be updated to return the new `Transformation` type. Rotation is applied before swaps within each transformation. Rotation indicator `↺N` is shown in column labels (MultiDeckView) and the deck label (DeckView) when applicable.

---

## 1. `Transformation` type (`src/lib/cipher/deck.ts`)

**Change the type from a fixed 4-tuple to a struct:**

```ts
// Before
export type Transformation = [Swap, Swap, Swap, Swap];

// After
export type Transformation = {
  swaps: Swap[];     // 1–13 swap pairs
  rotation: number;  // 0 = no rotation; N = cyclic shift by N positions (rotation applied first)
};
```

This is a breaking change that cascades through all files below.

**Update `applyTransformation`** to apply rotation first, then swaps:

```ts
export function applyTransformation(deck: DeckState, t: Transformation): DeckState {
  let newDeck = [...deck];
  if (t.rotation > 0) {
    newDeck = [...newDeck.slice(t.rotation), ...newDeck.slice(0, t.rotation)];
  }
  for (const [i, j] of t.swaps) {
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}
```

No other changes to `deck.ts` — `CipherStep`, `encipherStep`, and `encipher` all use `Transformation` by reference and need no logic changes.

---

## 2. `CipherConfig` type and updated generators (`src/lib/cipher/generate.ts`)

### New exported type

```ts
export type CipherConfig = {
  swapCount: number;        // 1–13: number of swap pairs per transformation
  rotationMax: number;      // 0–25: 0 = no rotation; positive = rotation amount
  rotationConstant: boolean; // true = every transformation uses rotationMax exactly
                             // false = each transformation picks randomly from [1, rotationMax]
};
```

### New helper: `sampleUnique`

Add alongside the existing `sampleUniqueNonZero`. The existing helper excludes 0 (for the case where swaps must cover position 0). The new helper samples from the full range [0, DECK_SIZE):

```ts
function sampleUnique(rng: () => number, max: number, count: number): number[] { ... }
```

This is needed when rotation > 0 and swaps are free to use any positions including 0.

### Updated `generateTransformation`

New signature: `generateTransformation(rng, swapCount, rotation): Transformation`

- If `rotation === 0`: top card must change via swaps → include position 0 in the first swap (current behavior). Sample `swapCount * 2 - 1` positions from non-zero using `sampleUniqueNonZero`, prepend 0.
- If `rotation > 0`: top card changes via rotation → swaps may use any positions. Sample `swapCount * 2` positions from the full range using `sampleUnique`.

In both cases, pair positions sequentially into swaps.

### Updated `transformationKey`

Include rotation in the key so two transformations with the same swaps but different rotations are treated as distinct:

```ts
export function transformationKey(t: Transformation): string {
  const normalized = t.swaps
    .map(([a, b]) => (a < b ? [a, b] : [b, a]) as Swap)
    .sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  return `r${t.rotation};${normalized.map(([a, b]) => `${a},${b}`).join(';')}`;
}
```

### Updated `generateCipherMapping`

New signature: `generateCipherMapping(seed: number, config: CipherConfig): CipherMapping`

For each of the 26 letters, compute a rotation for this transformation before calling `generateTransformation`:

```
if config.rotationMax === 0:    rotation = 0
if config.rotationMax > 0 and rotationConstant:  rotation = config.rotationMax
if config.rotationMax > 0 and !rotationConstant: rotation = 1 + floor(rng() * config.rotationMax)
```

The `config` parameter is **required** (no default) so all callers are explicit.

### Updated `generateSlidingWindowMapping`

Logic is unchanged. Only the return format changes — wrap the existing 4 swaps in the new struct:

```ts
mapping[letter] = {
  swaps: [
    [0, partner],
    [remaining[0], remaining[1]],
    [remaining[2], remaining[3]],
    [remaining[4], remaining[5]],
  ],
  rotation: 0,
};
```

---

## 3. App state and UI (`src/App.svelte`)

### New state

```ts
let swapCount      = $state(4);
let rotationMax    = $state(0);
let rotationConstant = $state(false);
```

### Updated `randomizeMapping`

```ts
function randomizeMapping() {
  const seed = Math.floor(Math.random() * 2 ** 32);
  mapping = generateCipherMapping(seed, { swapCount, rotationMax, rotationConstant });
}
```

### New UI controls

Add to the existing `.controls` div, alongside the Randomize button. Two new labeled number inputs and one checkbox:

```
Swaps: [4]   Rotations: [0]  [□ Constant]
```

- **Swaps** input: `type="number"`, min=1, max=13, bound to `swapCount`
- **Rotations** input: `type="number"`, min=0, max=25, bound to `rotationMax`
- **Constant** checkbox: bound to `rotationConstant`; disabled (greyed out) when `rotationMax === 0` since it has no effect

Labels and inputs use the existing `.highlight-toggle` style pattern for visual consistency.

---

## 4. `MultiDeckView.svelte`

### Extend `SWAP_COLORS` from 4 to 13 entries

Define 13 fixed colors in a hardcoded array. The first 4 remain unchanged to preserve visual consistency with existing ciphers:

```ts
const SWAP_COLORS = [
  '#e06c75', // swap 1 — red
  '#e5c07b', // swap 2 — yellow
  '#61afef', // swap 3 — blue
  '#98c379', // swap 4 — green
  // 9 additional distinct dark-theme-friendly colors for swaps 5–13
  ...
];
```

Specific color choices for positions 5–13 to be finalized at implementation time, following the existing one dark palette aesthetic.

### Update `buildSwapPairMap`

Change `transformation: Transformation` parameter; iterate over `transformation.swaps` instead of the transformation directly:

```ts
function buildSwapPairMap(transformation: Transformation): (number | null)[] {
  const map: (number | null)[] = new Array(26).fill(null);
  for (let pairIndex = 0; pairIndex < transformation.swaps.length; pairIndex++) {
    const [a, b] = transformation.swaps[pairIndex];
    map[a] = pairIndex;
    map[b] = pairIndex;
  }
  return map;
}
```

### Add rotation label to column headers

When `step.transformation.rotation > 0`, show `↺N` below the ciphertext char label in each column:

```svelte
<div class="col-label">{step.ciphertextChar}</div>
{#if step.transformation.rotation > 0}
  <div class="col-rotation">↺{step.transformation.rotation}</div>
{/if}
```

Style `.col-rotation` similarly to `.col-label` (muted gray, monospace, small).

---

## 5. `DeckView.svelte`

### Extend `SWAP_COLORS` to 13 entries

Same as MultiDeckView — both arrays should be defined identically (or extracted to a shared constant if preferred, though a shared file would be new infrastructure; duplicating the constant is simpler).

### Update `swapPairMap` derivation

Change iteration from `lastTransformation.length` / direct array access to `lastTransformation.swaps`:

```ts
let swapPairMap = $derived.by(() => {
  const map: (number | null)[] = new Array(deck.length).fill(null);
  if (lastTransformation) {
    for (let pairIndex = 0; pairIndex < lastTransformation.swaps.length; pairIndex++) {
      const [a, b] = lastTransformation.swaps[pairIndex];
      map[a] = pairIndex;
      map[b] = pairIndex;
    }
  }
  return map;
});
```

### Update legend

Derive legend entries from `lastTransformation.swaps.length` rather than the fixed `SWAP_COLORS` array length. When `lastTransformation` is null (no input yet), the legend section is not rendered:

```svelte
{#if showHighlights && lastTransformation}
  <div class="legend">
    {#each lastTransformation.swaps as _, i}
      <span class="legend-item">
        <span class="swatch" style:background-color={SWAP_COLORS[i]}></span>
        Swap {i + 1}
      </span>
    {/each}
    {#if lastTransformation.rotation > 0}
      <span class="legend-item">↺{lastTransformation.rotation}</span>
    {/if}
  </div>
{/if}
```

### Add rotation indicator to deck label

When the last transformation included a rotation, show `↺N` inline with the "Current Deck State" heading:

```svelte
<h2 class="deck-label">
  Current Deck State
  {#if lastTransformation && lastTransformation.rotation > 0}
    <span class="rotation-label">↺{lastTransformation.rotation}</span>
  {/if}
</h2>
```

---

## 6. Test updates (`src/lib/cipher/deck.test.ts`)

This file has the most changes. Every `Transformation` literal and every call to `generateCipherMapping` needs updating.

### `applyTransformation` tests
- Update both `Transformation` literals to `{ swaps: [...], rotation: 0 }` format.
- Add new tests for rotation behavior:
  - Rotation by N shifts cards correctly (e.g. rotation=2 on [A,B,C,...] → [C,D,...,A,B])
  - Rotation applied before swaps (verify combined effect)
  - Rotation of 0 is a no-op

### `generateCipherMapping` tests
- Add `config` argument to all `generateCipherMapping(seed)` calls → `generateCipherMapping(seed, { swapCount: 4, rotationMax: 0, rotationConstant: false })`.
- Update the inline `normalizeKey` function to use `t.swaps.map(...)` instead of `t.map(...)`.
- Update "exactly 4 swaps": `expect(t).toHaveLength(4)` → `expect(t.swaps).toHaveLength(4)`.
- Update "8 distinct positions": `t.flat()` → `t.swaps.flat()`.
- Update "position 0 included": `t.flat()` → `t.swaps.flat()`, `t[0][0]` → `t.swaps[0][0]`.
- Add new tests for variable `swapCount` (e.g. `swapCount: 2` → 2 swaps per transformation).
- Add new tests for rotation: constant rotation, random rotation (verify rotation ∈ [1, rotationMax]).
- Add test that two transformations with same swaps but different rotations are not considered duplicates.

### `generateSlidingWindowMapping` tests
- Update "4 swaps with 8 distinct positions": `expect(t).toHaveLength(4)` → `expect(t.swaps).toHaveLength(4)`, `t.flat()` → `t.swaps.flat()`.
- Update "position 0 included": `t[0][0]` → `t.swaps[0][0]`.
- Update "position 0 partner rotates": `mapping['A'][0]` → `mapping['A'].swaps[0]`, etc.
- Update "all non-zero positions in range": `for (const [a, b] of t)` → `for (const [a, b] of t.swaps)`.
- Add test: every transformation has `rotation: 0`.

### `encipher` tests
- These tests call `generateCipherMapping(42)` and `generateCipherMapping(77)` etc. — update all with default config.
- The `encipherStep` tests also use `generateCipherMapping(42)` — update same way.

### `App.test.ts`
- Smoke tests — likely no changes required since they test DOM presence, not transformation internals.

---

## Files Changed Summary

| File | Change |
|---|---|
| `src/lib/cipher/deck.ts` | `Transformation` type; `applyTransformation` logic (rotation + swaps) |
| `src/lib/cipher/generate.ts` | `CipherConfig` type; `sampleUnique`; `generateTransformation`; `transformationKey`; `generateCipherMapping` signature; `generateSlidingWindowMapping` format |
| `src/App.svelte` | 3 new state variables; updated `randomizeMapping`; new UI controls |
| `src/components/MultiDeckView.svelte` | 13-color array; `buildSwapPairMap` update; `↺N` column label |
| `src/components/DeckView.svelte` | 13-color array; `swapPairMap` update; dynamic legend; `↺N` deck label |
| `src/lib/cipher/deck.test.ts` | Update all `Transformation` literals; update all `generateCipherMapping` calls; add new tests for rotation and variable swap count |

---

## Constraints and Edge Cases

- **Top card rule**: If `rotation === 0`, position 0 must be in one swap (current invariant, preserved). If `rotation > 0`, position 0 need not be in any swap — the rotation guarantees the top card changes.
- **Rotation of 26**: Excluded by the UI max of 25. No wrapping needed.
- **Rotation of 0 with `rotationConstant = true`**: No rotation applied (same as `rotationMax = 0`). The constant checkbox is disabled in the UI when `rotationMax = 0`.
- **`generateSlidingWindowMapping` always uses `rotation: 0`** and 4 swaps — behavior unchanged.
- **`transformationKey` includes rotation**: `r0;0,1;2,3` and `r3;0,1;2,3` are different keys, so same-swap but different-rotation transformations count as distinct.
- **Random rotation uniqueness**: Since rotation is part of the uniqueness key, a seed producing a collision on swaps alone can be resolved by a different rotation, increasing the pool of available unique transformations.
