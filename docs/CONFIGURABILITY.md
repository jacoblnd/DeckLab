DeckLab should provide more configurability for deck ciphers.

The deck ciphers still need to maintain the properties:

1. All transformations result in the top card changing.
2. Every PT symbol has a corresponding transformation.
3. No two transformations are the same.


Some additional configurability which should be available for randomly-generating
a deck cipher is:

1. The number of swaps. (currently only supports 4)
2. The number of rotations (rotations are not currently supported)

From the view, these should be configurable and applied when the Randomize Cipher
button is pressed (in the same manner that the current random cipher mechanism works).

