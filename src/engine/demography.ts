import type { Archetype, ReproMode } from '../content/archetype';
import { getArchetype } from '../content/archetypes/index';
import { mutateGenotype, type Phenotype } from '../generation/index';
import {
  ageDays,
  bodyRatios,
  bodyTemperature,
  cohortCod,
  COD_PER_DRY_MASS,
  environmentFactor,
  mediaOf,
  phenotypeOf,
  populationCount,
  TICKS_PER_DAY,
  waterFraction,
} from './biota';
import { capacityUnits, enclosureProblem, type Space } from './capacity';
import { makeEvent } from './events';
import type { Pools, Process } from './fluxes';
import { addCohort, foundCohort, registerSpecies } from './founding';
import { cohortKey, gainKey } from './pools';
import type { Rng } from './rng';
import type { AgeCohort, CohortPopulation, OrganicPool, SimEvent, SimulationState } from './types';

/** docs/04 §5.6 */
export const MAX_COHORTS = 24;
/** docs/04 §5.6: an adult must weigh at least this share of adult mass to breed */
export const BREEDING_MASS_SHARE = 0.5;
/** docs/04 §5.6: adults breed only when f_env reaches this */
export const BREEDING_ENVIRONMENT = 0.5;
/** docs/04 §5.6 recruitment multiplier per docs/09 §2 class */
export const RECRUITMENT = { normal: 1, rare: 0.05, none: 0 } as const;
/** docs/04 §5.6: egg-to-recruit survival before allele and crowding effects */
export const JUVENILE_SURVIVAL_BASE = 0.5;
/** docs/04 §5.6: breeding interval when an archetype gives none, days */
export const DEFAULT_BREEDING_INTERVAL_DAYS = 30;
/** docs/04 §5.6: larval period as a share of maturity when an archetype gives none */
export const DEFAULT_LARVAL_SHARE = 0.25;
/** docs/05 §5 per-offspring mutation probability */
export const COHORT_MUTATION_RATE = 2e-5;
/** docs/05 §5 individuals moved into a mutant population */
export const MUTANT_FOUNDERS = 5;
/** cohorts below this many individuals are dissolved into detritus */
export const MIN_COHORT_COUNT = 1e-6;

const ASEXUAL_MODES: ReadonlySet<ReproMode> = new Set([
  'parthenogenesis',
  'budding',
  'fission',
  'fragmentation',
  'spores',
]);

const geometricMean = (a: number, b: number): number => Math.sqrt(a * b);

export function isAdult(cohort: AgeCohort, phenotype: Phenotype, tick: number): boolean {
  return !cohort.aquatic && ageDays(cohort, tick) >= phenotype.maturityDays;
}

/** Water-time fraction used to place dead matter: larvae in water, others by zone. */
const restingWaterFraction = (archetype: Archetype, cohort: AgeCohort | null): number =>
  cohort?.aquatic === true ? 1 : archetype.zone === 'T' ? 0 : archetype.zone === 'A' ? 0.5 : 1;

/** Larval period of water-breeding archetypes, days. */
export function larvalDays(archetype: Archetype, phenotype: Phenotype): number {
  const stage = archetype.lifeHistory.aquaticStageDays;
  return stage === undefined
    ? phenotype.maturityDays * DEFAULT_LARVAL_SHARE
    : geometricMean(stage.min.value, stage.max.value);
}

function addToOrganic(pool: OrganicPool, cod: number, n: number, p: number): void {
  pool.cod += cod;
  pool.n += n * cod;
  pool.p += p * cod;
}

/** Sends cohort or reserve biomass to detritus or litter. */
function toDetritus(state: SimulationState, archetype: Archetype, cod: number, w: number): void {
  if (!(cod > 0)) return;
  const ratios = bodyRatios(archetype);
  const toWater = state.water.volumeL > 0 && (w >= 0.5 || state.config.landFraction <= 0);
  addToOrganic(toWater ? state.water.detritus : state.land.litter, cod, ratios.n, ratios.p);
}

