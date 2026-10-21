import { describe, expect, it } from 'vitest';
import { applyProcesses, type Pools } from '../../src/engine/fluxes';

describe('flux limiter', () => {
  it('scales competing consumers so pools never go negative', () => {
    const pools: Pools = new Map([
      ['a', 1],
      ['b', 0],
      ['c', 0],
    ]);
    applyProcesses(pools, [
      { name: 'p1', rate: 2, stoichiometry: { a: -1, b: 1 } },
      { name: 'p2', rate: 2, stoichiometry: { a: -1, c: 1 } },
    ]);
    expect(pools.get('a')).toBeCloseTo(0, 12);
    expect(pools.get('b')).toBeCloseTo(0.5, 12);
    expect(pools.get('c')).toBeCloseTo(0.5, 12);
  });

  it('conserves mass along the stoichiometry', () => {
    const pools: Pools = new Map([
      ['x', 10],
      ['y', 3],
      ['z', 0],
    ]);
    applyProcesses(pools, [{ name: 'p', rate: 4, stoichiometry: { x: -1, y: -0.5, z: 1.5 } }]);
    const total = [...pools.values()].reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(13, 12);
    expect(pools.get('z')).toBeCloseTo(6, 12);
  });

  it('ignores processes with zero rate', () => {
    const pools: Pools = new Map([['a', 1]]);
    applyProcesses(pools, [{ name: 'p', rate: 0, stoichiometry: { a: -1 } }]);
    expect(pools.get('a')).toBe(1);
  });
});
