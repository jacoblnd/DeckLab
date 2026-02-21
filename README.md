# DeckLab

https://jacoblnd.github.io/DeckLab/

An interactive deck cipher visualization tool.

## Deck Cipher

A deck cipher is a type of [auto-key cipher](https://en.wikipedia.org/wiki/Autokey_cipher)
which uses a deck of cards to represent the cipher state and a specific set of shuffles to represent
state changes and ciphertext output.

### Relation to Eye Messages

The implementation and terminology used by this deck cipher tool is based on my limited
understanding of the collective community works in trying to solve a cryptogram in the
video game Noita: The [Noita eye messages](https://noita.wiki.gg/wiki/Eye_Messages).

A type of deck cipher is theorized as one of the possible implementations (or functionally
equivalent implementations) of the mechanism which created the Eye Puzzle cryptogram.
This deck cipher falls into the
[Group Autokey](https://github.com/Lymm37/eye-messages/wiki/Group-Autokey-%28GAK%29) class of ciphers
in the Noita Eye Puzzle community.
The properties of the cipher described below were chosen specifically to meet this criteria.

One major difference in the implementation of this deck cipher is that it only supports 26 Ciphertext
symbols whereas any true Eye Puzzle encipherment mechanism would need to support 83.
Additionally, the shuffle algorithms are currently simplistic in that they only support a limited number
of swaps.
Other shuffle transformations may exist in the true Eye Puzzle encipherment mechanism (if it is represented by
a deck cipher at all) such as rotations or decimations.

## Current Implementation

On page load, a constant deck cipher is generated with a sliding window of 4 swaps.
There is some additional complexity with the choice of which index the top card
swaps with to ensure that all 26 swaps are unique.
The constant sliding window deck cipher has the same properties as the randomly-generated
deck cipher described below.

The randomize deck button generates a deck cipher with the following properties:

1. Each PT symbol maps to 4 swaps.
2. No 2 PT symbols map to the same set of swaps.
3. Each set of swaps always includes a change to the top card.

Encipherment involves an initial deck state and reading PT symbols in order.

The initial deck state is always the ordered deck A-Z.

Then:
1. Read the next PT symbol.
2. Transform the current deck state according to the swaps associated with that PT symbol.
3. Read the top card of the deck which is the new CT symbol.

### Historical Deck State

All previous states of the deck and their corresponding ciphertext output are displayed on
the right side of the page.

### Isomorphs

#### Isomorphs - Bacgkround

An isomorph in the context of autokey ciphers is a pattern that describes which positions in a string
share the same character.
For example, the string `fhwofnf` produces the isomorph pattern `a..ba.ab` indicating that positions 0, 4, 6
all contain the same character (labeled 'a') and positions 3 and 7 both contain the same character which is
distinctly different from the first character (labeled 'b').
The `.` character is used to represent symbols (characters) which do not repeat.
Two strings are isomorphic if they produce the same isomorph.
`uvonuyun` also produces the isomorph `a..ba.ab` and is, therefore, isomorphic with the first string `fhwofnf`.

The isomorphic properties of a given ciphertext are important in understanding the underlying encipherment mechanism.
There are many reasons for this but one major reason is that two pieces of ciphertext which are isomorphic suggest that
their underlying plaintext may be the same.

For more information on isomorphs, see [Isomorphs](https://github.com/Lymm37/eye-messages/wiki/Isomorphs-%28Gap-Patterns%29).
To interact with isomorphs specifically in the eye messages, see Tomster12's [Isomorph Viewer](https://tomster12.github.io/isomorph-viewer/)

#### Isomorphs - Visually

Isomorphs in the ciphertext are automatically generated in the background.
They can be visualized by checking the `Show Isomorphs` box, after which they will appear below the main deck state.
Selecting one of the isomorphs will visually highlight which 2 substrings of the ciphertext are isomorphic with each other.
Isomorphs of length 2 are omitted. They don't seem that interesting.


## Future Feature Thoughts

- Visual exploration of the current deck cipher:
- - Inspecting each transformation associated with a given PT symbol
- More configurability for ciphers:
- - Different numbers of swaps other than 4
- - Different transformations (e.g., rotations, swaps+rotations)
- - Manual configuration of ciphers

