import type { Archetype, Vector } from '../content/archetype';
import { ARCHETYPE_IDS, type ArchetypeId } from '../content/archetypeIds';
import { getArchetype } from '../content/archetypes/index';
import { REALM_OCEANS, type RealmCode } from '../content/location';
import { BACKGROUND_SEEDING, type MicrobeId } from '../content/microbes';
import { NATIVE_RANGES } from '../content/realms';
import type { WaterSourceId } from '../content/waterSources';
import {
  parseGenotypeCode,
  sampleGenotype,
  type GenotypeCode,
  type SamplingEnvironment,
  type SpeciesOrigin,
} from '../generation/index';
import type { BioContext } from './bioContext';
import {
  bodyTemperature,
  COD_PER_DRY_MASS,
  environmentFactor,
  phenotypeOf,
  TICKS_PER_DAY,
  waterFraction,
} from './biota';
import {
  capacityCod,
  capacityUnits,
  MICROBIAL_CAPACITY_GROUP,
  microbialCapacity,
  enclosureProblem,
  type EnclosureProblem,
  type Space,
} from './capacity';
import { foodAvailability, foodNodes, predatorOf } from './consumers';
import { makeEvent } from './events';
import { creditImport, foundBiomass, foundCohort, registerSpecies } from './founding';
import { seedingCod } from './microbes';
import type { Rng } from './rng';
import type { CohortPopulation, Command, SimEvent, SimulationState, TankConfig } from './types';

/** docs/04 §7: chance per archetype and setup route before suitability */
export const INITIAL_INOCULATION_PROBABILITY = 0.5;
/** docs/04 §7: arrivals per archetype per game day before suitability */
export const ARRIVAL_RATE_PER_DAY: Readonly<Partial<Record<Vector, number>>> = {
  background: 0.05,
  open_inflow: 0.2,
  outside: 0.02,
};
/** docs/11 §7: outdoor tanks receive the `outside` route this many times as often */
export const OUTDOOR_OUTSIDE_FACTOR = 5;
/** docs/04 §7: chance an arrival reuses a genotype already seen in the tank */
export const REUSE_PROBABILITY = 0.3;
/** docs/04 §7: founding biomass as a share of carrying capacity */
export const FOUNDING_BIOMASS_SHARE = 1e-4;
/** docs/04 §7: founding individuals of a cohort-type arrival */
export const FOUNDING_COUNT = { min: 2, max: 10 } as const;
/** founders arrive half-grown */
export const FOUNDING_AGE_SHARE = 0.5;
export const FOUNDING_MASS_SHARE = 0.25;
/** docs/06 §2: adults per release */
export const RELEASE_COUNT = 5;
/** biomass released by the player as a share of carrying capacity */
export const RELEASE_BIOMASS_SHARE = 0.01;
/** docs/04 §9.2 */
export const SATURATION_LIMIT = 2000;
export const SATURATION_RESUME = 1900;
const MARINE_SALINITY_PPT = 30;
/** draws tried when a microbe species must suit the tank */
const SUITABLE_DRAW_ATTEMPTS = 8;

const WATER_VECTOR: Readonly<Record<WaterSourceId, Vector | null>> = {
  tap: 'tap_water',
  ro: null,
  aged: 'aged_water',
  river: 'pond_water',
  lake: 'pond_water',
  pond: 'pond_water',
  blackwater: 'pond_water',
  spring: 'pond_water',
  estuary: 'natural_seawater',
  seawater: 'natural_seawater',
};

export const ORIGIN: Readonly<Record<Vector, SpeciesOrigin>> = {
  background: 'background',
  tap_water: 'water',
  aged_water: 'water',
  pond_water: 'water',
  natural_seawater: 'water',
  live_rock: 'hitchhiker',
  wild_rock: 'hitchhiker',
  live_sand: 'hitchhiker',
  plant: 'hitchhiker',
  driftwood: 'hitchhiker',
  soil: 'hitchhiker',
  leaf_litter: 'hitchhiker',
  open_inflow: 'open_inflow',
  outside: 'outside',
  feeder_escape: 'feeder',
  player_release: 'release',
  mutation: 'mutation',
};

export interface Route {
  readonly vector: Vector;
  readonly realm: RealmCode;
}

