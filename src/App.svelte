<script lang="ts">
  import PlaintextInput from './components/PlaintextInput.svelte';
  import CiphertextOutput from './components/CiphertextOutput.svelte';
  import DeckView from './components/DeckView.svelte';
  import { createInitialDeck, encipherStep } from './lib/cipher/deck';

  let deck = $state(createInitialDeck());
  let ciphertext = $state('');

  function handleInput(char: string) {
    const result = encipherStep(deck, char);
    deck = result.newDeck;
    ciphertext += result.ciphertextChar;
  }
</script>

<main>
  <h1>DeckLab</h1>
  <PlaintextInput oninput={handleInput} />
  <CiphertextOutput {ciphertext} />
  <DeckView {deck} />
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
