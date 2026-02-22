# Tutorial Modal — Implementation Plan

## Overview

Add a "Show Tutorial" button that opens a large, vertically-scrollable modal explaining DeckLab. The modal follows the same patterns as `CipherInspector.svelte`: backdrop click / Escape key closes it, an X button closes it, and it is mounted outside `.app-layout` in `App.svelte`.

---

## Files

| Action | File |
|---|---|
| **Create** | `src/components/TutorialModal.svelte` |
| **Modify** | `src/App.svelte` |

No new logic files, no test files required (static content component, no testable behaviour beyond existing smoke tests).

---

## 1. `TutorialModal.svelte`

### Props

```ts
let { onclose }: { onclose: () => void } = $props();
```

### Template structure

```
<svelte:window onkeydown → Escape → onclose />

<div class="backdrop" onclick={onclose} role="presentation">
  <div class="modal" onclick={e => e.stopPropagation()} role="dialog"
       aria-modal="true" aria-label="Tutorial" tabindex="-1">

    <div class="modal-header">          ← flex-shrink: 0; stays at top
      <span class="modal-title">Tutorial</span>
      <button class="close-btn" onclick={onclose}>×</button>
    </div>

    <div class="modal-body">            ← overflow-y: auto; flex: 1
      <section class="overview"> … </section>
      <section class="features">
        {#each FEATURE_ROWS as row}
          <div class="feature-row">
            <div class="feature-desc"> … </div>
            <div class="feature-visual"> … </div>
          </div>
        {/each}
      </section>
    </div>
  </div>
</div>
```

### Sizing

```css
.modal {
  max-width: min(900px, 90vw);
  min-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;   /* header fixed, body scrolls */
}

.modal-body {
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-top: 1rem;
}
```

### Section layout

```css
.feature-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}
```

On narrower displays (`< 700px`) a media query collapses to a single column (description above visual).

---

## 2. Tutorial Content

### Overview section

Three subsections, each with a heading + prose:

**What is DeckLab?**
> DeckLab is an interactive deck cipher visualization tool. Type any text into the input box and watch the cipher encipher it in real-time, showing every deck state along the way.

**What is a Deck Cipher?**
> A deck cipher is a type of *auto-key cipher* that uses an ordered deck of symbols as its state. Each plaintext (PT) symbol maps to a specific *transformation* — a rotation (cyclic shift) followed by one or more swaps of card positions. After each transformation the top card of the deck is read as the ciphertext (CT) symbol. Because the deck changes with every character, the same PT letter produces a different CT letter depending on what came before it.

