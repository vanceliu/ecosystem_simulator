import { describe, expect, it } from 'vitest';
import {
  cloneState,
  computeGeometry,
  createInitialState,
  populationCod,
  populationCount,
  step,
  totalNitrogen,
  totalPhosphorus,
  trophicLevels,
} from '../../src/engine/index';
import { createBioContext } from '../../src/engine/bioContext';
import { cohortCod, phenotypeOf } from '../../src/engine/biota';
import { attackTerms, foodNodes, indexFood, predatorOf } from '../../src/engine/consumers';
import { removeExtinct } from '../../src/engine/demography';
import { toPools } from '../../src/engine/pools';
import type {
  CohortPopulation,
  Command,
  SimEvent,
  SimulationState,
  TankConfig,
} from '../../src/engine/types';
import { CYCLING_TANK } from './fixtures';
import { params } from '../params';

const WILD = { origin: 'wild', realm: 'IM' } as const;
const POND_TANK: TankConfig = {
  ...CYCLING_TANK,
  waterSource: 'pond',
  waterRealm: 'IM',
  substrateSource: WILD,
  hardscape: CYCLING_TANK.hardscape.map((item) => ({ ...item, source: WILD })),
  lightPpfd: 40,
};
const FEED_MG = 20;
const RELEASE_DAY = 20;

interface Run {
  readonly initial: SimulationState;
  readonly final: SimulationState;
  readonly events: readonly SimEvent[];
  readonly negatives: number;
}

function run(config: TankConfig, seed: string, days: number): Run {
  const initial = createInitialState(params, config, seed);
  let state = initial;
  const events: SimEvent[] = [];
  let negatives = 0;
  for (let tick = 0; tick < days * 24; tick += 1) {
    const commands: Command[] = [];
    if (tick % 24 === 9) commands.push({ type: 'feed', dryMassMg: FEED_MG });
    if (tick === RELEASE_DAY * 24 + 10) {
      for (const archetypeId of ['planktivore_fish', 'shrimp', 'snail'] as const)
        commands.push({ type: 'release', archetypeId });
    }
    const result = step(params, state, commands);
    state = result.state;
    events.push(...result.events);
    for (const population of state.populations) {
      const cod = populationCod(params, population);
      if (!(cod >= 0) || !Number.isFinite(cod)) negatives += 1;
      if (population.kind === 'cohort') {
        for (const cohort of population.cohorts) {
          if (!(cohort.count >= 0 && cohort.meanMassMg > 0)) negatives += 1;
        }
      }
    }
  }
  return { initial, final: state, events, negatives };
}

const stocked = run(POND_TANK, 'populations', 35);

describe('population dynamics (docs/04 §5)', () => {
  it('conserves nitrogen and phosphorus with animals, plants and microbes', () => {
    const { initial, final } = stocked;
    const nExpected = totalNitrogen(params, initial) + final.ledger.nIn - final.ledger.nOut;
    const pExpected = totalPhosphorus(params, initial) + final.ledger.pIn - final.ledger.pOut;
    expect(Math.abs(totalNitrogen(params, final) - nExpected) / nExpected).toBeLessThan(1e-9);
    expect(Math.abs(totalPhosphorus(params, final) - pExpected) / pExpected).toBeLessThan(1e-9);
  });

  it('keeps biomass, counts and masses non-negative and finite', () => {
    expect(stocked.negatives).toBe(0);
  });

  it('brings in species through setup routes and player release', () => {
    const vectors = new Set(stocked.final.populations.map((population) => population.vector));
    expect(stocked.final.populations.length).toBeGreaterThan(5);
    expect(Object.keys(stocked.final.species).length).toBeGreaterThan(10);
    expect([...vectors].some((vector) => vector !== 'background')).toBe(true);
  });

  it('records feeding fluxes and trophic levels above producers', () => {
    expect(Object.keys(stocked.final.records.feeding).length).toBeGreaterThan(0);
    const levels = Object.values(stocked.final.records.trophicLevels);
    expect(Math.max(...levels)).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic for the same seed and commands', () => {
    const a = run(POND_TANK, 'determinism', 8);
    const b = run(POND_TANK, 'determinism', 8);
    expect(JSON.stringify(a.final)).toBe(JSON.stringify(b.final));
    expect(cloneState(a.final)).toEqual(a.final);
  });
});

