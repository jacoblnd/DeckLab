# Card Path Visualization — Implementation Plan

## Overview

Add the ability to click any mini-card in `MultiDeckView` to trace that card's movement across deck states. Each trace draws a colored diagonal line in a thin SVG connector strip inserted between adjacent deck columns. Multiple cards can be traced simultaneously, each with its own color. Clicking a traced card again removes its trace. Generating a new cipher or pressing "Clear traces" resets all traces.

---

## User Interactions

| Action | Effect |
|---|---|
| Click an untraced mini-card in column N | Starts a trace for that card letter from column N; assigns it the next available trace color |
| Click an already-traced mini-card (any column) | Removes the trace for that card letter |
| Click **Randomize Cipher** | Resets all traces (new mapping makes old traces meaningless) |
| Click **Clear traces** (appears in left-panel controls when any trace is active) | Resets all traces |

The trace extends **forward** from the clicked column for `TRACE_WINDOW = 10` columns. This means 10 highlighted deck columns and 9 connector line segments between them.

Clicking on the initial `—` column starts a trace from display position 0 (before any cipher step).

---

## Data Model

### New type (defined locally in `App.svelte`)

```ts
type CardTrace = {
  startCol: number;  // display column index: 0 = initial "—" column, 1 = step 0, etc.
  color: string;
};
```

### Trace color palette (`TRACE_COLORS` — 8 colors)

Chosen to be visually distinct from the swap-highlight and isomorph colors:

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

When adding a trace, find the first color not currently used by any active trace (cycle if all 8 are in use).

---

## Geometry Constants

The connector SVG must align its line endpoints with the vertical centers of the mini-card cells in the neighboring columns. All values are derived from the existing CSS — **no DOM measurement required**.

```ts
// src/components/MultiDeckView.svelte (top of <script>)

const REM = 16; // assumed browser default root font size in px

// Mini-card dimensions (from .mini-card CSS)
const CARD_H  = 1.6 * REM;   // 25.6 px
const CARD_GAP = 0.15 * REM;  // 2.4 px — flex gap between cards
const CARD_STEP = CARD_H + CARD_GAP; // 28 px — center-to-center distance

// Header section height above the first mini-card in a column.
// Each section: content height + margin-bottom + flex gap (0.15rem).
//   pt-label:    min-height 1.3rem  + margin-bottom 0.1rem  + gap 0.15rem = 1.55rem
//   col-label:   ~0.85rem line-ht   + margin-bottom 0.2rem  + gap 0.15rem = ~1.2rem
//   col-rotation: min-height 0.7rem + margin-bottom 0.1rem  + gap 0.15rem = 0.95rem
const HEADER_H = (1.55 + 1.2 + 0.95) * REM; // ≈ 59.2 px

// Total column height (used as SVG height)
const COL_H = HEADER_H + 26 * CARD_H + 25 * CARD_GAP; // ≈ 786 px

// Y-coordinate (in px) of the center of card at deck index i
function cardCenterY(i: number): number {
  return HEADER_H + i * CARD_STEP + CARD_H / 2;
}
```

The connector SVG has:
- `width`: `CONNECTOR_W = 2.5 * REM` (40 px)
- `height`: `COL_H` px

---

## Files

| Action | File |
|---|---|
| **Create** | `src/components/ConnectorStrip.svelte` |
| **Modify** | `src/App.svelte` |
| **Modify** | `src/components/MultiDeckView.svelte` |

---

## 1. `ConnectorStrip.svelte` (new)

Renders a single SVG strip between two adjacent deck columns. Draws one diagonal line per active trace that passes through this connector.

### Props

```ts
let {
  leftDeck,   // string[] — 26-card deck on the left side of this gap
  rightDeck,  // string[] — 26-card deck on the right side
  traces,     // { card: string; color: string }[] — traces active through this connector
}: {
  leftDeck: string[];
  rightDeck: string[];
  traces: { card: string; color: string }[];
} = $props();
```

### Template

```svelte
<svg
  class="connector"
  width={CONNECTOR_W}
  height={COL_H}
  xmlns="http://www.w3.org/2000/svg"
>
  {#each traces as { card, color }}
    {@const leftPos  = leftDeck.indexOf(card)}
    {@const rightPos = rightDeck.indexOf(card)}
    {#if leftPos !== -1 && rightPos !== -1}
      <line
        x1="0"       y1={cardCenterY(leftPos)}
        x2={CONNECTOR_W} y2={cardCenterY(rightPos)}
        stroke={color}
        stroke-width="1.5"
        stroke-linecap="round"
        opacity="0.8"
      />
    {/if}
  {/each}
</svg>
```

