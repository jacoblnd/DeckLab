import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import App from '../../App.svelte';

describe('App', () => {
  it('renders without errors', () => {
    render(App);
    expect(screen.getByText('DeckLab')).toBeTruthy();
  });

  it('has a plaintext input', () => {
    render(App);
    expect(screen.getByTestId('plaintext-input')).toBeTruthy();
  });

  it('has a ciphertext output', () => {
    render(App);
    expect(screen.getByTestId('ciphertext-output')).toBeTruthy();
  });

  it('renders 26 cards in the deck', () => {
    render(App);
    const deck = screen.getByTestId('deck');
    expect(deck.children).toHaveLength(26);
  });
});
