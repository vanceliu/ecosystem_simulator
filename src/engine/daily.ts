import { getArchetype } from '../content/archetypes/index';
import { mutateGenotype, rarityScore, rarityTier } from '../generation/index';
import { COD_PER_DRY_MASS, phenotypeOf, populationCod } from './biota';
import {
  capacityCod,
  enclosureProblem,
  MICROBIAL_CAPACITY_GROUP,
  microbialCapacity,
  type Space,
} from './capacity';
import { makeEvent } from './events';
import type { Process } from './fluxes';
import { foundBiomass, registerSpecies } from './founding';
import { UVB_DEFICIT_DAYS } from './mortality';
import { populationKey } from './pools';
import { populationSize } from './records';
import type { Rng } from './rng';
import type { BiomassPopulation, Population, SimEvent, SimulationState } from './types';

/** docs/04 §7: consecutive days of net growth that establish a population */
export const ESTABLISHMENT_DAYS = 7;
/** docs/06 §4 */
export const BLOOM_DAILY_GROWTH = 0.5;
export const BLOOM_CAPACITY_SHARE = 0.5;
export const BOOM_FACTOR = 3;
export const BOOM_WINDOW_DAYS = 3;
export const TROPHIC_MILESTONES = [3, 4] as const;
/** docs/05 §5 biomass mutation coefficient μ_b */
export const BIOMASS_MUTATION_RATE = 5e-4;
/** docs/05 §5 biomass moved into a mutant population */
export const MUTANT_BIOMASS_SHARE = 0.01;
/** docs/04 §5.7 daily chance of sexual reproduction at full capacity once clonal aging allows it */
export const SEXUAL_REPRODUCTION_RATE = 0.1;
/** docs/04 §5.5 */
export const LOW_SYMBIONT_DENSITY = 0.2;

const ALGAE = new Set(['diatom', 'green_algae', 'cyanobacteria', 'phytoplankton', 'macroalgae']);

function capacityOf(population: BiomassPopulation, space: Space): number {
  const archetype = getArchetype(population.archetypeId);
  const group = MICROBIAL_CAPACITY_GROUP[archetype.id];
  return group === undefined
    ? capacityCod(archetype, phenotypeOf(population.speciesId), space)
    : microbialCapacity(group, space);
}