### Styles

```css
.connector {
  flex-shrink: 0;
  display: block;
}
```

The SVG is a plain flex item in the `.multi-deck` row — no absolute positioning needed.

---

## 2. `MultiDeckView.svelte` changes

### New props

```ts
let {
  steps,
  showHighlights,
  highlight = null,
  plaintextChars,
  cardTraces,        // Map<string, CardTrace> from App
  traceWindow,       // number — how many columns forward a trace extends
  ontoggle,          // (card: string, displayCol: number) => void
}: {
  ...
  cardTraces: Map<string, CardTrace>;
  traceWindow: number;
  ontoggle: (card: string, displayCol: number) => void;
} = $props();
```

### Display column index convention

The initial `—` column is `displayCol = 0`. Step `i` is `displayCol = i + 1`. All trace state uses this display-column index.

### Helper: active traces for a connector

The connector between display columns `j` and `j + 1` shows a trace if its window includes both columns:

```ts
function tracesForConnector(displayColLeft: number): { card: string; color: string }[] {
  const result: { card: string; color: string }[] = [];
  for (const [card, trace] of cardTraces) {
    const inWindow =
      displayColLeft >= trace.startCol &&
      displayColLeft < trace.startCol + traceWindow - 1;
    if (inWindow) result.push({ card, color: trace.color });
  }
  return result;
}
```

### Helper: is a card cell highlighted

A card cell in column `displayCol` is highlighted (colored outline) if a trace for that card is active and this column is within the trace window:

```ts
function traceForCard(card: string, displayCol: number): string | null {
  const trace = cardTraces.get(card);
  if (!trace) return null;
  if (displayCol >= trace.startCol && displayCol < trace.startCol + traceWindow) {
    return trace.color;
  }
  return null;
}
```

### Updated `{#snippet column(step, globalIdx)}`

`globalIdx` maps to `displayCol = globalIdx + 1`. Mini-cards gain:
1. `onclick` → `ontoggle(letter, displayCol)`
2. `cursor: pointer`
3. A colored `outline` when the card is being traced in this column

```svelte
{#snippet column(step: CipherStep, globalIdx: number)}
  {@const swapPairMap = buildSwapPairMap(step.transformation)}
  {@const displayCol = globalIdx + 1}
  <div class="column">
    <div class="pt-label">{plaintextChars[globalIdx]}</div>
    <div class="col-label">{step.ciphertextChar}</div>
    <div class="col-rotation">{step.transformation.rotation > 0 ? `↺${step.transformation.rotation}` : ''}</div>
    {#each step.deck as letter, i}
      {@const pair = showHighlights ? swapPairMap[i] : null}
      {@const traceColor = traceForCard(letter, displayCol)}
      <div
        class="mini-card"
        class:highlighted={pair != null}
        style:background-color={pair != null ? SWAP_COLORS[pair] : undefined}
        style:outline={traceColor ? `2px solid ${traceColor}` : undefined}
        style:z-index={traceColor ? 1 : undefined}
        onclick={() => ontoggle(letter, displayCol)}
      >
        {letter}
      </div>
    {/each}
  </div>
{/snippet}
```

The initial `—` column cards are also made clickable (displayCol = 0):

```svelte
<div class="column">
  <div class="pt-label"></div>
  <div class="col-label">—</div>
  <div class="col-rotation"></div>
  {#each initialDeck as letter}
    {@const traceColor = traceForCard(letter, 0)}
    <div
      class="mini-card"
      style:outline={traceColor ? `2px solid ${traceColor}` : undefined}
      style:z-index={traceColor ? 1 : undefined}
      onclick={() => ontoggle(letter, 0)}
    >
      {letter}
    </div>
  {/each}
</div>
```

### Connector rendering strategy

Connectors are only rendered when `cardTraces.size > 0`. When any trace is active, the `.multi-deck` flex gap drops to `0` (the connector SVGs provide all horizontal spacing).

```css
.multi-deck {
  gap: var(--deck-gap, 0.4rem);
}
```

In the template, set `--deck-gap` dynamically:

