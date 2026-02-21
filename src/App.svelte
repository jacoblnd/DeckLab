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

  function randomizeMapping() {
    const seed = Math.floor(Math.random() * 2 ** 32);
    mapping = generateCipherMapping(seed);
  }
</script>

<div class="app-layout">
  <main class="left-panel">
    <h1>DeckLab</h1>
    <div class="controls">
      <button onclick={randomizeMapping}>Randomize Cipher</button>
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