**Relation to the Noita Eye Messages**
> The deck ciphers implemented here are based on community research into the [Noita Eye Puzzle](https://noita.wiki.gg/wiki/Eye_Messages) — an unsolved cryptogram in the video game Noita. One theorized mechanism is a *Group Autokey (GAK)* cipher, a class of deck cipher that this tool explores.
>
> Note: DeckLab only supports 26 symbols (A–Z); any true Eye Puzzle mechanism would require 83 symbols. Additionally only swap and rotation transformations are supported — other shuffle types may exist in the real mechanism.

---

### Feature rows

Each row: **description on left**, **visual on right**.

---

#### Row 1 — Cipher Controls

**Description:**
- **Randomize Cipher** generates a new random cipher using the current Swaps / Rotations settings.
- **Swaps** (1–13) controls how many card-position pairs are exchanged per transformation.
- **Rotations** (0–25) sets the maximum cyclic shift applied before swaps; 0 disables rotation entirely.
- **Constant Rotations** (checkbox) — when checked, every transformation uses exactly the rotation max value; when unchecked, each picks a random amount from 1 to max.
- **Inspect Cipher** opens the Cipher Inspector modal (see below).

**Visual:**
Styled mock buttons and input chips matching the app palette:

```
[ Randomize Cipher ]  [ Inspect Cipher ]  [ Show Tutorial ]

Swaps: [4]   Rotations: [1]   [✓] Constant Rotations
```

Rendered as styled `<span>` and `<code>` elements — not interactive.

---

#### Row 2 — Encipherment

**Description:**
Encipherment starts from the ordered deck A–Z. For each PT character:
1. Look up that character's transformation (rotation + swaps).
2. Apply the rotation (cyclic left-shift by N positions).
3. Apply the swaps (exchange the specified card pairs).
4. The new top card is the CT character.

The deck evolves with every character, so identical PT letters produce different CT letters depending on context.

**Visual:**
ASCII-style encipherment diagram:

```
Deck: [A][B][C][D] … [Z]
        ↓  PT = "H"
   rotation ↺1 → [B][C][D] … [Z][A]
   swap 0↔3  → [D][C][B] … [Z][A]
   swap 1↔5  → …
        ↓
   CT = top card
```

Rendered as a `<pre>` block styled in the app's monospace/muted-gray palette.

---

#### Row 3 — Plaintext & Ciphertext Display

**Description:**
- The **Plaintext Output** strip (below the text input) shows only the A–Z characters you typed, uppercased, with non-letter characters removed. This is the exact sequence fed into the cipher.
- The **Ciphertext Output** strip shows the resulting CT characters aligned position-by-position with the filtered plaintext.
- When an isomorph is selected, both strips highlight the two matching substrings (A in purple, B in cyan).
- **Show swap highlights** (checkbox) controls whether cards in the deck views are color-coded by swap pair.

**Visual:**
Two labelled strips showing an example with highlighted substrings:

```
PT:  H E L L O W O R L D
CT:  M Q X F B J R K X P
         ↑_________↑
      isomorph pair (same pattern)
```

Positions 2 and 8 highlighted in purple/cyan using inline `<span style="background:…">` elements.

---

#### Row 4 — Current Deck State

**Description:**
The **Deck View** (bottom of the left panel) shows the deck's current position after the last PT character was enciphered. Each card letter is shown in order; colored backgrounds identify which swap pair moved each card.
- **Show swap highlights** toggles the card colors.
- **Animate deck** enables smooth FLIP animations when the deck reshuffles between characters.

**Visual:**
A row of 10 abbreviated card chips (A–J) with the first 4 using swap-pair colors:

```
[A red][B yel][C blu][D grn][E][F][G][H][I][J] …
swap 1  swap 2  swap 3  swap 4   (no swap)
```

Rendered as inline-flex `<span>` chips with `background-color` from the 13-color palette. Caption explains the color coding.

---

#### Row 5 — Historical Deck State

**Description:**
The **right panel** shows the full encipherment history — one column per PT character. Each column displays:
- The PT character (top, muted gray)
- The CT character (bold)
- The rotation applied (`↺N`, or blank if none)
- All 26 deck cards in their order after that step

Scroll horizontally to view long ciphertexts. The initial `—` column shows the starting A–Z deck before any encipherment.

**Visual:**
A mini three-column mock-up:

```
 —      H      E
        M      Q
        ↺1     ↺1
[A][B]  [D][C] [F][C]
…       …      …
```

Rendered as a small flex-row of labelled column `<div>`s styled to match the MultiDeckView palette.

---

#### Row 6 — Isomorphs

**Description:**
An **isomorph** is a pattern describing which positions in a string share the same character. For example, `fhwofnf` has isomorph pattern `a..ba.a` — position 0, 4, and 6 all share the same letter (labeled `a`), position 3 and another share a different repeated letter (labeled `b`), and `.` marks unique characters.

Two ciphertext substrings are *isomorphic* if they share the same pattern. This can hint that their underlying plaintexts are identical.

Enable **Show isomorphs** to reveal the isomorph list below the deck. Click any entry to highlight the two matching substrings — in the plaintext strip, the ciphertext strip, and the historical deck columns simultaneously.

**Visual:**
An example isomorph entry:

```
a..ba.a  ×3   pos 0 & 7

CT:  [M][Q][X][F][B][J][M] ← purple
                [M][Q][X][F][B][J][M] ← cyan
```

Rendered with colored `<span>` highlights for the two substrings and a monospace pattern label.

---

#### Row 7 — Cipher Inspector

**Description:**
Click **Inspect Cipher** to open the Cipher Inspector — a modal showing the full cipher mapping.

**Table tab:** One row per PT letter (A–Z) showing the rotation amount and each swap pair as a colored chip (e.g. `0↔3`).

**Heatmap tab:** A 26×26 grid where each cell is colored if that deck position is touched by a swap for that PT letter; the right column shows the rotation. Useful for spotting patterns across the full mapping at a glance.

**Visual:**
A 3-row abbreviated table mock-up:

```
PT  ↺   Swaps
A   ↺1  [0↔3 red] [1↔5 yel] [2↔7 blu] [4↔6 grn]
B   ↺1  [0↔2 red] [3↔8 yel] …
…
```

Rendered as a mini `<table>` with swap chips using `background-color` from `SWAP_COLORS`.

---

## 3. `App.svelte` Changes

### State

```ts
let showTutorial = $state(false);
```

### Import

```ts
import TutorialModal from './components/TutorialModal.svelte';
```

### Button placement

Add **"Show Tutorial"** button in the `.controls` div, between "Randomize Cipher" and "Inspect Cipher" (or at the end — see note below):

```svelte
<button onclick={() => showTutorial = true}>Show Tutorial</button>
```

> **Placement note:** "Randomize Cipher" and "Inspect Cipher" are the primary action buttons. "Show Tutorial" is a secondary/help action — placing it at the end of the controls row keeps the primary actions prominent.

### Modal mount

After the `{#if showCipherInspector}` block:

```svelte
{#if showTutorial}
  <TutorialModal onclose={() => showTutorial = false} />
{/if}
```

---

## 4. Styling Conventions (from `CipherInspector.svelte`)

| Property | Value |
|---|---|
| Backdrop background | `rgba(0, 0, 0, 0.65)` |
| Modal background | `#282c34` |
| Modal border | `1px solid #555` |
| Modal border-radius | `8px` |
| Section heading color | `#abb2bf` (muted gray) |
| Section heading style | uppercase, `letter-spacing: 0.05em` |
| Close button | `border: 1px solid #555`, transparent bg, `#abb2bf` color |
| z-index | 100 (same as `CipherInspector`) |
| Swap colors | `SWAP_COLORS` array (13 entries, same as other components) |

Section heading size: `0.85rem`, font-weight 600.
Body text size: `0.9rem`.
Feature description text: `0.875rem`, line-height `1.6`.

---

## 5. Accessibility

- `role="dialog"`, `aria-modal="true"`, `aria-label="Tutorial"` on modal div
- `tabindex="-1"` on modal (matches CipherInspector pattern)
- Close button has `aria-label="Close"`
- Backdrop has `role="presentation"`
- `<svelte:window onkeydown>` handles Escape

---

## 6. No-Test Rationale

`TutorialModal` contains only static text and inline styles — no logic or derived state. The existing `App.test.ts` smoke tests verify the app mounts cleanly; adding a dedicated smoke test for this component is optional but straightforward if desired (import + render with a no-op `onclose`).

---

## Open Questions / Decisions Made

| Question | Decision |
|---|---|
| Where does "Show Tutorial" go? | End of `.controls` row, after existing buttons |
| Should the modal header stay fixed while content scrolls? | Yes — `modal` is `flex-column`; `modal-header` is `flex-shrink:0`; `modal-body` is `overflow-y:auto; flex:1` |
| What form do "visuals" take? | Static styled HTML: mock card chips, colored letter spans, a mini table, a `<pre>` diagram — no interactive elements |
| Should visuals use real app components? | No — importing live components (DeckView, MultiDeckView, etc.) would require passing real state. Static mock-ups are simpler and more self-contained |
| Tabs vs. single scrollable? | Single vertically-scrollable body (no tabs) — the TUTORIAL.md spec says "vertically scrollable so all contents fit" |
| Width | `min(900px, 90vw)`, `min-width: 600px` |
