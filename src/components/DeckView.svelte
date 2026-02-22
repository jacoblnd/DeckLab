<script lang="ts">
  import Card from './Card.svelte';
  import { flip } from 'svelte/animate';
  import type { Transformation } from '../lib/cipher/deck';

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

  let { deck, lastTransformation, showHighlights, showAnimations }: {
    deck: string[];
    lastTransformation: Transformation | null;
    showHighlights: boolean;
    showAnimations: boolean;
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
      <span class="legend-label">Swaps:</span>
      {#each lastTransformation.swaps as _, i}
        <span class="legend-swatch" style:background-color={SWAP_COLORS[i]}>{i + 1}</span>
      {/each}
      {#if lastTransformation.rotation > 0}
        <span class="legend-rotation">↺{lastTransformation.rotation}</span>
      {/if}
    </div>
  {/if}
  <div class="deck" data-testid="deck">
    {#each deck as letter, i (letter)}
      <div class="card-slot" animate:flip={{ duration: showAnimations ? 500 : 0 }}>
        <Card {letter} swapPair={showHighlights ? swapPairMap[i] : null} />
      </div>
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
    gap: 0.3rem;
    align-items: center;
  }

  .legend-label {
    font-size: 0.8rem;
    color: #abb2bf;
    margin-right: 0.2rem;
  }

  .legend-swatch {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 2px;
    font-size: 0.65rem;
    font-weight: 700;
    font-family: monospace;
    color: #1e1e1e;
  }

  .legend-rotation {
    font-size: 0.8rem;
    font-family: monospace;
    color: #abb2bf;
    margin-left: 0.2rem;
  }

  .deck {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: center;
    padding: 0.5rem 0;
  }

  .card-slot {
    display: inline-flex;
  }
</style>
