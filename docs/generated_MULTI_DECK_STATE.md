# Multi-Deck State — Implementation Plan

## Overview

Add a horizontally scrollable component to the right side of the app. It shows the full deck state at each ciphertext step as vertical columns (left = step 1, right = last step). Each column is labeled with its ciphertext character, shows all 26 cards top-to-bottom in deck order, and highlights the 8 positions involved in that step's transformation.

The existing `DeckView` (final deck state, shown below plaintext/ciphertext) is kept.

---

## Changes Required

### 1. `src/lib/cipher/deck.ts` — extend `encipher()` return type

Add a `steps` array to the return value of `encipher()`. Each step captures the intermediate deck state, ciphertext character, and the transformation applied at that step.

**New type (export it for use by components):**
```ts
export type CipherStep = {
  deck: DeckState;
  ciphertextChar: string;
  transformation: Transformation;
};
```

**Updated `encipher()` signature:**
```ts
function encipher(
  plaintext: string,
  mapping: CipherMapping
): {
  deck: DeckState;
  ciphertext: string;
  lastTransformation: Transformation | null;
  steps: CipherStep[];
}
```

**Implementation change** — accumulate steps inside the loop:
```ts
const steps: CipherStep[] = [];

for (const char of plaintext) {
  const upper = char.toUpperCase();
  if (upper >= 'A' && upper <= 'Z') {
    const result = encipherStep(deck, upper, mapping);
    const transformation = mapping[upper];
    steps.push({ deck: result.newDeck, ciphertextChar: result.ciphertextChar, transformation });
    lastTransformation = transformation;
    deck = result.newDeck;
    ciphertext += result.ciphertextChar;
  }
}

return { deck, ciphertext, lastTransformation, steps };
```

Note: `deck` in each step is the deck state **after** the transformation (which produced that step's `ciphertextChar` as the top card).

---

### 2. `src/lib/cipher/deck.test.ts` — update tests

The existing `encipher` tests destructure `{ deck, ciphertext, lastTransformation }` from the return value. These continue to work since the new `steps` field is additive.

Add a new test block for `steps`:

```
encipher — steps
  - returns empty steps array for empty/non-letter input
  - returns one step per ciphertext character (filters non-letters)
  - each step's deck has 26 letters
  - each step's ciphertextChar matches the corresponding character in ciphertext
  - each step's transformation is the mapping entry for the corresponding plaintext letter
  - steps are sequential (each step's deck equals the prior step's result)
```

**Approx. 6 new tests** — keep them in the existing `encipher` describe block or add a nested describe.

---

### 3. `src/components/MultiDeckView.svelte` — new component

**Props:**
```ts
let { steps }: { steps: CipherStep[] } = $props();
```

**Layout:**
- Outer container: `overflow-x: auto`, `display: flex`, `flex-direction: row`, `gap: 0.4rem`, `padding: 0.5rem`.
- One column per step: `display: flex`, `flex-direction: column`, `align-items: center`, `gap: 0.15rem`.
- Column header: ciphertext character label in a small, styled `<div>` (bold, monospace, centered).
- 26 card cells below, top-to-bottom.

**Swap highlighting:**
Reuse the `swapPairMap` logic from `DeckView.svelte`. For each column, compute a map `(number | null)[]` from the step's `transformation`, then apply `SWAP_COLORS` to the card background.

**Card cell sizing (compact):**
Cards in the multi-deck view are smaller than the main deck view: `width: 1.6rem`, `height: 1.6rem`. Same border, border-radius, font-family, font-weight. No reuse of `Card.svelte` (that component is sized for the main view). Inline styles in the column template.

**Empty state:**
When `steps` is empty (no plaintext), render nothing (or an optional placeholder — keep it simple, render nothing).

**Rough template:**
```svelte
<div class="multi-deck" data-testid="multi-deck">
  {#each steps as step, colIndex}
    {@const swapPairMap = buildSwapPairMap(step.transformation)}
    <div class="column">
      <div class="col-label">{step.ciphertextChar}</div>
      {#each step.deck as letter, i}
        <div
          class="mini-card"
          class:highlighted={swapPairMap[i] != null}
          style:background-color={swapPairMap[i] != null ? SWAP_COLORS[swapPairMap[i]] : undefined}
        >
          {letter}
        </div>
      {/each}
    </div>
  {/each}
</div>
```

Extract `buildSwapPairMap(transformation: Transformation): (number | null)[]` as a local helper (mirrors `DeckView`'s `$derived.by` logic).

---

### 4. `src/App.svelte` — layout + wiring

**Import:**
```ts
import MultiDeckView from './components/MultiDeckView.svelte';
import type { CipherStep } from './lib/cipher/deck';
```

**Derived data:**
`result.steps` is already available from the updated `encipher()`.

**Layout change:**
Replace the single `<main>` column with a two-panel flex layout:

```svelte
<div class="app-layout">
  <main class="left-panel">
    <h1>DeckLab</h1>
    <div class="controls">...</div>
    <PlaintextInput ... />
    <CiphertextOutput ... />
    <DeckView ... />
  </main>
  <div class="right-panel">
    <MultiDeckView steps={result.steps} />
  </div>
</div>
```

**CSS:**
```css
.app-layout {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  min-height: 100vh;
}
.left-panel {
  /* existing main styles */
  flex-shrink: 0;
  width: 700px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.right-panel {
  flex: 1;
  overflow-x: auto;
  padding: 2rem 1rem;
  min-width: 0; /* prevents flex overflow */
  align-self: stretch;
}
```

---

## File Change Summary

| File | Change |
|---|---|
| `src/lib/cipher/deck.ts` | Export `CipherStep` type; extend `encipher()` to accumulate and return `steps` |
| `src/lib/cipher/deck.test.ts` | Add ~6 tests for `steps` in the `encipher` describe block |
| `src/components/MultiDeckView.svelte` | New component — horizontal scroll, column-per-step, compact card cells, swap highlighting |
| `src/App.svelte` | Import `MultiDeckView`; switch to two-panel layout; pass `result.steps` |

No other files need to change.

---

## Test Plan

1. Run `npm run test:ci` — all existing 33 tests must still pass.
2. New tests for `steps` should pass (target: ~6 new tests, total ~39).
3. Manual smoke test: type letters, observe columns appearing left-to-right with correct labels and highlighting.
4. Manual test: delete text, confirm columns disappear; empty input shows no columns.
5. Manual test: type a long string, confirm horizontal scrolling works.
6. Run `npm run check` — no TypeScript or Svelte errors.

---

## Design Notes

- `CipherStep.deck` captures the deck **after** transformation (the top card is the ciphertext char for that step).
- The `steps` array contains only steps for alphabetic input characters — same filter as the main `encipher()` loop.
- `MultiDeckView` does not import `Card.svelte` to avoid coupling the compact mini-card sizing to the main card sizing. If the Card component gains a `size` prop in the future, this can be revisited.
- No new state is introduced in `App.svelte`; `result.steps` is available directly from the existing `$derived` result.
