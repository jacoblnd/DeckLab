<script lang="ts">
  import { sortByInterestingness, countPatternOccurrences } from '../lib/cipher/isomorph';
  import type { Isomorph } from '../lib/cipher/isomorph';

  let {
    isomorphs,
    ciphertext,
    selected,
    onselect,
  }: {
    isomorphs: Isomorph[];
    ciphertext: string;
    selected: Isomorph | null;
    onselect: (iso: Isomorph | null) => void;
  } = $props();

  let patternCounts = $derived(countPatternOccurrences(isomorphs));
  let sorted = $derived(sortByInterestingness(isomorphs, patternCounts));

  function isSelected(iso: Isomorph): boolean {
    return selected != null
      && selected.startA === iso.startA
      && selected.startB === iso.startB
      && selected.pattern === iso.pattern;
  }
</script>

<div class="isomorph-list">
  {#if sorted.length === 0}
    <p class="empty">No isomorphs found.</p>
  {:else}
    {#each sorted as iso}
      {@const sel = isSelected(iso)}
      {@const subA = ciphertext.slice(iso.startA, iso.startA + iso.pattern.length)}
      {@const subB = ciphertext.slice(iso.startB, iso.startB + iso.pattern.length)}
      <button
        class="iso-entry"
        class:selected={sel}
        onclick={() => onselect(sel ? null : iso)}
      >
        <span class="iso-header">
          <span class="iso-pattern">{iso.pattern}</span>
          <span class="iso-count">×{patternCounts.get(iso.pattern) ?? 0}</span>
        </span>
        <span class="iso-positions">@{iso.startA} · @{iso.startB}</span>
        <span class="iso-subs">
          <span class="sub-a">{subA}</span>
          <span class="iso-sep">/</span>
          <span class="sub-b">{subB}</span>
        </span>
      </button>
    {/each}
  {/if}
</div>

<style>
  .isomorph-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    overflow-y: auto;
    max-height: 300px;
    padding: 0.5rem 0;
    align-content: flex-start;
  }

  .empty {
    margin: 0;
    color: #666;
    font-style: italic;
    font-size: 0.9rem;
  }

  .iso-entry {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid #555;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
    font-family: monospace;
    font-size: 0.8rem;
  }

  .iso-entry:hover {
    border-color: #888;
  }

  .iso-entry.selected {
    border-color: #c678dd;
    background: rgba(198, 120, 221, 0.1);
  }

  .iso-header {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }

  .iso-pattern {
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .iso-count {
    color: #abb2bf;
    font-size: 0.75rem;
  }

  .iso-positions {
    color: #abb2bf;
    font-size: 0.75rem;
  }

  .iso-subs {
    display: flex;
    gap: 0.3rem;
    align-items: center;
  }

  .sub-a {
    background-color: #c678dd;
    color: #1e1e1e;
    padding: 0 0.2rem;
    border-radius: 2px;
  }

  .sub-b {
    background-color: #56b6c2;
    color: #1e1e1e;
    padding: 0 0.2rem;
    border-radius: 2px;
  }

  .iso-sep {
    color: #abb2bf;
  }
</style>
