<script lang="ts">
  import PlaintextInput from './components/PlaintextInput.svelte';
  import CiphertextOutput from './components/CiphertextOutput.svelte';
  import DeckView from './components/DeckView.svelte';
  import MultiDeckView from './components/MultiDeckView.svelte';
  import IsomorphList from './components/IsomorphList.svelte';
  import { encipher } from './lib/cipher/deck';
  import { generateCipherMapping, generateSlidingWindowMapping } from './lib/cipher/generate';
  import { findIsomorphs } from './lib/cipher/isomorph';
  import type { Isomorph } from './lib/cipher/isomorph';

  let mapping = $state(generateSlidingWindowMapping());
  let plaintext = $state('');
  let showHighlights = $state(true);
  let showIsomorphs = $state(false);
  let selectedIsomorph = $state<Isomorph | null>(null);

  let swapCount = $state(4);
  let rotationMax = $state(0);
  let rotationConstant = $state(false);

  let result = $derived(encipher(plaintext, mapping));
  let isomorphs = $derived(findIsomorphs(result.ciphertext));
  let ciphertextHighlight = $derived(
    selectedIsomorph
      ? { startA: selectedIsomorph.startA, startB: selectedIsomorph.startB, length: selectedIsomorph.pattern.length }
      : null
  );

  // Clear selection whenever the ciphertext changes to prevent stale highlights
  $effect(() => {
    result.ciphertext;
    selectedIsomorph = null;
  });

  // When rotationMax drops to 0, swapCount=1 would be invalid — clamp to 2
  $effect(() => {
    if (rotationMax === 0 && swapCount < 2) {
      swapCount = 2;
    }
  });

  function randomizeMapping() {
    const seed = Math.floor(Math.random() * 2 ** 32);
    mapping = generateCipherMapping(seed, { swapCount, rotationMax, rotationConstant });
  }
</script>

<div class="app-layout">
  <main class="left-panel">
    <h1>DeckLab</h1>
    <div class="controls">
      <button onclick={randomizeMapping}>Randomize Cipher</button>
      <label class="control-label">
        Swaps:
        <input type="number" class="num-input" min={rotationMax === 0 ? 2 : 1} max="13" bind:value={swapCount} />
      </label>
      <label class="control-label">
        Rotations:
        <input type="number" class="num-input" min="0" max="25" bind:value={rotationMax} />
      </label>
      <label class="control-label" class:disabled={rotationMax === 0}>
        <input type="checkbox" bind:checked={rotationConstant} disabled={rotationMax === 0} />
        Constant Rotations
      </label>
      <label class="highlight-toggle">
        <input type="checkbox" bind:checked={showHighlights} />
        Show swap highlights
      </label>
      <label class="highlight-toggle">
        <input type="checkbox" bind:checked={showIsomorphs} />
        Show isomorphs
      </label>
    </div>
    <PlaintextInput oninput={(text) => plaintext = text} />
    <CiphertextOutput ciphertext={result.ciphertext} highlight={ciphertextHighlight} />
    <DeckView deck={result.deck} lastTransformation={result.lastTransformation} {showHighlights} />
    {#if showIsomorphs}
      <IsomorphList
        {isomorphs}
        ciphertext={result.ciphertext}
        selected={selectedIsomorph}
        onselect={(iso) => selectedIsomorph = iso}
      />
    {/if}
  </main>
  <div class="right-panel">
    <MultiDeckView steps={result.steps} {showHighlights} />
  </div>
</div>

<style>
  .app-layout {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    min-height: 100vh;
  }

  .left-panel {
    flex-shrink: 0;
    width: 700px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .right-panel {
    flex: 1;
    overflow-x: auto;
    padding: 2rem 1rem;
    min-width: 0;
    align-self: stretch;
  }

  h1 {
    text-align: center;
    margin: 0;
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .highlight-toggle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.9rem;
    cursor: pointer;
    user-select: none;
  }

  .control-label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.9rem;
    user-select: none;
  }

  .control-label.disabled {
    opacity: 0.4;
  }

  .num-input {
    width: 3rem;
    padding: 0.25rem 0.3rem;
    font-size: 0.9rem;
    border-radius: 4px;
    border: 1px solid #555;
    background: transparent;
    color: inherit;
    text-align: center;
  }

  .num-input:focus {
    outline: none;
    border-color: #888;
  }

  button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    border-radius: 6px;
    border: 1px solid #555;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  button:hover {
    border-color: #888;
  }
</style>
