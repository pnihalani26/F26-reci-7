import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Step 1: a generator for five-letter uppercase words.
 const wordForm = (letters: string) =>
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5}).map(cs => cs.join(''));
//  const word = wordForm(ALPHABET);

 const word = wordForm('ABC');

describe('matchGuess', () => {

  it ('returns exactly five colors', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        expect(matchGuess(secret, guess)).toHaveLength(5);
      }),
    );
  });

  it ('only uses the colors G, Y, B', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        for (const color of matchGuess(secret, guess)) expect(['G', 'Y', 'B']).toContain(color);
      }),
    );
  });

  it ('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(word, w => {
        expect(matchGuess(w, w)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });

  it('never credits a letter more times than the secret contains it', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const credited = [...guess].filter((c, i) => c === letter && result[i] !== 'B').length;
          const inSecret = [...secret].filter(c => c === letter).length;
          expect(credited).toBeLessThanOrEqual(inSecret);
        }
      }),
    );
  });

  // Pattern: conditional. If the guess is a rearrangement of the secret, every
  // guess letter has a matching letter in the secret, so nothing is black.
  // Rearrangements are generated directly by shuffling the secret.
  it('a rearrangement of the secret has no blacks', () => {
    const secretAndAnagram = word.chain(secret =>
      fc.shuffledSubarray([...secret], { minLength: 5 }).map(cs => [secret, cs.join('')] as const),
    );
    fc.assert(
      fc.property(secretAndAnagram, ([secret, guess]) => {
        expect(matchGuess(secret, guess)).not.toContain('B');
      }),
    );
  });
});