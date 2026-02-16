This project is a deck cipher visualization tool called DeckLab.

DeckLab will be a static web app hosted on github pages.

DeckLab project will be written in TypeScript using Svelte with Vite.

The DeckLab project will also include a docker and docker compose file for running the web app locally for faster iteration.

The static web app will be relatively simple with only a few components initially. It will not include any backend but it will need to maintain an internal state.

DeckLab will be an interactive deck cipher tool.

A deck cipher is a type of cipher which can be visually represented as a deck of cards (for simplicity, the deck will just be 26 static cards - one for each letter of the alphabet).

A deck cipher is a type of auto-key cipher used to encipher Plaintext symbols into Ciphertext symbols.

As subsequent Plaintext symbols are read, the deck changes state (the order of the cards) according to certain rules and outputs Ciphertext symbols.

For now, the nature of how a deck cipher changes isn't important. The important thing to understand about the deck cipher for now is that it will be represented
visually as a set of 26 cards which change order as Plaintext is inputted by the user.

Initially, there will only be 3 visual components laid out top to bottom on the page:

1. A Plaintext input box.
2. A Ciphertext read-only text box which updates with each letter typed by the Plaintext.
3. A container which shows the current deck state.

The cards should be simple and generated for flexibility.

DeckLab should include tests for the core logic functionality (the deck cipher logic) and, ideally, some minimal UI tests to catch UI regressions.

