# Initial Animations — Deck Card Movement

## Context

Cards in the Current Deck State view jump instantly to their new positions whenever a transformation is applied. The goal is to animate each card sliding from its old position to its new position. Animations are optional (off by default), triggered by any plaintext change or cipher mapping change, interruptible mid-flight, and capped at ~500ms.

---

## Chosen Approach: Svelte `animate:flip`

Svelte ships a built-in FLIP (First, Last, Invert, Play) animation directive via `svelte/animate`. When a keyed `{#each}` block has its items reordered, Svelte:

1. Records each element's bounding rect *before* the DOM update (First)
2. Applies the DOM update — cards are placed at their new positions (Last)
3. Computes the positional delta and applies it as an inverted CSS `transform` (Invert)
4. Transitions the transform to zero (Play) — visually: cards slide from old position to new

**Why this fits the requirements:**
- **Net position only**: FLIP animates wherever a card ends up, regardless of whether rotation or swaps caused the move. Exactly what was requested.
- **Any change triggers animation**: The `deck` array is recomputed (via `$derived`) on every plaintext change and every cipher mapping change. Each recomputation triggers a new FLIP cycle.
- **Interruptible by design**: FLIP measures the element's *current* rendered position (including mid-animation CSS transform offset) as the new "First". A mid-animation interruption starts a new animation from wherever the card currently is on screen.
- **Duration is a single parameter**: `animate:flip={{ duration: N }}`. Setting `N = 0` makes animation instant (used when the toggle is off).

---

## Design Decisions

| Question | Answer |
|---|---|
| What to animate | Net positional change only (not rotation phase + swap phase separately) |
| Trigger condition | Any plaintext change or mapping change |
| Animate on Randomize | Yes |
| On by default | No |
| Max duration | 500ms (well under the 1s ceiling; feels snappy but legible) |
| Easing | Svelte's default for `flip` (`cubicOut`) — no change needed |

---

## Required Changes

### 1. `src/App.svelte`

**Add state:**
```ts
let showAnimations = $state(false);
```

**Add checkbox to `.controls`** (alongside the existing "Show swap highlights" and "Show isomorphs" toggles):
```svelte
<label class="highlight-toggle">
  <input type="checkbox" bind:checked={showAnimations} />
  Animate deck
</label>
```

**Pass prop to DeckView:**
```svelte
<DeckView deck={result.deck} lastTransformation={result.lastTransformation} {showHighlights} {showAnimations} />
```

No other changes to `App.svelte`.

---

### 2. `src/components/DeckView.svelte`

**Import `flip`:**
```ts
import { flip } from 'svelte/animate';
```

**Extend props:**
```ts
let { deck, lastTransformation, showHighlights, showAnimations }: {
  deck: string[];
  lastTransformation: Transformation | null;
  showHighlights: boolean;
  showAnimations: boolean;
} = $props();
```

**Key the `{#each}` by letter and wrap each card in an animated container:**

Before:
```svelte
<div class="deck" data-testid="deck">
  {#each deck as letter, i}
    <Card {letter} swapPair={showHighlights ? swapPairMap[i] : null} />
  {/each}
</div>
```

After:
```svelte
<div class="deck" data-testid="deck">
  {#each deck as letter, i (letter)}
    <div class="card-slot" animate:flip={{ duration: showAnimations ? 500 : 0 }}>
      <Card {letter} swapPair={showHighlights ? swapPairMap[i] : null} />
    </div>
  {/each}
</div>
```

**Add `.card-slot` style** (transparent wrapper — sizes itself to the Card inside, participates as a flex item in `.deck`):
```css
.card-slot {
  display: inline-flex;
}
```

**Why `(letter)` as key:** The deck is always a permutation of A–Z, so each letter is unique. Keying by letter lets Svelte track which DOM element belongs to which card across reorders — this is what activates FLIP.

**Why the wrapper div:** Svelte's `animate:` directive can only be applied to HTML elements, not to component tags. The `<div class="card-slot">` is a thin flex item wrapper that participates in the `.deck` flex layout; the `<Card>` inside sizes it naturally to `2rem × 2.8rem`.

**Why `duration: 0` when disabled:** A zero-duration flip is visually instant (no animation), keeping a single code path for both states. No need for duplicate `{#each}` blocks.

---

## How Interruption Works

When the user types while a card is mid-slide:

1. `plaintext` changes → `result` re-derives → `deck` is a new array.
2. Svelte's reconciler runs the keyed `{#each}` for the new `deck` order.
3. For each `card-slot`, FLIP measures its *current* `getBoundingClientRect()` — which, during an in-progress CSS transform animation, reflects the element's visually-translated position.
4. FLIP computes the delta from that current screen position to the new target position.
5. A fresh CSS transition starts immediately from where the card is right now.

This means cards reverse or redirect mid-air and continue smoothly to their true destination — no jump, no snap.

---

## Files Changed

| File | Change |
|---|---|
| `src/App.svelte` | Add `showAnimations` state, "Animate deck" checkbox, pass prop to `DeckView` |
| `src/components/DeckView.svelte` | Import `flip`; extend props; key `{#each}` by letter; wrap `<Card>` in animated `<div class="card-slot">`; add `.card-slot` CSS |

No new files. No changes to `Card.svelte`, `MultiDeckView.svelte`, or any logic/test files.

---

## Not Animated (Out of Scope)

- `MultiDeckView` — the per-step deck history columns are not animated in this initial implementation.
- The legend / rotation label in `DeckView` — static.
- `CiphertextOutput`, `IsomorphList`, `DeckView` label — static.

---

## Test Impact

All 83 existing tests continue to pass:

- `App.test.ts` — the new checkbox is off by default; the rendered deck output is identical to the current behavior when `showAnimations = false`.
- `deck.test.ts` / `isomorph.test.ts` — pure logic, unaffected.
- jsdom (the test environment) does not execute CSS animations, so no new animation-specific tests are needed.
