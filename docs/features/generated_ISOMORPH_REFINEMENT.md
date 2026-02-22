# Isomorph Refinement — Implementation Plan

## Overview

Three improvements to the isomorph feature:

1. **Plaintext highlighting display** — a new read-only div between the textarea and ciphertext output that shows the filtered plaintext with the same position-based highlighting as the ciphertext output.
2. **MultiDeckView column highlighting** — when an isomorph is selected, the corresponding columns in the multi-deck view get individual outlines in the A/B highlight colors.
3. **Isomorph sort order** — swap the primary and secondary sort keys so interestingness takes priority over occurrence count.

---

## Design Decisions

| Question | Answer |
|---|---|
| Plaintext display content | Filtered plaintext only (A–Z chars, uppercased) — positions align 1:1 with ciphertext |
| MultiDeckView highlight style | Individual `outline` per column; purple for A group, cyan for B group |
| Fixed height for text displays | 6rem with `overflow-y: auto` |

---

## Feature 1: Plaintext Highlighting Display

### Why filtered plaintext

`encipher()` skips non-alpha characters, so `ciphertext[i]` corresponds to the _i_-th alpha character in the plaintext, not raw plaintext index `i`. Using the filtered plaintext (`'Hello World' → 'HELLOWORLD'`) makes isomorph positions map 1:1 between the two displays without any index-mapping machinery. The raw input remains visible in the textarea above.

### New file: `src/components/PlaintextOutput.svelte`

Mirrors `CiphertextOutput` structure and styling:

**Props:**
```ts
{ filteredPlaintext: string; highlight: { startA: number; startB: number; length: number } | null }
```

**Template:** Same per-character `<span>` loop as `CiphertextOutput`, with identical `inA`/`inB` highlight logic. No section label (the textarea immediately above is already labeled "Plaintext").

**Styling:**
- `height: 6rem; overflow-y: auto` (fixed height, scrollable)
- Same `font-family: monospace`, `font-size: 1rem`, `word-break: break-all`, `line-height: 1.6`, `background-color: rgba(128,128,128,0.1)`, `border-radius: 4px`, `padding: 0.5rem`
- Placeholder text: `Filtered plaintext appears here...` (same italic gray style as ciphertext placeholder)

### Modified file: `src/components/CiphertextOutput.svelte`

Change the `.ciphertext-chars` rule from `min-height: 3rem` to `height: 6rem; overflow-y: auto` so both displays are the same constant size.

### Modified file: `src/App.svelte`

**Add derived filtered plaintext:**
```ts
let filteredPlaintext = $derived(
  [...plaintext]
    .filter(c => { const u = c.toUpperCase(); return u >= 'A' && u <= 'Z'; })
    .map(c => c.toUpperCase())
    .join('')
);
```

**Import and render `PlaintextOutput`** between `PlaintextInput` and `CiphertextOutput`:
```svelte
import PlaintextOutput from './components/PlaintextOutput.svelte';

<!-- in template, between PlaintextInput and CiphertextOutput: -->
<PlaintextOutput {filteredPlaintext} highlight={ciphertextHighlight} />
```

No new state is needed — `ciphertextHighlight` already carries `{ startA, startB, length }` and is derived from `selectedIsomorph`.

---

## Feature 2: MultiDeckView Column Highlighting

Each step in `steps` corresponds to ciphertext position `i`. When `selectedIsomorph` has `startA = 3` and `length = 5`, columns at indices 3–7 in `steps` should get a purple `outline`. Columns at indices `startB` through `startB + length - 1` get a cyan `outline`. The initial A–Z (`—`) column is never highlighted.

### Modified file: `src/components/MultiDeckView.svelte`

**Extend props:**
```ts
let { steps, showHighlights, highlight }: {
  steps: CipherStep[];
  showHighlights: boolean;
  highlight: { startA: number; startB: number; length: number } | null;
} = $props();
```

**Apply per-column outline in the `{#each steps}` block:**
```svelte
{#each steps as step, i}
  {@const inA = highlight != null && i >= highlight.startA && i < highlight.startA + highlight.length}
  {@const inB = highlight != null && i >= highlight.startB && i < highlight.startB + highlight.length}
  <div
    class="column"
    style:outline={inA ? '2px solid #c678dd' : inB ? '2px solid #56b6c2' : undefined}
  >
    ...
  </div>
{/each}
```

`outline` is used (not `border`) because it does not affect layout — column widths and gaps remain unchanged.

### Modified file: `src/App.svelte`

Pass `highlight` to `MultiDeckView`:
```svelte
<MultiDeckView steps={result.steps} {showHighlights} highlight={ciphertextHighlight} />
```

---

## Feature 3: Isomorph Sort Order

### Current sort in `sortByInterestingness` (isomorph.ts:80–93)

```
1. Descending pair count  ← primary
2. Descending interestingness
3. Descending pattern length
4. Ascending startA
```

### New sort order

```
1. Descending interestingness  ← primary (swapped)
2. Descending pair count       ← secondary (swapped)
3. Descending pattern length
4. Ascending startA
```

### Modified file: `src/lib/cipher/isomorph.ts`

Swap the first two comparisons in the `sort` comparator and update the docstring:

```ts
// Before:
const dc = (patternCounts.get(b.pattern) ?? 0) - (patternCounts.get(a.pattern) ?? 0);
if (dc !== 0) return dc;
const di = isomorphInterestingness(b.pattern) - isomorphInterestingness(a.pattern);
if (di !== 0) return di;

// After:
const di = isomorphInterestingness(b.pattern) - isomorphInterestingness(a.pattern);
if (di !== 0) return di;
const dc = (patternCounts.get(b.pattern) ?? 0) - (patternCounts.get(a.pattern) ?? 0);
if (dc !== 0) return dc;
```

### Modified file: `src/lib/cipher/isomorph.test.ts`

The 5 existing `sortByInterestingness` tests may include cases that rely on count-first ordering. Any test where two isomorphs have different counts but equal interestingness will still pass (count breaks the tie correctly). Only tests where isomorphs have different interestingness _and_ different counts in the opposing order will need updating. Review and fix those tests to reflect the new primary sort key.

---

## Files Changed Summary

| File | Change |
|---|---|
| **New**: `src/components/PlaintextOutput.svelte` | Filtered plaintext display; 6rem fixed height; same highlight logic as `CiphertextOutput` |
| `src/App.svelte` | Derive `filteredPlaintext`; import + render `PlaintextOutput`; pass `highlight` to `MultiDeckView` |
| `src/components/CiphertextOutput.svelte` | Change `.ciphertext-chars` to `height: 6rem; overflow-y: auto` |
| `src/components/MultiDeckView.svelte` | Accept `highlight` prop; apply `style:outline` to highlighted step columns |
| `src/lib/cipher/isomorph.ts` | Swap interestingness and count sort keys; update docstring |
| `src/lib/cipher/isomorph.test.ts` | Update `sortByInterestingness` tests affected by new sort order |

---

## Layout After Changes

```
┌─────────────────────── left-panel ─────────────────────────┐
│  h1: DeckLab                                                │
│  controls: [buttons + checkboxes]                           │
│  PlaintextInput  (textarea, resize:vertical, min-h 3rem)    │
│  PlaintextOutput (6rem fixed, overflow-y:auto)  ← NEW       │
│  CiphertextOutput (6rem fixed, overflow-y:auto) ← resized   │
│  DeckView                                                   │
│  IsomorphList (if showIsomorphs)                            │
└─────────────────────────────────────────────────────────────┘
```
