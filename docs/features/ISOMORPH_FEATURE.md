Isomorphs in Ciphertext are an interesting property which need to be calculated.

An incomplete definition of isomorphs:
Two substrings of a Ciphertext are considered isomorphic if some of their repeated
characters are substitutions of each other.
The isomorph which represents them is written as letters (a-z) and the period character (.).
Letters represent a Ciphertext symbol which repeats somewhere else in the isomorph.
The period symbol represents Ciphertext symbols which do not repeat or aren't part of the repeating pattern when two Ciphertext strings are compared.

Example:

Ciphertext 1: ahwoanao
Ciphertext 2: uvonuyun

isomorph: a..ba.ab

In Ciphertext 1 and 2, the 1st, 5th, and 7th characters are the same and are represented
in the isomorph as 'a'.
The 4th and 8th characters are also the same and are represented in the isomorph as 'b'.
The 2nd, 3rd, and 6th characters are represented as periods which indicate they aren't part of the isomorphic pattern.

Don't try to implement the visualization of isomorphs yet.

Instead, calculate them but do not make changes to the UI to display them.

Ask any questions required to more deeply understand what isomorphs are and how to
write an algorithm to calculate all of the isomorphs from the current ciphertext.

