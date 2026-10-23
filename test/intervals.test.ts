import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// Valid by construction: start <= end because end = start + a non-negative length.
// A small range makes overlapping and touching intervals common.
const interval: fc.Arbitrary<Interval> = fc
  .tuple(fc.integer({ min: -20, max: 20 }), fc.nat({ max: 10 }))
  .map(([start, length]): Interval => [start, start + length]);
const intervalList = fc.array(interval);

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Pattern: invariant. The output is sorted by start, every output interval
  // is valid, and consecutive intervals neither overlap nor touch.
  it('output is sorted, valid, and strictly separated', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (const [s, e] of out) expect(s).toBeLessThanOrEqual(e);
        for (let i = 0; i + 1 < out.length; i++) {
          expect(out[i][1]).toBeLessThan(out[i + 1][0]);
        }
      }),
    );
  });

  // Pattern: differential. A point p is covered by the output exactly when it
  // is covered by the input. Points include half-integers, since the spec
  // covers all reals: 2.5 lies in the gap between [1, 2] and [3, 4]. Besides
  // random points, we check every endpoint and the points just beside it,
  // which is where coverage can change.
  it('output covers exactly the same points as the input', () => {
    const covered = (xs: readonly Interval[], p: number) => xs.some(([s, e]) => s <= p && p <= e);
    const point = fc.integer({ min: -50, max: 70 }).map(k => k / 2);
    fc.assert(
      fc.property(intervalList, fc.array(point, { maxLength: 20 }), (xs, randomPoints) => {
        const out = mergeIntervals(xs);
        const edges = [...xs, ...out].flat().flatMap(x => [x - 0.5, x, x + 0.5]);
        for (const p of [...randomPoints, ...edges]) {
          expect(covered(out, p), `point ${p}`).toBe(covered(xs, p));
        }
      }),
    );
  });

  // Pattern: metamorphic. Shuffling the input, and appending duplicates of some
  // of its intervals, does not change the output.
  it('reordering or duplicating input intervals does not change the output', () => {
    const listAndVariant = intervalList.chain(xs =>
      fc
        .tuple(fc.shuffledSubarray(xs, { minLength: xs.length }), fc.subarray(xs))
        .map(([shuffled, dups]) => [xs, [...shuffled, ...dups]] as const),
    );
    fc.assert(
      fc.property(listAndVariant, ([xs, variant]) => {
        expect(mergeIntervals(variant)).toEqual(mergeIntervals(xs));
      }),
    );
  });

  // Pattern: algebraic. Merging is idempotent: merge(merge(xs)) = merge(xs).
  it('merging an already merged list changes nothing', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: conditional. If no two input intervals overlap or touch, the
  // output is exactly the input, sorted by start. Such inputs are built
  // directly: each interval starts at least 1 after the previous one ends.
  it('separated intervals come back unchanged, just sorted', () => {
    const separated = fc
      .tuple(
        fc.integer({ min: -20, max: 20 }),
        fc.array(fc.tuple(fc.integer({ min: 1, max: 5 }), fc.nat({ max: 5 }))),
      )
      .map(([first, steps]) => {
        const sorted: Interval[] = [];
        let end = first - 1;
        for (const [gap, length] of steps) {
          const start = end + gap;
          end = start + length;
          sorted.push([start, end]);
        }
        return sorted;
      })
      .chain(sorted =>
        fc.shuffledSubarray(sorted, { minLength: sorted.length }).map(shuffled => [sorted, shuffled] as const),
      );
    fc.assert(
      fc.property(separated, ([sorted, shuffled]) => {
        expect(mergeIntervals(shuffled)).toEqual(sorted);
      }),
    );
  });

  // Pattern: invariant. The input array and the intervals in it are not
  // modified, even when the caller later reads them.
  it('does not modify the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const before = structuredClone(xs);
        mergeIntervals(xs);
        expect(xs).toEqual(before);
      }),
    );
  });
});
