Now that the scaffolding is in place, the core deck cipher logic can be written.

Before introducing the properties of a deck cipher, its important to discuss terminology:

**Deck Transformations / Card Swaps**

There are many different ways to change the order of cards in a deck. This is also referred to as transforming the deck state. One way to do so is with a certain number of card swaps. A swap is the transformation of the deck state such that certain cards swap positions. For example, a single swap could be swapping the 1st card with the 14th card. A transformation involving two swaps could be swapping the 11th and the 15th card as well as the 26th and the 8th card.

One way to visually represent a set of swaps with a deck is to take an initial ordered deck (from A to Z), perform the swaps, and then display the order of the deck afterwards.

This visual representation is not important right now but will be important for the future when further exploration of the deck cipher is implemented.

A deck cipher has the following properties:

1. Each Plaintext (PT) symbol maps to a distinct transformation (set of swaps).
2. No two PT symbols can map to the same transformation.
3. Every transformation must move the top card of the deck.

**Encipherment**

Using a deck cipher involves:

1. Taking an initial deck state (for now, the ordered A-Z deck is fine).
2. For each PT symbol read:
2a. Perform the transformation to the deck for that PT symbol.
2b. Output the top card of the deck as the CT symbol.

For now, all deck ciphers should be generated such that each PT symbol transformation involves 4 swaps.

A deck cipher should be randomly generated based on some constant configuration on each page reload.

