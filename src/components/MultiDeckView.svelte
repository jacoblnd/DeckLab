<script lang="ts">
  import type { CipherStep, Transformation } from '../lib/cipher/deck';
  import { createInitialDeck } from '../lib/cipher/deck';

  const SWAP_COLORS = [
    '#e06c75', // swap 1  — red
    '#e5c07b', // swap 2  — yellow
    '#61afef', // swap 3  — blue
    '#98c379', // swap 4  — green
    '#c678dd', // swap 5  — purple
    '#56b6c2', // swap 6  — cyan
    '#d19a66', // swap 7  — orange
    '#e96eb0', // swap 8  — hot pink
    '#be5046', // swap 9  — dark red
    '#528bff', // swap 10 — bright blue
    '#7ec8a4', // swap 11 — mint
    '#f0a0a0', // swap 12 — light red
    '#a0c8f0', // swap 13 — light blue
  ];

  type CardTrace = { card: string; startCol: number; color: string };

  const initialDeck = createInitialDeck();

  let { steps, showHighlights, highlight = null, plaintextChars, cardTraces, traceWindow, ontoggle }: {
    steps: CipherStep[];
    showHighlights: boolean;
    highlight: { startA: number; startB: number; length: number } | null;
    plaintextChars: string;
    cardTraces: CardTrace[];
    traceWindow: number;
    ontoggle: (card: string, displayCol: number) => void;
  } = $props();

  // DOM refs for the container, each column div, and the first two cards in the
  // initial column (used to measure baseY and cardStep without CSS constant guesses).
  let containerEl       = $state<HTMLElement | null>(null);
  let colEls            = $state<(HTMLElement | null)[]>([]);
  let initialColCardEls = $state<(HTMLElement | null)[]>([]);

  // X center of each display column in container coordinates.
  // colPositions[0] = initial "—" column, colPositions[i+1] = steps[i].
  // Recomputes whenever any colEls[i] or containerEl changes (via bind:this).
  let colPositions = $derived.by(() => {
    if (!containerEl) return [];
    const containerRect = containerEl.getBoundingClientRect();
    return Array.from({ length: steps.length + 1 }, (_, i) => {
      const el = colEls[i];
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return rect.left + rect.width / 2 - containerRect.left;
    });
  });

  // Y geometry measured from the first two mini-cards in the initial column:
  //   baseY    — Y center of the card at deck position 0 (in container coordinates)
  //   cardStep — center-to-center distance between consecutive cards
  // This avoids CSS constant approximations (line-height, box-sizing, etc.).
  let cardGeometry = $derived.by(() => {
    const first  = initialColCardEls[0];
    const second = initialColCardEls[1];
    if (!first || !second || !containerEl) return null;
    const containerTop = containerEl.getBoundingClientRect().top;
    const firstRect    = first.getBoundingClientRect();
    const secondRect   = second.getBoundingClientRect();
    return {
      baseY:    firstRect.top  - containerTop + firstRect.height / 2,
      cardStep: secondRect.top - firstRect.top,
    };
  });

  function buildSwapPairMap(transformation: Transformation): (number | null)[] {
    const map: (number | null)[] = new Array(26).fill(null);
    for (let pairIndex = 0; pairIndex < transformation.swaps.length; pairIndex++) {
      const [a, b] = transformation.swaps[pairIndex];
      map[a] = pairIndex;
      map[b] = pairIndex;
    }
    return map;
  }

  // Deck state at display column col (0 = initial A-Z, j = steps[j-1].deck).
  function deckAtCol(col: number): string[] {
    return col === 0 ? initialDeck : steps[col - 1].deck;
  }

  // Y center (px, relative to container top) of the card at deckPos.
  // All columns share the same vertical card layout, so no column index is needed.
  function cardCenterY(deckPos: number): number | null {
    if (!cardGeometry) return null;
    return cardGeometry.baseY + deckPos * cardGeometry.cardStep;
  }

  // Returns the trace color if any active trace covers this card at this display column.
  function traceColorForCard(card: string, displayCol: number): string | null {
    for (const trace of cardTraces) {
      if (trace.card === card &&
          displayCol >= trace.startCol &&
          displayCol < trace.startCol + traceWindow) {
        return trace.color;
      }
    }
    return null;
  }

  // SVG polyline points string for a single trace (returns '' if fewer than 2 points).
  function tracePoints(trace: CardTrace): string {
    const endCol = Math.min(trace.startCol + traceWindow - 1, steps.length);
    const pts: string[] = [];
    for (let col = trace.startCol; col <= endCol; col++) {
      const deckPos = deckAtCol(col).indexOf(trace.card);
      const x = colPositions[col];
      if (x == null || deckPos === -1) continue;
      const y = cardCenterY(deckPos);
      if (y === null) continue;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.length >= 2 ? pts.join(' ') : '';
  }
</script>

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

<div class="multi-deck" data-testid="multi-deck" bind:this={containerEl}>
  <!-- Initial "—" column (displayCol = 0) -->
  <div class="column" bind:this={colEls[0]}>
    <div class="pt-label"></div>
    <div class="col-label">—</div>
    <div class="col-rotation"></div>
    {#each initialDeck as letter, i}
      {@const traceColor = traceColorForCard(letter, 0)}
      <div
        class="mini-card"
        bind:this={initialColCardEls[i]}
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

  {#if !highlight}
    {#each steps as step, i}
      {@render column(step, i)}
    {/each}
  {:else}
    {@const { startA, startB, length } = highlight}
    {#each steps.slice(0, startA) as step, i}
      {@render column(step, i)}
    {/each}
    <div class="group-bracket" style:outline="2px solid #c678dd">
      {#each steps.slice(startA, startA + length) as step, i}
        {@render column(step, startA + i)}
      {/each}
    </div>
    {#each steps.slice(startA + length, startB) as step, i}
      {@render column(step, startA + length + i)}
    {/each}
    <div class="group-bracket" style:outline="2px solid #56b6c2">
      {#each steps.slice(startB, startB + length) as step, i}
        {@render column(step, startB + i)}
      {/each}
    </div>
    {#each steps.slice(startB + length) as step, i}
      {@render column(step, startB + length + i)}
    {/each}
  {/if}

  <!-- SVG overlay: draws trace polylines above all columns when any trace is active. -->
  {#if cardTraces.length > 0}
    <svg class="trace-overlay" xmlns="http://www.w3.org/2000/svg">
      {#each cardTraces as trace}
        {@const pts = tracePoints(trace)}
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

<style>
  .multi-deck {
    display: flex;
    flex-direction: row;
    gap: 0.4rem;
    padding: 0.5rem;
    position: relative; /* required for the absolutely-positioned SVG overlay */
  }

  .trace-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
    z-index: 10;
  }

  .group-bracket {
    display: flex;
    flex-direction: row;
    gap: 0.4rem;
    border-radius: 3px;
  }

  .column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    flex-shrink: 0;
  }

  .pt-label {
    font-family: monospace;
    font-size: 0.85rem;
    min-height: 1.3rem;
    color: #abb2bf;
    margin-bottom: 0.1rem;
  }

  .col-label {
    font-family: monospace;
    font-weight: 700;
    font-size: 0.85rem;
    margin-bottom: 0.2rem;
    color: #abb2bf;
  }

  .col-rotation {
    font-family: monospace;
    font-size: 0.7rem;
    line-height: 1;
    min-height: 0.7rem;
    color: #abb2bf;
    margin-bottom: 0.1rem;
  }

  .mini-card {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    border: 1px solid #555;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: 600;
    font-family: monospace;
    user-select: none;
    cursor: pointer;
    position: relative; /* required for z-index on outlined traced cards */
  }

  .highlighted {
    color: #1e1e1e;
  }
</style>
