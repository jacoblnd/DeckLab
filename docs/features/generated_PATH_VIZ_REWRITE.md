# Card Path Visualization — Rewrite Plan (Overlay Approach)

## Overview

Add the ability to click any mini-card in `MultiDeckView` to trace that card's movement across deck states. Each active trace draws a colored polyline in a single SVG overlay that sits above the entire deck grid. Multiple cards can be traced simultaneously, each with its own color. Clicking a traced card again removes its trace.

**Key departure from the original plan:** The original plan inserted `ConnectorStrip.svelte` SVG elements as flex items between adjacent columns and toggled the `.multi-deck` gap to zero when traces were active. This plan uses a single absolutely-positioned SVG overlay that covers the full `.multi-deck` container, leaving the flex gap permanently at `0.4rem`.

---

## User Interactions

| Action | Effect |
|---|---|
| Click an untraced mini-card in column N | Starts a trace for that card letter from column N; assigns it the next available trace color |
| Click an already-traced mini-card (any column) | Removes the trace for that card letter |
| Click **Randomize Cipher** | Resets all traces |
| Click **Clear traces** (appears when any trace is active) | Resets all traces |

The trace extends **forward** from the clicked column for `TRACE_WINDOW = 10` columns (10 highlighted deck columns, 9 polyline segments between them).

Clicking on the initial `—` column starts a trace from display position 0 (before any cipher step).

---

## Data Model

### New type (defined in both `App.svelte` and `MultiDeckView.svelte`)

```ts
type CardTrace = {
  startCol: number; // display column index: 0 = initial "—" column, 1 = step 0, etc.
  color: string;
};
```

### Trace color palette (`TRACE_COLORS` — 8 colors)

```ts
const TRACE_COLORS = [
  '#ffffff', // white
  '#ff6b6b', // coral
  '#ffd93d', // bright yellow
  '#6bcb77', // bright green
  '#4d96ff', // sky blue
  '#ff922b', // orange
  '#cc5de8', // violet
  '#20c997', // teal
];
```

When adding a trace, assign the first color not currently used by any active trace (fall back to cycling if all 8 are in use).

---

## Overlay Geometry

The SVG overlay is `position: absolute; inset: 0; width: 100%; height: 100%`. Its coordinate space has origin at the top-left of the `.multi-deck` container. Column X positions are measured from the DOM; card Y positions within each column are computed from CSS constants applied to the column's measured top offset.

### DOM Measurement (X coordinates)

Bind `containerEl` to the `.multi-deck` div and `colEls[i]` to each column div. Derive `colPositions` from these refs:

```ts
let containerEl = $state<HTMLElement | null>(null);
let colEls = $state<(HTMLElement | null)[]>([]);

let colPositions = $derived.by(() => {
  if (!containerEl) return [];
  const containerRect = containerEl.getBoundingClientRect();
  return Array.from({ length: steps.length + 1 }, (_, i) => {
    const el = colEls[i];
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      top: rect.top - containerRect.top,
    };
  });
});
```

`colPositions` recomputes whenever any `colEls[i]` changes (mount/unmount via `bind:this`) or `containerEl` changes.

> **Note:** Positions are not automatically updated on window resize. A `ResizeObserver` on `containerEl` could force recomputation on resize — this is deferred to a future enhancement.

### CSS Constants (Y coordinates within each column)

Card centers within a column are computed using the column's measured `top` offset plus CSS-constant-derived offsets:

```ts
const REM = 16; // assumed browser default root font size in px

// Mini-card dimensions (from .mini-card CSS)
const CARD_H    = 1.6  * REM; // 25.6 px
const CARD_GAP  = 0.15 * REM; // 2.4 px — flex gap between mini-cards
const CARD_STEP = CARD_H + CARD_GAP; // 28 px — center-to-center distance

// Height of the label area above the first mini-card in a column (flex gap is 0.15rem between each row):
//   pt-label:     min-height 1.3rem + margin-bottom 0.1rem + gap 0.15rem = 1.55rem
//   col-label:    ~0.85rem line-ht  + margin-bottom 0.2rem + gap 0.15rem = ~1.2rem
//   col-rotation: min-height 0.7rem + margin-bottom 0.1rem + gap 0.15rem = 0.95rem
const HEADER_H = (1.55 + 1.2 + 0.95) * REM; // ≈ 59.2 px

function cardCenterY(colIdx: number, deckPos: number): number | null {
  const colPos = colPositions[colIdx];
  if (!colPos) return null;
  return colPos.top + HEADER_H + deckPos * CARD_STEP + CARD_H / 2;
}
```