describe('population conservation principle (docs/04 §9.1)', () => {
  it('removes only populations below one individual and returns their mass to detritus', () => {
    const state = cloneState(stocked.final);
    const victim = state.populations.find(
      (population): population is CohortPopulation =>
        population.kind === 'cohort' && populationCount(population) >= 1,
    );
    expect(victim).toBeDefined();
    if (victim === undefined) return;
    for (const cohort of victim.cohorts) cohort.count *= 0.5 / populationCount(victim);
    const before = totalNitrogen(params, state);
    const others = state.populations.length - 1;
    removeExtinct(params, state);
    expect(state.populations.length).toBe(others);
    expect(Math.abs(totalNitrogen(params, state) - before) / before).toBeLessThan(1e-12);
  });

  it('applies carrying capacity through crowding, never by truncating counts', () => {
    const state = cloneState(stocked.final);
    const population = state.populations.find(
      (candidate): candidate is CohortPopulation =>
        candidate.kind === 'cohort' && populationCount(candidate) >= 1,
    );
    expect(population).toBeDefined();
    if (population === undefined) return;
    for (const cohort of population.cohorts) cohort.count *= 1000;
    const crowded = populationCount(population);
    const next = step(params, state).state;
    const after = next.populations.find((candidate) => candidate.id === population.id);
    expect(after?.kind).toBe('cohort');
    if (after?.kind !== 'cohort') return;
    expect(populationCount(after)).toBeGreaterThan(crowded * 0.5);
  });

  it('kills every individual at the maximum lifespan', () => {
    const state = cloneState(stocked.final);
    const population = state.populations.find(
      (candidate): candidate is CohortPopulation =>
        candidate.kind === 'cohort' &&
        params.archetypes[candidate.archetypeId].lifeHistory.senescence === 'gompertz',
    );
    expect(population).toBeDefined();
    if (population === undefined) return;
    const maxDays = phenotypeOf(params, population.speciesId).lifespan.maxDays;
    population.cohorts = population.cohorts.map((cohort) => ({
      ...cohort,
      birthTick: state.tick - Math.ceil(maxDays * 24) - 24,
    }));
    const next = step(params, state).state;
    const after = next.populations.find((candidate) => candidate.id === population.id);
    const remaining =
      after?.kind === 'cohort' ? after.cohorts.reduce((s, c) => s + cohortCod(params, c), 0) : 0;
    expect(remaining).toBe(0);
  });
});

describe('emergence and release (docs/04 §7, docs/06 §2)', () => {
  it('only lets archetypes native to the source realm arrive from wild materials', () => {
    const antarctic = { origin: 'wild', realm: 'AN' } as const;
    const state = createInitialState(
      params,
      {
        ...POND_TANK,
        waterRealm: 'AN',
        substrateSource: antarctic,
        hardscape: POND_TANK.hardscape.map((item) => ({ ...item, source: antarctic })),
      },
      'antarctic',
    );
    for (const population of state.populations) {
      if (population.vector === 'background') continue;
      expect(params.nativeRanges[population.archetypeId].realms).toContain('AN');
    }
  });

  it('rejects a release that does not fit the minimum enclosure', () => {
    const state = createInitialState(params, POND_TANK, 'small-tank');
    const result = step(params, state, [{ type: 'release', archetypeId: 'arowana' }]);
    const rejection = result.events.find((event) => event.type === 'release_rejected');
    expect(rejection?.detail).toBeDefined();
    expect(result.state.populations.some((p) => p.archetypeId === 'arowana')).toBe(false);
  });
});

describe('functional response (docs/04 §5.4)', () => {
  it('lets a predator switch fully to the only food kind present', () => {
    const state = createInitialState(params, POND_TANK, 'switching');
    const released = step(params, state, [
      { type: 'release', archetypeId: 'planktivore_fish' },
    ]).state;
    released.substances.food_cod = 100;
    released.substances.food_n = 5;
    released.substances.food_p = 1;
    const context = createBioContext(
      params,
      released,
      toPools(params, released),
      computeGeometry(params, POND_TANK),
      1,
    );
    const fish = released.populations.find((p) => p.archetypeId === 'planktivore_fish');
    expect(fish).toBeDefined();
    if (fish === undefined) return;
    const predator = predatorOf(context, fish);
    expect(predator).not.toBeNull();
    if (predator === null) return;
    const feed = attackTerms(context, predator, indexFood(foodNodes(context, []))).find(
      (entry) => entry.kind === 'food',
    );
    expect(feed?.term ?? 0).toBeGreaterThan(1);
  });
});

describe('trophic levels (docs/04 §6)', () => {
  it('chains producers, grazers and predators and ignores cannibalism', () => {
    const levels = trophicLevels({
      'alga>snail': [10, 0, 0, 0, 0, 0, 0],
      'snail>fish': [5, 0, 0, 0, 0, 0, 0],
      'fish>fish': [5, 0, 0, 0, 0, 0, 0],
    });
    expect(levels.snail).toBeCloseTo(2, 9);
    expect(levels.fish).toBeCloseTo(3, 9);
  });
});
