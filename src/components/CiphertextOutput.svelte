<script lang="ts">
  const HL_A = '#c678dd';
  const HL_B = '#56b6c2';

  let {
    tokens,
  }: {
    tokens: { char: string; highlight: 'A' | 'B' | null }[];
  } = $props();

  let hasContent = $derived(tokens.length > 0);
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
    {#if !hasContent}
      <span class="placeholder">Ciphertext appears here...</span>
    {:else}
      {#each tokens as token}
        {#if token.char === '\n'}
          <br />
        {:else}
          <span
            class="ct-char"
            style:background-color={token.highlight === 'A' ? HL_A : token.highlight === 'B' ? HL_B : undefined}
            style:color={token.highlight ? '#1e1e1e' : undefined}
          >{token.char}</span>
        {/if}
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
    height: 6rem;
    overflow-y: auto;
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
