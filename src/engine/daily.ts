import type { ParameterSet } from '../content/parameters';
import { mutateGenotype, rarityScore, rarityTier } from '../generation/index';
import { codPerDryMass, phenotypeOf, populationCod } from './biota';
import {
  capacityCod,
  enclosureProblem,
  MICROBIAL_CAPACITY_GROUP,
  microbialCapacity,
  type Space,
} from './capacity';
import { makeEvent } from './events';
import type { PoolKey, Process } from './fluxes';
import { foundBiomass, registerSpecies } from './founding';
import { populationKey } from './pools';
import { populationSize } from './records';
import type { Rng } from './rng';
import type { BiomassPopulation, Population, SimEvent, SimulationState } from './types';

const ALGAE = new Set(['diatom', 'green_algae', 'cyanobacteria', 'phytoplankton', 'macroalgae']);

function capacityOf(params: ParameterSet, population: BiomassPopulation, space: Space): number {
  const archetype = params.archetypes[population.archetypeId];
  const group = MICROBIAL_CAPACITY_GROUP[archetype.id];
  return group === undefined
    ? capacityCod(params, archetype, phenotypeOf(params, population.speciesId), space)
    : microbialCapacity(params, group, space);
}

function establishmentEvents(
  params: ParameterSet,
  state: SimulationState,
  population: Population,
): SimEvent[] {
  const tick = state.tick;
  const speciesId = population.speciesId;
  const events: SimEvent[] = [];
  population.establishedTick = tick;
  const archetype = params.archetypes[population.archetypeId];
  const legendary = rarityTier(params, rarityScore(params, archetype, speciesId)) === 'legendary';
  events.push(makeEvent('species_established', tick, { speciesId }));
  if (population.vector === 'mutation')
    events.push(makeEvent('mutant_established', tick, { speciesId }));
  if (legendary) events.push(makeEvent('legendary_established', tick, { speciesId }));
  if (population.vector === 'outside')
    events.push(makeEvent('invader_established', tick, { speciesId }));
  if (population.vector === 'feeder_escape')
    events.push(makeEvent('feeder_established', tick, { speciesId }));
  return events;
}

/** docs/05 §5: one biomass mutation roll per population per day. */
function mutateBiomass(
  params: ParameterSet,
  state: SimulationState,
  population: BiomassPopulation,
  space: Space,
  rng: Rng,
): void {
  const archetype = params.archetypes[population.archetypeId];
  const daily = params.mechanics.daily;
  const cellCod = phenotypeOf(params, population.speciesId).adultMassMg * codPerDryMass(params);
  const chance = daily.biomassMutationRate * Math.log10(population.cod / cellCod + 1);
  if (rng.next() >= chance) return;
  const mutantId = mutateGenotype(params, archetype, population.speciesId, rng);
  if (mutantId === population.speciesId) return;
  if (enclosureProblem(archetype, phenotypeOf(params, mutantId), state.config, space) !== null)
    return;
  const moved = population.cod * daily.mutantBiomassShare;
  population.cod -= moved;
  const parent = state.species[population.speciesId];
  registerSpecies(state, {
    id: mutantId,
    origin: 'mutation',
    parentId: population.speciesId,
    introduced: parent?.introduced ?? false,
  });
  foundBiomass(state, mutantId, 'mutation', moved);
}

/** docs/04 §5.7 clonal aging: daily sexual reset once generations reach the minimum. */
function clonalSex(
  params: ParameterSet,
  population: BiomassPopulation,
  space: Space,
  rng: Rng,
): void {
  const archetype = params.archetypes[population.archetypeId];
  const limits = archetype.lifeHistory.clonalMaxGenerations;
  if (archetype.lifeHistory.senescence !== 'clonal_aging' || limits === undefined) return;
  if (population.clonalGenerations < limits.min.value) return;
  const capacity = capacityOf(params, population, space);
  const fill = capacity > 0 ? Math.min(1, population.cod / capacity) : 0;
  if (rng.next() < params.mechanics.daily.sexualReproductionRate * fill) {
    population.clonalGenerations = 0;
    population.collapsed = false;
  }
}

