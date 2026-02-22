# DeckLab — Project Setup Plan

## Overview

Set up the DeckLab Svelte + TypeScript + Vite static web app — a deck cipher visualization tool hosted on GitHub Pages. The Vite scaffold already exists and just needs to be relocated and built upon.

---

## 1. Relocate Scaffolded Project to Repo Root

The `npm create vite@latest` scaffold landed in a nested `DeckLab/DeckLab/` subdirectory. Move its contents (package.json, src/, index.html, vite.config.ts, tsconfig files, etc.) up to the repo root so the project structure is flat.

- Move all files/directories from `DeckLab/DeckLab/` to `DeckLab/`.
- Remove the now-empty `DeckLab/DeckLab/` directory.
- Set `base: '/DeckLab/'` in `vite.config.ts` so assets resolve correctly on GitHub Pages.

## 2. Install Additional Dependencies

The Svelte template already provides `svelte`, `vite`, `@sveltejs/vite-plugin-svelte`, and `typescript`.

Additional dev dependencies to install:
- `vitest` — unit test runner
- `@testing-library/svelte` — lightweight Svelte component testing
- `@testing-library/jest-dom` — DOM matchers
- `jsdom` — DOM environment for Vitest
- `gh-pages` — manual GitHub Pages deployment

## 3. Project Structure

```
DeckLab/
├── docs/                        # Project documentation (existing)
├── src/
│   ├── app.css                  # Minimal global reset/base styles
│   ├── App.svelte               # Root component — layout of the 3 main sections
│   ├── main.ts                  # Entry point
│   ├── lib/
│   │   └── cipher/
│   │       ├── deck.ts          # Deck state & cipher logic (pure functions)
│   │       └── deck.test.ts     # Unit tests for cipher logic
│   └── components/
│       ├── PlaintextInput.svelte       # Plaintext input box
│       ├── CiphertextOutput.svelte     # Read-only ciphertext display
│       ├── DeckView.svelte             # Visual deck state container
│       ├── Card.svelte                 # Single card component
│       └── __tests__/
│           └── App.test.ts             # Basic UI smoke test
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

## 4. Component Outlines

### `App.svelte`
- Vertical layout with three sections stacked top-to-bottom.
- Holds the deck state (array of 26 cards, A–Z).
- Passes state and callbacks down to child components.

### `PlaintextInput.svelte`
- A text input or textarea.
- On each keystroke (letter A–Z), emits an event/calls a callback to process the new letter through the cipher.

### `CiphertextOutput.svelte`
- Read-only text area or `<div>` displaying the accumulated ciphertext.
- Reactively updates as ciphertext symbols are produced.

### `DeckView.svelte`
- Renders 26 `Card` components in current deck order.
- Receives the deck state array as a prop.

### `Card.svelte`
- Simple styled card displaying a single letter.
- Scoped Svelte CSS for styling (border, padding, font).

## 5. Cipher Logic Stub (`src/lib/cipher/deck.ts`)

- Export a `DeckState` type (array of 26 letters).
- Export `createInitialDeck(): DeckState` — returns A–Z in order.
- Export `encipherStep(deck: DeckState, plaintextChar: string): { newDeck: DeckState; ciphertextChar: string }` — stub that returns the character unchanged and the deck unmodified (placeholder for real cipher logic later).
- Pure functions, no side effects — easy to test.

## 6. Testing Setup

### Vitest config (in `vite.config.ts`):
```ts
test: {
  environment: 'jsdom',
  globals: true,
}
```

### Unit tests (`deck.test.ts`):
- `createInitialDeck()` returns 26 letters A–Z.
- `encipherStep()` returns expected output (stub behavior for now).

### Component test (`App.test.ts`):
- Renders `App.svelte` without errors.
- Plaintext input is present and typeable.
- Ciphertext output area exists.
- 26 cards are rendered.

### npm scripts:
- `npm run test` — runs Vitest in watch mode.
- `npm run test:ci` — single run for CI.

## 7. GitHub Pages Deployment (Manual)

No CI/CD pipeline for now. Manual deployment steps:

```bash
npm run build          # outputs to dist/
npx gh-pages -d dist   # publishes dist/ to gh-pages branch
```

Add an npm script:
- `npm run deploy` — builds and publishes to GitHub Pages.

## 8. Steps to Execute

1. Move scaffolded files from `DeckLab/DeckLab/` to repo root; delete the nested directory.
2. Install additional dev dependencies (vitest, @testing-library/svelte, @testing-library/jest-dom, jsdom, gh-pages).
3. Configure `vite.config.ts` (base path, test config).
4. Create the `src/lib/cipher/` directory with `deck.ts` stub and `deck.test.ts`.
5. Replace template Svelte components with DeckLab components (`App`, `PlaintextInput`, `CiphertextOutput`, `DeckView`, `Card`).
6. Create the component test in `src/components/__tests__/App.test.ts`.
7. Update `package.json` scripts (`test`, `test:ci`, `deploy`).
8. Update `.gitignore` for Node/Vite artifacts.
9. Verify: `npm run dev` serves locally, `npm run test` passes.
