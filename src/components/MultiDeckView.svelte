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

  const initialDeck = createInitialDeck();

  let { steps, showHighlights }: { steps: CipherStep[]; showHighlights: boolean } = $props();

  function buildSwapPairMap(transformation: Transformation): (number | null)[] {
    const map: (number | null)[] = new Array(26).fill(null);
    for (let pairIndex = 0; pairIndex < transformation.swaps.length; pairIndex++) {
      const [a, b] = transformation.swaps[pairIndex];
      map[a] = pairIndex;
      map[b] = pairIndex;
    }
    return map;
  }
</script>

<div class="multi-deck" data-testid="multi-deck">
  <div class="column">
    <div class="col-label">—</div>
    <div class="col-rotation"></div>
    {#each initialDeck as letter}
      <div class="mini-card">{letter}</div>
    {/each}
  </div>
  {#each steps as step}
    {@const swapPairMap = buildSwapPairMap(step.transformation)}
    <div class="column">
      <div class="col-label">{step.ciphertextChar}</div>
      <div class="col-rotation">{step.transformation.rotation > 0 ? `↺${step.transformation.rotation}` : ''}</div>
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
  }

  .highlighted {
    color: #1e1e1e;
  }
</style>
