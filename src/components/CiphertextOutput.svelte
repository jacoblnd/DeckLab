<script lang="ts">
  const HL_A = '#c678dd';
  const HL_B = '#56b6c2';

  let {
    ciphertext,
    highlight = null,
  }: {
    ciphertext: string;
    highlight: { startA: number; startB: number; length: number } | null;
  } = $props();
</script>

<div class="ciphertext-section">
  <label for="ciphertext">Ciphertext</label>
  <div
    id="ciphertext"
    class="ciphertext-chars"
    data-testid="ciphertext-output"
    aria-label="Ciphertext"
    aria-readonly="true"
  >
    {#if ciphertext.length === 0}
      <span class="placeholder">Ciphertext appears here...</span>
    {:else}
      {#each ciphertext.split('') as char, i}
        {@const inA = highlight != null && i >= highlight.startA && i < highlight.startA + highlight.length}
        {@const inB = highlight != null && i >= highlight.startB && i < highlight.startB + highlight.length}
        <span
          class="ct-char"
          style:background-color={inA ? HL_A : inB ? HL_B : undefined}
          style:color={inA || inB ? '#1e1e1e' : undefined}
        >{char}</span>
      {/each}
    {/if}
  </div>
</div>

<style>
  .ciphertext-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  label {
    font-weight: 600;
  }

  .ciphertext-chars {
    font-family: monospace;
    font-size: 1rem;
    padding: 0.5rem;
    min-height: 3rem;
    background-color: rgba(128, 128, 128, 0.1);
    word-break: break-all;
    line-height: 1.6;
    border-radius: 4px;
  }

  .ct-char {
    border-radius: 2px;
  }

  .placeholder {
    color: #666;
    font-style: italic;
  }
</style>
