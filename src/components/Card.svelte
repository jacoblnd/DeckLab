<script lang="ts">
  const SWAP_COLORS = ['#e06c75', '#e5c07b', '#61afef', '#98c379'];

  let { letter, swapPair = null }: { letter: string; swapPair?: number | null } = $props();
</script>

<div
  class="card"
  class:highlighted={swapPair != null}
  style:background-color={swapPair != null ? SWAP_COLORS[swapPair] : undefined}
>
  {letter}
</div>

<style>
  .card {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2.8rem;
    border: 1px solid #555;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    font-family: monospace;
    user-select: none;
  }
  .highlighted {
    color: #1e1e1e;
  }
</style>
