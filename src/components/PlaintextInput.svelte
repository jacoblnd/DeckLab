<script lang="ts">
  let { oninput }: { oninput: (text: string) => void } = $props();
</script>

<div class="plaintext-section">
  <label for="plaintext">Plaintext</label>
  <textarea
    id="plaintext"
    data-testid="plaintext-input"
    placeholder="Type letters A–Z..."
    oninput={(e) => oninput(e.currentTarget.value)}
  ></textarea>
</div>

<style>
  .plaintext-section {
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
  }
</style>
