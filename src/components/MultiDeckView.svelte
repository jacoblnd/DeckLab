<script lang="ts">
  import type { CipherStep, Transformation } from '../lib/cipher/deck';
  import { createInitialDeck } from '../lib/cipher/deck';
  import ConnectorStrip from './ConnectorStrip.svelte';

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

  type CardTrace = { startCol: number; color: string };

  const initialDeck = createInitialDeck();

  let { steps, showHighlights, highlight = null, plaintextChars, cardTraces, traceWindow, ontoggle }: {
    steps: CipherStep[];
    showHighlights: boolean;
    highlight: { startA: number; startB: number; length: number } | null;
    plaintextChars: string;
    cardTraces: Map<string, CardTrace>;
    traceWindow: number;
    ontoggle: (card: string, displayCol: number) => void;
  } = $props();

  function buildSwapPairMap(transformation: Transformation): (number | null)[] {
    const map: (number | null)[] = new Array(26).fill(null);
    for (let pairIndex = 0; pairIndex < transformation.swaps.length; pairIndex++) {
      const [a, b] = transformation.swaps[pairIndex];
      map[a] = pairIndex;
      map[b] = pairIndex;
    }
    return map;
  }

  // Returns the trace color if this card is being traced in this display column,
  // or null if not. displayCol: 0 = initial "—" column, i+1 = step i.
  function traceColorForCard(card: string, displayCol: number): string | null {
    const trace = cardTraces.get(card);
    if (!trace) return null;
    if (displayCol >= trace.startCol && displayCol < trace.startCol + traceWindow) {
      return trace.color;
    }
    return null;
  }

  // Returns the set of traces active through the connector between displayCol j
  // and displayCol j+1. Both columns must be within the trace window.
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

  let hasTraces = $derived(cardTraces.size > 0);
</script>

{#snippet column(step: CipherStep, globalIdx: number)}
  {@const swapPairMap = buildSwapPairMap(step.transformation)}
  {@const displayCol = globalIdx + 1}
  <div class="column">
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

<div
  class="multi-deck"
  data-testid="multi-deck"
  style:gap={hasTraces ? '0' : '0.4rem'}
>
  <!-- Initial "—" column (displayCol = 0) -->
  <div class="column">
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

  {#if !highlight}
    {#each steps as step, i}
      {#if hasTraces}
        <ConnectorStrip
          leftDeck={i === 0 ? initialDeck : steps[i - 1].deck}
          rightDeck={step.deck}
          traces={tracesForConnector(i)}
        />
      {/if}
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
</div>

<style>
  .multi-deck {
    display: flex;
    flex-direction: row;
    gap: 0.4rem;
    padding: 0.5rem;
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
    line-height: 1;
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
    position: relative;
  }

  .highlighted {
    color: #1e1e1e;
  }
</style>
