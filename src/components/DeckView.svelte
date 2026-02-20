<script lang="ts">
  import Card from './Card.svelte';
  import type { Transformation } from '../lib/cipher/deck';

  const SWAP_COLORS = ['#e06c75', '#e5c07b', '#61afef', '#98c379'];

  let { deck, lastTransformation }: { deck: string[]; lastTransformation: Transformation | null } = $props();

  // Map each deck position to its swap pair index (0–3), or null if not swapped.
  let swapPairMap = $derived.by(() => {
    const map: (number | null)[] = new Array(deck.length).fill(null);
    if (lastTransformation) {
      for (let pairIndex = 0; pairIndex < lastTransformation.length; pairIndex++) {
        const [a, b] = lastTransformation[pairIndex];
        map[a] = pairIndex;
        map[b] = pairIndex;
      }
    }
    return map;
  });
</script>

<div class="deck-section">
  <h2 class="deck-label">Current Deck State</h2>
  <div class="legend">
    {#each SWAP_COLORS as color, i}
      <span class="legend-item">
        <span class="swatch" style:background-color={color}></span>
        Swap {i + 1}
      </span>
    {/each}
  </div>
  <div class="deck" data-testid="deck">
    {#each deck as letter, i}
      <Card {letter} swapPair={swapPairMap[i]} />
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