/** Arrival routes opened by the tank setup (docs/02 §1, docs/06 §1). */
export function setupRoutes(config: TankConfig): Route[] {
  const routes: Route[] = [];
  const water = WATER_VECTOR[config.waterSource];
  if (water !== null) {
    const realm = water === 'aged_water' ? config.location.realm : config.waterRealm;
    routes.push({ vector: water, realm });
  }
  if (config.substrate !== 'bare' && config.substrateSource.origin === 'wild')
    routes.push({ vector: 'live_sand', realm: config.substrateSource.realm });
  for (const item of config.hardscape) {
    if (item.source.origin !== 'wild') continue;
    const vector: Vector =
      item.type === 'reef_rock'
        ? 'live_rock'
        : item.type === 'driftwood'
          ? 'driftwood'
          : 'wild_rock';
    routes.push({ vector, realm: item.source.realm });
  }
  if (config.landSubstrate !== null && config.landSubstrateSource.origin === 'wild') {
    routes.push({ vector: 'soil', realm: config.landSubstrateSource.realm });
    routes.push({ vector: 'leaf_litter', realm: config.landSubstrateSource.realm });
  }
  return routes;
}

/** docs/11 §6: natural routes only bring archetypes native to the source realm. */
export function isNative(archetype: Archetype, realm: RealmCode, salinityPpt: number): boolean {
  const range = NATIVE_RANGES[archetype.id];
  const marine = archetype.zone !== 'T' && salinityPpt >= MARINE_SALINITY_PPT;
  if (marine) return range.oceans.some((ocean) => REALM_OCEANS[realm].includes(ocean));
  return range.realms.includes(realm);
}

const isBackgroundMicrobe = (id: ArchetypeId): id is MicrobeId => id in BACKGROUND_SEEDING;

function samplingEnvironment(
  state: SimulationState,
  archetype: Archetype,
  context: BioContext,
): SamplingEnvironment {
  const minimum = archetype.minEnclosure?.lengthCm?.value;
  const maxLengthMm =
    minimum === undefined
      ? undefined
      : (archetype.typicalLengthMm.value * state.config.lengthCm) / minimum;
  return {
    temperatureC: archetype.zone === 'T' ? state.land.airTemperatureC : state.water.temperatureC,
    salinityPpt: context.salinityPpt,
    ph: context.ph,
    ...(maxLengthMm === undefined ? {} : { maxLengthMm }),
  };
}

function pickGenotype(
  state: SimulationState,
  archetype: Archetype,
  context: BioContext,
  rng: Rng,
): GenotypeCode | null {
  if (rng.next() < REUSE_PROBABILITY) {
    const known = Object.keys(state.species).filter((id) => id.startsWith(`${archetype.id}:`));
    const reused = known[Math.floor(rng.next() * known.length)];
    if (reused !== undefined) return reused;
  }
  return sampleGenotype(archetype, rng, samplingEnvironment(state, archetype, context));
}

/** Draws until a genotype can live in the tank now; null when none of the attempts can. */
export function pickSuitableGenotype(
  context: BioContext,
  archetype: Archetype,
  rng: Rng,
): GenotypeCode | null {
  for (let attempt = 0; attempt < SUITABLE_DRAW_ATTEMPTS; attempt += 1) {
    const speciesId = pickGenotype(context.state, archetype, context, rng);
    if (speciesId !== null && suitability(context, archetype, speciesId) > 0) return speciesId;
  }
  return null;
}

/** A one-adult stand-in population used to score food supply before arrival. */
function candidate(speciesId: GenotypeCode, tick: number): CohortPopulation {
  const phenotype = phenotypeOf(speciesId);
  return {
    id: 'candidate',
    speciesId,
    archetypeId: parseGenotypeCode(speciesId).archetypeId,
    vector: 'background',
    arrivedTick: tick,
    establishedTick: null,
    growthStreakDays: 0,
    dayStartCod: 0,
    recentDaySize: [],
    kind: 'cohort',
    cohorts: [
      {
        birthTick: tick - Math.ceil(phenotype.maturityDays * TICKS_PER_DAY),
        count: 1,
        meanMassMg: phenotype.adultMassMg,
        peakMassMg: phenotype.adultMassMg,
        aquatic: false,
        spentTick: null,
      },
    ],
    reserveCod: 0,
    lastClutchTick: null,
    symbiontDensity: null,
    lowSymbiontDays: 0,
  };
}

