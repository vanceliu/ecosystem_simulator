import type { Archetype, ReproMode } from '../content/archetype';
import type { ParameterSet } from '../content/parameters';
import { DETRITUS, LITTER } from '../content/substances';
import { mutateGenotype, type Phenotype } from '../generation/index';
import {
  ageDays,
  bodyRatios,
  bodyTemperature,
  cohortCod,
  codPerDryMass,
  environmentFactor,
  mediaOf,
  phenotypeOf,
  populationCount,
  TICKS_PER_DAY,
  waterFraction,
} from './biota';
import { capacityUnits, enclosureProblem, type Space } from './capacity';
import { makeEvent } from './events';
import type { PoolKey, Pools, Process } from './fluxes';
import { addCohort, foundCohort, registerSpecies } from './founding';
import { cohortKey, gainKey } from './pools';
import type { Rng } from './rng';
import type { AgeCohort, CohortPopulation, SimEvent, SimulationState } from './types';

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
const restingWaterFraction = (
  params: ParameterSet,
  archetype: Archetype,
  cohort: AgeCohort | null,
): number =>
  cohort?.aquatic === true ? 1 : params.mechanics.biota.zoneWaterFraction[archetype.zone];

/** Larval period of water-breeding archetypes, days. */
export function larvalDays(
  params: ParameterSet,
  archetype: Archetype,
  phenotype: Phenotype,
): number {
  const stage = archetype.lifeHistory.aquaticStageDays;
  return stage === undefined
    ? phenotype.maturityDays * params.mechanics.demography.defaultLarvalShare
    : geometricMean(stage.min.value, stage.max.value);
}

/** Sends cohort or reserve biomass to detritus or litter. */
function toDetritus(
  params: ParameterSet,
  state: SimulationState,
  archetype: Archetype,
  cod: number,
  w: number,
): void {
  if (!(cod > 0)) return;
  const ratios = bodyRatios(params, archetype);
  const toWater = state.water.volumeL > 0 && (w >= 0.5 || state.config.landFraction <= 0);
  const sink = toWater ? DETRITUS : LITTER;
  const substances = state.substances;
  substances[sink.cod] += cod;
  substances[sink.n] += ratios.n * cod;
  substances[sink.p] += ratios.p * cod;
}

/** Allocates assimilated COD: body mass up to adult mass first, the rest to the reserve. */
function allocateGain(
  params: ParameterSet,
  population: CohortPopulation,
  gain: number,
  phenotype: Phenotype,
): void {
  const codPerDry = codPerDryMass(params);
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
      Math.max(0, phenotype.adultMassMg - cohort.meanMassMg) * cohort.count * codPerDry;
    const growth = Math.min(share, deficit);
    cohort.meanMassMg += growth / (cohort.count * codPerDry);
    cohort.peakMassMg = Math.max(cohort.peakMassMg, cohort.meanMassMg);
    share -= growth;
    population.reserveCod += share;
  });
}

/** Writes flux results back into cohorts: removed individuals, lost mass and gains. */
export function applyCohortFluxes(
  params: ParameterSet,
  state: SimulationState,
  pools: Pools,
  processes: readonly Process[],
  effective: readonly number[],
): void {
  const removed = new Map<PoolKey, number>();
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
      const before = cohortCod(params, cohort);
      if (before <= 0) return;
      const after = Math.max(0, pools.get(key) ?? 0);
      const lost = Math.min(before, removed.get(key) ?? 0);
      cohort.count *= Math.max(0, 1 - lost / before);
      if (cohort.count > 0 && after > 0)
        cohort.meanMassMg = after / (cohort.count * codPerDryMass(params));
      else cohort.count = 0;
    });
    allocateGain(
      params,
      population,
      pools.get(gainKey(population.id)) ?? 0,
      phenotypeOf(params, population.speciesId),
    );
  }
}

