import type { Archetype, Habitat, SpecialisedEffects } from '../content/archetype';
import type { ParameterSet } from '../content/parameters';
import type { Sourced } from '../content/sourced';
import {
  derivePhenotype,
  parseGenotypeCode,
  phResponse,
  salinityFactor,
  toleranceFactor,
  type GenotypeCode,
  type Phenotype,
} from '../generation/index';
import { salinityPpt, waterPh } from './environment';
import type { AgeCohort, CohortPopulation, Population, SimulationState } from './types';

export const TICKS_PER_DAY = 24;

/** mg COD per mg dry biomass. */
export const codPerDryMass = (params: ParameterSet): number =>
  params.stoichiometry.base.codPerDryBiomass.value;

const WATER_HABITATS: ReadonlySet<Habitat> = new Set([
  'pelagic',
  'surface',
  'benthic',
  'infaunal',
  'epiphytic',
  'sessile',
  'crevice',
]);

const phenotypeCaches = new WeakMap<ParameterSet, Map<GenotypeCode, Phenotype>>();
const NO_EFFECTS: SpecialisedEffects = {};

/** docs/05 §2.3 effects of the specialised metabolism allele; empty for other species. */
export function specialisedOf(archetype: Archetype, phenotype: Phenotype): SpecialisedEffects {
  return archetype.kind === 'biomass' && phenotype.specialisedMetabolism
    ? archetype.specialised
    : NO_EFFECTS;
}

/** Multiplier carried by an optional effect; 1 when absent. */
export const effect = (value: Sourced | undefined): number => value?.value ?? 1;

/** humidityMin after the specialised shift, %. */
export function humidityMinOf(archetype: Archetype, phenotype: Phenotype): number | undefined {
  const base = phenotype.humidityMinPercent;
  if (base === undefined) return undefined;
  const shift = specialisedOf(archetype, phenotype).humidityMinShift?.value ?? 0;
  return Math.min(95, Math.max(10, base + shift));
}

export function archetypeOf(params: ParameterSet, speciesId: GenotypeCode): Archetype {
  return params.archetypes[parseGenotypeCode(speciesId).archetypeId];
}

export function phenotypeOf(params: ParameterSet, speciesId: GenotypeCode): Phenotype {
  let cache = phenotypeCaches.get(params);
  if (cache === undefined) {
    cache = new Map();
    phenotypeCaches.set(params, cache);
  }
  const cached = cache.get(speciesId);
  if (cached !== undefined) return cached;
  const phenotype = derivePhenotype(params, archetypeOf(params, speciesId), speciesId);
  cache.set(speciesId, phenotype);
  return phenotype;
}

/** Element content per mg COD of an archetype's living tissue. */
export function bodyRatios(params: ParameterSet, archetype: Archetype): { n: number; p: number } {
  const body =
    archetype.bodyComposition ?? params.physiology.bodyComposition[archetype.metabolicClass];
  const cod = codPerDryMass(params);
  return { n: body.nPerDryMass.value / cod, p: body.pPerDryMass.value / cod };
}

export const cohortCod = (params: ParameterSet, cohort: AgeCohort): number =>
  cohort.count * cohort.meanMassMg * codPerDryMass(params);

export function populationCod(params: ParameterSet, population: Population): number {
  if (population.kind === 'biomass') return population.cod;
  return population.cohorts.reduce(
    (sum, cohort) => sum + cohortCod(params, cohort),
    population.reserveCod,
  );
}

export function populationCount(population: CohortPopulation): number {
  return population.cohorts.reduce((sum, cohort) => sum + cohort.count, 0);
}

export const ageDays = (cohort: AgeCohort, tick: number): number =>
  (tick - cohort.birthTick) / TICKS_PER_DAY;

export interface Media {
  readonly hasWater: boolean;
  readonly hasLand: boolean;
}

export function mediaOf(state: SimulationState, landAreaM2: number): Media {
  return { hasWater: state.water.volumeL > 0, hasLand: landAreaM2 > 0 };
}

/** Share of time spent in water (docs/04 §5.4), restricted to the media the tank has. */
export function waterFraction(
  params: ParameterSet,
  archetype: Archetype,
  phenotype: Phenotype,
  media: Media,
  aquaticStage: boolean,
): number {
  const biota = params.mechanics.biota;
  let w: number = aquaticStage ? 1 : biota.zoneWaterFraction[archetype.zone];
  if (!aquaticStage && archetype.zone === 'A' && phenotype.habitats.length > 0) {
    const inWater = phenotype.habitats.filter((habitat) => WATER_HABITATS.has(habitat)).length;
    const onLand = phenotype.habitats.length - inWater;
    if (inWater > onLand) w += biota.habitatWaterShift;
    if (onLand > inWater) w -= biota.habitatWaterShift;
  }
  if (!media.hasWater) return 0;
  if (!media.hasLand) return 1;
  return w;
}

/** docs/04 §5.4 body temperature. */
export function bodyTemperature(
  state: SimulationState,
  archetype: Archetype,
  w: number,
  lightsOn: boolean,
): number {
  const basking =
    archetype.metabolicClass === 'reptile' &&
    archetype.flags.includes('needs_basking') &&
    lightsOn &&
    state.config.baskingC !== null &&
    w < 1;
  if (basking && state.config.baskingC !== null) return state.config.baskingC;
  return w >= 0.5 ? state.water.temperatureC : state.land.airTemperatureC;
}

/** Humidity response for land organisms: 1 at or above humidityMin, linear to 0 below. */
export function humidityFactor(humidity: number, humidityMin: number | undefined): number {
  if (humidityMin === undefined || humidityMin <= 0) return 1;
  return Math.max(0, Math.min(1, humidity / humidityMin));
}

/** docs/04 §5.1 f_env; land organisms replace salinity with humidity. */
export function environmentFactor(
  params: ParameterSet,
  state: SimulationState,
  phenotype: Phenotype,
  temperatureC: number,
  w: number,
  humidityMinPercent: number | undefined = phenotype.humidityMinPercent,
): number {
  let factor = toleranceFactor(temperatureC, phenotype.temperatureC);
  if (w > 0 && state.water.volumeL > 0) {
    const salinity = phenotype.salinityPpt;
    const aquatic =
      (salinity === undefined ? 1 : salinityFactor(params, salinityPpt(state), salinity)) *
      phResponse(params, waterPh(params, state), phenotype.ph);
    factor *= w >= 1 ? aquatic : Math.max(aquatic, 1 - w);
  }
  if (w < 1) factor *= humidityFactor(state.land.humidity, humidityMinPercent);
  return factor;
}