### Deck at a display column

```ts
// col 0 → initial A–Z deck; col j → steps[j-1].deck (deck after step j-1)
function deckAtCol(col: number): string[] {
  return col === 0 ? initialDeck : steps[col - 1].deck;
}
```

### Polyline points for a trace

```ts
function tracePoints(card: string, trace: CardTrace): string {
  const endCol = Math.min(trace.startCol + TRACE_WINDOW - 1, steps.length);
  const pts: string[] = [];
  for (let col = trace.startCol; col <= endCol; col++) {
    const deckPos = deckAtCol(col).indexOf(card);
    const colPos = colPositions[col];
    if (!colPos || deckPos === -1) continue;
    const y = cardCenterY(col, deckPos);
    if (y === null) continue;
    pts.push(`${colPos.x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}
```

---

## Isomorph Mode Interaction

When an isomorph is selected (`highlight !== null`), the `group-bracket` wrapper divs alter the DOM layout, making column X positions shift unpredictably relative to the overlay's coordinate assumptions. Therefore:

- **SVG trace lines are suppressed** when `highlight` is non-null (the `<svg>` block simply isn't rendered).
- **Card outline highlights remain active** in all modes — they are pure per-card CSS (`outline`), unaffected by bracket wrappers.

---

## Files

| Action | File |
|---|---|
| **Modify** | `src/App.svelte` |
| **Modify** | `src/components/MultiDeckView.svelte` |

No new files. `ConnectorStrip.svelte` is not created.

---

## 1. `App.svelte` Changes

### New type and constants

```ts
type CardTrace = { startCol: number; color: string };

const TRACE_WINDOW = 10;

const TRACE_COLORS = [
  '#ffffff', // white
  '#ff6b6b', // coral
  '#ffd93d', // bright yellow
  '#6bcb77', // bright green
  '#4d96ff', // sky blue
  '#ff922b', // orange
  '#cc5de8', // violet
  '#20c997', // teal
];
```

### New state

```ts
let cardTraces = $state<Map<string, CardTrace>>(new Map());
```

### `toggleCardTrace`

```ts
function toggleCardTrace(card: string, displayCol: number) {
  const next = new Map(cardTraces);
  if (next.has(card)) {
    next.delete(card);
  } else {
    const usedColors = new Set([...next.values()].map(t => t.color));
    const color =
      TRACE_COLORS.find(c => !usedColors.has(c)) ??
      TRACE_COLORS[next.size % TRACE_COLORS.length];
    next.set(card, { startCol: displayCol, color });
  }
  cardTraces = next;
}
```

### `clearAllTraces`

```ts
function clearAllTraces() {
  cardTraces = new Map();
}
```

### Updated `randomizeMapping` — reset traces

```ts
function randomizeMapping() {
  const seed = Math.floor(Math.random() * 2 ** 32);
  mapping = generateCipherMapping(seed, { swapCount, rotationMax, rotationConstant });
  cardTraces = new Map();
}
```

### "Clear traces" button — in `.controls`

```svelte
{#if cardTraces.size > 0}
  <button onclick={clearAllTraces}>Clear traces</button>
{/if}
```

### Updated `MultiDeckView` usage

```svelte
<MultiDeckView
  steps={result.steps}
  {showHighlights}
  highlight={ciphertextHighlight}
  plaintextChars={filteredPlaintext}
  {cardTraces}
  traceWindow={TRACE_WINDOW}
  ontoggle={toggleCardTrace}
/>
```

---

## 2. `MultiDeckView.svelte` Changes

### New type and constants (top of `<script>`)

```ts
type CardTrace = { startCol: number; color: string };

const REM       = 16;
const CARD_H    = 1.6  * REM;
const CARD_GAP  = 0.15 * REM;
const CARD_STEP = CARD_H + CARD_GAP;
const HEADER_H  = (1.55 + 1.2 + 0.95) * REM; // ≈ 59.2 px
```

### New props

```ts
let { steps, showHighlights, highlight = null, plaintextChars, cardTraces, traceWindow, ontoggle }: {
  steps: CipherStep[];
  showHighlights: boolean;
  highlight: { startA: number; startB: number; length: number } | null;
  plaintextChars: string;
  cardTraces: Map<string, CardTrace>;
  traceWindow: number;
  ontoggle: (card: string, displayCol: number) => void;
} = $props();
```

### New state (DOM refs)

```ts
let containerEl = $state<HTMLElement | null>(null);
let colEls      = $state<(HTMLElement | null)[]>([]);
```

### New derived — column positions

```ts
let colPositions = $derived.by(() => {
  if (!containerEl) return [];
  const containerRect = containerEl.getBoundingClientRect();
  return Array.from({ length: steps.length + 1 }, (_, i) => {
    const el = colEls[i];
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x:   rect.left + rect.width / 2 - containerRect.left,
      top: rect.top  - containerRect.top,
    };
  });
});
```

### Helpers

```ts
function deckAtCol(col: number): string[] {
  return col === 0 ? initialDeck : steps[col - 1].deck;
}