/** Allocates assimilated COD: body mass up to adult mass first, the rest to the reserve. */
function allocateGain(population: CohortPopulation, gain: number, phenotype: Phenotype): void {
  if (!(gain > 0)) return;
  const weights = population.cohorts.map((cohort) =>
    cohort.count > 0 ? cohort.count * Math.pow(cohort.meanMassMg, 0.75) : 0,
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) {
    population.reserveCod += gain;
    return;
  }
  population.cohorts.forEach((cohort, index) => {
    let share = (gain * (weights[index] ?? 0)) / total;
    if (share <= 0) return;
    const deficit =
      Math.max(0, phenotype.adultMassMg - cohort.meanMassMg) * cohort.count * COD_PER_DRY_MASS;
    const growth = Math.min(share, deficit);
    cohort.meanMassMg += growth / (cohort.count * COD_PER_DRY_MASS);
    cohort.peakMassMg = Math.max(cohort.peakMassMg, cohort.meanMassMg);
    share -= growth;
    population.reserveCod += share;
  });
}

/** Writes flux results back into cohorts: removed individuals, lost mass and gains. */
export function applyCohortFluxes(
  state: SimulationState,
  pools: Pools,
  processes: readonly Process[],
  effective: readonly number[],
): void {
  const removed = new Map<string, number>();
  processes.forEach((process, index) => {
    const amount = effective[index] ?? 0;
    if (process.cohorts === undefined || amount <= 0) return;
    for (const touch of process.cohorts) {
      if (touch.effect !== 'remove') continue;
      const coefficient = -(process.stoichiometry[touch.key] ?? 0);
      removed.set(touch.key, (removed.get(touch.key) ?? 0) + amount * coefficient);
    }
  });
  for (const population of state.populations) {
    if (population.kind !== 'cohort') continue;
    population.cohorts.forEach((cohort, index) => {
      const key = cohortKey(population.id, index);
      const before = cohortCod(cohort);
      if (before <= 0) return;
      const after = Math.max(0, pools.get(key) ?? 0);
      const lost = Math.min(before, removed.get(key) ?? 0);
      cohort.count *= Math.max(0, 1 - lost / before);
      if (cohort.count > 0 && after > 0)
        cohort.meanMassMg = after / (cohort.count * COD_PER_DRY_MASS);
      else cohort.count = 0;
    });
    allocateGain(
      population,
      pools.get(gainKey(population.id)) ?? 0,
      phenotypeOf(population.speciesId),
    );
  }
}

/** Merges the adjacent pair of cohorts with the smallest combined count (docs/04 §5.6). */
function enforceCohortLimit(population: CohortPopulation): void {
  while (population.cohorts.length > MAX_COHORTS) {
    let best = 0;
    let bestCount = Infinity;
    for (let index = 0; index < population.cohorts.length - 1; index += 1) {
      const sum =
        (population.cohorts[index]?.count ?? 0) + (population.cohorts[index + 1]?.count ?? 0);
      if (sum < bestCount) {
        bestCount = sum;
        best = index;
      }
    }
    const a = population.cohorts[best];
    const b = population.cohorts[best + 1];
    if (a === undefined || b === undefined) return;
    const count = a.count + b.count;
    const merged: AgeCohort = {
      birthTick:
        count > 0
          ? Math.round((a.birthTick * a.count + b.birthTick * b.count) / count)
          : a.birthTick,
      count,
      meanMassMg:
        count > 0 ? (a.meanMassMg * a.count + b.meanMassMg * b.count) / count : a.meanMassMg,
      peakMassMg: Math.max(a.peakMassMg, b.peakMassMg),
      aquatic: a.aquatic && b.aquatic,
      spentTick: a.spentTick ?? b.spentTick,
    };
    population.cohorts.splice(best, 2, merged);
  }
}

function breedingInterval(archetype: Archetype): number {
  const interval = archetype.lifeHistory.reproduction.intervalDays;
  return interval === undefined
    ? DEFAULT_BREEDING_INTERVAL_DAYS
    : geometricMean(interval.min.value, interval.max.value);
}

