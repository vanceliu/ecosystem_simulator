import { describe, expect, it } from 'vitest';
import { applyProcesses, type Pools } from '../../src/engine/fluxes';

describe('flux limiter', () => {
  it('scales competing consumers so pools never go negative', () => {
    const pools: Pools = new Map([
      ['water_tan', 1],
      ['water_no2', 0],
      ['water_no3', 0],
    ]);
    applyProcesses(pools, [
      { name: 'p1', rate: 2, stoichiometry: { water_tan: -1, water_no2: 1 } },
      { name: 'p2', rate: 2, stoichiometry: { water_tan: -1, water_no3: 1 } },
    ]);
    expect(pools.get('water_tan')).toBeCloseTo(0, 12);
    expect(pools.get('water_no2')).toBeCloseTo(0.5, 12);
    expect(pools.get('water_no3')).toBeCloseTo(0.5, 12);
  });

  it('conserves mass along the stoichiometry', () => {
    const pools: Pools = new Map([
      ['water_o2', 10],
      ['water_co2', 3],
      ['water_po4', 0],
    ]);
    applyProcesses(pools, [
      { name: 'p', rate: 4, stoichiometry: { water_o2: -1, water_co2: -0.5, water_po4: 1.5 } },
    ]);
    const total = [...pools.values()].reduce((sum, value) => sum + value, 0);
    expect(total).toBeCloseTo(13, 12);
    expect(pools.get('water_po4')).toBeCloseTo(6, 12);
  });

  it('ignores processes with zero rate', () => {
    const pools: Pools = new Map([['water_tan', 1]]);
    applyProcesses(pools, [{ name: 'p', rate: 0, stoichiometry: { water_tan: -1 } }]);
    expect(pools.get('water_tan')).toBe(1);
  });
});
