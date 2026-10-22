import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ArchetypeId } from '../../src/content/archetypeIds';
import { createInitialState, populationSize, step, waterPh } from '../../src/engine/index';
import type { Command, SimulationState, TankConfig } from '../../src/engine/types';
import { recommendTankConfig, representativeLocation } from '../../src/game/setup';
import { loadParameterSet } from '../../tools/reference-node';

const params = await loadParameterSet();

const DAYS = 20;
const RELEASE_TICK = 5 * 24 + 10;
const FEED_HOUR = 9;
const FEED_MG = 20;
const RELATIVE_TOLERANCE = 1e-9;
const FIXTURE = new URL('../fixtures/regression-m3.json', import.meta.url);

const WILD = { origin: 'wild', realm: 'IM' } as const;

function preset(
  habitat: 'stream' | 'coral_reef' | 'rainforest_floor',
  waterSource: TankConfig['waterSource'],
): TankConfig {
  const base = recommendTankConfig(
    params,
    representativeLocation(params, {
      hemisphere: 'north',
      latitudeZone: 'tropical',
      altitudeBand: 'lowland',
      moisture: 'humid',
      continentality: 'maritime',
      habitat,
      realm: 'IM',
    }),
    'indoor',
  );
  return {
    ...base,
    waterSource,
    waterRealm: 'IM',
    substrateSource: WILD,
    landSubstrateSource: WILD,
    hardscape: base.hardscape.map((piece) => ({ ...piece, source: WILD })),
  };
}

interface Scenario {
  readonly name: string;
  readonly config: TankConfig;
  readonly releases: readonly ArchetypeId[];
}

const SCENARIOS: readonly Scenario[] = [
  {
    name: 'freshwater',
    config: { ...preset('stream', 'pond'), substrate: 'aquasoil' },
    releases: ['planktivore_fish', 'shrimp', 'snail'],
  },
  { name: 'marine', config: preset('coral_reef', 'seawater'), releases: ['coral', 'tang'] },
  {
    name: 'rainforest',
    config: preset('rainforest_floor', 'tap'),
    releases: ['dart_frog_small', 'springtail'],
  },
];

function summarize(state: SimulationState): unknown {
  const water = state.water;
  const substances = state.substances;
  const populations: Record<string, number> = {};
  for (const population of state.populations) {
    populations[population.speciesId] =
      (populations[population.speciesId] ?? 0) + populationSize(params, population);
  }
  return {
    ph: water.volumeL > 0 ? waterPh(params, state) : 0,
    volumeL: water.volumeL,
    temperatureC: water.temperatureC,
    o2: substances.water_o2,
    co2: substances.water_co2,
    tan: substances.water_tan,
    no2: substances.water_no2,
    no3: substances.water_no3,
    po4: substances.water_po4,
    alkalinity: substances.water_alkalinity,
    substrateCod: substances.water_substrate,
    detritusCod: substances.detritus_cod,
    sedimentTan: substances.sediment_tan,
    litterCod: substances.litter_cod,
    soilTan: substances.soil_tan,
    humidity: state.land.humidity,
    ledger: state.ledger,
    species: Object.keys(state.species).length,
    populations,
  };
}

function run(scenario: Scenario): unknown[] {
  let state = createInitialState(params, scenario.config, `regression-${scenario.name}`);
  const days: unknown[] = [];
  for (let tick = 0; tick < DAYS * 24; tick++) {
    const commands: Command[] = [];
    if (tick % 24 === FEED_HOUR) commands.push({ type: 'feed', dryMassMg: FEED_MG });
    if (tick === RELEASE_TICK) {
      for (const archetypeId of scenario.releases) commands.push({ type: 'release', archetypeId });
    }
    state = step(params, state, commands).state;
    if (tick % 24 === 23) days.push(summarize(state));
  }
  return days;
}

/** Paths where actual and expected differ beyond the relative tolerance. */
function differences(actual: unknown, expected: unknown, path: string, out: string[]): void {
  if (typeof expected === 'number' && typeof actual === 'number') {
    const scale = Math.max(Math.abs(expected), 1e-12);
    if (Math.abs(actual - expected) / scale > RELATIVE_TOLERANCE) {
      out.push(`${path}: ${String(actual)} ≠ ${String(expected)}`);
    }
    return;
  }
  if (expected !== null && typeof expected === 'object') {
    if (actual === null || typeof actual !== 'object') {
      out.push(`${path}: missing`);
      return;
    }
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const key of keys) {
      differences(
        (actual as Record<string, unknown>)[key],
        (expected as Record<string, unknown>)[key],
        `${path}.${key}`,
        out,
      );
    }
    return;
  }
  if (actual !== expected) out.push(`${path}: ${String(actual)} ≠ ${String(expected)}`);
}

describe('regression against the pre-M3b fixture', () => {
  const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, unknown>;
  for (const scenario of SCENARIOS) {
    it(`reproduces ${scenario.name}`, { timeout: 120_000 }, () => {
      const out: string[] = [];
      differences(run(scenario), fixture[scenario.name], scenario.name, out);
      expect(out.slice(0, 10)).toEqual([]);
    });
  }
});
