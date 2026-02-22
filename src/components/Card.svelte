<script lang="ts">
  const SWAP_COLORS = [
    '#e06c75', // swap 1  — red
    '#e5c07b', // swap 2  — yellow
    '#61afef', // swap 3  — blue
    '#98c379', // swap 4  — green
    '#c678dd', // swap 5  — purple
    '#56b6c2', // swap 6  — cyan
    '#d19a66', // swap 7  — orange
    '#e96eb0', // swap 8  — hot pink
    '#be5046', // swap 9  — dark red
    '#528bff', // swap 10 — bright blue
    '#7ec8a4', // swap 11 — mint
    '#f0a0a0', // swap 12 — light red
    '#a0c8f0', // swap 13 — light blue
  ];

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