/** Merges the adjacent pair of cohorts with the smallest combined count (docs/04 §5.6). */
function enforceCohortLimit(maxCohorts: number, population: CohortPopulation): void {
  while (population.cohorts.length > maxCohorts) {
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

function breedingInterval(params: ParameterSet, archetype: Archetype): number {
  const interval = archetype.lifeHistory.reproduction.intervalDays;
  return interval === undefined
    ? params.mechanics.demography.defaultBreedingIntervalDays
    : geometricMean(interval.min.value, interval.max.value);
}

/** docs/04 §5.6 reproduction, docs/05 §5 mutation; once per tick. */
function reproduce(
  params: ParameterSet,
  state: SimulationState,
  population: CohortPopulation,
  space: Space,
  rng: Rng,
  saturated: boolean,
): void {
  const tick = state.tick;
  const archetype = params.archetypes[population.archetypeId];
  if (archetype.kind !== 'cohort') return;
  const phenotype = phenotypeOf(params, population.speciesId);
  const codPerDry = codPerDryMass(params);
  const demography = params.mechanics.demography;
  const lifeHistory = archetype.lifeHistory;
  if (
    population.lastClutchTick !== null &&
    tick - population.lastClutchTick < breedingInterval(params, archetype) * TICKS_PER_DAY
  )
    return;
  const needsWater = archetype.flags.includes('needs_water_to_breed') || archetype.zone === 'W';
  if (needsWater && state.water.volumeL <= 0) return;
  const media = mediaOf(state, space.geometry.landAreaM2);
  const breeders = population.cohorts.filter(
    (cohort) =>
      isAdult(cohort, phenotype, tick) &&
      cohort.spentTick === null &&
      cohort.meanMassMg >= demography.breedingMassShare * phenotype.adultMassMg,
  );
  const adults = breeders.reduce((sum, cohort) => sum + cohort.count, 0);
  const asexual = ASEXUAL_MODES.has(lifeHistory.reproduction.mode);
  if (adults < (asexual ? 1 : 2)) return;
  const w = waterFraction(params, archetype, phenotype, media, false);
  const temperature = bodyTemperature(state, archetype, w, state.climate.ppfd > 0);
  if (environmentFactor(params, state, phenotype, temperature, w) < demography.breedingEnvironment)
    return;
  const clutch = phenotype.clutch ?? 1;
  const eggMassMg = phenotype.eggMassMg ?? phenotype.adultMassMg * 0.01;
  const clutchCod = clutch * eggMassMg * codPerDry;
  const clutches = Math.min(adults * (asexual ? 1 : 0.5), population.reserveCod / clutchCod);
  if (clutches < 1) return;
  const usedCod = clutches * clutchCod;
  population.reserveCod -= usedCod;
  population.lastClutchTick = tick;

  const capacity = capacityUnits(params, archetype, space);
  const occupied = population.cohorts.reduce((sum, cohort) => sum + cohort.count, 0);
  const crowding = capacity > 0 ? Math.max(0, 1 - occupied / capacity) : 0;
  const survival =
    Math.min(1, demography.juvenileSurvivalBase * phenotype.juvenileSurvivalMultiplier) *
    demography.recruitment[lifeHistory.recruitment] *
    crowding;
  const recruits = clutches * clutch * survival;
  const recruitCod = recruits * eggMassMg * codPerDry;
  const aquatic =
    archetype.flags.includes('needs_water_to_breed') ||
    archetype.flags.includes('metamorphosis_exit');
  toDetritus(params, state, archetype, usedCod - recruitCod, aquatic ? 1 : w);
  if (lifeHistory.senescence === 'semelparous') {
    for (const cohort of breeders) cohort.spentTick = tick;
  }
  if (!(recruits > params.mechanics.limits.minCohortCount)) return;
  const newborn: AgeCohort = {
    birthTick: tick,
    count: recruits,
    meanMassMg: eggMassMg,
    peakMassMg: eggMassMg,
    aquatic,
    spentTick: null,
  };
  const mutationChance = 1 - Math.pow(1 - demography.cohortMutationRate, recruits);
  if (!saturated && rng.next() < mutationChance) {
    const founders = Math.min(demography.mutantFounders, recruits);
    const mutantId = mutateGenotype(params, archetype, population.speciesId, rng);
    const mutantPhenotype = phenotypeOf(params, mutantId);
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
      foundCohort(params, state, mutantId, 'mutation', { ...newborn, count: founders });
    }
  }
  if (newborn.count > params.mechanics.limits.minCohortCount) addCohort(population, newborn);
}

/** Larvae leave the water; aquatic insects emerge and leave the tank (docs/04 §5.7). */
function developStages(
  params: ParameterSet,
  state: SimulationState,
  population: CohortPopulation,
  events: SimEvent[],
): void {
  const archetype = params.archetypes[population.archetypeId];
  const phenotype = phenotypeOf(params, population.speciesId);
  const tick = state.tick;
  const exits = archetype.flags.includes('metamorphosis_exit');
  const metamorphoses = archetype.flags.includes('needs_water_to_breed');
  if (!exits && !metamorphoses) return;
  const larval = larvalDays(params, archetype, phenotype);
  const ratios = bodyRatios(params, archetype);
  let metamorphosed = false;
  let emerged = false;
  population.cohorts = population.cohorts.filter((cohort) => {
    if (!cohort.aquatic || ageDays(cohort, tick) < larval) return true;
    if (exits) {
      if (cohort.meanMassMg < phenotype.adultMassMg) return true;
      const cod = cohortCod(params, cohort);
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
function pruneCohorts(
  params: ParameterSet,
  state: SimulationState,
  population: CohortPopulation,
): void {
  const archetype = params.archetypes[population.archetypeId];
  const lifespan = phenotypeOf(params, population.speciesId).lifespan;
  const limit =
    archetype.lifeHistory.senescence === 'negligible' ? lifespan.capDays : lifespan.maxDays;
  population.cohorts = population.cohorts.filter((cohort) => {
    if (
      cohort.count >= params.mechanics.limits.minCohortCount &&
      ageDays(cohort, state.tick) < limit
    )
      return true;
    toDetritus(
      params,
      state,
      archetype,
      cohortCod(params, cohort),
      restingWaterFraction(params, archetype, cohort),
    );
    return false;
  });
}

/** Per-tick cohort bookkeeping after the flux step. */
export function updateCohorts(
  params: ParameterSet,
  state: SimulationState,
  space: Space,
  rng: Rng,
  saturated: boolean,
): SimEvent[] {
  const events: SimEvent[] = [];
  for (const population of [...state.populations]) {
    if (population.kind !== 'cohort') continue;
    pruneCohorts(params, state, population);
    developStages(params, state, population, events);
    reproduce(params, state, population, space, rng, saturated);
    enforceCohortLimit(params.mechanics.limits.maxCohorts, population);
  }
  return events;
}

/** Removes populations below one individual or one cell (docs/04 §8). */
export function removeExtinct(params: ParameterSet, state: SimulationState): SimEvent[] {
  const events: SimEvent[] = [];
  state.populations = state.populations.filter((population) => {
    const archetype = params.archetypes[population.archetypeId];
    const phenotype = phenotypeOf(params, population.speciesId);
    const alive =
      population.kind === 'cohort'
        ? populationCount(population) >= 1
        : population.cod / (phenotype.adultMassMg * codPerDryMass(params)) >= 1;
    if (alive) return true;
    const rest = (cohort: AgeCohort | null): number =>
      restingWaterFraction(params, archetype, cohort);
    if (population.kind === 'cohort') {
      for (const cohort of population.cohorts)
        toDetritus(params, state, archetype, cohortCod(params, cohort), rest(cohort));
      toDetritus(params, state, archetype, population.reserveCod, rest(null));
    } else {
      toDetritus(params, state, archetype, population.cod, rest(null));
    }
    if (population.establishedTick !== null)
      events.push(makeEvent('species_extinct', state.tick, { speciesId: population.speciesId }));
    return false;
  });
  return events;
}
