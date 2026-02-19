# DeckLab

https://jacoblnd.github.io/DeckLab/

A visualization tool for understanding deck ciphers.

## Current Implementation

On page load, a constant deck cipher is generated with a sliding window of 4 swaps.
There is some additional complexity with the choice of which index the top card
swaps with to ensure that all 26 swaps are unique.
The constant sliding window deck cipher has the same properties as the randomly-generated
deck cipher described below.

The randomize deck button generates a deck with transfomrations with the following 
properties:

1. Each PT symbol maps to 4 swaps.
2. No 2 PT symbols map to the same set of swaps.
3. Each set of swaps always includes a change to the top card.

Encipherment involves an initial deck state and reading PT symbols in order.

The initial deck state is always the ordered deck A-Z.

Then:
1. Read the next PT symbol.
2. Transform the current deck state according to the swaps associated with that PT symbol.
3. Read the top card of the deck which is the new CT symbol.


## Future Feature Thoughts

- Visual exploration of the current deck cipher:
- - Inspecting each transformation associated with a given PT symbol
- More configurability for ciphers:
- - Different numbers of swaps other than 4
- - Different transformations (e.g., rotations, swaps+rotations)
- - Manual configuration of ciphers

