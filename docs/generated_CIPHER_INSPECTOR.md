# Cipher Inspector Modal

## Context
Users want to understand the inner mechanics of the currently-loaded cipher — specifically, what transformation (swaps + rotation) is assigned to each of the 26 PT letters. This information exists in the `CipherMapping` but is not currently exposed in the UI. A "Cipher Inspector" modal with two tabs (Transformation Table + Position Heatmap) satisfies this need without cluttering the main layout.

---

## Approach

### New file: `src/components/CipherInspector.svelte`
A modal overlay with two tabs. Receives `mapping: CipherMapping` and `onclose: () => void` as props. Manages `activeTab` internally.

**Structural layout:**
```
<svelte:window onkeydown> (Escape → close)
<div class="backdrop" onclick={onclose}>       ← fixed, full-screen, semi-transparent
  <div class="modal" onclick|stopPropagation>  ← bordered panel, scroll if needed
    header: "Cipher Inspector"  +  [×] close button
    tabs:   [Table]  [Heatmap]
    content: (active tab)
  </div>
</div>
```

**SWAP_COLORS array** — duplicates the existing 13-entry array from DeckView/MultiDeckView (consistent with the established pattern).

---

### Tab 1: Transformation Table

One row per PT letter (A–Z):

| PT | ↺   | Swaps                                    |
|----|-----|------------------------------------------|
| A  | ↺1  | `[0↔5]` `[3↔12]` `[8↔20]` `[2↔7]`      |
| B  | —   | `[0↔1]` `[4↔15]` `[9↔22]` `[3↔11]`     |

- **PT column**: monospace bold letter
- **↺ column**: `↺N` if `rotation > 0`, else `—`
- **Swaps column**: one chip per swap pair, colored `SWAP_COLORS[i]`, text `a↔b` (position numbers), dark text on colored background — matching `legend-swatch` style from DeckView

---

### Tab 2: Position Heatmap

Grid: rows = PT letters A–Z, columns = deck positions 0–25 (labeled A–Z, since position 0 = initial card A, etc.), plus a final ↺ column.

| PT | A | B | C | … | Z | ↺  |
|----|---|---|---|---|---|----|
| A  | ■ |   | ■ | … |   | ↺1 |
| B  |   | ■ |   | … | ■ | —  |

- Each cell is colored `SWAP_COLORS[pairIndex]` if that position is involved in any swap for that letter
- Empty cells are unstyled
- ↺ column: `↺N` if rotation > 0, else dim `—`

Helper function:
```ts
function getPairIndex(t: Transformation, pos: number): number | null {
  for (let i = 0; i < t.swaps.length; i++) {
    if (t.swaps[i][0] === pos || t.swaps[i][1] === pos) return i;
  }
  return null;
}
```

Column headers use `LETTERS` (`'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')`). The table wrapper uses `overflow-x: auto` since 28 columns can exceed viewport width.

---

### Modified file: `src/App.svelte`

1. Import `CipherInspector`
2. Add state: `let showCipherInspector = $state(false);`
3. Add button in `.controls`: `<button onclick={() => showCipherInspector = true}>Inspect Cipher</button>`
4. Mount modal **outside** `.app-layout` (overlays full viewport):
   ```svelte
   {#if showCipherInspector}
     <CipherInspector {mapping} onclose={() => showCipherInspector = false} />
   {/if}
   ```

---

## Critical files
- **New:** `src/components/CipherInspector.svelte`
- **Modified:** `src/App.svelte`
- **Types from:** `src/lib/cipher/deck.ts` (`CipherMapping`, `Transformation`)
- **Style reference:** `src/components/DeckView.svelte`, `src/components/MultiDeckView.svelte`