/** docs/04 §5.6 reproduction, docs/05 §5 mutation; once per tick. */
function reproduce(
  state: SimulationState,
  population: CohortPopulation,
  space: Space,
  rng: Rng,
  saturated: boolean,
): void {
  const tick = state.tick;
  const archetype = getArchetype(population.archetypeId);
  if (archetype.kind !== 'cohort') return;
  const phenotype = phenotypeOf(population.speciesId);
  const lifeHistory = archetype.lifeHistory;
  if (
    population.lastClutchTick !== null &&
    tick - population.lastClutchTick < breedingInterval(archetype) * TICKS_PER_DAY
  )
    return;
  const needsWater = archetype.flags.includes('needs_water_to_breed') || archetype.zone === 'W';
  if (needsWater && state.water.volumeL <= 0) return;
  const media = mediaOf(state, space.geometry.landAreaM2);
  const breeders = population.cohorts.filter(
    (cohort) =>
      isAdult(cohort, phenotype, tick) &&
      cohort.spentTick === null &&
      cohort.meanMassMg >= BREEDING_MASS_SHARE * phenotype.adultMassMg,
  );
  const adults = breeders.reduce((sum, cohort) => sum + cohort.count, 0);
  const asexual = ASEXUAL_MODES.has(lifeHistory.reproduction.mode);
  if (adults < (asexual ? 1 : 2)) return;
  const w = waterFraction(archetype, phenotype, media, false);
  const temperature = bodyTemperature(state, archetype, w, state.climate.ppfd > 0);
  if (environmentFactor(state, phenotype, temperature, w) < BREEDING_ENVIRONMENT) return;
  const clutch = phenotype.clutch ?? 1;
  const eggMassMg = phenotype.eggMassMg ?? phenotype.adultMassMg * 0.01;
  const clutchCod = clutch * eggMassMg * COD_PER_DRY_MASS;
  const clutches = Math.min(adults * (asexual ? 1 : 0.5), population.reserveCod / clutchCod);
  if (clutches < 1) return;
  const usedCod = clutches * clutchCod;
  population.reserveCod -= usedCod;
  population.lastClutchTick = tick;

  const capacity = capacityUnits(archetype, space);
  const occupied = population.cohorts.reduce((sum, cohort) => sum + cohort.count, 0);
  const crowding = capacity > 0 ? Math.max(0, 1 - occupied / capacity) : 0;
  const survival =
    Math.min(1, JUVENILE_SURVIVAL_BASE * phenotype.juvenileSurvivalMultiplier) *
    RECRUITMENT[lifeHistory.recruitment] *
    crowding;
  const recruits = clutches * clutch * survival;
  const recruitCod = recruits * eggMassMg * COD_PER_DRY_MASS;
  const aquatic =
    archetype.flags.includes('needs_water_to_breed') ||
    archetype.flags.includes('metamorphosis_exit');
  toDetritus(state, archetype, usedCod - recruitCod, aquatic ? 1 : w);
  if (lifeHistory.senescence === 'semelparous') {
    for (const cohort of breeders) cohort.spentTick = tick;
  }
  if (!(recruits > MIN_COHORT_COUNT)) return;
  const newborn: AgeCohort = {
    birthTick: tick,
    count: recruits,
    meanMassMg: eggMassMg,
    peakMassMg: eggMassMg,
    aquatic,
    spentTick: null,
  };
  const mutationChance = 1 - Math.pow(1 - COHORT_MUTATION_RATE, recruits);
  if (!saturated && rng.next() < mutationChance) {
    const founders = Math.min(MUTANT_FOUNDERS, recruits);
    const mutantId = mutateGenotype(archetype, population.speciesId, rng);
    const mutantPhenotype = phenotypeOf(mutantId);
    if (
      mutantId !== population.speciesId &&
      enclosureProblem(archetype, mutantPhenotype, state.config, space) === null
    ) {
      newborn.count -= founders;
      const parent = state.species[population.speciesId];
      registerSpecies(state, {
        id: mutantId,
        origin: 'mutation',
        parentId: population.speciesId,
        introduced: parent?.introduced ?? false,
      });
      foundCohort(state, mutantId, 'mutation', { ...newborn, count: founders });
    }
  }
  if (newborn.count > MIN_COHORT_COUNT) addCohort(population, newborn);
}

