<script lang="ts">
  // Geometry constants — must stay in sync with MultiDeckView.svelte's .column CSS.
  // Read the actual root font size rather than hardcoding 16px: card dimensions are
  // in rem units, so a wrong REM value compounds across all 26 card positions.
  const REM = parseFloat(getComputedStyle(document.documentElement).fontSize);

  const CARD_H    = 1.6  * REM;  // 25.6 px  — .mini-card height
  const CARD_GAP  = 0.15 * REM;  //  2.4 px  — flex gap between cards
  const CARD_STEP = CARD_H + CARD_GAP; // 28 px

  // Heights of the three header rows above the cards, each including
  // its own margin-bottom plus the column's flex gap (0.15 rem) after it.
  const PT_LABEL_H    = (1.3  + 0.1  + 0.15) * REM; // 24.8 px
  const COL_LABEL_H   = (0.85 * 1.0  + 0.2  + 0.15) * REM; //  19.2 px  (0.85rem × line-height:1 + margins/gap)
  const COL_ROT_H     = (0.7  + 0.1  + 0.15) * REM; // 15.2 px
  const HEADER_H      = PT_LABEL_H + COL_LABEL_H + COL_ROT_H; // ≈ 59.7 px

  const CONNECTOR_W = 2.5 * REM; // 40 px — width of each connector strip
  const COL_H = HEADER_H + 26 * CARD_H + 25 * CARD_GAP; // ≈ 785 px

  function cardCenterY(i: number): number {
    return HEADER_H + i * CARD_STEP + CARD_H / 2;
  }

  let {
    leftDeck,
    rightDeck,
    traces,
  }: {
    leftDeck: string[];
    rightDeck: string[];
    traces: { card: string; color: string }[];
  } = $props();
</script>

<svg
  class="connector"
  width={CONNECTOR_W}
  height={COL_H}
  xmlns="http://www.w3.org/2000/svg"
>
  {#each traces as { card, color }}
    {@const leftPos  = leftDeck.indexOf(card)}
    {@const rightPos = rightDeck.indexOf(card)}
    {#if leftPos !== -1 && rightPos !== -1}
      <line
        x1="0"            y1={cardCenterY(leftPos)}
        x2={CONNECTOR_W}  y2={cardCenterY(rightPos)}
        stroke={color}
        stroke-width="1.5"
        stroke-linecap="round"
        opacity="0.75"
      />
    {/if}
  {/each}
</svg>

<style>
  .connector {
    flex-shrink: 0;
    display: block;
  }
</style>
