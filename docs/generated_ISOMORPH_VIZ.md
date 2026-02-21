# Isomorph Visualization — Implementation Plan

## Overview

Add a toggleable, vertically-scrollable isomorph panel below the Current Deck State,
ranked by interestingness. Selecting an isomorph highlights the two corresponding
ciphertext substrings in the ciphertext output. The ciphertext output's `<textarea>`
is replaced with a span-based `<div>` to support per-character highlights.

---

## Interestingness Metric

```
interestingness(pattern) = (number of non-period characters) / pattern.length
```

Examples:
- `'aaaa'`     → 4/4 = 1.0
- `'a..ba.ab'` → 5/8 = 0.625
- `'a....a'`   → 2/6 = 0.33
- `'.....'`    → 0/5 = 0.0  (never emitted, but defined)

Sort order: descending interestingness. Ties broken by pattern length descending
(longer constraint spans more ciphertext → more interesting). Further ties broken
by startA ascending.

---

## Highlight Colors

Two new colors for the two selected substrings, distinct from the four swap colors:

| Role        | Color     | Hex       |
|-------------|-----------|-----------|
| Substring A | Purple    | `#c678dd` |
| Substring B | Cyan      | `#56b6c2` |

Dark text (`#1e1e1e`) on both for contrast (same treatment as swap highlights).

---

## Files

| File | Change |
|---|---|
| `src/lib/cipher/isomorph.ts` | Add `isomorphInterestingness` and `sortByInterestingness` |
| `src/lib/cipher/isomorph.test.ts` | Add tests for both new functions |
| `src/components/CiphertextOutput.svelte` | Replace `<textarea>` with span-based `<div>`; add `highlight` prop |
| `src/components/IsomorphList.svelte` | New — vertically-scrollable list of clickable entries |
| `src/App.svelte` | Add `showIsomorphs` + `selectedIsomorph` state, checkbox, wiring |

---

## 1. `src/lib/cipher/isomorph.ts`

Add two exports:

```ts
/** Fraction of non-period characters in the pattern. Range [0, 1]. */
export function isomorphInterestingness(pattern: string): number {
  const repeats = pattern.split('').filter(c => c !== '.').length;
  return repeats / pattern.length;
}

/**
 * Returns a new array sorted by descending interestingness.
 * Ties broken by pattern length descending, then startA ascending.
 */
export function sortByInterestingness(isomorphs: Isomorph[]): Isomorph[] {
  return [...isomorphs].sort((a, b) => {
    const di = isomorphInterestingness(b.pattern) - isomorphInterestingness(a.pattern);
    if (di !== 0) return di;
    const dl = b.pattern.length - a.pattern.length;
    if (dl !== 0) return dl;
    return a.startA - b.startA;
  });
}
```

---

## 2. `src/lib/cipher/isomorph.test.ts`

Add a new `describe` block for the two new functions (~8 tests):

```
isomorphInterestingness
  - returns 0 for all-period pattern
  - returns 1 for all-letter pattern ('aaaa')
  - returns correct fraction for mixed pattern ('a..ba.ab' → 0.625)
  - returns correct fraction for sparse pattern ('a....a' → 0.333…)

sortByInterestingness
  - returns a new array (does not mutate input)
  - sorts by descending density
  - breaks density ties by pattern length descending
  - breaks length ties by startA ascending
```

---

## 3. `src/components/CiphertextOutput.svelte`

**Props change:**
```ts
let {
  ciphertext,
  highlight = null,
}: {
  ciphertext: string;
  highlight: { startA: number; startB: number; length: number } | null;
} = $props();
```

**Template change** — replace `<textarea>` with a character-by-character `<div>`:

```svelte
<div
  class="ciphertext-chars"
  data-testid="ciphertext-output"
  aria-label="Ciphertext"
>
  {#if ciphertext.length === 0}
    <span class="placeholder">Ciphertext appears here...</span>
  {:else}
    {#each ciphertext.split('') as char, i}
      {@const inA = highlight != null && i >= highlight.startA && i < highlight.startA + highlight.length}
      {@const inB = highlight != null && i >= highlight.startB && i < highlight.startB + highlight.length}
      <span
        class="ct-char"
        class:hl-a={inA}
        class:hl-b={inB}
      >{char}</span>
    {/each}
  {/if}
</div>
```

`data-testid="ciphertext-output"` stays on the outer div so `App.test.ts` continues to pass.

**CSS additions:**
```css
.ciphertext-chars {
  font-family: monospace;
  font-size: 1rem;
  padding: 0.5rem;
  min-height: 3rem;
  background-color: rgba(128, 128, 128, 0.1);
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 0;
  word-break: break-all;
  white-space: pre-wrap;
}
.ct-char { display: inline; }
.hl-a { background-color: #c678dd; color: #1e1e1e; }
.hl-b { background-color: #56b6c2; color: #1e1e1e; }
.placeholder { color: #666; font-style: italic; }
```

Note: `<textarea>` CSS rules (`resize`, `value` binding) are removed.

---

## 4. `src/components/IsomorphList.svelte` (new)

**Props:**
```ts
let {
  isomorphs,
  ciphertext,
  selected,
  onselect,
}: {
  isomorphs: Isomorph[];
  ciphertext: string;
  selected: Isomorph | null;
  onselect: (iso: Isomorph | null) => void;
} = $props();
```

**Derived:**
```ts
import { sortByInterestingness } from '../lib/cipher/isomorph';
let sorted = $derived(sortByInterestingness(isomorphs));
```