/** Day-start biology bookkeeping, docs/04 §5.5, §5.7, §7 and docs/06 §4. */
export function dailyBiology(
  params: ParameterSet,
  state: SimulationState,
  space: Space,
  rng: Rng,
  saturated: boolean,
): SimEvent[] {
  const events: SimEvent[] = [];
  const tick = state.tick;
  const daily = params.mechanics.daily;
  const uvbDeficitDays = params.mechanics.mortality.uvbDeficitDays;
  let reptileNeedsUvb = false;
  let dryAir = false;
  for (const population of [...state.populations]) {
    const archetype = params.archetypes[population.archetypeId];
    const phenotype = phenotypeOf(params, population.speciesId);
    const cod = populationCod(params, population);
    const size = populationSize(params, population);
    population.growthStreakDays =
      cod > population.dayStartCod ? population.growthStreakDays + 1 : 0;
    if (
      population.establishedTick === null &&
      population.growthStreakDays >= daily.establishmentDays
    )
      events.push(...establishmentEvents(params, state, population));
    const [fourDaysAgo, threeDaysAgo, , yesterday] = population.recentDaySize;
    const booming =
      threeDaysAgo !== undefined && threeDaysAgo > 0 && size >= daily.boomFactor * threeDaysAgo;
    const wasBooming =
      fourDaysAgo !== undefined &&
      yesterday !== undefined &&
      fourDaysAgo > 0 &&
      yesterday >= daily.boomFactor * fourDaysAgo;
    if (population.kind === 'cohort' && booming && !wasBooming)
      events.push(makeEvent('population_boom', tick, { speciesId: population.speciesId }));
    if (population.kind === 'biomass') {
      const capacity = capacityOf(params, population, space);
      const bloomed =
        cod > population.dayStartCod * (1 + daily.bloomDailyGrowth) &&
        cod > daily.bloomCapacityShare * capacity &&
        population.dayStartCod <= daily.bloomCapacityShare * capacity;
      if (bloomed && ALGAE.has(archetype.id))
        events.push(makeEvent('algae_bloom', tick, { speciesId: population.speciesId }));
      if (
        archetype.id === 'heterotroph' &&
        cod > daily.bloomCapacityShare * capacity &&
        population.dayStartCod <= daily.bloomCapacityShare * capacity
      )
        events.push(makeEvent('bacterial_bloom', tick, { speciesId: population.speciesId }));
      const limits = archetype.lifeHistory.clonalMaxGenerations;
      if (
        limits !== undefined &&
        !population.collapsed &&
        population.clonalGenerations >= limits.max.value
      ) {
        population.collapsed = true;
        events.push(makeEvent('clonal_collapse', tick, { speciesId: population.speciesId }));
      }
      clonalSex(params, population, space, rng);
      if (!saturated) mutateBiomass(params, state, population, space, rng);
    } else if (population.symbiontDensity !== null) {
      population.lowSymbiontDays =
        population.symbiontDensity < daily.lowSymbiontDensity ? population.lowSymbiontDays + 1 : 0;
    }
    population.dayStartCod = populationCod(params, population);
    population.recentDaySize = [...population.recentDaySize, size].slice(
      -(daily.boomWindowDays + 1),
    );
    if (archetype.flags.includes('needs_uvb')) reptileNeedsUvb = true;
    if (
      archetype.zone !== 'W' &&
      phenotype.humidityMinPercent !== undefined &&
      space.geometry.landAreaM2 > 0 &&
      state.land.humidity < phenotype.humidityMinPercent
    )
      dryAir = true;
  }

  const tracking = state.tracking;
  tracking.uvbOffDays = reptileNeedsUvb && !state.config.uvb ? tracking.uvbOffDays + 1 : 0;
  if (tracking.uvbOffDays >= uvbDeficitDays && !tracking.uvbAlert)
    events.push(makeEvent('uvb_missing', tick));
  tracking.uvbAlert = tracking.uvbOffDays >= uvbDeficitDays;
  if (dryAir && !tracking.dryAirAlert) events.push(makeEvent('dry_air', tick));
  tracking.dryAirAlert = dryAir;

  const highest = Math.max(0, ...Object.values(state.records.trophicLevels));
  for (const milestone of daily.trophicMilestones) {
    if (highest >= milestone && tracking.trophicMilestone < milestone) {
      tracking.trophicMilestone = milestone;
      events.push(makeEvent('trophic_milestone', tick, { detail: String(milestone) }));
    }
  }
  return events;
}

/** docs/04 §5.7: clonal generations advance with each substep's growth. */
export function advanceClonalGenerations(
  params: ParameterSet,
  state: SimulationState,
  processes: readonly Process[],
  effective: readonly number[],
  before: ReadonlyMap<PoolKey, number>,
): void {
  const clonal = new Map<PoolKey, BiomassPopulation>();
  for (const population of state.populations) {
    if (population.kind !== 'biomass') continue;
    if (params.archetypes[population.archetypeId].lifeHistory.senescence !== 'clonal_aging')
      continue;
    clonal.set(populationKey(population.id), population);
  }
  if (clonal.size === 0) return;
  const grown = new Map<PoolKey, number>();
  processes.forEach((process, index) => {
    const amount = effective[index] ?? 0;
    if (amount <= 0) return;
    for (const key in process.stoichiometry) {
      const coefficient = process.stoichiometry[key as PoolKey] ?? 0;
      if (coefficient > 0 && clonal.has(key as PoolKey))
        grown.set(key as PoolKey, (grown.get(key as PoolKey) ?? 0) + coefficient * amount);
    }
  });
  for (const [key, growth] of grown) {
    const population = clonal.get(key);
    const start = before.get(key) ?? 0;
    if (population !== undefined && start > 0)
      population.clonalGenerations += Math.log2(1 + growth / start);
  }
}
