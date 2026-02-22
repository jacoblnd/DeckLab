<script lang="ts">
  const HL_A = '#c678dd';
  const HL_B = '#56b6c2';

  let {
    filteredPlaintext,
    highlight = null,
  }: {
    filteredPlaintext: string;
    highlight: { startA: number; startB: number; length: number } | null;
  } = $props();
</script>

<div class="plaintext-output-section">
  <div
    class="pt-chars"
    data-testid="plaintext-output"
    aria-label="Filtered plaintext"
    aria-readonly="true"
  >
    {#if filteredPlaintext.length === 0}
      <span class="placeholder">Filtered plaintext appears here...</span>
    {:else}
      {#each filteredPlaintext.split('') as char, i}
        {@const inA = highlight != null && i >= highlight.startA && i < highlight.startA + highlight.length}
        {@const inB = highlight != null && i >= highlight.startB && i < highlight.startB + highlight.length}
        <span
          class="pt-char"
          style:background-color={inA ? HL_A : inB ? HL_B : undefined}
          style:color={inA || inB ? '#1e1e1e' : undefined}
        >{char}</span>
      {/each}
    {/if}
  </div>
</div>

<style>
  .plaintext-output-section {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .pt-chars {
    font-family: monospace;
    font-size: 1rem;
    padding: 0.5rem;
    height: 6rem;
    overflow-y: auto;
    background-color: rgba(128, 128, 128, 0.1);
    word-break: break-all;
    line-height: 1.6;
    border-radius: 4px;
  }

  .pt-char {
    border-radius: 2px;
  }

  .placeholder {
    color: #666;
    font-style: italic;
  }
</style>