/** docs/04 §7 suitability = f_env × food × toxicity × capacity. */
export function suitability(
  context: BioContext,
  archetype: Archetype,
  speciesId: GenotypeCode,
): number {
  const state = context.state;
  const phenotype = phenotypeOf(speciesId);
  if (enclosureProblem(archetype, phenotype, state.config, context.space) !== null) return 0;
  const w = waterFraction(archetype, phenotype, context.media, false);
  const temperature = bodyTemperature(state, archetype, w, context.lightsOn);
  const fEnv = environmentFactor(state, phenotype, temperature, w);
  if (fEnv <= 0) return 0;
  if (w > 0 && context.media.hasWater) {
    const volume = context.space.waterVolumeL;
    const o2 = state.water.o2 / volume;
    if (phenotype.nh3MaxMgL !== undefined && context.freeAmmoniaMgL > phenotype.nh3MaxMgL) return 0;
    if (phenotype.no2MaxMgL !== undefined && state.water.no2 / volume > phenotype.no2MaxMgL)
      return 0;
    if (
      phenotype.o2MinMgL !== undefined &&
      o2 < phenotype.o2MinMgL &&
      !archetype.flags.includes('air_breather')
    )
      return 0;
  }
  let food = 1;
  if (archetype.kind === 'cohort') {
    const predator = predatorOf(context, candidate(speciesId, state.tick));
    food =
      predator === null
        ? 0
        : foodAvailability(context, predator, foodNodes(context, state.populations));
  } else if (archetype.trophicMode === 'consumer') {
    const predator = predatorOf(context, {
      ...candidate(speciesId, state.tick),
      kind: 'biomass',
      cod: phenotype.adultMassMg * COD_PER_DRY_MASS,
      clonalGenerations: 0,
      collapsed: false,
    });
    food =
      predator === null
        ? 0
        : foodAvailability(context, predator, foodNodes(context, state.populations));
  }
  return fEnv * food;
}

/** Founding biomass for an arriving biomass species, mg COD. */
function foundingCod(
  archetype: Archetype,
  speciesId: GenotypeCode,
  space: Space,
  share: number,
): number {
  const microbial = MICROBIAL_CAPACITY_GROUP[archetype.id];
  const capacity =
    microbial === undefined
      ? capacityCod(archetype, phenotypeOf(speciesId), space)
      : microbialCapacity(microbial, space);
  return capacity * share;
}

/** Brings a species in from outside the tank; returns false when nothing could arrive. */
export function admit(
  state: SimulationState,
  space: Space,
  archetype: Archetype,
  speciesId: GenotypeCode,
  vector: Vector,
  realm: RealmCode,
  rng: Rng,
): boolean {
  const phenotype = phenotypeOf(speciesId);
  registerSpecies(state, {
    id: speciesId,
    origin: ORIGIN[vector],
    introduced: realm !== state.config.location.realm,
  });
  if (archetype.kind === 'biomass') {
    const units = archetype.zone === 'T' ? space.geometry.landAreaM2 : space.waterVolumeL;
    const cod = isBackgroundMicrobe(archetype.id)
      ? seedingCod(archetype.id, units, 1 / TICKS_PER_DAY)
      : foundingCod(archetype, speciesId, space, FOUNDING_BIOMASS_SHARE);
    if (!(cod > 0)) return false;
    foundBiomass(state, speciesId, vector, cod);
    creditImport(state, speciesId, cod);
    return true;
  }
  const count =
    FOUNDING_COUNT.min + Math.floor(rng.next() * (FOUNDING_COUNT.max - FOUNDING_COUNT.min + 1));
  const massMg = Math.max(phenotype.eggMassMg ?? 0, phenotype.adultMassMg * FOUNDING_MASS_SHARE);
  foundCohort(state, speciesId, vector, {
    birthTick: state.tick - Math.round(phenotype.maturityDays * FOUNDING_AGE_SHARE * TICKS_PER_DAY),
    count,
    meanMassMg: massMg,
    peakMassMg: massMg,
    aquatic: archetype.flags.includes('metamorphosis_exit'),
    spentTick: null,
  });
  creditImport(state, speciesId, count * massMg * COD_PER_DRY_MASS);
  return true;
}

function tryArrival(
  context: BioContext,
  archetype: Archetype,
  vector: Vector,
  realm: RealmCode,
  probability: number,
  rng: Rng,
): boolean {
  const roll = rng.next();
  if (roll >= probability) return false;
  const state = context.state;
  if (!isNative(archetype, realm, context.salinityPpt)) return false;
  const speciesId = pickGenotype(state, archetype, context, rng);
  if (speciesId === null) return false;
  if (roll >= probability * suitability(context, archetype, speciesId)) return false;
  return admit(state, context.space, archetype, speciesId, vector, realm, rng);
}

