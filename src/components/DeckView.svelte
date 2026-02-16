<script lang="ts">
  import Card from './Card.svelte';
  import type { Transformation } from '../lib/cipher/deck';

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

<div class="deck" data-testid="deck">
  {#each deck as letter, i}
    <Card {letter} swapPair={swapPairMap[i]} />
  {/each}
</div>

<style>
  .deck {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: center;
    padding: 1rem 0;
  }
</style>