```svelte
<div
  class="multi-deck"
  data-testid="multi-deck"
  style:--deck-gap={cardTraces.size > 0 ? '0' : '0.4rem'}
>
```

### Rendering paths

There are now two top-level modes: **no isomorph highlight** and **isomorph highlight active**. Connectors are only rendered in the no-highlight path. When isomorph highlighting is active, the layout uses `group-bracket` wrappers which are incompatible with interleaved connector elements, so connectors are suppressed.

```
No highlight, no traces:
  [initial] [s0] [s1] [s2] ...                          ← unchanged

No highlight, traces active:
  [initial] [conn] [s0] [conn] [s1] [conn] [s2] ...

Isomorph highlight active (traces suppressed in display):
  [initial] [bracket-A…] [flat cols] [bracket-B…] [flat cols]
  ← unchanged from current behavior
```

#### No-highlight + traces rendering

```svelte
{#if !highlight}
  <!-- initial column -->
  <InitialColumn {initialDeck} {traceForCard} {ontoggle} />

  {#each steps as step, i}
    {#if cardTraces.size > 0}
      <ConnectorStrip
        leftDeck={i === 0 ? initialDeck : steps[i - 1].deck}
        rightDeck={step.deck}
        traces={tracesForConnector(i)}
      />
    {/if}
    {@render column(step, i)}
  {/each}
{:else}
  <!-- existing isomorph bracket rendering — unchanged -->
  ...
{/if}
```

> Note: `InitialColumn` is an extraction of the existing inline initial column HTML into a snippet/component to avoid duplication across the traces and no-traces paths. Or it stays inline and both paths render it directly — acceptable since it's small.

---

## 3. `App.svelte` changes

### New state

```ts
const TRACE_WINDOW = 10;

const TRACE_COLORS = [
  '#ffffff',
  '#ff6b6b',
  '#ffd93d',
  '#6bcb77',
  '#4d96ff',
  '#ff922b',
  '#cc5de8',
  '#20c997',
];

let cardTraces = $state<Map<string, CardTrace>>(new Map());
```

### `toggleCardTrace` function

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

### `clearAllTraces` function

```ts
function clearAllTraces() {
  cardTraces = new Map();
}
```

### `randomizeMapping` — reset traces

```ts
function randomizeMapping() {
  const seed = Math.floor(Math.random() * 2 ** 32);
  mapping = generateCipherMapping(seed, { swapCount, rotationMax, rotationConstant });
  cardTraces = new Map();
}
```

### "Clear traces" button

Shown only when at least one trace is active. Placed at the end of the `.controls` row:

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

## 4. CSS additions to `MultiDeckView.svelte`

```css
/* Cursor on all mini-cards (they are now always clickable) */
.mini-card {
  cursor: pointer;
  position: relative; /* needed for z-index to take effect */
}

/* Outline on traced cards must not be clipped */
.mini-card:focus-visible {
  outline-offset: 1px;
}
```

---

## 5. Notable Design Decisions

| Decision | Rationale |
|---|---|
| Traces suppressed when isomorph highlight is active | `group-bracket` wrappers are incompatible with interleaved connector elements; the two features serve different analytical purposes and are unlikely to be used together |
| No DOM measurement — geometry from CSS constants | Simpler and avoids timing issues; breaks only if the root font size is non-16px (uncommon for this tool) |
| `cardTraces` as `Map` copied on every mutation | Svelte 5 `$state` Map mutations are reactive via Proxy, but copying ensures clean immutable updates and avoids subtle reactivity edge cases |
| `displayCol = 0` for the initial `—` column | Allows traces to start from the very beginning; `displayCol = i + 1` for step `i` keeps the mapping simple |
| Connector gap strategy: `--deck-gap` CSS variable | Switches from `0.4rem` to `0` when any trace is active; the ConnectorStrip width provides equivalent spacing; avoids duplicating layout logic |
| `TRACE_WINDOW = 10` hard-coded | Keeps the plan simple; can be exposed as a configurable prop or UI control later if desired |
| Trace outline uses CSS `outline` (not `border`) | Matches the existing isomorph bracket approach; `outline` doesn't affect layout box sizing |

---

## 6. Test Considerations

No changes to cipher logic — existing 83 tests are unaffected. The new state management in `App.svelte` (toggle, clear, reset on randomize) is suitable for additional component smoke tests if desired, but is not strictly required.
