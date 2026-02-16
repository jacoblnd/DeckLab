<script lang="ts">
  import PlaintextInput from './components/PlaintextInput.svelte';
  import CiphertextOutput from './components/CiphertextOutput.svelte';
  import DeckView from './components/DeckView.svelte';
  import { encipher } from './lib/cipher/deck';
  import { generateCipherMapping } from './lib/cipher/generate';

  const seed = Math.floor(Math.random() * 2 ** 32);
  const mapping = generateCipherMapping(seed);

  let plaintext = $state('');
  let result = $derived(encipher(plaintext, mapping));
</script>

<main>
  <h1>DeckLab</h1>
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
</style>
