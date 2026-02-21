<script lang="ts">
  import type { CipherStep, Transformation } from '../lib/cipher/deck';
  import { createInitialDeck } from '../lib/cipher/deck';

  const SWAP_COLORS = ['#e06c75', '#e5c07b', '#61afef', '#98c379'];
  const initialDeck = createInitialDeck();

  let { steps, showHighlights }: { steps: CipherStep[]; showHighlights: boolean } = $props();

  function buildSwapPairMap(transformation: Transformation): (number | null)[] {
    const map: (number | null)[] = new Array(26).fill(null);
    for (let pairIndex = 0; pairIndex < transformation.length; pairIndex++) {
      const [a, b] = transformation[pairIndex];
      map[a] = pairIndex;
      map[b] = pairIndex;
    }
    return map;
  }
</script>

<div class="multi-deck" data-testid="multi-deck">
  <div class="column">
    <div class="col-label">—</div>
    {#each initialDeck as letter}
      <div class="mini-card">{letter}</div>
    {/each}
  </div>
  {#each steps as step}
    {@const swapPairMap = buildSwapPairMap(step.transformation)}
    <div class="column">
      <div class="col-label">{step.ciphertextChar}</div>
      {#each step.deck as letter, i}
        {@const pair = showHighlights ? swapPairMap[i] : null}
        <div
          class="mini-card"
          class:highlighted={pair != null}
          style:background-color={pair != null ? SWAP_COLORS[pair] : undefined}
        >
          {letter}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .multi-deck {
    display: flex;
    flex-direction: row;
    gap: 0.4rem;
    padding: 0.5rem;
  }

  .column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    flex-shrink: 0;
  }

  .col-label {
    font-family: monospace;
    font-weight: 700;
    font-size: 0.85rem;
    margin-bottom: 0.2rem;
    color: #abb2bf;
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
  }

  .highlighted {
    color: #1e1e1e;
  }
</style>
