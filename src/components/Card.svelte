<script lang="ts">
  let { letter }: { letter: string } = $props();
</script>

<div class="card">
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
</style>