function establishmentEvents(state: SimulationState, population: Population): SimEvent[] {
  const tick = state.tick;
  const speciesId = population.speciesId;
  const events: SimEvent[] = [];
  population.establishedTick = tick;
  const archetype = getArchetype(population.archetypeId);
  const legendary = rarityTier(rarityScore(archetype, speciesId)) === 'legendary';
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
  state: SimulationState,
  population: BiomassPopulation,
  space: Space,
  rng: Rng,
): void {
  const archetype = getArchetype(population.archetypeId);
  const cellCod = phenotypeOf(population.speciesId).adultMassMg * COD_PER_DRY_MASS;
  const chance = BIOMASS_MUTATION_RATE * Math.log10(population.cod / cellCod + 1);
  if (rng.next() >= chance) return;
  const mutantId = mutateGenotype(archetype, population.speciesId, rng);
  if (mutantId === population.speciesId) return;
  if (enclosureProblem(archetype, phenotypeOf(mutantId), state.config, space) !== null) return;
  const moved = population.cod * MUTANT_BIOMASS_SHARE;
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
function clonalSex(population: BiomassPopulation, space: Space, rng: Rng): void {
  const archetype = getArchetype(population.archetypeId);
  const limits = archetype.lifeHistory.clonalMaxGenerations;
  if (archetype.lifeHistory.senescence !== 'clonal_aging' || limits === undefined) return;
  if (population.clonalGenerations < limits.min.value) return;
  const capacity = capacityOf(population, space);
  const fill = capacity > 0 ? Math.min(1, population.cod / capacity) : 0;
  if (rng.next() < SEXUAL_REPRODUCTION_RATE * fill) {
    population.clonalGenerations = 0;
    population.collapsed = false;
  }
}

/** Day-start biology bookkeeping, docs/04 §5.5, §5.7, §7 and docs/06 §4. */
export function dailyBiology(
  state: SimulationState,
  space: Space,
  rng: Rng,
  saturated: boolean,
): SimEvent[] {
  const events: SimEvent[] = [];
  const tick = state.tick;
  let reptileNeedsUvb = false;
  let dryAir = false;
  for (const population of [...state.populations]) {
    const archetype = getArchetype(population.archetypeId);
    const phenotype = phenotypeOf(population.speciesId);
    const cod = populationCod(population);
    const size = populationSize(population);
    population.growthStreakDays =
      cod > population.dayStartCod ? population.growthStreakDays + 1 : 0;
    if (population.establishedTick === null && population.growthStreakDays >= ESTABLISHMENT_DAYS)
      events.push(...establishmentEvents(state, population));
    const [fourDaysAgo, threeDaysAgo, , yesterday] = population.recentDaySize;
    const booming =
      threeDaysAgo !== undefined && threeDaysAgo > 0 && size >= BOOM_FACTOR * threeDaysAgo;
    const wasBooming =
      fourDaysAgo !== undefined &&
      yesterday !== undefined &&
      fourDaysAgo > 0 &&
      yesterday >= BOOM_FACTOR * fourDaysAgo;
    if (population.kind === 'cohort' && booming && !wasBooming)
      events.push(makeEvent('population_boom', tick, { speciesId: population.speciesId }));
    if (population.kind === 'biomass') {
      const capacity = capacityOf(population, space);
      const bloomed =
        cod > population.dayStartCod * (1 + BLOOM_DAILY_GROWTH) &&
        cod > BLOOM_CAPACITY_SHARE * capacity &&
        population.dayStartCod <= BLOOM_CAPACITY_SHARE * capacity;
      if (bloomed && ALGAE.has(archetype.id))
        events.push(makeEvent('algae_bloom', tick, { speciesId: population.speciesId }));
      if (
        archetype.id === 'heterotroph' &&
        cod > BLOOM_CAPACITY_SHARE * capacity &&
        population.dayStartCod <= BLOOM_CAPACITY_SHARE * capacity
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
      clonalSex(population, space, rng);
      if (!saturated) mutateBiomass(state, population, space, rng);
    } else if (population.symbiontDensity !== null) {
      population.lowSymbiontDays =
        population.symbiontDensity < LOW_SYMBIONT_DENSITY ? population.lowSymbiontDays + 1 : 0;
    }
    population.dayStartCod = populationCod(population);
    population.recentDaySize = [...population.recentDaySize, size].slice(-(BOOM_WINDOW_DAYS + 1));
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
  if (tracking.uvbOffDays >= UVB_DEFICIT_DAYS && !tracking.uvbAlert)
    events.push(makeEvent('uvb_missing', tick));
  tracking.uvbAlert = tracking.uvbOffDays >= UVB_DEFICIT_DAYS;
  if (dryAir && !tracking.dryAirAlert) events.push(makeEvent('dry_air', tick));
  tracking.dryAirAlert = dryAir;

  const highest = Math.max(0, ...Object.values(state.records.trophicLevels));
  for (const milestone of TROPHIC_MILESTONES) {
    if (highest >= milestone && tracking.trophicMilestone < milestone) {
      tracking.trophicMilestone = milestone;
      events.push(makeEvent('trophic_milestone', tick, { detail: String(milestone) }));
    }
  }
  return events;
}

/** docs/04 §5.7: clonal generations advance with each substep's growth. */
export function advanceClonalGenerations(
  state: SimulationState,
  processes: readonly Process[],
  effective: readonly number[],
  before: ReadonlyMap<string, number>,
): void {
  const grown = new Map<string, number>();
  processes.forEach((process, index) => {
    const amount = effective[index] ?? 0;
    if (amount <= 0) return;
    for (const [key, coefficient] of Object.entries(process.stoichiometry)) {
      if (coefficient > 0 && key.startsWith('pop:'))
        grown.set(key, (grown.get(key) ?? 0) + coefficient * amount);
    }
  });
  for (const population of state.populations) {
    if (population.kind !== 'biomass') continue;
    const archetype = getArchetype(population.archetypeId);
    if (archetype.lifeHistory.senescence !== 'clonal_aging') continue;
    const key = populationKey(population.id);
    const start = before.get(key) ?? 0;
    const growth = grown.get(key) ?? 0;
    if (start > 0 && growth > 0) population.clonalGenerations += Math.log2(1 + growth / start);
  }
}
