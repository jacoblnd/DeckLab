The isomorph feature and visualization should be refined and extended.


## Plaintext Highlighting

The largest feature here will be to visually include a div below the plaintext
and above the ciphertext which will be the same size as the ciphertext div and
will support highlighting of the plaintext positions in the same way that the
ciphertext div supports highlighting of the ciphertext positions when isomorphs
are selected.
Both the plaintext and ciphertext divs should be a constant vertical size and
vertically scrollable so that large text doesn't push all of the divs and the
rest of the components down.

## MultiDeckView Highlighting

In addition to highlighting the plaintext and ciphertext div substrings, the
MultiDeckView should also have the corresponding columns highlighted. This should
probably manifest as an outline surrounding the full columns representing substrings
and the outline line color should be the same as the 1st/2nd isomorph substring
highlight colors respectively.

## Isomorph ordering

Isomorph ordering is currently by number of occurrences first. Instead, it should
prioritize ordering by interestingness first and then number of occurrences.

