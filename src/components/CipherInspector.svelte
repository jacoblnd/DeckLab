<script lang="ts">
  import type { CipherMapping, Transformation } from '../lib/cipher/deck';

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

  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  let { mapping, onclose }: { mapping: CipherMapping; onclose: () => void } = $props();

  let activeTab = $state<'table' | 'heatmap'>('table');

  function getPairIndex(t: Transformation, pos: number): number | null {
    for (let i = 0; i < t.swaps.length; i++) {
      if (t.swaps[i][0] === pos || t.swaps[i][1] === pos) return i;
    }
    return null;
  }
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') onclose(); }} />

<div class="backdrop" onclick={onclose} role="presentation">
  <div
    class="modal"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-label="Cipher Inspector"
    tabindex="-1"
  >
    <div class="modal-header">
      <span class="modal-title">Cipher Inspector</span>
      <button class="close-btn" onclick={onclose} aria-label="Close">×</button>
    </div>

    <div class="tabs">
      <button
        class="tab-btn"
        class:active={activeTab === 'table'}
        onclick={() => activeTab = 'table'}
      >Table</button>
      <button
        class="tab-btn"
        class:active={activeTab === 'heatmap'}
        onclick={() => activeTab = 'heatmap'}
      >Heatmap</button>
    </div>

    <div class="tab-content">
      {#if activeTab === 'table'}
        <table class="transform-table">
          <thead>
            <tr>
              <th class="col-pt">PT</th>
              <th class="col-rot">↺</th>
              <th class="col-swaps">Swaps</th>
            </tr>
          </thead>
          <tbody>
            {#each LETTERS as letter}
              {@const t = mapping[letter]}
              <tr>
                <td class="cell-pt">{letter}</td>
                <td class="cell-rot">
                  {#if t.rotation > 0}
                    <span class="rot-label">↺{t.rotation}</span>
                  {:else}
                    <span class="rot-none">—</span>
                  {/if}
                </td>
                <td class="cell-swaps">
                  {#each t.swaps as [a, b], i}
                    <span
                      class="swap-chip"
                      style:background-color={SWAP_COLORS[i]}
                    >{a}↔{b}</span>
                  {/each}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <div class="heatmap-scroll">
          <table class="heatmap-table">
            <thead>
              <tr>
                <th class="hm-corner"></th>
                <th colspan="26" class="hm-axis-label">Deck Position</th>
                <th class="hm-corner"></th>
              </tr>
              <tr>
                <th class="hm-pt-header">PT</th>
                {#each LETTERS as _, pos}
                  <th class="hm-pos-header">{pos}</th>
                {/each}
                <th class="hm-rot-header">↺</th>
              </tr>
            </thead>
            <tbody>
              {#each LETTERS as letter}
                {@const t = mapping[letter]}
                <tr>
                  <td class="hm-pt-cell">{letter}</td>
                  {#each LETTERS as _, pos}
                    {@const pairIdx = getPairIndex(t, pos)}
                    <td
                      class="hm-cell"
                      class:hm-active={pairIdx != null}
                      style:background-color={pairIdx != null ? SWAP_COLORS[pairIdx] : undefined}
                    ></td>
                  {/each}
                  <td class="hm-rot-cell">
                    {#if t.rotation > 0}
                      <span class="rot-label">↺{t.rotation}</span>
                    {:else}
                      <span class="rot-none">—</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal {
    background: #282c34;
    border: 1px solid #555;
    border-radius: 8px;
    max-width: 90vw;
    max-height: 85vh;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 400px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-title {
    font-size: 1rem;
    font-weight: 600;
    color: #abb2bf;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .close-btn {
    background: transparent;
    border: 1px solid #555;
    border-radius: 4px;
    color: #abb2bf;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    padding: 0.15rem 0.45rem;
  }

  .close-btn:hover {
    border-color: #888;
    color: inherit;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
  }

  .tab-btn {
    padding: 0.3rem 0.9rem;
    font-size: 0.85rem;
    border-radius: 4px;
    border: 1px solid #555;
    background: transparent;
    color: #abb2bf;
    cursor: pointer;
  }

  .tab-btn:hover {
    border-color: #888;
  }

  .tab-btn.active {
    border-color: #888;
    color: inherit;
  }

  /* ── Table tab ──────────────────────────────── */

  .transform-table {
    border-collapse: collapse;
    font-size: 0.85rem;
    width: 100%;
  }

  .transform-table th {
    color: #abb2bf;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.3rem 0.6rem;
    text-align: left;
    border-bottom: 1px solid #444;
  }

  .transform-table tr + tr td {
    border-top: 1px solid #333;
  }

  .col-pt  { width: 2rem; }
  .col-rot { width: 3rem; }
  .col-swaps { }

  .cell-pt {
    font-family: monospace;
    font-weight: 700;
    font-size: 0.9rem;
    padding: 0.3rem 0.6rem;
    color: #abb2bf;
  }

  .cell-rot {
    padding: 0.3rem 0.6rem;
    font-family: monospace;
    font-size: 0.8rem;
  }

  .cell-swaps {
    padding: 0.3rem 0.6rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
  }

  .swap-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.75rem;
    font-weight: 700;
    color: #1e1e1e;
    white-space: nowrap;
  }

  .rot-label {
    font-family: monospace;
    color: #abb2bf;
  }

  .rot-none {
    font-family: monospace;
    color: #444;
  }

  /* ── Heatmap tab ────────────────────────────── */

  .heatmap-scroll {
    overflow-x: auto;
  }

  .heatmap-table {
    border-collapse: collapse;
    font-size: 0.75rem;
  }

  .hm-corner {
    /* intentionally empty — occupies the top-left and top-right header cells */
  }

  .hm-axis-label {
    color: #abb2bf;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: center;
    padding: 0.3rem 0;
    border-bottom: 1px solid #444;
  }

  .hm-pt-header,
  .hm-rot-header {
    color: #abb2bf;
    font-weight: 600;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.2rem 0.4rem;
    border-bottom: 1px solid #444;
  }

  .hm-pos-header {
    color: #abb2bf;
    font-weight: 600;
    font-size: 0.7rem;
    font-family: monospace;
    text-align: center;
    padding: 0.2rem 0;
    width: 1.5rem;
    border-bottom: 1px solid #444;
  }

  .hm-pt-cell {
    font-family: monospace;
    font-weight: 700;
    font-size: 0.85rem;
    color: #abb2bf;
    padding: 0.15rem 0.4rem;
    border-right: 1px solid #444;
  }

  .hm-cell {
    width: 1.5rem;
    height: 1.4rem;
    border: 1px solid #333;
  }

  .hm-rot-cell {
    font-family: monospace;
    font-size: 0.75rem;
    padding: 0 0.4rem;
    text-align: center;
    border-left: 1px solid #444;
    white-space: nowrap;
  }
</style>
