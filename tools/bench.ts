import { parseArgs } from 'node:util';
import { ARCHETYPE_IDS } from '../src/content/archetypeIds';
import { getArchetype } from '../src/content/archetypes/index';
import { computeGeometry, createInitialState, step } from '../src/engine/index';
import { createBioContext } from '../src/engine/bioContext';
import {
  bodyTemperature,
  environmentFactor,
  phenotypeOf,
  TICKS_PER_DAY,
  waterFraction,
} from '../src/engine/biota';
import { capacityCod, enclosureProblem, type Space } from '../src/engine/capacity';
import { foundBiomass, foundCohort, registerSpecies } from '../src/engine/founding';
import { toPools } from '../src/engine/pools';
import { createRng } from '../src/engine/rng';
import type { SimulationState, TankConfig } from '../src/engine/types';
import { recommendTankConfig, representativeLocation } from '../src/game/setup';
import { sampleGenotype } from '../src/generation/index';

/** docs/04 §9.2 performance check: a large half-land tank filled with many populations. */
const USAGE = 'npm run bench -- [--populations <n>] [--ticks <n>]';
/** ticks run before topping the tank back up and measuring */
const SETTLE_TICKS = 48;
/** docs/04 §9.2 */
const TARGET_MS = 100;

function benchTank(): TankConfig {
  const location = representativeLocation({
    hemisphere: 'north',
    latitudeZone: 'tropical',
    altitudeBand: 'lowland',
    moisture: 'humid',
    continentality: 'maritime',
    habitat: 'mangrove',
    realm: 'IM',
  });
  return {
    ...recommendTankConfig(location, 'indoor'),
    lengthCm: 600,
    widthCm: 200,
    heightCm: 120,
    waterDepthCm: 80,
    landFraction: 0.3,
    salinityPpt: 5,
  };
}

function populate(state: SimulationState, target: number): void {
  const rng = createRng(7);
  const geometry = computeGeometry(state.config);
  const space: Space = {
    geometry,
    waterVolumeL: state.water.volumeL,
    landSubstrateDepthCm: state.config.landSubstrateDepthCm,
  };
  const context = createBioContext(state, toPools(state), geometry, 0);
  for (let round = 0; state.populations.length < target && round < 200; round += 1) {
    for (const id of ARCHETYPE_IDS) {
      if (state.populations.length >= target) return;
      const archetype = getArchetype(id);
      const speciesId = sampleGenotype(archetype, rng, {
        temperatureC: state.water.temperatureC,
        salinityPpt: context.salinityPpt,
        ph: context.ph,
      });
      if (speciesId === null) continue;
      const phenotype = phenotypeOf(speciesId);
      if (enclosureProblem(archetype, phenotype, state.config, space) !== null) continue;
      if (state.species[speciesId] !== undefined) continue;
      const w = waterFraction(archetype, phenotype, context.media, false);
      const temperature = bodyTemperature(state, archetype, w, false);
      if (environmentFactor(state, phenotype, temperature, w) <= 0) continue;
      registerSpecies(state, { id: speciesId, origin: 'release', introduced: false });
      if (archetype.kind === 'biomass') {
        foundBiomass(
          state,
          speciesId,
          'player_release',
          capacityCod(archetype, phenotype, space) * 1e-3 + 1,
        );
      } else {
        foundCohort(state, speciesId, 'player_release', {
          birthTick: state.tick - Math.ceil(phenotype.maturityDays * TICKS_PER_DAY),
          count: 5,
          meanMassMg: phenotype.adultMassMg,
          peakMassMg: phenotype.adultMassMg,
          aquatic: false,
          spentTick: null,
        });
      }
    }
  }
}

function main(): void {
  const { values } = parseArgs({
    options: {
      populations: { type: 'string', default: '1000' },
      ticks: { type: 'string', default: '48' },
    },
  });
  const target = Number(values.populations);
  const ticks = Number(values.ticks);
  if (!(target > 0 && ticks > 0)) throw new Error(USAGE);
  let state = createInitialState(benchTank(), 'bench');
  populate(state, target);
  for (let tick = 0; tick < SETTLE_TICKS; tick += 1) state = step(state).state;
  populate(state, target);
  const start = state.populations.length;
  const began = performance.now();
  for (let tick = 0; tick < ticks; tick += 1) state = step(state).state;
  const perTick = (performance.now() - began) / ticks;
  process.stdout.write(
    `populations ${start} → ${state.populations.length} · ${perTick.toFixed(2)} ms/tick · ` +
      `substeps ${state.tracking.substeps} (target < ${TARGET_MS} ms at 1,000 populations)\n`,
  );
}

main();
