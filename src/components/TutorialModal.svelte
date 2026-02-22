<script lang="ts">
  let { onclose }: { onclose: () => void } = $props();

  const SWAP_COLORS = [
    '#e06c75', // swap 1  — red
    '#e5c07b', // swap 2  — yellow
    '#61afef', // swap 3  — blue
    '#98c379', // swap 4  — green
    '#c678dd', // swap 5  — purple
    '#56b6c2', // swap 6  — cyan
    '#d19a66', // swap 7  — orange
  ];

  const EXAMPLE_CARDS = ['A','B','C','D','E','F','G','H','I','J'];
  const CARD_COLORS: (string | null)[] = [
    '#e06c75', '#e5c07b', '#61afef', '#98c379',
    null, null, null, null, null, null,
  ];
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') onclose(); }} />

<div class="backdrop" onclick={onclose} role="presentation">
  <div
    class="modal"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    aria-label="Tutorial"
    tabindex="-1"
  >
    <div class="modal-header">
      <span class="modal-title">Tutorial</span>
      <button class="close-btn" onclick={onclose} aria-label="Close">×</button>
    </div>

    <div class="modal-body">

      <!-- ── Overview ───────────────────────────────────────────── -->
      <section>
        <h2 class="section-heading">Overview</h2>

        <div class="prose-block">
          <h3 class="sub-heading">What is DeckLab?</h3>
          <p>
            DeckLab is an interactive deck cipher visualization tool. Type any
            text into the input box and the watch it be enciphered in real-time,
            showing every deck state along the way.
          </p>
        </div>

        <div class="prose-block">
          <h3 class="sub-heading">What is a Deck Cipher?</h3>
          <p>
            A deck cipher is a type of <em>auto-key cipher</em> that uses a
            deck of symbols as its state. Each plaintext (PT) symbol
            maps to a specific <em>transformation</em>. For simplicity, DeckLab
            transformations are currently always represented by a left-rotation
            (cyclic shift) of 0 or more followed by one or more swaps of card
            positions. After each transformation, the top card of the deck becomes
            the ciphertext (CT) symbol. Because the deck changes with every character,
            the same PT letter produces a different CT letter depending on what came before
            it.
            One critical property of the cipher - that no 2 transformations result in the same card
            being brought to the top of the deck - is intentionally maintained to make
            DeckLab ciphers similar to a type of theorized cipher in the Noita Eye Messages community.
          </p>
        </div>

        <div class="prose-block">
          <h3 class="sub-heading">Relation to the Noita Eye Messages</h3>
          <p>
            DeckLab ciphers are based on community research
            into the{' '}
            <a
              href="https://noita.wiki.gg/wiki/Eye_Messages"
              target="_blank"
              rel="noopener noreferrer"
            >Noita Eye Puzzle</a> — an unsolved cryptogram in the video game
            Noita. A deck cipher is one theorized mechanism for the encryption.
            DeckLab ciphers fall into the{' '}
            <a
              href="https://github.com/Lymm37/eye-messages/wiki/Group-Autokey-%28GAK%29"
              target="_blank"
              rel="noopener noreferrer"
            >Group Autokey (GAK)</a> class of ciphers.
            The full set of GAK ciphers is the symmetric group S26. DeckLab only generates
            a subset of S26 due to the simple (rotation+swaps) implementation.
            Additionally, DeckLab only supports 26 symbols (A–Z); any true Eye Puzzle
            mechanism would need to support 83 symbols.
          </p>
        </div>
      </section>

      <!-- ── Features ───────────────────────────────────────────── -->
      <section>
        <h2 class="section-heading">Features</h2>

        <!-- Row 1: Cipher Controls -->
        <div class="feature-row">
          <div class="feature-desc">
            <h3 class="feature-heading">Cipher Controls</h3>
            <p>
              <strong>Randomize Cipher</strong> generates a new random cipher
              using the current settings. Each PT letter gets a unique
              transformation; no two share the same one.
            </p>
            <p>
              <strong>Swaps</strong> (1–13) controls how many card-position
              pairs are exchanged per transformation.
            </p>
            <p>
              <strong>Rotations</strong> (0–25) sets the maximum cyclic left-shift
              applied before swaps. 0 disables rotation entirely (swaps must
              then include position 0).
            </p>
            <p>
              <strong>Constant Rotations</strong> — when checked, every
              transformation uses exactly the rotation max; when unchecked, each
              picks a random amount from 1 to max.
            </p>
            <p>
              <strong>Inspect Cipher</strong> opens the Cipher Inspector modal
              showing the full transformation mapping.
            </p>
          </div>
          <div class="feature-visual">
            <div class="mock-controls">
              <span class="mock-btn">Randomize Cipher</span>
              <span class="mock-btn">Inspect Cipher</span>
              <span class="mock-btn">Show Tutorial</span>
            </div>
            <div class="mock-controls" style="margin-top: 0.5rem;">
              <span class="mock-label">Swaps: <code class="mock-num">4</code></span>
              <span class="mock-label">Rotations: <code class="mock-num">1</code></span>
            </div>
            <div class="mock-controls" style="margin-top: 0.4rem;">
              <span class="mock-label"><span class="mock-check">✓</span> Constant Rotations</span>
              <span class="mock-label"><span class="mock-check">✓</span> Show swap highlights</span>
              <span class="mock-label"><span class="mock-uncheck">☐</span> Show isomorphs</span>
              <span class="mock-label"><span class="mock-uncheck">☐</span> Animate deck</span>
            </div>
          </div>
        </div>

        <div class="feature-divider"></div>

        <!-- Row 2: Encipherment -->
        <div class="feature-row">
          <div class="feature-desc">
            <h3 class="feature-heading">How Encipherment Works</h3>
            <p>
              Encipherment always starts from the ordered deck A–Z. For each PT
              character:
            </p>
            <ol class="feature-list">
              <li>Look up that character's transformation (rotation + swaps).</li>
              <li>Apply the rotation — cyclic left-shift the deck by N positions.</li>
              <li>Apply the swaps — exchange the specified card-position pairs.</li>
              <li>Read the top card — that is the CT character.</li>
            </ol>
            <p>
              Because the deck carries state between steps, identical PT letters
              produce different CT letters at different positions.
            </p>
          </div>
          <div class="feature-visual">
            <pre class="diagram">{`Initial deck (A–Z):
  [A][B][C][D][E]…[Z]

PT = "H"  →  transformation for H:
  rotation ↺1
  [B][C][D][E]…[Z][A]

  swaps: 0↔3, 1↔5, …
  [E][…][…][B]…

  top card (now [E]) = CT character`}</pre>
          </div>
        </div>

        <div class="feature-divider"></div>

        <!-- Row 3: PT / CT Display -->
        <div class="feature-row">
          <div class="feature-desc">
            <h3 class="feature-heading">Plaintext &amp; Ciphertext Display</h3>
            <p>
              Below the text input are two read-only strips:
            </p>
            <ul class="feature-list">
              <li>
                <strong>Plaintext strip</strong> — only the A–Z characters you
                typed, uppercased. Non-letter characters are removed. This is
                the exact sequence fed into the cipher.
              </li>
              <li>
                <strong>Ciphertext strip</strong> — the resulting CT characters,
                aligned position-by-position with the filtered plaintext.
              </li>
            </ul>
            <p>
              When an isomorph is selected, both strips highlight the two
              matching substrings — the first in purple, the second in cyan.
            </p>
          </div>
          <div class="feature-visual">
            <div class="mock-strip-label">PT</div>
            <div class="mock-strip">
              {#each 'HELLOWORLD'.split('') as c, i}
                <span
                  class="mock-char"
                  style:background-color={i >= 2 && i <= 4 ? '#c678dd33' : i >= 7 && i <= 9 ? '#56b6c233' : undefined}
                  style:color={i >= 2 && i <= 4 ? '#c678dd' : i >= 7 && i <= 9 ? '#56b6c2' : undefined}
                >{c}</span>
              {/each}
            </div>
            <div class="mock-strip-label" style="margin-top: 0.5rem;">CT</div>
            <div class="mock-strip">
              {#each 'MQXFXJRKXK'.split('') as c, i}
                <span
                  class="mock-char"
                  style:background-color={i >= 2 && i <= 4 ? '#c678dd33' : i >= 7 && i <= 9 ? '#56b6c233' : undefined}
                  style:color={i >= 2 && i <= 4 ? '#c678dd' : i >= 7 && i <= 9 ? '#56b6c2' : undefined}
                >{c}</span>
              {/each}
            </div>
            <p class="visual-caption">
              Purple = isomorph substring A &nbsp;·&nbsp; Cyan = isomorph substring B
            </p>
          </div>
        </div>

        <div class="feature-divider"></div>

        <!-- Row 4: Deck View -->
        <div class="feature-row">
          <div class="feature-desc">
            <h3 class="feature-heading">Current Deck State</h3>
            <p>
              The <strong>Deck View</strong> (bottom of the left panel) shows
              the deck's arrangement after the most recent encipherment step.
              Each card is shown in its current position.
            </p>
            <p>
              With <strong>Show swap highlights</strong> enabled, cards that
              were moved by a swap are colored by which swap pair moved them.
              Up to 13 swaps are supported - each with a distinct color.
              The number assigned to a given swap, e.g., swap 1, swap 2, isn't structurally
              important to the encipherment process but helps maintain visual
              consistency.
            </p>
            <p>
              Enable <strong>Animate deck</strong> to see smooth FLIP animations
              as cards move to their new positions with each keystroke.
            </p>
          </div>
          <div class="feature-visual">
            <div class="mock-deck">
              {#each EXAMPLE_CARDS as letter, i}
                <span
                  class="mock-card"
                  style:background-color={CARD_COLORS[i] ?? '#3a3f4a'}
                  style:color={CARD_COLORS[i] ? '#1e1e1e' : '#abb2bf'}
                >{letter}</span>
              {/each}
              <span class="mock-card-ellipsis">…</span>
            </div>
            <p class="visual-caption">
              Colors = swap pairs &nbsp;·&nbsp; Plain = unswapped
            </p>
            <div class="mock-swap-legend">
              {#each SWAP_COLORS as color, i}
                <span class="mock-legend-chip" style:background-color={color}>
                  Swap {i + 1}
                </span>
              {/each}
            </div>
          </div>
        </div>

        <div class="feature-divider"></div>

        <!-- Row 5: Historical Deck State -->
        <div class="feature-row">
          <div class="feature-desc">
            <h3 class="feature-heading">Historical Deck State</h3>
            <p>
              The <strong>right panel</strong> shows the full encipherment
              history — one column per PT character, scrollable horizontally.
              Each column displays:
            </p>
            <ul class="feature-list">
              <li>The PT character (top, muted)</li>
              <li>The CT character (bold)</li>
              <li>The rotation applied (<code>↺N</code>, or blank)</li>
              <li>All 26 deck cards in order after that step</li>
            </ul>
            <p>
              The initial <strong>—</strong> column shows the starting A–Z deck
              before any encipherment. When an isomorph is selected, bracket
              outlines highlight the two matching column groups.
            </p>
          </div>
          <div class="feature-visual">
            <div class="mock-multideck">
              {#each [
                { pt: '—', ct: '—', rot: '', cards: ['A','B','C'] },
                { pt: 'H', ct: 'M', rot: '↺1', cards: ['D','B','C'] },
                { pt: 'E', ct: 'Q', rot: '↺1', cards: ['F','B','C'] },
                { pt: 'L', ct: 'X', rot: '↺1', cards: ['G','F','C'] },
              ] as col}
                <div class="mock-col">
                  <div class="mock-col-pt">{col.pt}</div>
                  <div class="mock-col-ct">{col.ct}</div>
                  <div class="mock-col-rot">{col.rot}</div>
                  {#each col.cards as card}
                    <div class="mock-col-card">{card}</div>
                  {/each}
                  <div class="mock-col-card muted">…</div>
                </div>
              {/each}
            </div>
            <p class="visual-caption">Each column = one PT→CT step and the resultant deck state</p>
          </div>
        </div>

        <div class="feature-divider"></div>

        <!-- Row 6: Isomorphs -->
        <div class="feature-row">
          <div class="feature-desc">
            <h3 class="feature-heading">Isomorphs</h3>
            <p>
              An <strong>isomorph</strong> is two sequences of text which are
              substitutions of each other. A slightly-incorrect but more useful
              definition in the context of this tool is:
              a pattern describing which positions in a string share the same character.
              For example, <code>FHWOFNFO</code> has the isomorph pattern{' '}
              <code>a..ba.ab</code> — positions 0, 4, and 6 all contain the same
              character (labeled <code>a</code>), positions 3 and 7 contain the same
              character (labeled <code>b</code>) which is different from the first
              repeating character <code>a</code>
              Positions that don't repeate are labeled with <code>.</code>.
            </p>
            <p>
              Two ciphertext substrings are <em>isomorphic</em> if they share
              the same pattern. This can hint that their underlying plaintexts
              are identical — useful for cryptanalysis.
            </p>
            <p>
              Enable <strong>Show isomorphs</strong> to reveal the isomorph
              list below the deck. Isomorphs are sorted by how interesting they
              are (denser repetition = higher). Click any entry to highlight
              both matching substrings across the PT strip, CT strip, and
              historical deck columns simultaneously.
            </p>
            <p>
              For more information on isomorphs in relation to the Noita eye messages
              see {' '}
              <a
                href="https://tomster12.github.io/isomorph-viewer/"
                target="_blank"
                rel="noopener noreferrer"
              >Tomster12's Isomorph Viewer</a>.
              And for a more precise definition, see {' '}
              <a
                href="https://github.com/Lymm37/eye-messages/wiki/Isomorphs-%28Gap-Patterns%29"
                target="_blank"
                rel="noopener noreferrer"
              >Lymm's Isomorph (Gap Patterns)</a>.
            </p>
          </div>
          <div class="feature-visual">
            <div class="mock-isomorph-entry">
              <span class="mock-iso-pattern">a..ba.ab</span>
              <span class="mock-iso-badge">×1</span>
            </div>
            <div class="mock-strip" style="margin-top: 0.75rem;">
              {#each 'FHWOFNFO'.split('') as c, i}
                <span
                  class="mock-char"
                  style:background-color={'#c678dd33'}
                  style:color={'#c678dd'}
                >{c}</span>
              {/each}
            </div>
            <div class="mock-strip" style="margin-top: 0.3rem;">
              {#each 'UVONUYUN'.split('') as c, i}
                <span
                  class="mock-char"
                  style:background-color={'#56b6c233'}
                  style:color={'#56b6c2'}
                >{c}</span>
              {/each}
            </div>
            <p class="visual-caption">
              Same isomorph pattern — purple (A) and cyan (B)
            </p>
          </div>
        </div>

        <div class="feature-divider"></div>

        <!-- Row 7: Cipher Inspector -->
        <div class="feature-row">
          <div class="feature-desc">
            <h3 class="feature-heading">Cipher Inspector</h3>
            <p>
              Click <strong>Inspect Cipher</strong> to open the Cipher Inspector
              — a modal showing the complete cipher mapping.
            </p>
            <p>
              <strong>Table tab:</strong> One row per PT letter (A–Z) showing
              the rotation amount and each swap pair as a color-coded chip (e.g.
              <code>0↔3</code>). Useful for reading the exact transformation for
              any letter.
            </p>
            <p>
              <strong>Heatmap tab:</strong> A 26×26 grid where each cell is
              colored if that deck position is involved in a swap for that PT
              letter. The right column shows the rotation. Useful for spotting
              structural patterns across the entire mapping at a glance.
            </p>
          </div>
          <div class="feature-visual">
            <table class="mock-table">
              <thead>
                <tr>
                  <th>PT</th>
                  <th>↺</th>
                  <th>Swaps</th>
                </tr>
              </thead>
              <tbody>
                {#each [
                  { pt: 'A', rot: '↺1', swaps: [[0,3],[1,5],[2,7],[4,6]] },
                  { pt: 'B', rot: '↺1', swaps: [[0,2],[3,8],[1,6],[4,9]] },
                  { pt: 'C', rot: '↺1', swaps: [[0,4],[2,9],[3,5],[1,7]] },
                ] as row}
                  <tr>
                    <td class="mock-td-pt">{row.pt}</td>
                    <td class="mock-td-rot">{row.rot}</td>
                    <td class="mock-td-swaps">
                      {#each row.swaps as [a, b], i}
                        <span class="mock-swap-chip" style:background-color={SWAP_COLORS[i]}>
                          {a}↔{b}
                        </span>
                      {/each}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
            <p class="visual-caption">Table tab — color-coded swap chips per PT letter</p>
          </div>
        </div>

      </section>
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
    max-width: min(900px, 90vw);
    min-width: 600px;
    max-height: 85vh;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
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

  .modal-body {
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  /* ── Headings ────────────────────────────── */

  .section-heading {
    font-size: 0.8rem;
    font-weight: 600;
    color: #abb2bf;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin: 0 0 1rem 0;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid #444;
  }

  .sub-heading {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 0.4rem 0;
    color: inherit;
  }

  .feature-heading {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 0.6rem 0;
    color: inherit;
  }

  /* ── Prose ───────────────────────────────── */

  .prose-block {
    margin-bottom: 1.2rem;
  }

  .prose-block p,
  .feature-desc p {
    font-size: 0.875rem;
    line-height: 1.65;
    margin: 0 0 0.5rem 0;
    color: #cdd3de;
  }

  .prose-block a {
    color: #61afef;
    text-decoration: none;
  }

  .prose-block a:hover {
    text-decoration: underline;
  }

  /* ── Feature rows ────────────────────────── */

  .feature-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  .feature-desc p {
    margin: 0 0 0.5rem 0;
  }

  .feature-list {
    font-size: 0.875rem;
    line-height: 1.65;
    color: #cdd3de;
    margin: 0.25rem 0 0.5rem 0;
    padding-left: 1.25rem;
  }

  .feature-list li {
    margin-bottom: 0.25rem;
  }

  .feature-divider {
    border: none;
    border-top: 1px solid #333;
    margin: 0;
  }

  /* ── Visuals ─────────────────────────────── */

  .feature-visual {
    background: #1e2127;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    font-size: 0.82rem;
  }

  .visual-caption {
    font-size: 0.75rem;
    color: #abb2bf;
    margin: 0.5rem 0 0 0;
    font-style: italic;
  }

  /* mock controls */
  .mock-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
  }

  .mock-btn {
    padding: 0.3rem 0.6rem;
    border: 1px solid #555;
    border-radius: 5px;
    font-size: 0.78rem;
    color: #abb2bf;
    background: transparent;
    white-space: nowrap;
  }

  .mock-label {
    font-size: 0.78rem;
    color: #abb2bf;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
  }

  .mock-num {
    border: 1px solid #555;
    border-radius: 3px;
    padding: 0.05rem 0.3rem;
    font-size: 0.78rem;
    background: transparent;
    color: inherit;
  }

  .mock-check {
    color: #98c379;
    font-size: 0.85rem;
  }

  .mock-uncheck {
    color: #555;
    font-size: 0.85rem;
  }

  /* diagram */
  .diagram {
    font-family: monospace;
    font-size: 0.78rem;
    line-height: 1.6;
    color: #abb2bf;
    margin: 0;
    white-space: pre;
    overflow-x: auto;
  }

  /* PT/CT strips */
  .mock-strip-label {
    font-size: 0.7rem;
    color: #abb2bf;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.2rem;
  }

  .mock-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.1rem;
  }

  .mock-char {
    font-family: monospace;
    font-size: 0.85rem;
    font-weight: 700;
    width: 1.3rem;
    height: 1.3rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
  }

  /* deck */
  .mock-deck {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .mock-card {
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: 700;
    width: 1.6rem;
    height: 1.6rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
  }

  .mock-card-ellipsis {
    font-size: 0.8rem;
    color: #abb2bf;
    display: inline-flex;
    align-items: center;
  }

  .mock-swap-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.4rem;
  }

  .mock-legend-chip {
    font-size: 0.7rem;
    font-weight: 600;
    color: #1e1e1e;
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    white-space: nowrap;
  }

  /* multi-deck mock */
  .mock-multideck {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
  }

  .mock-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    min-width: 2rem;
  }

  .mock-col-pt {
    font-family: monospace;
    font-size: 0.75rem;
    color: #abb2bf;
    min-height: 1rem;
  }

  .mock-col-ct {
    font-family: monospace;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .mock-col-rot {
    font-family: monospace;
    font-size: 0.7rem;
    color: #abb2bf;
    min-height: 0.9rem;
  }

  .mock-col-card {
    font-family: monospace;
    font-size: 0.7rem;
    width: 1.4rem;
    height: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #3a3f4a;
    border-radius: 2px;
    color: #cdd3de;
  }

  .mock-col-card.muted {
    background: transparent;
    color: #abb2bf;
  }

  /* isomorph mock */
  .mock-isomorph-entry {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.5rem;
    background: #2c313a;
    border-radius: 4px;
    border: 1px solid #3a3f4a;
  }

  .mock-iso-pattern {
    font-family: monospace;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .mock-iso-badge {
    font-size: 0.72rem;
    background: #3a3f4a;
    color: #abb2bf;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
  }


  /* cipher inspector mock table */
  .mock-table {
    border-collapse: collapse;
    font-size: 0.8rem;
    width: 100%;
  }

  .mock-table th {
    color: #abb2bf;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.2rem 0.4rem;
    text-align: left;
    border-bottom: 1px solid #444;
  }

  .mock-table tr + tr td {
    border-top: 1px solid #333;
  }

  .mock-td-pt {
    font-family: monospace;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 0.25rem 0.4rem;
    color: #abb2bf;
    white-space: nowrap;
  }

  .mock-td-rot {
    font-family: monospace;
    font-size: 0.78rem;
    padding: 0.25rem 0.4rem;
    color: #abb2bf;
    white-space: nowrap;
  }

  .mock-td-swaps {
    padding: 0.25rem 0.4rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .mock-swap-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.72rem;
    font-weight: 700;
    color: #1e1e1e;
    white-space: nowrap;
  }

  /* ── Responsive ──────────────────────────── */

  @media (max-width: 700px) {
    .modal {
      min-width: unset;
      max-width: 95vw;
    }

    .feature-row {
      grid-template-columns: 1fr;
    }
  }
</style>
