<script lang="ts">
  import PlaintextInput from './components/PlaintextInput.svelte';
  import CiphertextOutput from './components/CiphertextOutput.svelte';
  import DeckView from './components/DeckView.svelte';
  import { encipher } from './lib/cipher/deck';
  import { generateCipherMapping, generateSlidingWindowMapping } from './lib/cipher/generate';

  let mapping = $state(generateSlidingWindowMapping());
  let plaintext = $state('');
  let result = $derived(encipher(plaintext, mapping));

  function randomizeMapping() {
    const seed = Math.floor(Math.random() * 2 ** 32);
    mapping = generateCipherMapping(seed);
  }
</script>

<main>
  <h1>DeckLab</h1>
  <div class="controls">
    <button onclick={randomizeMapping}>Randomize Deck</button>
  </div>
  <PlaintextInput oninput={(text) => plaintext = text} />
  <CiphertextOutput ciphertext={result.ciphertext} />
  <DeckView deck={result.deck} lastTransformation={result.lastTransformation} />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem;
  }
  h1 {
    text-align: center;
    margin: 0;
  }
  .controls {
    display: flex;
    justify-content: center;
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
