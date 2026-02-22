<script lang="ts">
  import Card from './Card.svelte';
  import type { Transformation } from '../lib/cipher/deck';

  const SWAP_COLORS = [
    '#e06c75', // swap 1  — red
    '#e5c07b', // swap 2  — yellow
    '#61afef', // swap 3  — blue
    '#98c379', // swap 4  — green
    '#c678dd', // swap 5  — purple
    '#56b6c2', // swap 6  — cyan
    '#d19a66', // swap 7  — orange
    '#e06c75', // swap 8  — red (recycled, visually distinct by position)
    '#be5046', // swap 9  — dark red
    '#528bff', // swap 10 — bright blue
    '#7ec8a4', // swap 11 — mint
    '#f0a0a0', // swap 12 — light red
    '#a0c8f0', // swap 13 — light blue
  ];

  let { deck, lastTransformation, showHighlights }: {
    deck: string[];
    lastTransformation: Transformation | null;
    showHighlights: boolean;
  } = $props();

  // Map each deck position to its swap pair index, or null if not swapped.
  let swapPairMap = $derived.by(() => {
    const map: (number | null)[] = new Array(deck.length).fill(null);
    if (lastTransformation) {
      for (let pairIndex = 0; pairIndex < lastTransformation.swaps.length; pairIndex++) {
        const [a, b] = lastTransformation.swaps[pairIndex];
        map[a] = pairIndex;
        map[b] = pairIndex;
      }
    }
    return map;
  });
</script>

<div class="deck-section">
  <h2 class="deck-label">
    Current Deck State
    {#if lastTransformation && lastTransformation.rotation > 0}
      <span class="rotation-label">↺{lastTransformation.rotation}</span>
    {/if}
  </h2>
  {#if showHighlights && lastTransformation}
    <div class="legend">
      {#each lastTransformation.swaps as _, i}
        <span class="legend-item">
          <span class="swatch" style:background-color={SWAP_COLORS[i]}></span>
          Swap {i + 1}
        </span>
      {/each}
      {#if lastTransformation.rotation > 0}
        <span class="legend-item">↺{lastTransformation.rotation}</span>
      {/if}
    </div>
  {/if}
  <div class="deck" data-testid="deck">
    {#each deck as letter, i}
      <Card {letter} swapPair={showHighlights ? swapPairMap[i] : null} />
    {/each}
  </div>
</div>

<style>
  .deck-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .deck-label {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #abb2bf;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .rotation-label {
    font-size: 0.85rem;
    font-family: monospace;
    color: #abb2bf;
  }

  .legend {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: #abb2bf;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .swatch {
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 2px;
  }

  .deck {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: center;
    padding: 0.5rem 0;
  }
</style>
