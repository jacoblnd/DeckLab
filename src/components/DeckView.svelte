<script lang="ts">
  import Card from './Card.svelte';

  let { deck }: { deck: string[] } = $props();
</script>

<div class="deck" data-testid="deck">
  {#each deck as letter}
    <Card {letter} />
  {/each}
</div>

<style>
  .deck {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: center;
    padding: 1rem 0;
  }
</style>
