# Feature Tweaks — Implementation Plan

## Feature 1: Isomorph Occurrence Counts

### What "count" means
The *count* for an isomorph is the number of distinct positions in the ciphertext where that pattern appears. For example, if pattern `a.b.a` is found at positions 0, 5, and 10, every pair emitted for that pattern (`(0,5)`, `(0,10)`, `(5,10)`) carries `count = 3`.

### Changes

#### 1. `src/lib/cipher/isomorph.ts`

**Type:** Add `count: number` to `Isomorph`.

```ts
export type Isomorph = {
  pattern: string;
  startA: number;
  startB: number;
  count: number;   // NEW — number of ciphertext positions with this pattern
};
```

**`findIsomorphs`:** After the `groups` map is built for each window length, use `positions.length` as the count and include it in each emitted `Isomorph`:

```ts
for (const [pattern, positions] of groups) {
  const count = positions.length;   // NEW
  for (let pi = 0; pi < positions.length; pi++) {
    const startA = positions[pi];
    for (let pj = pi + 1; pj < positions.length; pj++) {
      const startB = positions[pj];
      if (startB >= startA + n) {
        result.push({ pattern, startA, startB, count });   // count added
      }
    }
  }
}
```

**`sortByInterestingness`:** Update sort comparator to use count as the primary key, with the existing order as tiebreakers:

```
count desc → interestingness desc → pattern length desc → startA asc
```

#### 2. `src/components/IsomorphList.svelte`

Show the count in each isomorph box. A compact badge like `×3` works well displayed alongside the pattern, using the existing muted gray color (`#abb2bf`) so it's informative without being visually dominant.

Example layout within each `.iso-entry`:
```
a..ba.ab  ×2
@0 · @8
AHWO / UVON
```

#### 3. `src/lib/cipher/isomorph.test.ts`

Several existing tests will break because:
- All `Isomorph` object literals are missing the new required `count` field (TypeScript error)
- `toContainEqual` uses structural equality, so result objects with `count` won't match old test objects without it

**`findIsomorphs` tests — updates required:**

| Test | Count to add |
|---|---|
| "finds a known isomorphic pair from the doc example" | `count: 2` (pattern appears at positions 0 and 8) |
| "includes non-overlapping window pairs" (`ababab`, `a.a`) | `count: 4` (pattern `a.a` appears at positions 0, 1, 2, 3) |
| "returns all valid pairs when three isomorphic windows" | `count: 3` on all three `aa.` entries |

Tests using `filter`+`toHaveLength` (overlapping, touching, leading-period) require no changes since they don't compare `Isomorph` fields directly.

**`sortByInterestingness` tests — updates required:**

All four tests create `Isomorph` literals without `count`. Add `count: 2` to each (same count for all isomorphs being compared, so count doesn't affect the sort outcome and the existing sort behavior remains the thing under test).

**New sort test for count:**

Add a test demonstrating that a lower-interestingness isomorph with a higher count beats a higher-interestingness isomorph with a lower count.

---

## Feature 2: Initial Deck State in MultiDeckView

### Problem
`MultiDeckView` iterates over `result.steps`, where each step holds the deck state *after* enciphering one character. When plaintext has been entered, the initial A–Z deck (before any transformation) is never shown.

### Change

**`src/components/MultiDeckView.svelte` only — no other files need to change.**

- Import `createInitialDeck` from `../lib/cipher/deck`
- Before the `{#each steps}` loop, render a hardcoded initial column with:
  - Label: `—` (no ciphertext character produced)
  - Cards: the A–Z deck from `createInitialDeck()`
  - No transformation → no swap highlights

`createInitialDeck()` is pure and deterministic (always A–Z), so it can safely be called at module level or inline in the template.

Since `App.svelte` passes `steps={result.steps}` unchanged, no changes are needed to `App.svelte`, `deck.ts`, or any test files for this feature.

---

## Files Changed Summary

| File | Change |
|---|---|
| `src/lib/cipher/isomorph.ts` | Add `count` to type; populate in `findIsomorphs`; update sort comparator |
| `src/lib/cipher/isomorph.test.ts` | Add `count` to all Isomorph literals; add count sort test |
| `src/components/IsomorphList.svelte` | Display `×N` count badge in each entry |
| `src/components/MultiDeckView.svelte` | Prepend initial A–Z deck column with label `—` |

---

## Open Questions / Clarifications Not Needed

- The label for the initial column (`—`) is a reasonable default — update if preferred.
- The count badge style can be adjusted after implementation.
- No changes to `encipher` return type or `CipherStep` type are required.