/** docs/04 §7 setup inoculation through every route opened by the tank setup. */
export function inoculate(context: BioContext, rng: Rng): void {
  for (const route of setupRoutes(context.state.config)) {
    for (const id of ARCHETYPE_IDS) {
      if (isBackgroundMicrobe(id)) continue;
      const archetype = getArchetype(id);
      if (!archetype.vectors.includes(route.vector)) continue;
      tryArrival(
        context,
        archetype,
        route.vector,
        route.realm,
        INITIAL_INOCULATION_PROBABILITY,
        rng,
      );
    }
  }
}

/** Background microbes with no population get one from a day's first tick of seeding. */
function seedMissingMicrobes(context: BioContext, rng: Rng): void {
  const state = context.state;
  for (const id of Object.keys(BACKGROUND_SEEDING) as MicrobeId[]) {
    if (state.populations.some((population) => population.archetypeId === id)) continue;
    const archetype = getArchetype(id);
    const units =
      archetype.zone === 'T' ? context.space.geometry.landAreaM2 : context.space.waterVolumeL;
    if (units <= 0) continue;
    const speciesId = pickSuitableGenotype(context, archetype, rng);
    if (speciesId === null) continue;
    const cod = seedingCod(id, units, 1 / TICKS_PER_DAY);
    registerSpecies(state, { id: speciesId, origin: 'background', introduced: false });
    foundBiomass(state, speciesId, 'background', cod);
    creditImport(state, speciesId, cod);
  }
}

/** docs/04 §7 per-tick arrivals: background, open inflow and from outside the tank. */
export function arrivals(context: BioContext, rng: Rng): void {
  const state = context.state;
  if (state.tick % TICKS_PER_DAY === 0) seedMissingMicrobes(context, rng);
  const realm = state.config.location.realm;
  const outsideFactor = state.config.placement === 'outdoor' ? OUTDOOR_OUTSIDE_FACTOR : 1;
  const open: Vector[] = ['background'];
  if (state.config.openInflow) open.push('open_inflow');
  if (!state.config.lid) open.push('outside');
  for (const vector of open) {
    const perDay = (ARRIVAL_RATE_PER_DAY[vector] ?? 0) * (vector === 'outside' ? outsideFactor : 1);
    const probability = perDay / TICKS_PER_DAY;
    for (const id of ARCHETYPE_IDS) {
      const archetype = getArchetype(id);
      if (!archetype.vectors.includes(vector)) continue;
      tryArrival(context, archetype, vector, realm, probability, rng);
    }
  }
}

/** docs/06 §2 release: five adults, or 1% of capacity for biomass groups. */
export function release(
  context: BioContext,
  command: Extract<Command, { type: 'release' }>,
  rng: Rng,
): SimEvent | null {
  const state = context.state;
  const archetype = getArchetype(command.archetypeId);
  const speciesId = command.speciesId ?? sampleGenotype(archetype, rng);
  const reject = (reason: EnclosureProblem | 'no_capacity' | 'no_species'): SimEvent =>
    makeEvent('release_rejected', state.tick, {
      ...(speciesId === null ? {} : { speciesId }),
      detail: reason,
    });
  if (speciesId === null) return reject('no_species');
  const phenotype = phenotypeOf(speciesId);
  const problem = enclosureProblem(archetype, phenotype, state.config, context.space);
  if (problem !== null) return reject(problem);
  registerSpecies(state, { id: speciesId, origin: 'release', introduced: false });
  if (archetype.kind === 'biomass') {
    const cod = foundingCod(archetype, speciesId, context.space, RELEASE_BIOMASS_SHARE);
    if (!(cod > 0)) return reject('no_capacity');
    foundBiomass(state, speciesId, 'player_release', cod);
    creditImport(state, speciesId, cod);
    return null;
  }
  const capacity = Math.floor(capacityUnits(archetype, context.space));
  const count = Math.min(command.count ?? RELEASE_COUNT, RELEASE_COUNT, capacity);
  if (count < 1) return reject('no_capacity');
  foundCohort(state, speciesId, 'player_release', {
    birthTick: state.tick - Math.ceil(phenotype.maturityDays * TICKS_PER_DAY),
    count,
    meanMassMg: phenotype.adultMassMg,
    peakMassMg: phenotype.adultMassMg,
    aquatic: false,
    spentTick: null,
  });
  creditImport(state, speciesId, count * phenotype.adultMassMg * COD_PER_DRY_MASS);
  return null;
}