function cardCenterY(colIdx: number, deckPos: number): number | null {
  const colPos = colPositions[colIdx];
  if (!colPos) return null;
  return colPos.top + HEADER_H + deckPos * CARD_STEP + CARD_H / 2;
}

// Returns CSS color string if this card is traced in this display column, else null.
function traceColorForCard(card: string, displayCol: number): string | null {
  const trace = cardTraces.get(card);
  if (!trace) return null;
  return (displayCol >= trace.startCol && displayCol < trace.startCol + traceWindow)
    ? trace.color
    : null;
}

// SVG polyline points string for a single trace, or '' if fewer than 2 points.
function tracePoints(card: string, trace: CardTrace): string {
  const endCol = Math.min(trace.startCol + traceWindow - 1, steps.length);
  const pts: string[] = [];
  for (let col = trace.startCol; col <= endCol; col++) {
    const deckPos = deckAtCol(col).indexOf(card);
    const colPos  = colPositions[col];
    if (!colPos || deckPos === -1) continue;
    const y = cardCenterY(col, deckPos);
    if (y === null) continue;
    pts.push(`${colPos.x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.length >= 2 ? pts.join(' ') : '';
}
```

### Updated `{#snippet column(step, globalIdx)}`

```svelte
{#snippet column(step: CipherStep, globalIdx: number)}
  {@const swapPairMap = buildSwapPairMap(step.transformation)}
  {@const displayCol = globalIdx + 1}
  <div class="column" bind:this={colEls[displayCol]}>
    <div class="pt-label">{plaintextChars[globalIdx]}</div>
    <div class="col-label">{step.ciphertextChar}</div>
    <div class="col-rotation">{step.transformation.rotation > 0 ? `↺${step.transformation.rotation}` : ''}</div>
    {#each step.deck as letter, i}
      {@const pair = showHighlights ? swapPairMap[i] : null}
      {@const traceColor = traceColorForCard(letter, displayCol)}
      <div
        class="mini-card"
        class:highlighted={pair != null}
        style:background-color={pair != null ? SWAP_COLORS[pair] : undefined}
        style:outline={traceColor ? `2px solid ${traceColor}` : undefined}
        style:z-index={traceColor ? 1 : undefined}
        role="button"
        tabindex="0"
        onclick={() => ontoggle(letter, displayCol)}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') ontoggle(letter, displayCol); }}
      >
        {letter}
      </div>
    {/each}
  </div>
{/snippet}
```

### Updated initial `—` column

```svelte
<div class="column" bind:this={colEls[0]}>
  <div class="pt-label"></div>
  <div class="col-label">—</div>
  <div class="col-rotation"></div>
  {#each initialDeck as letter}
    {@const traceColor = traceColorForCard(letter, 0)}
    <div
      class="mini-card"
      style:outline={traceColor ? `2px solid ${traceColor}` : undefined}
      style:z-index={traceColor ? 1 : undefined}
      role="button"
      tabindex="0"
      onclick={() => ontoggle(letter, 0)}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') ontoggle(letter, 0); }}
    >
      {letter}
    </div>
  {/each}
</div>
```

### `.multi-deck` wrapper with overlay SVG

```svelte
<div class="multi-deck" data-testid="multi-deck" bind:this={containerEl}>
  <!-- initial column + step columns rendered here (unchanged layout) -->
  ...

  {#if cardTraces.size > 0 && !highlight}
    <svg class="trace-overlay" xmlns="http://www.w3.org/2000/svg">
      {#each [...cardTraces.entries()] as [card, trace]}
        {@const pts = tracePoints(card, trace)}
        {#if pts}
          <polyline
            points={pts}
            stroke={trace.color}
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
            opacity="0.85"
          />
        {/if}
      {/each}
    </svg>
  {/if}
</div>
```

The SVG is a child of `.multi-deck` with `position: absolute`. It does not participate in flex layout and does not affect column spacing.

---

## 3. CSS Changes in `MultiDeckView.svelte`

```css
/* Required for the absolutely-positioned SVG overlay */
.multi-deck {
  display: flex;
  flex-direction: row;
  gap: 0.4rem;          /* unchanged — never toggled */
  padding: 0.5rem;
  position: relative;   /* NEW */
}

/* Trace overlay SVG — covers the entire container */
.trace-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 10;          /* renders above all column content */
}

/* Mini-cards are now always clickable */
.mini-card {
  /* existing properties... */
  cursor: pointer;
  position: relative;   /* NEW — required for z-index on outlined cards */
}
```

The traced mini-card's `z-index: 1` (set inline via `style:z-index`) ensures its `outline` renders above neighboring cards' backgrounds. The overlay SVG's `z-index: 10` ensures trace polylines render above all cards, including outlined ones.

---

## 4. Notable Design Decisions

| Decision | Rationale |
|---|---|
| Single overlay SVG, not per-connector SVG elements | Columns maintain a constant `gap: 0.4rem` with no structural changes when traces are active |
| DOM measurement for X, CSS constants for Y | X positions depend on actual layout (column widths, gap, padding) so DOM is more robust; Y positions are fully determined by the known card CSS constants |
| `$derived.by` reads `colEls[i]` — triggers via `bind:this` | When Svelte mounts/unmounts a column div, `bind:this` writes to the `$state` proxy, marking `colPositions` stale and queuing recomputation |
| Polyline per trace, not individual line segments | One `<polyline>` per trace expresses the full path cleanly; avoids per-gap iteration that the ConnectorStrip approach required |
| SVG lines suppressed when isomorph highlight is active | `group-bracket` wrappers shift column X offsets unpredictably; card outline highlights (pure CSS) remain active in all modes |
| `z-index: 10` on `.trace-overlay` | Ensures polylines render on top of the card grid, including outlined traced cards; `pointer-events: none` keeps clicks passing through to the cards |
| `cardTraces` as `Map` copied on every mutation | Svelte 5 `$state` Map mutations are reactive via Proxy, but copying ensures clean immutable updates |
| `TRACE_WINDOW = 10` hard-coded | Keeps the plan simple; can be exposed as a UI control later |
| ResizeObserver deferred | Column positions are recomputed on mount and on structural changes (step count changes); window resize is rare for this tool and can be handled in a follow-up |

---

## 5. Test Considerations

No changes to cipher logic — existing 83 tests are unaffected. The new state management in `App.svelte` (toggle, clear, reset on randomize) is suitable for additional component smoke tests, but is not strictly required.
