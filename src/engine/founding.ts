import type { Vector } from '../content/archetype';
import type { ParameterSet } from '../content/parameters';
import { parseGenotypeCode, type GenotypeCode, type SpeciesRecord } from '../generation/index';
import { archetypeOf, bodyRatios, codPerDryMass, TICKS_PER_DAY } from './biota';
import type {
  AgeCohort,
  BiomassPopulation,
  CohortPopulation,
  Population,
  SimulationState,
} from './types';

/** docs/05 §1: one species record per genotype, kept after extinction. */
export function registerSpecies(state: SimulationState, record: SpeciesRecord): void {
  if (!(record.id in state.species)) state.species[record.id] = record;
}

export function findPopulation(state: SimulationState, speciesId: GenotypeCode): Population | null {
  return state.populations.find((population) => population.speciesId === speciesId) ?? null;
}

function base(state: SimulationState, speciesId: GenotypeCode, vector: Vector, cod: number) {
  const id = `pop-${state.nextPopulationId}`;
  state.nextPopulationId += 1;
  return {
    id,
    speciesId,
    archetypeId: parseGenotypeCode(speciesId).archetypeId,
    vector,
    arrivedTick: state.tick,
    establishedTick: null,
    growthStreakDays: 0,
    dayStartCod: cod,
    recentDaySize: [],
  };
}

/** Adds biomass of a species, joining its population when one exists. */
export function foundBiomass(
  state: SimulationState,
  speciesId: GenotypeCode,
  vector: Vector,
  cod: number,
): BiomassPopulation {
  const existing = findPopulation(state, speciesId);
  if (existing !== null && existing.kind === 'biomass') {
    existing.cod += cod;
    return existing;
  }
  const population: BiomassPopulation = {
    ...base(state, speciesId, vector, cod),
    kind: 'biomass',
    cod,
    clonalGenerations: 0,
    collapsed: false,
  };
  state.populations.push(population);
  return population;
}

/** Merges a cohort into the one born on the same game day, or appends it. */
export function addCohort(population: CohortPopulation, cohort: AgeCohort): void {
  const day = Math.floor(cohort.birthTick / TICKS_PER_DAY);
  const twin = population.cohorts.find(
    (existing) =>
      Math.floor(existing.birthTick / TICKS_PER_DAY) === day &&
      existing.aquatic === cohort.aquatic &&
      existing.spentTick === cohort.spentTick,
  );
  if (twin === undefined) {
    population.cohorts.push(cohort);
    population.cohorts.sort((a, b) => a.birthTick - b.birthTick);
    return;
  }
  const count = twin.count + cohort.count;
  if (count <= 0) return;
  twin.meanMassMg = (twin.meanMassMg * twin.count + cohort.meanMassMg * cohort.count) / count;
  twin.peakMassMg = Math.max(twin.peakMassMg, cohort.peakMassMg, twin.meanMassMg);
  twin.count = count;
}

/** Adds individuals of a species, joining its population when one exists. */
export function foundCohort(
  params: ParameterSet,
  state: SimulationState,
  speciesId: GenotypeCode,
  vector: Vector,
  cohort: AgeCohort,
): CohortPopulation {
  const existing = findPopulation(state, speciesId);
  if (existing !== null && existing.kind === 'cohort') {
    addCohort(existing, cohort);
    return existing;
  }
  const archetype = archetypeOf(params, speciesId);
  const population: CohortPopulation = {
    ...base(state, speciesId, vector, cohort.count * cohort.meanMassMg * codPerDryMass(params)),
    kind: 'cohort',
    cohorts: [cohort],
    reserveCod: 0,
    lastClutchTick: null,
    symbiontDensity: archetype.flags.includes('symbiont_host') ? 1 : null,
    lowSymbiontDays: 0,
  };
  state.populations.push(population);
  return population;
}

/** Records N and P brought in from outside the tank. */
export function creditImport(
  params: ParameterSet,
  state: SimulationState,
  speciesId: GenotypeCode,
  cod: number,
): void {
  const ratios = bodyRatios(params, archetypeOf(params, speciesId));
  state.ledger.nIn += cod * ratios.n;
  state.ledger.pIn += cod * ratios.p;
}
