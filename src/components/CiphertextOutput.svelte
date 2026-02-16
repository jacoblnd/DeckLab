<script lang="ts">
  let { ciphertext }: { ciphertext: string } = $props();
</script>

<div class="ciphertext-section">
  <label for="ciphertext">Ciphertext</label>
  <textarea
    id="ciphertext"
    data-testid="ciphertext-output"
    readonly
    value={ciphertext}
    placeholder="Ciphertext appears here..."
  ></textarea>
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
  textarea {
    font-family: monospace;
    font-size: 1rem;
    padding: 0.5rem;
    resize: vertical;
    min-height: 3rem;
    background-color: rgba(128, 128, 128, 0.1);
  }
</style>
