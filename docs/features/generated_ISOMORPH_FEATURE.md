# Isomorph Feature — Implementation Plan

## Concept Summary

The **isomorph pattern** of a string encodes which positions share the same character.
Characters that appear more than once are labelled `a`, `b`, `c`, … in order of first
occurrence. Characters that appear exactly once are labelled `.`.

```
'ahwoanao'  →  a..ba.ab
 ^  ^  ^^       a = 'a' (repeats at positions 0,4,6)
   ^   ^         b = 'o' (repeats at positions 3,7)
    ^              . = 'h','w','n' (each appears once)
```

Two substrings are **isomorphic** when they produce the same pattern:

```
'ahwoanao'  →  a..ba.ab
'uvonuyun'  →  a..ba.ab   ← same pattern, therefore isomorphic
```

---

## Scope of "Calculate All Isomorphs"

For a ciphertext of length `L`:

- Consider every window length `n` from **3** to **floor(L / 2)**.
- For each `n`, examine every start position `i` in `[0, L − n]`.
- Compute the isomorph pattern of `ciphertext[i .. i+n)`.
- Skip **trivial windows** where all characters are distinct (pattern contains no letters,
  only `.`).
- Two windows at start positions `startA < startB` are a valid isomorphic pair if:
  1. They produce the same pattern, **and**
  2. Their index ranges **do not overlap**: `startB >= startA + n`.

---

## Output Type

```ts
export type Isomorph = {
  pattern: string;   // e.g. 'a..ba.ab'  (length = window length)
  startA: number;    // start index of first substring in ciphertext
  startB: number;    // start index of second substring (startB >= startA + pattern.length)
};
```

`findIsomorphs(ciphertext)` returns `Isomorph[]`.

---

## Files

| File | Change |
|---|---|
| `src/lib/cipher/isomorph.ts` | New — exports `isomorphPattern` and `findIsomorphs` |
| `src/lib/cipher/isomorph.test.ts` | New — unit tests |

No other files change. No UI modifications.

---

## Algorithm

### `isomorphPattern(s: string): string`

```
1. Count frequency of every character in s.
2. Walk s left to right:
   - If freq[char] === 1  → append '.'
   - Else if char not yet assigned a letter → assign next letter ('a','b','c',…), append it
   - Else → append the already-assigned letter
3. Return the result string.
```

Letter assignment counter starts at 0 (`String.fromCharCode(97 + counter)`).

### `findIsomorphs(ciphertext: string): Isomorph[]`

```
result = []
L = ciphertext.length
maxLen = floor(L / 2)

for n = 3 to maxLen:
  groups: Map<string, number[]> = {}       // pattern → [startPositions in order]

  for i = 0 to L − n:
    pattern = isomorphPattern(ciphertext[i .. i+n))
    if pattern contains no letter (all '.')  → skip (trivial)
    groups[pattern].push(i)

  for each (pattern, positions) in groups:
    for each pair (pi, pj) with pi < pj:
      startA = positions[pi]
      startB = positions[pj]
      if startB >= startA + n:             // non-overlap guard
        result.push({ pattern, startA, startB })

return result
```

`positions` is naturally in ascending order because `i` is iterated 0 → L−n.
Therefore `startA < startB` is guaranteed; only the non-overlap check is needed.

---

## Test Plan (`isomorph.test.ts`)

### `isomorphPattern`

| Test | Input | Expected |
|---|---|---|
| All unique chars | `'abcde'` | `'.....'` |
| One repeated char | `'abac'` | `'a.a.'` |
| Two repeat groups | `'ahwoanao'` | `'a..ba.ab'` |
| Second string from doc example | `'uvonuyun'` | `'a..ba.ab'` |
| All same char | `'aaaa'` | `'aaaa'` |
| Letters assigned in first-occurrence order | `'bab'` | `'aba'` (not `'bab'`) |

### `findIsomorphs`

| Test | Description |
|---|---|
| Empty / short ciphertext | `''`, `'ab'`, `'abc'` → `[]` (length < 6 means maxLen < 3, no valid n) |
| Ciphertext too short for any n | length 5 → maxLen = 2 < 3 → `[]` |
| No repeated chars in any window | Returns `[]` (all trivial) |
| Known isomorphic pair | `'ahwoanao'` at offset 0 and `'uvonuyun'` at offset 8 in a combined ciphertext produces `{ pattern:'a..ba.ab', startA:0, startB:8 }` |
| Overlap exclusion | Two windows at positions 0 and 4 with n=8 overlap (4 < 0+8=8) → excluded |
| Non-overlap included | Two windows at positions 0 and 8 with n=8 → 8 >= 0+8 → included |
| Only counts non-trivial | A ciphertext of all distinct characters like `'abcdefgh'` → `[]` |
| Result contains all valid pairs | For a ciphertext with three isomorphic non-overlapping windows, all three pairs are in the result |

Approximately **14 tests** across the two describe blocks.

---

## Edge Cases

- **Ciphertext length < 6**: `maxLen = floor(L/2) < 3`, so the outer loop body never executes → returns `[]`.
- **All characters identical** (e.g. `'aaaa…'`): every window's pattern is `'aaa…'` — non-trivial, so pairs are produced.
- **Pattern letter overflow**: a window of length 26 could have up to 13 distinct repeating characters, needing letters `a`–`m`. A window longer than 52 chars can't have more than 26 distinct chars, so never exceeds `z`.
- **startB === startA + n**: exactly touching (not overlapping) — included, since `>=` is used.

---

## Design Notes

- `isomorphPattern` and `findIsomorphs` are pure functions with no side effects.
- The implied window length of any `Isomorph` result is `pattern.length`.
- The function is not optimised for very long ciphertexts (O(L³) in the worst case) but is appropriate for the expected interactive use case.
- The output array may have duplicate patterns across different `n` values; callers can group by `pattern` if needed.
- No ordering guarantee on the result array — pairs are emitted in the order `n` is iterated, then positions within each `n`.