/** Larvae leave the water; aquatic insects emerge and leave the tank (docs/04 §5.7). */
function developStages(
  state: SimulationState,
  population: CohortPopulation,
  events: SimEvent[],
): void {
  const archetype = getArchetype(population.archetypeId);
  const phenotype = phenotypeOf(population.speciesId);
  const tick = state.tick;
  const exits = archetype.flags.includes('metamorphosis_exit');
  const metamorphoses = archetype.flags.includes('needs_water_to_breed');
  if (!exits && !metamorphoses) return;
  const larval = larvalDays(archetype, phenotype);
  const ratios = bodyRatios(archetype);
  let metamorphosed = false;
  let emerged = false;
  population.cohorts = population.cohorts.filter((cohort) => {
    if (!cohort.aquatic || ageDays(cohort, tick) < larval) return true;
    if (exits) {
      if (cohort.meanMassMg < phenotype.adultMassMg) return true;
      const cod = cohortCod(cohort);
      state.ledger.nOut += cod * ratios.n;
      state.ledger.pOut += cod * ratios.p;
      emerged = true;
      return false;
    }
    cohort.aquatic = false;
    metamorphosed = true;
    return true;
  });
  if (emerged) events.push(makeEvent('emergence_exit', tick, { speciesId: population.speciesId }));
  if (metamorphosed && archetype.zone !== 'W')
    events.push(makeEvent('metamorphosis', tick, { speciesId: population.speciesId }));
}

/** Dissolves empty cohorts and cohorts past the age limit (docs/04 §5.7) into detritus. */
function pruneCohorts(state: SimulationState, population: CohortPopulation): void {
  const archetype = getArchetype(population.archetypeId);
  const lifespan = phenotypeOf(population.speciesId).lifespan;
  const limit =
    archetype.lifeHistory.senescence === 'negligible' ? lifespan.capDays : lifespan.maxDays;
  population.cohorts = population.cohorts.filter((cohort) => {
    if (cohort.count >= MIN_COHORT_COUNT && ageDays(cohort, state.tick) < limit) return true;
    toDetritus(state, archetype, cohortCod(cohort), restingWaterFraction(archetype, cohort));
    return false;
  });
}

/** Per-tick cohort bookkeeping after the flux step. */
export function updateCohorts(
  state: SimulationState,
  space: Space,
  rng: Rng,
  saturated: boolean,
): SimEvent[] {
  const events: SimEvent[] = [];
  for (const population of [...state.populations]) {
    if (population.kind !== 'cohort') continue;
    pruneCohorts(state, population);
    developStages(state, population, events);
    reproduce(state, population, space, rng, saturated);
    enforceCohortLimit(population);
  }
  return events;
}

/** Removes populations below one individual or one cell (docs/04 §8). */
export function removeExtinct(state: SimulationState): SimEvent[] {
  const events: SimEvent[] = [];
  state.populations = state.populations.filter((population) => {
    const archetype = getArchetype(population.archetypeId);
    const phenotype = phenotypeOf(population.speciesId);
    const alive =
      population.kind === 'cohort'
        ? populationCount(population) >= 1
        : population.cod / (phenotype.adultMassMg * COD_PER_DRY_MASS) >= 1;
    if (alive) return true;
    if (population.kind === 'cohort') {
      for (const cohort of population.cohorts)
        toDetritus(state, archetype, cohortCod(cohort), restingWaterFraction(archetype, cohort));
      toDetritus(state, archetype, population.reserveCod, restingWaterFraction(archetype, null));
    } else {
      toDetritus(state, archetype, population.cod, restingWaterFraction(archetype, null));
    }
    if (population.establishedTick !== null)
      events.push(makeEvent('species_extinct', state.tick, { speciesId: population.speciesId }));
    return false;
  });
  return events;
}
