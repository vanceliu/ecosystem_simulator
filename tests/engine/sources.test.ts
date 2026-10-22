import { describe, expect, it } from 'vitest';
import { WILD_LITTER_STOCK } from '../../src/content/tankOptions';
import {
  computeGeometry,
  createInitialState,
  khDkh,
  populationCod,
  salinityPpt,
} from '../../src/engine/index';
import { waterComposition } from '../../src/engine/sourceWater';
import type { TankConfig } from '../../src/engine/types';
import { CYCLING_TANK, tank } from './fixtures';
import { runDays } from './simulation';

const WILD = { origin: 'wild', realm: 'IM' } as const;
const CLEAN = { origin: 'clean', realm: 'IM' } as const;
const NO_FEED = 0;

const sterile: TankConfig = {
  ...CYCLING_TANK,
  waterSource: 'ro',
  substrateSource: CLEAN,
  hardscape: [{ type: 'rock', source: CLEAN }],
};
const wild: TankConfig = {
  ...CYCLING_TANK,
  waterSource: 'pond',
  substrateSource: WILD,
  hardscape: [{ type: 'rock', source: WILD }],
};

describe('fill water composition (docs/04 §3)', () => {
  it('makes synthetic seawater from RO water and sea salt', () => {
    const fill = waterComposition({ ...CYCLING_TANK, waterSource: 'ro', salinityPpt: 35 });
    expect(fill.salinityPpt).toBe(35);
    expect(fill.kh).toBeCloseTo(8, 6);
    expect(fill.ca).toBeCloseTo(420, 6);
    expect(fill.inoculum).toEqual({});
  });

  it('dilutes natural seawater with RO water to the target salinity', () => {
    const fill = waterComposition({ ...CYCLING_TANK, waterSource: 'seawater', salinityPpt: 14 });
    expect(fill.sourceFraction).toBeCloseTo(0.4, 6);
    expect(fill.inoculum.heterotroph).toBeCloseTo(4e5, 0);
  });

  it('carries salinity and hardness into the tank', () => {
    const state = createInitialState(
      { ...CYCLING_TANK, waterSource: 'ro', salinityPpt: 35 },
      'salt',
    );
    expect(salinityPpt(state)).toBeCloseTo(35, 6);
    expect(khDkh(state)).toBeCloseTo(8, 6);
  });
});

describe('self-sustaining tanks without feeding (docs/06 §4)', () => {
  it('stays without load when water and materials are clean', () => {
    const run = runDays(sterile, 'sterile', 120, NO_FEED, 9);
    expect(run.final.tracking.cycleStatus).toBe('no_load');
    expect(run.events.filter((event) => event.type.startsWith('cycle'))).toEqual([]);
  });

  it('cycles on the organic load carried by wild water, rock and sand', () => {
    const initial = createInitialState(wild, 'wild');
    expect(initial.water.detritus.n).toBeGreaterThan(0);
    const run = runDays(wild, 'wild', 120, NO_FEED, 9);
    const types = run.events.map((event) => event.type);
    expect(types).toContain('cycle_started');
    expect(types).toContain('cycle_complete');
    expect(run.final.tracking.cycleStatus).toBe('complete');
  });

  it('receives nitrogen from rain outdoors', () => {
    const outdoor = tank(
      { zone: 'temperate', moisture: 'humid', habitat: 'pond_wetland', realm: 'PA' },
      'outdoor',
    );
    const run = runDays(outdoor, 'rain', 90, NO_FEED, 9);
    expect(run.final.ledger.nIn).toBeGreaterThan(0);
  });
});

describe('wild land materials (docs/11 §6)', () => {
  it('lays down a forest-floor litter stock for the latitude zone', () => {
    const config: TankConfig = {
      ...CYCLING_TANK,
      landFraction: 0.5,
      landSubstrate: 'leaf_litter',
      landSubstrateDepthCm: 8,
      landSubstrateSource: { origin: 'wild', realm: 'IM' },
    };
    const state = createInitialState(config, 'litter');
    const landAreaM2 = computeGeometry(config).landAreaM2;
    const expectedDryMg = WILD_LITTER_STOCK.tropical.value * landAreaM2 * 1000;
    expect(state.land.litter.cod).toBeCloseTo(expectedDryMg * 1.2, 3);
    const soil = state.populations.find((population) => population.archetypeId === 'soil_bacteria');
    expect(soil === undefined ? 0 : populationCod(soil)).toBeGreaterThan(0);
  });
});
