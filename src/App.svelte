<script lang="ts">
  import PlaintextInput from './components/PlaintextInput.svelte';
  import CiphertextOutput from './components/CiphertextOutput.svelte';
  import DeckView from './components/DeckView.svelte';
  import MultiDeckView from './components/MultiDeckView.svelte';
  import IsomorphList from './components/IsomorphList.svelte';
  import PlaintextOutput from './components/PlaintextOutput.svelte';
  import CipherInspector from './components/CipherInspector.svelte';
  import TutorialModal from './components/TutorialModal.svelte';
  import { encipher } from './lib/cipher/deck';
  import { generateCipherMapping, generateSlidingWindowMapping } from './lib/cipher/generate';
  import { findIsomorphs } from './lib/cipher/isomorph';
  import type { Isomorph } from './lib/cipher/isomorph';

  type DisplayToken = { char: string; highlight: 'A' | 'B' | null };
  type CardTrace = { card: string; startCol: number; color: string };

  const PASSTHROUGH = new Set([' ', '\n', '.']);

  const TRACE_WINDOW = 10;

  const TRACE_COLORS = [
    '#ffffff', // white
    '#ff6b6b', // coral
    '#ffd93d', // bright yellow
    '#6bcb77', // bright green
    '#4d96ff', // sky blue
    '#ff922b', // orange
    '#cc5de8', // violet
    '#20c997', // teal
  ];

  let mapping = $state(generateSlidingWindowMapping());
  let cardTraces = $state<CardTrace[]>([]);
  let plaintext = $state('');
  let showHighlights = $state(true);
  let showIsomorphs = $state(false);
  let showCipherInspector = $state(false);
  let showTutorial = $state(false);
  let showAnimations = $state(false);
  let selectedIsomorph = $state<Isomorph | null>(null);

  let swapCount = $state(4);
  let rotationMax = $state(1);
  let rotationConstant = $state(true);

  // Pure A–Z string: drives encipher, isomorphs, and MultiDeckView alignment
  let filteredPlaintext = $derived(
    [...plaintext]
      .filter(c => { const u = c.toUpperCase(); return u >= 'A' && u <= 'Z'; })
      .map(c => c.toUpperCase())
      .join('')
  );

  let result = $derived(encipher(plaintext, mapping));
  let isomorphs = $derived(findIsomorphs(result.ciphertext));
  let ciphertextHighlight = $derived(
    selectedIsomorph
      ? { startA: selectedIsomorph.startA, startB: selectedIsomorph.startB, length: selectedIsomorph.pattern.length }
      : null
  );

  // Token arrays for display: passthrough chars (space/newline/period) are preserved
  // in both strips at their original positions; highlight is pre-computed per token.
  let displayTokens = $derived.by(() => {
    const ct = result.ciphertext;
    const hl = ciphertextHighlight;
    const ptTokens: DisplayToken[] = [];
    const ctTokens: DisplayToken[] = [];
    let cipherIdx = 0;
    for (const raw of plaintext) {
      if (PASSTHROUGH.has(raw)) {
        ptTokens.push({ char: raw, highlight: null });
        ctTokens.push({ char: raw, highlight: null });
      } else {
        const u = raw.toUpperCase();
        if (u >= 'A' && u <= 'Z') {
          let highlight: 'A' | 'B' | null = null;
          if (hl) {
            if (cipherIdx >= hl.startA && cipherIdx < hl.startA + hl.length) highlight = 'A';
            else if (cipherIdx >= hl.startB && cipherIdx < hl.startB + hl.length) highlight = 'B';
          }
          ptTokens.push({ char: u, highlight });
          ctTokens.push({ char: ct[cipherIdx], highlight });
          cipherIdx++;
        }
      }
    }
    return { ptTokens, ctTokens };
  });

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
    cardTraces = [];
  }

  function toggleCardTrace(card: string, displayCol: number) {
    const hitIdx = cardTraces.findIndex(t =>
      t.card === card &&
      displayCol >= t.startCol &&
      displayCol < t.startCol + TRACE_WINDOW
    );
    if (hitIdx !== -1) {
      cardTraces = cardTraces.filter((_, i) => i !== hitIdx);
    } else {
      const usedColors = new Set(cardTraces.map(t => t.color));
      const color =
        TRACE_COLORS.find(c => !usedColors.has(c)) ??
        TRACE_COLORS[cardTraces.length % TRACE_COLORS.length];
      cardTraces = [...cardTraces, { card, startCol: displayCol, color }];
    }
  }

  function clearAllTraces() {
    cardTraces = [];
  }
</script>

<div class="app-layout">
  <main class="left-panel">
    <h1>DeckLab</h1>
    <div class="controls">
      <button onclick={randomizeMapping}>Randomize Cipher</button>
      <button onclick={() => showCipherInspector = true}>Inspect Cipher</button>
      <button onclick={() => showTutorial = true}>Show Tutorial</button>
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
      <label class="highlight-toggle">
        <input type="checkbox" bind:checked={showAnimations} />
        Animate deck
      </label>
      {#if cardTraces.length > 0}
        <button onclick={clearAllTraces}>Clear traces</button>
      {/if}
    </div>
    <PlaintextInput oninput={(text) => plaintext = text} />
    <PlaintextOutput tokens={displayTokens.ptTokens} />
    <CiphertextOutput tokens={displayTokens.ctTokens} />
    <DeckView deck={result.deck} lastTransformation={result.lastTransformation} {showHighlights} {showAnimations} />
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
    <MultiDeckView
      steps={result.steps}
      {showHighlights}
      highlight={ciphertextHighlight}
      plaintextChars={filteredPlaintext}
      {cardTraces}
      traceWindow={TRACE_WINDOW}
      ontoggle={toggleCardTrace}
    />
  </div>
</div>

{#if showCipherInspector}
  <CipherInspector {mapping} onclose={() => showCipherInspector = false} />
{/if}

{#if showTutorial}
  <TutorialModal onclose={() => showTutorial = false} />
{/if}

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
