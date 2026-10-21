import { describe, expect, it } from 'vitest';
import { createRng, hashSeed, rngForTick } from '../../src/engine/rng';

const draw = (seed: number, count: number): number[] => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng.next());
};

describe('rng', () => {
  it('reproduces the same sequence for the same seed', () => {
    expect(draw(42, 20)).toEqual(draw(42, 20));
  });

  it('produces different sequences for different seeds', () => {
    expect(draw(42, 20)).not.toEqual(draw(43, 20));
  });

  it('hashes string seeds deterministically', () => {
    expect(hashSeed('reef')).toBe(hashSeed('reef'));
    expect(hashSeed('reef')).not.toBe(hashSeed('reed'));
  });

  it('gives independent streams per tick', () => {
    const seed = hashSeed('world');
    expect(rngForTick(seed, 1).next()).not.toBe(rngForTick(seed, 2).next());
    expect(rngForTick(seed, 7).next()).toBe(rngForTick(seed, 7).next());
  });

  it('is uniform on [0, 1)', () => {
    const values = draw(2024, 100_000);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(mean).toBeGreaterThan(0.49);
    expect(mean).toBeLessThan(0.51);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
  });
});