**Template** — flex-wrap grid of entries, each showing pattern + positions + substrings:

```svelte
<div class="isomorph-list">
  {#each sorted as iso}
    {@const isSelected = selected != null
      && selected.startA === iso.startA
      && selected.startB === iso.startB
      && selected.pattern === iso.pattern}
    {@const subA = ciphertext.slice(iso.startA, iso.startA + iso.pattern.length)}
    {@const subB = ciphertext.slice(iso.startB, iso.startB + iso.pattern.length)}
    <button
      class="iso-entry"
      class:selected={isSelected}
      onclick={() => onselect(isSelected ? null : iso)}
    >
      <span class="iso-pattern">{iso.pattern}</span>
      <span class="iso-positions">@{iso.startA} · @{iso.startB}</span>
      <span class="iso-subs">
        <span class="sub-a">{subA}</span>
        <span class="iso-sep">/</span>
        <span class="sub-b">{subB}</span>
      </span>
    </button>
  {/each}
</div>
```

**CSS** — vertically scrollable wrapper with flex-wrap entries:
```css
.isomorph-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  overflow-y: auto;
  max-height: 300px;
  padding: 0.5rem 0;
  align-content: flex-start;
}
.iso-entry {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid #555;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
  font-family: monospace;
  font-size: 0.8rem;
}
.iso-entry:hover { border-color: #888; }
.iso-entry.selected { border-color: #c678dd; background: rgba(198, 120, 221, 0.1); }
.iso-pattern { font-weight: 700; letter-spacing: 0.05em; }
.iso-positions { color: #abb2bf; font-size: 0.75rem; }
.iso-subs { display: flex; gap: 0.3rem; align-items: center; }
.sub-a { background-color: #c678dd; color: #1e1e1e; padding: 0 0.2rem; border-radius: 2px; }
.sub-b { background-color: #56b6c2; color: #1e1e1e; padding: 0 0.2rem; border-radius: 2px; }
.iso-sep { color: #abb2bf; }
```

**Empty state:** When `isomorphs.length === 0`, render a muted message: `"No isomorphs found."`.

---

## 5. `src/App.svelte`

**New imports:**
```ts
import IsomorphList from './components/IsomorphList.svelte';
import { findIsomorphs } from './lib/cipher/isomorph';
import type { Isomorph } from './lib/cipher/isomorph';
```

**New state:**
```ts
let showIsomorphs = $state(false);
let selectedIsomorph = $state<Isomorph | null>(null);
let isomorphs = $derived(findIsomorphs(result.ciphertext));

// Clear selection whenever the ciphertext changes
$effect(() => {
  result.ciphertext;       // reactive dependency
  selectedIsomorph = null;
});
```

**Highlight derived value:**
```ts
let ciphertextHighlight = $derived(
  selectedIsomorph
    ? { startA: selectedIsomorph.startA, startB: selectedIsomorph.startB, length: selectedIsomorph.pattern.length }
    : null
);
```

**Checkbox** — added to the `.controls` row alongside the existing "Show swap highlights" checkbox:
```svelte
<label class="highlight-toggle">
  <input type="checkbox" bind:checked={showIsomorphs} />
  Show isomorphs
</label>
```

**Updated CiphertextOutput call:**
```svelte
<CiphertextOutput ciphertext={result.ciphertext} highlight={ciphertextHighlight} />
```

**New IsomorphList below DeckView** (conditional on `showIsomorphs`):
```svelte
{#if showIsomorphs}
  <IsomorphList
    {isomorphs}
    ciphertext={result.ciphertext}
    selected={selectedIsomorph}
    onselect={(iso) => selectedIsomorph = iso}
  />
{/if}
```

---

## Test Plan

### `isomorph.test.ts` additions (~8 new tests)

| Describe | Test |
|---|---|
| `isomorphInterestingness` | All-period → 0 |
| | All-letter → 1 |
| | `'a..ba.ab'` → 0.625 |
| | `'a....a'` → 1/3 |
| `sortByInterestingness` | Returns new array (input unchanged) |
| | Higher density sorts first |
| | Equal density: longer pattern sorts first |
| | Equal density + length: lower startA sorts first |

### Existing tests

All 55 existing tests must continue to pass. The key concern is `App.test.ts` test 3 ("has a ciphertext output"), which queries by `data-testid="ciphertext-output"` — preserved on the new `<div>`.

---

## Design Notes

1. **`selectedIsomorph` identity** — compared by `(startA, startB, pattern)` triple rather than object reference, since `$derived` recreates the `isomorphs` array on every ciphertext change.

2. **`$effect` reset** — listing `result.ciphertext` as a dependency in the effect means any keystroke that changes the ciphertext clears the selection, preventing stale highlights.

3. **No overlap in highlights** — the two highlighted regions are guaranteed non-overlapping by the `findIsomorphs` non-overlap invariant (`startB >= startA + n`), so `hl-a` and `hl-b` classes never apply to the same span.

4. **`<textarea>` removal** — the `resize: vertical` user affordance is lost. The new `<div>` is sized by content. If the ciphertext is long it will wrap naturally. This is acceptable for the visualization use case.

5. **Performance** — `findIsomorphs` is O(L³) and runs on every keystroke via `$derived`. For typical interactive ciphertext lengths this is fine. If it becomes slow, memoization or debouncing can be added later.

6. **Checkbox placement** — `showIsomorphs` joins `showHighlights` in the `.controls` flex row. The row may need a slight width increase or wrapping at narrow viewports, but within the fixed 700px left panel it fits comfortably.
